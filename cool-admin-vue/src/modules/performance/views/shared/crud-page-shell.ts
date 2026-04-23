/**
 * 文件职责：统一 asset/material 共享 CRUD 壳层的配置类型和基础 UI 辅助；
 * 不负责具体业务实体字段、接口实现或页面权限生产；
 * 依赖调用方传入的 page service、权限键和字段配置；
 * 维护重点是两个壳层必须共用同一套配置契约，避免 props/动作上下文继续各自漂移。
 */

export { resolveErrorMessage } from './error-message';

export type CrudFieldState = Record<string, unknown>;
export type CrudFilters = CrudFieldState;
export type CrudRowShape = {
	id?: number;
};

export interface CrudPageResult<TRow = CrudRowShape> {
	list?: TRow[];
	pagination?: {
		total?: number | null;
	} | null;
}

export type CrudButtonType = string;
export type CrudTagType = string;
export type ElementButtonType =
	| ''
	| 'default'
	| 'primary'
	| 'success'
	| 'warning'
	| 'info'
	| 'danger'
	| 'text';
export type ElementTagType = 'primary' | 'success' | 'warning' | 'danger' | 'info';

export interface CrudSelectOption {
	label: string;
	value: unknown;
}

export interface CrudTagMeta {
	label: string;
	type?: CrudTagType;
}

export type CrudTagMap = Record<string, CrudTagMeta>;

export type CrudFormatter<TRow = CrudRowShape> = {
	bivarianceHack(value: unknown, row: TRow): unknown;
}['bivarianceHack'];

export interface CrudColumnConfig<TRow = CrudRowShape> {
	prop: string;
	label: string;
	minWidth?: number;
	width?: number;
	span?: number;
	tagMap?: CrudTagMap;
	formatter?: CrudFormatter<TRow>;
}

export interface CrudFilterFieldConfig {
	prop: string;
	label: string;
	type: string;
	placeholder?: string;
	width?: string;
	options?: CrudSelectOption[];
}

export interface CrudFormFieldConfig {
	prop: string;
	label: string;
	type: string;
	placeholder?: string;
	width?: string;
	options?: CrudSelectOption[];
	span?: number;
	rows?: number;
	min?: number;
	precision?: number;
}

export interface CrudPager {
	page: number;
	size: number;
	total: number;
}

export interface CrudToolbarActionContext<
	TFilter extends CrudFilters = CrudFilters,
	TRow = CrudRowShape
> {
	filters: TFilter;
	rows: TRow[];
	pager: CrudPager;
}

export interface CrudToolbarAction<
	TFilter extends CrudFilters = CrudFilters,
	TRow = CrudRowShape
> {
	key: string;
	label: string;
	permission: string;
	type?: CrudButtonType;
	handler?: (context: CrudToolbarActionContext<TFilter, TRow>) => Promise<unknown> | unknown;
	successMessage?: string;
}

export type CrudMutationHandler = {
	bivarianceHack(data: unknown): Promise<unknown> | unknown;
}['bivarianceHack'];

export type CrudRowPredicate<TRow = CrudRowShape> = {
	bivarianceHack(row: TRow): boolean;
}['bivarianceHack'];

export type CrudRowTextResolver<TRow = CrudRowShape> = {
	bivarianceHack(row: TRow): string;
}['bivarianceHack'];

export type CrudRowHandler<TRow = CrudRowShape> = {
	bivarianceHack(row: TRow): Promise<unknown> | unknown;
}['bivarianceHack'];

export interface CrudRowAction<TRow = CrudRowShape> {
	key: string;
	label: string;
	permission: string;
	type?: CrudButtonType;
	visible?: CrudRowPredicate<TRow>;
	confirmText?: CrudRowTextResolver<TRow>;
	handler: CrudRowHandler<TRow>;
	successMessage?: string;
}

export function resolveButtonType(
	value?: CrudButtonType,
	fallback: ElementButtonType = 'default'
): ElementButtonType {
	switch (value) {
		case '':
		case 'default':
		case 'primary':
		case 'success':
		case 'warning':
		case 'info':
		case 'danger':
		case 'text':
			return value;
		default:
			return fallback;
	}
}

export function resolveTagType(
	tagMap: CrudTagMap | undefined,
	value: unknown,
	fallback: ElementTagType = 'info'
): ElementTagType {
	const normalizedValue =
		typeof value === 'string' || typeof value === 'number' ? String(value) : '';

	switch (tagMap?.[normalizedValue]?.type) {
		case 'primary':
		case 'success':
		case 'warning':
		case 'danger':
		case 'info':
			return tagMap[normalizedValue].type;
		default:
			return fallback;
	}
}

export function resolveTagLabel(tagMap: CrudTagMap | undefined, value: unknown) {
	const normalizedValue =
		typeof value === 'string' || typeof value === 'number' ? String(value) : '';

	return tagMap?.[normalizedValue]?.label || normalizedValue || '-';
}

export function readField(source: object | null | undefined, prop: string) {
	if (!source || typeof source !== 'object') {
		return undefined;
	}

	return (source as Record<string, unknown>)[prop];
}

export function readTextField(state: CrudFieldState, prop: string) {
	const value = state[prop];
	if (typeof value === 'string') {
		return value;
	}
	if (typeof value === 'number' || typeof value === 'boolean') {
		return String(value);
	}
	return '';
}

export function readScalarField(state: CrudFieldState, prop: string) {
	const value = state[prop];
	if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
		return value;
	}
	return undefined;
}

export function resolveOptionValue(value: unknown) {
	if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
		return value;
	}
	return '';
}

export function readNumberField(state: CrudFieldState, prop: string) {
	const value = state[prop];
	return typeof value === 'number' ? value : undefined;
}

export function readDateField(state: CrudFieldState, prop: string) {
	const value = state[prop];
	if (typeof value === 'string' || typeof value === 'number' || value instanceof Date) {
		return value;
	}
	return undefined;
}

export function writeField(state: CrudFieldState, prop: string, value: unknown) {
	state[prop] = value;
}
