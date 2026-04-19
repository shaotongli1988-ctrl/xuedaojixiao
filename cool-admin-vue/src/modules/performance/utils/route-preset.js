/**
 * 主题13相关页面的深链预置参数工具。
 * 这里只负责解析 query 中的单值/数组值、正整数 ID 和预置参数是否存在，
 * 以及主题内页面对预置参数的一次性消费与清理，不负责业务接口本身。
 * 维护重点是保持“非法参数不消费、有效参数只消费一次”的统一口径。
 */

/**
 * @param {unknown} value
 * @returns {unknown}
 */
export function firstQueryValue(value) {
	return Array.isArray(value) ? value[0] : value;
}

/**
 * @param {unknown} value
 * @returns {number | undefined}
 */
export function normalizeQueryNumber(value) {
	const parsed = Number(firstQueryValue(value));
	return Number.isInteger(parsed) && parsed > 0 ? parsed : undefined;
}

/**
 * @param {Record<string, unknown>} query
 * @param {string[]} keys
 * @returns {boolean}
 */
export function hasQueryPreset(query, keys) {
	return keys.some(key => query[key] !== undefined);
}

/**
 * @param {{
 *   route: { path: string, query: Record<string, unknown> },
 *   router: { replace: (location: { path: string, query: Record<string, unknown> }) => Promise<unknown> | unknown },
 *   keys: string[]
 * }} options
 * @returns {Promise<void>}
 */
export async function clearRoutePresetQuery(options) {
	const query = { ...options.route.query };

	for (const key of options.keys) {
		delete query[key];
	}

	await options.router.replace({
		path: options.route.path,
		query
	});
}

/**
 * @template TPayload
 * @param {{
 *   route: { path: string, query: Record<string, unknown> },
 *   router: { replace: (location: { path: string, query: Record<string, unknown> }) => Promise<unknown> | unknown },
 *   keys: string[],
 *   parse: (query: Record<string, unknown>) => TPayload,
 *   shouldConsume: (payload: TPayload) => boolean,
 *   consume: (payload: TPayload) => Promise<unknown> | unknown
 * }} options
 * @returns {Promise<boolean>}
 */
export async function consumeRoutePreset(options) {
	if (!hasQueryPreset(options.route.query, options.keys)) {
		return false;
	}

	const payload = options.parse(options.route.query);

	if (!options.shouldConsume(payload)) {
		await clearRoutePresetQuery(options);
		return false;
	}

	await options.consume(payload);
	await clearRoutePresetQuery(options);
	return true;
}
