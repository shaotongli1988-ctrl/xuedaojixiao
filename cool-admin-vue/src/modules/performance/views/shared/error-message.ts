/**
 * 文件职责：统一 performance 视图层把 unknown 错误转成可展示文案的最小逻辑。
 * 不负责错误上报、埋点、鉴权处理或具体提示组件调用。
 * 维护重点：只收敛重复的 message 提取逻辑，避免页面继续复制相同解析函数。
 */

import { ElMessage } from 'element-plus';

export function resolveErrorMessage(error: unknown, fallback: string) {
	if (typeof error === 'string' && error.trim()) {
		return error;
	}

	if (typeof error === 'object' && error !== null && 'message' in error) {
		const message = error.message;
		if (typeof message === 'string' && message.trim()) {
			return message;
		}
	}

	return fallback;
}

export function isUserCancelledError(error: unknown) {
	return error === 'cancel' || error === 'close';
}

export function showElementWarningFromError(error: unknown, fallback: string) {
	ElMessage.warning(resolveErrorMessage(error, fallback));
}

export function createElementWarningFromErrorHandler(fallback: string) {
	return (error: unknown) => {
		showElementWarningFromError(error, fallback);
	};
}

export function showElementErrorFromError(error: unknown, fallback: string) {
	ElMessage.error(resolveErrorMessage(error, fallback));
}

export function createElementErrorFromErrorHandler(fallback: string) {
	return (error: unknown) => {
		showElementErrorFromError(error, fallback);
	};
}
