declare namespace Eps {
	interface DemoGoodsEntity {
		/**
		 * 任意键值
		 */
		[key: string]: any;
	}

	interface UserAddressEntity {
		/**
		 * 任意键值
		 */
		[key: string]: any;
	}

	interface UserInfoEntity {
		/**
		 * 任意键值
		 */
		[key: string]: any;
	}

	type json = any;

	interface BaseComm {
		/**
		 * uploadMode
		 */
		uploadMode(data?: any): Promise<any>;

		/**
		 * upload
		 */
		upload(data?: any): Promise<any>;

		/**
		 * param
		 */
		param(data?: any): Promise<any>;

		/**
		 * eps
		 */
		eps(data?: any): Promise<any>;

		/**
		 * 权限标识
		 */
		permission: { uploadMode: string; upload: string; param: string; eps: string };

		/**
		 * 权限状态
		 */
		_permission: { uploadMode: boolean; upload: boolean; param: boolean; eps: boolean };

		request: Service["request"];
	}

	interface OpenDemoCache {
		/**
		 * set
		 */
		set(data?: any): Promise<any>;

		/**
		 * get
		 */
		get(data?: any): Promise<any>;

		/**
		 * 权限标识
		 */
		permission: { set: string; get: string };

		/**
		 * 权限状态
		 */
		_permission: { set: boolean; get: boolean };

		request: Service["request"];
	}

	interface OpenDemoEvent {
		/**
		 * global
		 */
		global(data?: any): Promise<any>;

		/**
		 * comm
		 */
		comm(data?: any): Promise<any>;

		/**
		 * 权限标识
		 */
		permission: { global: string; comm: string };

		/**
		 * 权限状态
		 */
		_permission: { global: boolean; comm: boolean };

		request: Service["request"];
	}

	interface OpenDemoGoods {
		/**
		 * entityPage
		 */
		entityPage(data?: any): Promise<any>;

		/**
		 * sqlPage
		 */
		sqlPage(data?: any): Promise<any>;

		/**
		 * delete
		 */
		delete(data?: any): Promise<any>;

		/**
		 * update
		 */
		update(data?: any): Promise<any>;

		/**
		 * info
		 */
		info(data?: any): Promise<DemoGoodsEntity>;

		/**
		 * list
		 */
		list(data?: any): Promise<DemoGoodsEntity[]>;

		/**
		 * page
		 */
		page(data?: any): Promise<{
			pagination: { size: number; page: number; total: number; [key: string]: any };
			list: DemoGoodsEntity[];
			[key: string]: any;
		}>;

		/**
		 * add
		 */
		add(data?: any): Promise<any>;

		/**
		 * 权限标识
		 */
		permission: {
			entityPage: string;
			sqlPage: string;
			delete: string;
			update: string;
			info: string;
			list: string;
			page: string;
			add: string;
		};

		/**
		 * 权限状态
		 */
		_permission: {
			entityPage: boolean;
			sqlPage: boolean;
			delete: boolean;
			update: boolean;
			info: boolean;
			list: boolean;
			page: boolean;
			add: boolean;
		};

		request: Service["request"];
	}

	interface OpenDemoI18n {
		/**
		 * en
		 */
		en(data?: any): Promise<any>;

		/**
		 * tw
		 */
		tw(data?: any): Promise<any>;

		/**
		 * 权限标识
		 */
		permission: { en: string; tw: string };

		/**
		 * 权限状态
		 */
		_permission: { en: boolean; tw: boolean };

		request: Service["request"];
	}

	interface OpenDemoPlugin {
		/**
		 * invoke
		 */
		invoke(data?: any): Promise<any>;

		/**
		 * 权限标识
		 */
		permission: { invoke: string };

		/**
		 * 权限状态
		 */
		_permission: { invoke: boolean };

		request: Service["request"];
	}

	interface OpenDemoQueue {
		/**
		 * addGetter
		 */
		addGetter(data?: any): Promise<any>;

		/**
		 * getter
		 */
		getter(data?: any): Promise<any>;

		/**
		 * add
		 */
		add(data?: any): Promise<any>;

		/**
		 * 权限标识
		 */
		permission: { addGetter: string; getter: string; add: string };

		/**
		 * 权限状态
		 */
		_permission: { addGetter: boolean; getter: boolean; add: boolean };

		request: Service["request"];
	}

	interface OpenDemoRpc {
		/**
		 * transaction
		 */
		transaction(data?: any): Promise<any>;

		/**
		 * event
		 */
		event(data?: any): Promise<any>;

		/**
		 * call
		 */
		call(data?: any): Promise<any>;

		/**
		 * 权限标识
		 */
		permission: { transaction: string; event: string; call: string };

		/**
		 * 权限状态
		 */
		_permission: { transaction: boolean; event: boolean; call: boolean };

		request: Service["request"];
	}

	interface OpenDemoSse {
		/**
		 * call
		 */
		call(data?: any): Promise<any>;

		/**
		 * 权限标识
		 */
		permission: { call: string };

		/**
		 * 权限状态
		 */
		_permission: { call: boolean };

		request: Service["request"];
	}

	interface OpenDemoTenant {
		/**
		 * 权限标识
		 */
		permission: {};

		/**
		 * 权限状态
		 */
		_permission: {};

		request: Service["request"];
	}

	interface OpenDemoTransaction {
		/**
		 * delete
		 */
		delete(data?: any): Promise<any>;

		/**
		 * update
		 */
		update(data?: any): Promise<any>;

		/**
		 * info
		 */
		info(data?: any): Promise<DemoGoodsEntity>;

		/**
		 * list
		 */
		list(data?: any): Promise<DemoGoodsEntity[]>;

		/**
		 * page
		 */
		page(data?: any): Promise<{
			pagination: { size: number; page: number; total: number; [key: string]: any };
			list: DemoGoodsEntity[];
			[key: string]: any;
		}>;

		/**
		 * add
		 */
		add(data?: any): Promise<any>;

		/**
		 * 权限标识
		 */
		permission: {
			delete: string;
			update: string;
			info: string;
			list: string;
			page: string;
			add: string;
		};

		/**
		 * 权限状态
		 */
		_permission: {
			delete: boolean;
			update: boolean;
			info: boolean;
			list: boolean;
			page: boolean;
			add: boolean;
		};

		request: Service["request"];
	}

	interface DictInfo {
		/**
		 * types
		 */
		types(data?: any): Promise<any>;

		/**
		 * data
		 */
		data(data?: any): Promise<any>;

		/**
		 * 权限标识
		 */
		permission: { types: string; data: string };

		/**
		 * 权限状态
		 */
		_permission: { types: boolean; data: boolean };

		request: Service["request"];
	}

	interface Swagger {
		/**
		 * json
		 */
		json(data?: any): Promise<any>;

		/**
		 * 权限标识
		 */
		permission: { json: string };

		/**
		 * 权限状态
		 */
		_permission: { json: boolean };

		request: Service["request"];
	}

	interface UserAddress {
		/**
		 * default
		 */
		default(data?: any): Promise<any>;

		/**
		 * delete
		 */
		delete(data?: any): Promise<any>;

		/**
		 * update
		 */
		update(data?: any): Promise<any>;

		/**
		 * info
		 */
		info(data?: any): Promise<UserAddressEntity>;

		/**
		 * list
		 */
		list(data?: any): Promise<UserAddressEntity[]>;

		/**
		 * page
		 */
		page(data?: any): Promise<{
			pagination: { size: number; page: number; total: number; [key: string]: any };
			list: UserAddressEntity[];
			[key: string]: any;
		}>;

		/**
		 * add
		 */
		add(data?: any): Promise<any>;

		/**
		 * 权限标识
		 */
		permission: {
			default: string;
			delete: string;
			update: string;
			info: string;
			list: string;
			page: string;
			add: string;
		};

		/**
		 * 权限状态
		 */
		_permission: {
			default: boolean;
			delete: boolean;
			update: boolean;
			info: boolean;
			list: boolean;
			page: boolean;
			add: boolean;
		};

		request: Service["request"];
	}

	interface UserComm {
		/**
		 * wxMpConfig
		 */
		wxMpConfig(data?: any): Promise<any>;

		/**
		 * 权限标识
		 */
		permission: { wxMpConfig: string };

		/**
		 * 权限状态
		 */
		_permission: { wxMpConfig: boolean };

		request: Service["request"];
	}

	interface UserInfo {
		/**
		 * updatePassword
		 */
		updatePassword(data?: any): Promise<any>;

		/**
		 * updatePerson
		 */
		updatePerson(data?: any): Promise<any>;

		/**
		 * bindPhone
		 */
		bindPhone(data?: any): Promise<any>;

		/**
		 * miniPhone
		 */
		miniPhone(data?: any): Promise<any>;

		/**
		 * person
		 */
		person(data?: any): Promise<any>;

		/**
		 * logoff
		 */
		logoff(data?: any): Promise<any>;

		/**
		 * 权限标识
		 */
		permission: {
			updatePassword: string;
			updatePerson: string;
			bindPhone: string;
			miniPhone: string;
			person: string;
			logoff: string;
		};

		/**
		 * 权限状态
		 */
		_permission: {
			updatePassword: boolean;
			updatePerson: boolean;
			bindPhone: boolean;
			miniPhone: boolean;
			person: boolean;
			logoff: boolean;
		};

		request: Service["request"];
	}

	interface UserLogin {
		/**
		 * refreshToken
		 */
		refreshToken(data?: any): Promise<any>;

		/**
		 * miniPhone
		 */
		miniPhone(data?: any): Promise<any>;

		/**
		 * uniPhone
		 */
		uniPhone(data?: any): Promise<any>;

		/**
		 * password
		 */
		password(data?: any): Promise<any>;

		/**
		 * captcha
		 */
		captcha(data?: any): Promise<any>;

		/**
		 * smsCode
		 */
		smsCode(data?: any): Promise<any>;

		/**
		 * wxApp
		 */
		wxApp(data?: any): Promise<any>;

		/**
		 * phone
		 */
		phone(data?: any): Promise<any>;

		/**
		 * mini
		 */
		mini(data?: any): Promise<any>;

		/**
		 * mp
		 */
		mp(data?: any): Promise<any>;

		/**
		 * 权限标识
		 */
		permission: {
			refreshToken: string;
			miniPhone: string;
			uniPhone: string;
			password: string;
			captcha: string;
			smsCode: string;
			wxApp: string;
			phone: string;
			mini: string;
			mp: string;
		};

		/**
		 * 权限状态
		 */
		_permission: {
			refreshToken: boolean;
			miniPhone: boolean;
			uniPhone: boolean;
			password: boolean;
			captcha: boolean;
			smsCode: boolean;
			wxApp: boolean;
			phone: boolean;
			mini: boolean;
			mp: boolean;
		};

		request: Service["request"];
	}

	type Service = {
		/**
		 * 基础请求
		 */
		request(options?: {
			url: string;
			method?: "POST" | "GET" | "PUT" | "DELETE" | "PATCH" | "HEAD" | "OPTIONS";
			data?: any;
			params?: any;
			headers?: {
				authorization?: string;
				[key: string]: any;
			};
			timeout?: number;
			proxy?: boolean;
			[key: string]: any;
		}): Promise<any>;

		base: { comm: BaseComm };
		open: {
			demo: {
				cache: OpenDemoCache;
				event: OpenDemoEvent;
				goods: OpenDemoGoods;
				i18n: OpenDemoI18n;
				plugin: OpenDemoPlugin;
				queue: OpenDemoQueue;
				rpc: OpenDemoRpc;
				sse: OpenDemoSse;
				tenant: OpenDemoTenant;
				transaction: OpenDemoTransaction;
			};
		};
		dict: { info: DictInfo };
		swagger: Swagger;
		user: { address: UserAddress; comm: UserComm; info: UserInfo; login: UserLogin };
	};

	type DictKey = "brand" | "occupation";
}
