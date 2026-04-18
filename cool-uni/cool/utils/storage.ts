function getStorageDriver() {
	if (typeof uni !== "undefined") {
		return {
			get: (key: string) => uni.getStorageSync(key),
			info: () => uni.getStorageInfoSync(),
			set: (key: string, value: any) => uni.setStorageSync(key, value),
			remove: (key: string) => uni.removeStorageSync(key),
			clear: () => uni.clearStorageSync(),
		};
	}

	if (typeof localStorage !== "undefined") {
		return {
			get: (key: string) => {
				const raw = localStorage.getItem(key);
				if (raw == null) {
					return "";
				}
				try {
					return JSON.parse(raw);
				} catch (error) {
					return raw;
				}
			},
			info: () => ({ keys: Object.keys(localStorage) }),
			set: (key: string, value: any) => {
				localStorage.setItem(key, JSON.stringify(value));
			},
			remove: (key: string) => localStorage.removeItem(key),
			clear: () => localStorage.clear(),
		};
	}

	return {
		get: () => "",
		info: () => ({ keys: [] as string[] }),
		set: () => undefined,
		remove: () => undefined,
		clear: () => undefined,
	};
}

export const storage = {
	// 后缀标识
	suffix: "_deadtime",

	/**
	 * 获取
	 * @param {*} key 关键字
	 */
	get(key: string): any {
		return getStorageDriver().get(key);
	},

	/**
	 * 获取全部
	 */
	info() {
		const { keys } = getStorageDriver().info();
		const d: any = {};

		keys.forEach((e: string) => {
			d[e] = this.get(e);
		});

		return d;
	},

	/**
	 * 设置
	 * @param {*} key 关键字
	 * @param {*} value 值
	 * @param {*} expires 过期时间
	 */
	set(key: string, value: any, expires?: number): void {
		const driver = getStorageDriver();
		driver.set(key, value);

		if (expires) {
			driver.set(`${key}${this.suffix}`, Date.parse(String(new Date())) + expires * 1000);
		}
	},

	/**
	 * 是否过期
	 * @param {*} key 关键字
	 */
	isExpired(key: string): boolean {
		return this.get(`${key}${this.suffix}`) - Date.parse(String(new Date())) <= 0;
	},

	/**
	 * 删除
	 * @param {*} key 关键字
	 */
	remove(key: string) {
		return getStorageDriver().remove(key);
	},

	/**
	 * 清理
	 */
	clear() {
		getStorageDriver().clear();
	},

	/**
	 * 获取一次后删除
	 */
	once(key: string) {
		const value = this.get(key);
		this.remove(key);
		return value;
	},
};
