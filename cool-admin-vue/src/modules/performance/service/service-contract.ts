/**
 * 文件职责：收敛 performance service 层对 BaseService/request 返回值的单一类型契约转换入口。
 * 不负责响应解包、错误语义映射或业务字段校验。
 * 维护重点：所有 Promise<T> 强转与可选 decoder 都应统一走这里，避免各 service 文件散落 unknown 强转。
 */

export type PerformanceServiceDecoder<T> = (value: unknown, field?: string) => T;

export type PerformancePagePagination = {
	page: number;
	size: number;
	total: number;
};

export type PerformancePageResultShape<T> = {
	list: T[];
	pagination: PerformancePagePagination;
};

export function isPerformanceServiceRecord(value: unknown): value is Record<string, unknown> {
	return typeof value === 'object' && value !== null;
}

export function expectPerformanceServiceRecord(value: unknown, field: string) {
	if (!isPerformanceServiceRecord(value)) {
		throw new Error(`${field} 必须为对象`);
	}

	return value;
}

export function expectPerformanceServiceString(value: unknown, field: string) {
	if (typeof value !== 'string') {
		throw new Error(`${field} 必须为字符串`);
	}

	return value;
}

export function expectPerformanceServiceNullableString(value: unknown, field: string) {
	if (value == null) {
		return null;
	}

	return expectPerformanceServiceString(value, field);
}

export function expectPerformanceServiceOptionalString(value: unknown, field: string) {
	if (value == null) {
		return undefined;
	}

	return expectPerformanceServiceString(value, field);
}

export function expectPerformanceServiceNumber(value: unknown, field: string) {
	if (typeof value !== 'number' || Number.isNaN(value)) {
		throw new Error(`${field} 必须为数字`);
	}

	return value;
}

export function expectPerformanceServiceNullableNumber(value: unknown, field: string) {
	if (value == null) {
		return null;
	}

	return expectPerformanceServiceNumber(value, field);
}

export function expectPerformanceServiceOptionalNumber(value: unknown, field: string) {
	if (value == null) {
		return undefined;
	}

	return expectPerformanceServiceNumber(value, field);
}

export function expectPerformanceServiceBoolean(value: unknown, field: string) {
	if (typeof value !== 'boolean') {
		throw new Error(`${field} 必须为布尔值`);
	}

	return value;
}

export function expectPerformanceServiceArray(
	value: unknown,
	field: string
): unknown[] {
	if (!Array.isArray(value)) {
		throw new Error(`${field} 必须为数组`);
	}

	return value;
}

export function expectPerformanceServiceStringArray(value: unknown, field: string) {
	return expectPerformanceServiceArray(value, field).map((item, index) =>
		expectPerformanceServiceString(item, `${field}[${index}]`)
	);
}

export function expectPerformanceServiceNumberArray(value: unknown, field: string) {
	return expectPerformanceServiceArray(value, field).map((item, index) =>
		expectPerformanceServiceNumber(item, `${field}[${index}]`)
	);
}

export function expectPerformanceServiceEnum<T extends string>(
	value: unknown,
	field: string,
	allowed: readonly T[]
) {
	if (typeof value !== 'string' || !allowed.includes(value as T)) {
		throw new Error(`${field} 非法`);
	}

	return value as T;
}

export function expectPerformanceServiceOptionalEnum<T extends string>(
	value: unknown,
	field: string,
	allowed: readonly T[]
) {
	if (value == null) {
		return undefined;
	}

	return expectPerformanceServiceEnum(value, field, allowed);
}

export function decodePerformanceServicePagination(
	value: unknown,
	field = 'pagination'
): PerformancePagePagination {
	const record = expectPerformanceServiceRecord(value, field);

	return {
		page: expectPerformanceServiceNumber(record.page, `${field}.page`),
		size: expectPerformanceServiceNumber(record.size, `${field}.size`),
		total: expectPerformanceServiceNumber(record.total, `${field}.total`)
	};
}

export function decodePerformanceServicePageResult<T>(
	value: unknown,
	field: string,
	decodeItem: PerformanceServiceDecoder<T>
): PerformancePageResultShape<T> {
	const record = expectPerformanceServiceRecord(value, field);
	const list = expectPerformanceServiceArray(record.list, `${field}.list`).map((item, index) =>
		decodeItem(item, `${field}.list[${index}]`)
	);

	return {
		list,
		pagination: decodePerformanceServicePagination(record.pagination, `${field}.pagination`)
	};
}

/**
 * 把底层 request/BaseService 返回值统一收敛为业务 service 暴露的 Promise<T>。
 * 请求层已经负责解包 { code, data }，这里负责统一类型边界和可选 runtime decoder。
 */
export function asPerformanceServicePromise<T>(
	requestResult: unknown,
	decode?: PerformanceServiceDecoder<T>
) {
	return Promise.resolve(requestResult).then(value => {
		if (decode) {
			return decode(value);
		}

		return value as T;
	});
}
