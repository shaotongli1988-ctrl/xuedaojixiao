/**
 * 文件职责：统一 performance 视图层 lookup 加载失败时的 warning 文案转换与 handler 生成。
 * 不负责具体 lookup 数据加载、权限判断或消息组件实现。
 * 维护重点：asset/material 等子域只能复用这里的最小 warning helper，避免再各自复制同一套错误解析。
 */

import { ElMessage } from 'element-plus';
import type { LookupErrorHandler } from '../../types';
import { resolveErrorMessage } from './error-message';

export function resolveLookupErrorMessage(error: unknown, fallback: string) {
	return resolveErrorMessage(error, fallback);
}

export function createLookupWarningHandler(
	showWarning: (message: string) => void,
	fallback: string
): LookupErrorHandler {
	return error => {
		showWarning(resolveLookupErrorMessage(error, fallback));
	};
}

export function createElementLookupWarningHandler(fallback: string): LookupErrorHandler {
	return createLookupWarningHandler(message => ElMessage.warning(message), fallback);
}
