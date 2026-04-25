/**
 * 文件职责：统一 performance 视图层的确认框、输入框取消处理，以及行级动作的 loading/成功/失败提示编排。
 * 不负责业务权限判断、接口参数组装或页面级状态机。
 * 维护重点：只沉淀通用交互壳，避免各页面重复实现 confirm/prompt/catch/finally。
 */

import { ElMessage, ElMessageBox } from 'element-plus';
import { isUserCancelledError, showElementErrorFromError } from './error-message';

type ConfirmOptions = Parameters<typeof ElMessageBox.confirm>[2];
type PromptOptions = Parameters<typeof ElMessageBox.prompt>[2];
type PromptResult = Awaited<ReturnType<typeof ElMessageBox.prompt>>;
export const ELEMENT_ACTION_SKIPPED = Symbol('performance.element-action-skipped');

interface TrackedElementActionOptions<TAction> {
	rowId: number;
	actionType: TAction;
	request: () => Promise<unknown>;
	successMessage?: string;
	errorMessage: string;
	setLoading?: (rowId: number | null, actionType: TAction | null) => void;
	onSuccess?: () => void | Promise<void>;
	refresh?: () => Promise<void>;
}

export async function confirmElementAction(
	message: string,
	title: string,
	options?: ConfirmOptions
) {
	try {
		await ElMessageBox.confirm(message, title, {
			type: 'warning',
			...options
		});
		return true;
	} catch (error: unknown) {
		if (isUserCancelledError(error)) {
			return false;
		}
		throw error;
	}
}

export async function promptElementAction(message: string, title: string, options?: PromptOptions) {
	try {
		return (await ElMessageBox.prompt(message, title, options)) as PromptResult;
	} catch (error: unknown) {
		if (isUserCancelledError(error)) {
			return null;
		}
		throw error;
	}
}

export async function runTrackedElementAction<TAction>(
	options: TrackedElementActionOptions<TAction>
) {
	options.setLoading?.(options.rowId, options.actionType);

	try {
		const result = await options.request();
		if (result === ELEMENT_ACTION_SKIPPED) {
			return;
		}
		await options.onSuccess?.();
		if (options.successMessage) {
			ElMessage.success(options.successMessage);
		}
		await options.refresh?.();
	} catch (error: unknown) {
		showElementErrorFromError(error, options.errorMessage);
	} finally {
		options.setLoading?.(null, null);
	}
}
