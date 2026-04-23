declare namespace Eps {
	interface BaseSysDepartmentEntity {
		/**
		 * 任意键值
		 */
		[key: string]: any;
	}

	interface BaseSysLogEntity {
		/**
		 * 任意键值
		 */
		[key: string]: any;
	}

	interface BaseSysMenuEntity {
		/**
		 * 任意键值
		 */
		[key: string]: any;
	}

	interface BaseSysParamEntity {
		/**
		 * 任意键值
		 */
		[key: string]: any;
	}

	interface BaseSysRoleEntity {
		/**
		 * 任意键值
		 */
		[key: string]: any;
	}

	interface BaseSysUserEntity {
		/**
		 * 任意键值
		 */
		[key: string]: any;
	}

	interface DemoGoodsEntity {
		/**
		 * 任意键值
		 */
		[key: string]: any;
	}

	interface DictInfoEntity {
		/**
		 * 任意键值
		 */
		[key: string]: any;
	}

	interface DictTypeEntity {
		/**
		 * 任意键值
		 */
		[key: string]: any;
	}

	interface PluginInfoEntity {
		/**
		 * 任意键值
		 */
		[key: string]: any;
	}

	interface RecycleDataEntity {
		/**
		 * 任意键值
		 */
		[key: string]: any;
	}

	interface SpaceInfoEntity {
		/**
		 * 任意键值
		 */
		[key: string]: any;
	}

	interface SpaceTypeEntity {
		/**
		 * 任意键值
		 */
		[key: string]: any;
	}

	interface TaskInfoEntity {
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

	interface PagePagination {
		size: number;
		page: number;
		total: number;
		[key: string]: any;
	}

	interface PageResponse<T> {
		pagination: PagePagination;
		list: T[];
		[key: string]: any;
	}

	interface BaseSysLogPageResponse {
		pagination: PagePagination;
		list: BaseSysLogEntity[];
	}

	interface BaseSysMenuPageResponse {
		pagination: PagePagination;
		list: BaseSysMenuEntity[];
	}

	interface BaseSysParamPageResponse {
		pagination: PagePagination;
		list: BaseSysParamEntity[];
	}

	interface BaseSysRolePageResponse {
		pagination: PagePagination;
		list: BaseSysRoleEntity[];
	}

	interface BaseSysUserPageResponse {
		pagination: PagePagination;
		list: BaseSysUserEntity[];
	}

	interface DemoGoodsPageResponse {
		pagination: PagePagination;
		list: DemoGoodsEntity[];
	}

	interface DictInfoPageResponse {
		pagination: PagePagination;
		list: DictInfoEntity[];
	}

	interface DictTypePageResponse {
		pagination: PagePagination;
		list: DictTypeEntity[];
	}

	interface PerformanceAnnualInspectionPageResponse {
		pagination: PagePagination;
		list: any[];
	}

	interface PerformanceAssessmentPageResponse {
		pagination: PagePagination;
		list: any[];
	}

	interface PerformanceAssetAssignmentPageResponse {
		pagination: PagePagination;
		list: any[];
	}

	interface PerformanceAssetDepreciationPageResponse {
		pagination: PagePagination;
		list: any[];
	}

	interface PerformanceAssetDisposalPageResponse {
		pagination: PagePagination;
		list: any[];
	}

	interface PerformanceAssetInfoPageResponse {
		pagination: PagePagination;
		list: any[];
	}

	interface PerformanceAssetInventoryPageResponse {
		pagination: PagePagination;
		list: any[];
	}

	interface PerformanceAssetMaintenancePageResponse {
		pagination: PagePagination;
		list: any[];
	}

	interface PerformanceAssetProcurementPageResponse {
		pagination: PagePagination;
		list: any[];
	}

	interface PerformanceAssetReportPageResponse {
		pagination: PagePagination;
		list: any[];
	}

	interface PerformanceAssetTransferPageResponse {
		pagination: PagePagination;
		list: any[];
	}

	interface PerformanceCapabilityModelPageResponse {
		pagination: PagePagination;
		list: any[];
	}

	interface PerformanceCertificatePageResponse {
		pagination: PagePagination;
		list: any[];
	}

	interface PerformanceContractPageResponse {
		pagination: PagePagination;
		list: any[];
	}

	interface PerformanceCoursePracticePageResponse {
		pagination: PagePagination;
		list: any[];
	}

	interface PerformanceCourseRecitePageResponse {
		pagination: PagePagination;
		list: any[];
	}

	interface PerformanceCoursePageResponse {
		pagination: PagePagination;
		list: any[];
	}

	interface PerformanceDesignCollabPageResponse {
		pagination: PagePagination;
		list: any[];
	}

	interface PerformanceDocumentCenterPageResponse {
		pagination: PagePagination;
		list: any[];
	}

	interface PerformanceExpressCollabPageResponse {
		pagination: PagePagination;
		list: any[];
	}

	interface PerformanceFeedbackPageResponse {
		pagination: PagePagination;
		list: any[];
	}

	interface PerformanceGoalPageResponse {
		pagination: PagePagination;
		list: any[];
	}

	interface PerformanceHiringPageResponse {
		pagination: PagePagination;
		list: any[];
	}

	interface PerformanceHonorPageResponse {
		pagination: PagePagination;
		list: any[];
	}

	interface PerformanceIndicatorPageResponse {
		pagination: PagePagination;
		list: any[];
	}

	interface PerformanceIntellectualPropertyPageResponse {
		pagination: PagePagination;
		list: any[];
	}

	interface PerformanceInterviewPageResponse {
		pagination: PagePagination;
		list: any[];
	}

	interface PerformanceJobStandardPageResponse {
		pagination: PagePagination;
		list: any[];
	}

	interface PerformanceKnowledgeBasePageResponse {
		pagination: PagePagination;
		list: any[];
	}

	interface PerformanceMeetingPageResponse {
		pagination: PagePagination;
		list: any[];
	}

	interface PerformancePipPageResponse {
		pagination: PagePagination;
		list: any[];
	}

	interface PerformancePromotionPageResponse {
		pagination: PagePagination;
		list: any[];
	}

	interface PerformancePublicityMaterialPageResponse {
		pagination: PagePagination;
		list: any[];
	}

	interface PerformancePurchaseOrderPageResponse {
		pagination: PagePagination;
		list: any[];
	}

	interface PerformanceRecruitPlanPageResponse {
		pagination: PagePagination;
		list: any[];
	}

	interface PerformanceResumePoolPageResponse {
		pagination: PagePagination;
		list: any[];
	}

	interface PerformanceSalaryPageResponse {
		pagination: PagePagination;
		list: any[];
	}

	interface PerformanceSuggestionPageResponse {
		pagination: PagePagination;
		list: any[];
	}

	interface PerformanceSupplierPageResponse {
		pagination: PagePagination;
		list: any[];
	}

	interface PerformanceTalentAssetPageResponse {
		pagination: PagePagination;
		list: any[];
	}

	interface PerformanceTeacherAgentAuditPageResponse {
		pagination: PagePagination;
		list: any[];
	}

	interface PerformanceTeacherAgentRelationPageResponse {
		pagination: PagePagination;
		list: any[];
	}

	interface PerformanceTeacherAgentPageResponse {
		pagination: PagePagination;
		list: any[];
	}

	interface PerformanceTeacherAttributionConflictPageResponse {
		pagination: PagePagination;
		list: any[];
	}

	interface PerformanceTeacherAttributionPageResponse {
		pagination: PagePagination;
		list: any[];
	}

	interface PerformanceTeacherClassPageResponse {
		pagination: PagePagination;
		list: any[];
	}

	interface PerformanceTeacherFollowPageResponse {
		pagination: PagePagination;
		list: any[];
	}

	interface PerformanceTeacherInfoPageResponse {
		pagination: PagePagination;
		list: any[];
	}

	interface PerformanceTeacherTodoPageResponse {
		pagination: PagePagination;
		list: any[];
	}

	interface PerformanceVehiclePageResponse {
		pagination: PagePagination;
		list: any[];
	}

	interface PerformanceAssetAssignmentRequestPageResponse {
		pagination: PagePagination;
		list: any[];
	}

	interface PerformanceMaterialCatalogPageResponse {
		pagination: PagePagination;
		list: any[];
	}

	interface PerformanceMaterialInboundPageResponse {
		pagination: PagePagination;
		list: any[];
	}

	interface PerformanceMaterialIssuePageResponse {
		pagination: PagePagination;
		list: any[];
	}

	interface PerformanceMaterialStockPageResponse {
		pagination: PagePagination;
		list: any[];
	}

	interface PerformanceMaterialStockLogPageResponse {
		pagination: PagePagination;
		list: any[];
	}

	interface PerformanceWorkPlanPageResponse {
		pagination: PagePagination;
		list: any[];
	}

	interface PluginInfoPageResponse {
		pagination: PagePagination;
		list: PluginInfoEntity[];
	}

	interface RecycleDataPageResponse {
		pagination: PagePagination;
		list: RecycleDataEntity[];
	}

	interface SpaceInfoPageResponse {
		pagination: PagePagination;
		list: SpaceInfoEntity[];
	}

	interface SpaceTypePageResponse {
		pagination: PagePagination;
		list: SpaceTypeEntity[];
	}

	interface TaskInfoPageResponse {
		pagination: PagePagination;
		list: TaskInfoEntity[];
	}

	interface UserAddressPageResponse {
		pagination: PagePagination;
		list: UserAddressEntity[];
	}

	interface UserInfoPageResponse {
		pagination: PagePagination;
		list: UserInfoEntity[];
	}

	interface BaseCoding {
		/**
		 * getModuleTree
		 */
		getModuleTree(data?: any): Promise<any>;

		/**
		 * createCode
		 */
		createCode(data?: any): Promise<any>;

		/**
		 * 权限标识
		 */
		permission: { getModuleTree: string; createCode: string };

		/**
		 * 权限状态
		 */
		_permission: { getModuleTree: boolean; createCode: boolean };

		request: Request;
	}

	interface BaseComm {
		/**
		 * personUpdate
		 */
		personUpdate(data?: any): Promise<any>;

		/**
		 * uploadMode
		 */
		uploadMode(data?: any): Promise<any>;

		/**
		 * permmenu
		 */
		permmenu(data?: any): Promise<any>;

		/**
		 * program
		 */
		program(data?: any): Promise<any>;

		/**
		 * person
		 */
		person(data?: any): Promise<any>;

		/**
		 * upload
		 */
		upload(data?: any): Promise<any>;

		/**
		 * logout
		 */
		logout(data?: any): Promise<any>;

		/**
		 * 权限标识
		 */
		permission: {
			personUpdate: string;
			uploadMode: string;
			permmenu: string;
			program: string;
			person: string;
			upload: string;
			logout: string;
		};

		/**
		 * 权限状态
		 */
		_permission: {
			personUpdate: boolean;
			uploadMode: boolean;
			permmenu: boolean;
			program: boolean;
			person: boolean;
			upload: boolean;
			logout: boolean;
		};

		request: Request;
	}

	interface BaseOpen {
		/**
		 * refreshToken
		 */
		refreshToken(data?: any): Promise<any>;

		/**
		 * runtimeMeta
		 */
		runtimeMeta(data?: any): Promise<any>;

		/**
		 * captcha
		 */
		captcha(data?: any): Promise<any>;

		/**
		 * login
		 */
		login(data?: any): Promise<any>;

		/**
		 * html
		 */
		html(data?: any): Promise<any>;

		/**
		 * eps
		 */
		eps(data?: any): Promise<any>;

		/**
		 * 权限标识
		 */
		permission: {
			refreshToken: string;
			runtimeMeta: string;
			captcha: string;
			login: string;
			html: string;
			eps: string;
		};

		/**
		 * 权限状态
		 */
		_permission: {
			refreshToken: boolean;
			runtimeMeta: boolean;
			captcha: boolean;
			login: boolean;
			html: boolean;
			eps: boolean;
		};

		request: Request;
	}

	interface BaseSysDepartment {
		/**
		 * delete
		 */
		delete(data?: any): Promise<any>;

		/**
		 * update
		 */
		update(data?: any): Promise<any>;

		/**
		 * order
		 */
		order(data?: any): Promise<any>;

		/**
		 * list
		 */
		list(data?: any): Promise<BaseSysDepartmentEntity[]>;

		/**
		 * add
		 */
		add(data?: any): Promise<any>;

		/**
		 * 权限标识
		 */
		permission: { delete: string; update: string; order: string; list: string; add: string };

		/**
		 * 权限状态
		 */
		_permission: {
			delete: boolean;
			update: boolean;
			order: boolean;
			list: boolean;
			add: boolean;
		};

		request: Request;
	}

	interface BaseSysLog {
		/**
		 * setKeep
		 */
		setKeep(data?: any): Promise<any>;

		/**
		 * getKeep
		 */
		getKeep(data?: any): Promise<any>;

		/**
		 * clear
		 */
		clear(data?: any): Promise<any>;

		/**
		 * page
		 */
		page(data?: any): Promise<BaseSysLogPageResponse>;

		/**
		 * 权限标识
		 */
		permission: { setKeep: string; getKeep: string; clear: string; page: string };

		/**
		 * 权限状态
		 */
		_permission: { setKeep: boolean; getKeep: boolean; clear: boolean; page: boolean };

		request: Request;
	}

	interface BaseSysMenu {
		/**
		 * create
		 */
		create(data?: any): Promise<any>;

		/**
		 * export
		 */
		export(data?: any): Promise<any>;

		/**
		 * import
		 */
		import(data?: any): Promise<any>;

		/**
		 * delete
		 */
		delete(data?: any): Promise<any>;

		/**
		 * update
		 */
		update(data?: any): Promise<any>;

		/**
		 * parse
		 */
		parse(data?: any): Promise<any>;

		/**
		 * info
		 */
		info(data?: any): Promise<BaseSysMenuEntity>;

		/**
		 * list
		 */
		list(data?: any): Promise<BaseSysMenuEntity[]>;

		/**
		 * page
		 */
		page(data?: any): Promise<BaseSysMenuPageResponse>;

		/**
		 * add
		 */
		add(data?: any): Promise<any>;

		/**
		 * 权限标识
		 */
		permission: {
			create: string;
			export: string;
			import: string;
			delete: string;
			update: string;
			parse: string;
			info: string;
			list: string;
			page: string;
			add: string;
		};

		/**
		 * 权限状态
		 */
		_permission: {
			create: boolean;
			export: boolean;
			import: boolean;
			delete: boolean;
			update: boolean;
			parse: boolean;
			info: boolean;
			list: boolean;
			page: boolean;
			add: boolean;
		};

		request: Request;
	}

	interface BaseSysParam {
		/**
		 * delete
		 */
		delete(data?: any): Promise<any>;

		/**
		 * update
		 */
		update(data?: any): Promise<any>;

		/**
		 * html
		 */
		html(data?: any): Promise<any>;

		/**
		 * info
		 */
		info(data?: any): Promise<BaseSysParamEntity>;

		/**
		 * page
		 */
		page(data?: any): Promise<BaseSysParamPageResponse>;

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
			html: string;
			info: string;
			page: string;
			add: string;
		};

		/**
		 * 权限状态
		 */
		_permission: {
			delete: boolean;
			update: boolean;
			html: boolean;
			info: boolean;
			page: boolean;
			add: boolean;
		};

		request: Request;
	}

	interface BaseSysRole {
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
		info(data?: any): Promise<BaseSysRoleEntity>;

		/**
		 * list
		 */
		list(data?: any): Promise<BaseSysRoleEntity[]>;

		/**
		 * page
		 */
		page(data?: any): Promise<BaseSysRolePageResponse>;

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

		request: Request;
	}

	interface BaseSysUser {
		/**
		 * delete
		 */
		delete(data?: any): Promise<any>;

		/**
		 * update
		 */
		update(data?: any): Promise<any>;

		/**
		 * move
		 */
		move(data?: any): Promise<any>;

		/**
		 * info
		 */
		info(data?: any): Promise<BaseSysUserEntity>;

		/**
		 * list
		 */
		list(data?: any): Promise<BaseSysUserEntity[]>;

		/**
		 * page
		 */
		page(data?: any): Promise<BaseSysUserPageResponse>;

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
			move: string;
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
			move: boolean;
			info: boolean;
			list: boolean;
			page: boolean;
			add: boolean;
		};

		request: Request;
	}

	interface DemoGoods {
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
		page(data?: any): Promise<DemoGoodsPageResponse>;

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

		request: Request;
	}

	interface DemoTenant {
		/**
		 * noTenant
		 */
		noTenant(data?: any): Promise<any>;

		/**
		 * noUse
		 */
		noUse(data?: any): Promise<any>;

		/**
		 * use
		 */
		use(data?: any): Promise<any>;

		/**
		 * 权限标识
		 */
		permission: { noTenant: string; noUse: string; use: string };

		/**
		 * 权限状态
		 */
		_permission: { noTenant: boolean; noUse: boolean; use: boolean };

		request: Request;
	}

	interface DictInfo {
		/**
		 * delete
		 */
		delete(data?: any): Promise<any>;

		/**
		 * update
		 */
		update(data?: any): Promise<any>;

		/**
		 * types
		 */
		types(data?: any): Promise<any>;

		/**
		 * data
		 */
		data(data?: any): Promise<any>;

		/**
		 * info
		 */
		info(data?: any): Promise<DictInfoEntity>;

		/**
		 * list
		 */
		list(data?: any): Promise<DictInfoEntity[]>;

		/**
		 * page
		 */
		page(data?: any): Promise<DictInfoPageResponse>;

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
			types: string;
			data: string;
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
			types: boolean;
			data: boolean;
			info: boolean;
			list: boolean;
			page: boolean;
			add: boolean;
		};

		request: Request;
	}

	interface DictType {
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
		info(data?: any): Promise<DictTypeEntity>;

		/**
		 * list
		 */
		list(data?: any): Promise<DictTypeEntity[]>;

		/**
		 * page
		 */
		page(data?: any): Promise<DictTypePageResponse>;

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

		request: Request;
	}

	interface PerformanceAnnualInspection {
		/**
		 * update
		 */
		update(data?: any): Promise<any>;

		/**
		 * delete
		 */
		delete(data?: any): Promise<any>;

		/**
		 * stats
		 */
		stats(data?: any): Promise<any>;

		/**
		 * page
		 */
		page(data?: any): Promise<PerformanceAnnualInspectionPageResponse>;

		/**
		 * info
		 */
		info(data?: any): Promise<any>;

		/**
		 * add
		 */
		add(data?: any): Promise<any>;

		/**
		 * 权限标识
		 */
		permission: {
			update: string;
			delete: string;
			stats: string;
			page: string;
			info: string;
			add: string;
		};

		/**
		 * 权限状态
		 */
		_permission: {
			update: boolean;
			delete: boolean;
			stats: boolean;
			page: boolean;
			info: boolean;
			add: boolean;
		};

		request: Request;
	}

	interface PerformanceApprovalFlow {
		/**
		 * info
		 */
		info(data?: any): Promise<any>;

		/**
		 * save
		 */
		save(data?: any): Promise<any>;

		/**
		 * terminate
		 */
		terminate(data?: any): Promise<any>;

		/**
		 * transfer
		 */
		transfer(data?: any): Promise<any>;

		/**
		 * withdraw
		 */
		withdraw(data?: any): Promise<any>;

		/**
		 * fallback
		 */
		fallback(data?: any): Promise<any>;

		/**
		 * approve
		 */
		approve(data?: any): Promise<any>;

		/**
		 * resolve
		 */
		resolve(data?: any): Promise<any>;

		/**
		 * reject
		 */
		reject(data?: any): Promise<any>;

		/**
		 * remind
		 */
		remind(data?: any): Promise<any>;

		/**
		 * info
		 */
		info(data?: any): Promise<any>;

		/**
		 * 权限标识
		 */
		permission: {
			info: string;
			save: string;
			terminate: string;
			transfer: string;
			withdraw: string;
			fallback: string;
			approve: string;
			resolve: string;
			reject: string;
			remind: string;
		};

		/**
		 * 权限状态
		 */
		_permission: {
			info: boolean;
			save: boolean;
			terminate: boolean;
			transfer: boolean;
			withdraw: boolean;
			fallback: boolean;
			approve: boolean;
			resolve: boolean;
			reject: boolean;
			remind: boolean;
		};

		request: Request;
	}

	interface PerformanceAssessment {
		/**
		 * approve
		 */
		approve(data?: any): Promise<any>;

		/**
		 * update
		 */
		update(data?: any): Promise<any>;

		/**
		 * delete
		 */
		delete(data?: any): Promise<any>;

		/**
		 * submit
		 */
		submit(data?: any): Promise<any>;

		/**
		 * reject
		 */
		reject(data?: any): Promise<any>;

		/**
		 * export
		 */
		export(data?: any): Promise<any>;

		/**
		 * page
		 */
		page(data?: any): Promise<PerformanceAssessmentPageResponse>;

		/**
		 * info
		 */
		info(data?: any): Promise<any>;

		/**
		 * add
		 */
		add(data?: any): Promise<any>;

		/**
		 * 权限标识
		 */
		permission: {
			approve: string;
			update: string;
			delete: string;
			submit: string;
			reject: string;
			export: string;
			page: string;
			info: string;
			add: string;
		};

		/**
		 * 权限状态
		 */
		_permission: {
			approve: boolean;
			update: boolean;
			delete: boolean;
			submit: boolean;
			reject: boolean;
			export: boolean;
			page: boolean;
			info: boolean;
			add: boolean;
		};

		request: Request;
	}

	interface PerformanceAssetAssignment {
		/**
		 * markLost
		 */
		markLost(data?: any): Promise<any>;

		/**
		 * update
		 */
		update(data?: any): Promise<any>;

		/**
		 * return
		 */
		return(data?: any): Promise<any>;

		/**
		 * delete
		 */
		delete(data?: any): Promise<any>;

		/**
		 * page
		 */
		page(data?: any): Promise<PerformanceAssetAssignmentPageResponse>;

		/**
		 * add
		 */
		add(data?: any): Promise<any>;

		/**
		 * 权限标识
		 */
		permission: {
			markLost: string;
			update: string;
			return: string;
			delete: string;
			page: string;
			add: string;
		};

		/**
		 * 权限状态
		 */
		_permission: {
			markLost: boolean;
			update: boolean;
			return: boolean;
			delete: boolean;
			page: boolean;
			add: boolean;
		};

		request: Request;
	}

	interface PerformanceAssetDashboard {
		/**
		 * summary
		 */
		summary(data?: any): Promise<any>;

		/**
		 * 权限标识
		 */
		permission: { summary: string };

		/**
		 * 权限状态
		 */
		_permission: { summary: boolean };

		request: Request;
	}

	interface PerformanceAssetDepreciation {
		/**
		 * recalculate
		 */
		recalculate(data?: any): Promise<any>;

		/**
		 * summary
		 */
		summary(data?: any): Promise<any>;

		/**
		 * page
		 */
		page(data?: any): Promise<PerformanceAssetDepreciationPageResponse>;

		/**
		 * 权限标识
		 */
		permission: { recalculate: string; summary: string; page: string };

		/**
		 * 权限状态
		 */
		_permission: { recalculate: boolean; summary: boolean; page: boolean };

		request: Request;
	}

	interface PerformanceAssetDisposal {
		/**
		 * approve
		 */
		approve(data?: any): Promise<any>;

		/**
		 * execute
		 */
		execute(data?: any): Promise<any>;

		/**
		 * update
		 */
		update(data?: any): Promise<any>;

		/**
		 * submit
		 */
		submit(data?: any): Promise<any>;

		/**
		 * cancel
		 */
		cancel(data?: any): Promise<any>;

		/**
		 * page
		 */
		page(data?: any): Promise<PerformanceAssetDisposalPageResponse>;

		/**
		 * info
		 */
		info(data?: any): Promise<any>;

		/**
		 * add
		 */
		add(data?: any): Promise<any>;

		/**
		 * 权限标识
		 */
		permission: {
			approve: string;
			execute: string;
			update: string;
			submit: string;
			cancel: string;
			page: string;
			info: string;
			add: string;
		};

		/**
		 * 权限状态
		 */
		_permission: {
			approve: boolean;
			execute: boolean;
			update: boolean;
			submit: boolean;
			cancel: boolean;
			page: boolean;
			info: boolean;
			add: boolean;
		};

		request: Request;
	}

	interface PerformanceAssetInfo {
		/**
		 * updateStatus
		 */
		updateStatus(data?: any): Promise<any>;

		/**
		 * update
		 */
		update(data?: any): Promise<any>;

		/**
		 * delete
		 */
		delete(data?: any): Promise<any>;

		/**
		 * page
		 */
		page(data?: any): Promise<PerformanceAssetInfoPageResponse>;

		/**
		 * info
		 */
		info(data?: any): Promise<any>;

		/**
		 * add
		 */
		add(data?: any): Promise<any>;

		/**
		 * 权限标识
		 */
		permission: {
			updateStatus: string;
			update: string;
			delete: string;
			page: string;
			info: string;
			add: string;
		};

		/**
		 * 权限状态
		 */
		_permission: {
			updateStatus: boolean;
			update: boolean;
			delete: boolean;
			page: boolean;
			info: boolean;
			add: boolean;
		};

		request: Request;
	}

	interface PerformanceAssetInventory {
		/**
		 * complete
		 */
		complete(data?: any): Promise<any>;

		/**
		 * update
		 */
		update(data?: any): Promise<any>;

		/**
		 * start
		 */
		start(data?: any): Promise<any>;

		/**
		 * close
		 */
		close(data?: any): Promise<any>;

		/**
		 * page
		 */
		page(data?: any): Promise<PerformanceAssetInventoryPageResponse>;

		/**
		 * info
		 */
		info(data?: any): Promise<any>;

		/**
		 * add
		 */
		add(data?: any): Promise<any>;

		/**
		 * 权限标识
		 */
		permission: {
			complete: string;
			update: string;
			start: string;
			close: string;
			page: string;
			info: string;
			add: string;
		};

		/**
		 * 权限状态
		 */
		_permission: {
			complete: boolean;
			update: boolean;
			start: boolean;
			close: boolean;
			page: boolean;
			info: boolean;
			add: boolean;
		};

		request: Request;
	}

	interface PerformanceAssetMaintenance {
		/**
		 * complete
		 */
		complete(data?: any): Promise<any>;

		/**
		 * update
		 */
		update(data?: any): Promise<any>;

		/**
		 * cancel
		 */
		cancel(data?: any): Promise<any>;

		/**
		 * delete
		 */
		delete(data?: any): Promise<any>;

		/**
		 * page
		 */
		page(data?: any): Promise<PerformanceAssetMaintenancePageResponse>;

		/**
		 * add
		 */
		add(data?: any): Promise<any>;

		/**
		 * 权限标识
		 */
		permission: {
			complete: string;
			update: string;
			cancel: string;
			delete: string;
			page: string;
			add: string;
		};

		/**
		 * 权限状态
		 */
		_permission: {
			complete: boolean;
			update: boolean;
			cancel: boolean;
			delete: boolean;
			page: boolean;
			add: boolean;
		};

		request: Request;
	}

	interface PerformanceAssetProcurement {
		/**
		 * receive
		 */
		receive(data?: any): Promise<any>;

		/**
		 * update
		 */
		update(data?: any): Promise<any>;

		/**
		 * submit
		 */
		submit(data?: any): Promise<any>;

		/**
		 * cancel
		 */
		cancel(data?: any): Promise<any>;

		/**
		 * page
		 */
		page(data?: any): Promise<PerformanceAssetProcurementPageResponse>;

		/**
		 * info
		 */
		info(data?: any): Promise<any>;

		/**
		 * add
		 */
		add(data?: any): Promise<any>;

		/**
		 * 权限标识
		 */
		permission: {
			receive: string;
			update: string;
			submit: string;
			cancel: string;
			page: string;
			info: string;
			add: string;
		};

		/**
		 * 权限状态
		 */
		_permission: {
			receive: boolean;
			update: boolean;
			submit: boolean;
			cancel: boolean;
			page: boolean;
			info: boolean;
			add: boolean;
		};

		request: Request;
	}

	interface PerformanceAssetReport {
		/**
		 * summary
		 */
		summary(data?: any): Promise<any>;

		/**
		 * export
		 */
		export(data?: any): Promise<any>;

		/**
		 * page
		 */
		page(data?: any): Promise<PerformanceAssetReportPageResponse>;

		/**
		 * 权限标识
		 */
		permission: { summary: string; export: string; page: string };

		/**
		 * 权限状态
		 */
		_permission: { summary: boolean; export: boolean; page: boolean };

		request: Request;
	}

	interface PerformanceAssetTransfer {
		/**
		 * complete
		 */
		complete(data?: any): Promise<any>;

		/**
		 * update
		 */
		update(data?: any): Promise<any>;

		/**
		 * submit
		 */
		submit(data?: any): Promise<any>;

		/**
		 * cancel
		 */
		cancel(data?: any): Promise<any>;

		/**
		 * page
		 */
		page(data?: any): Promise<PerformanceAssetTransferPageResponse>;

		/**
		 * info
		 */
		info(data?: any): Promise<any>;

		/**
		 * add
		 */
		add(data?: any): Promise<any>;

		/**
		 * 权限标识
		 */
		permission: {
			complete: string;
			update: string;
			submit: string;
			cancel: string;
			page: string;
			info: string;
			add: string;
		};

		/**
		 * 权限状态
		 */
		_permission: {
			complete: boolean;
			update: boolean;
			submit: boolean;
			cancel: boolean;
			page: boolean;
			info: boolean;
			add: boolean;
		};

		request: Request;
	}

	interface PerformanceCapabilityItem {
		/**
		 * info
		 */
		info(data?: any): Promise<any>;

		/**
		 * 权限标识
		 */
		permission: { info: string };

		/**
		 * 权限状态
		 */
		_permission: { info: boolean };

		request: Request;
	}

	interface PerformanceCapabilityModel {
		/**
		 * update
		 */
		update(data?: any): Promise<any>;

		/**
		 * page
		 */
		page(data?: any): Promise<PerformanceCapabilityModelPageResponse>;

		/**
		 * info
		 */
		info(data?: any): Promise<any>;

		/**
		 * add
		 */
		add(data?: any): Promise<any>;

		/**
		 * 权限标识
		 */
		permission: { update: string; page: string; info: string; add: string };

		/**
		 * 权限状态
		 */
		_permission: { update: boolean; page: boolean; info: boolean; add: boolean };

		request: Request;
	}

	interface PerformanceCapabilityPortrait {
		/**
		 * info
		 */
		info(data?: any): Promise<any>;

		/**
		 * 权限标识
		 */
		permission: { info: string };

		/**
		 * 权限状态
		 */
		_permission: { info: boolean };

		request: Request;
	}

	interface PerformanceCertificate {
		/**
		 * recordPage
		 */
		recordPage(data?: any): Promise<any>;

		/**
		 * update
		 */
		update(data?: any): Promise<any>;

		/**
		 * issue
		 */
		issue(data?: any): Promise<any>;

		/**
		 * page
		 */
		page(data?: any): Promise<PerformanceCertificatePageResponse>;

		/**
		 * info
		 */
		info(data?: any): Promise<any>;

		/**
		 * add
		 */
		add(data?: any): Promise<any>;

		/**
		 * 权限标识
		 */
		permission: {
			recordPage: string;
			update: string;
			issue: string;
			page: string;
			info: string;
			add: string;
		};

		/**
		 * 权限状态
		 */
		_permission: {
			recordPage: boolean;
			update: boolean;
			issue: boolean;
			page: boolean;
			info: boolean;
			add: boolean;
		};

		request: Request;
	}

	interface PerformanceContract {
		/**
		 * update
		 */
		update(data?: any): Promise<any>;

		/**
		 * delete
		 */
		delete(data?: any): Promise<any>;

		/**
		 * page
		 */
		page(data?: any): Promise<PerformanceContractPageResponse>;

		/**
		 * info
		 */
		info(data?: any): Promise<any>;

		/**
		 * add
		 */
		add(data?: any): Promise<any>;

		/**
		 * 权限标识
		 */
		permission: { update: string; delete: string; page: string; info: string; add: string };

		/**
		 * 权限状态
		 */
		_permission: {
			update: boolean;
			delete: boolean;
			page: boolean;
			info: boolean;
			add: boolean;
		};

		request: Request;
	}

	interface PerformanceCourseExam {
		/**
		 * summary
		 */
		summary(data?: any): Promise<any>;

		/**
		 * 权限标识
		 */
		permission: { summary: string };

		/**
		 * 权限状态
		 */
		_permission: { summary: boolean };

		request: Request;
	}

	interface PerformanceCoursePractice {
		/**
		 * submit
		 */
		submit(data?: any): Promise<any>;

		/**
		 * page
		 */
		page(data?: any): Promise<PerformanceCoursePracticePageResponse>;

		/**
		 * info
		 */
		info(data?: any): Promise<any>;

		/**
		 * 权限标识
		 */
		permission: { submit: string; page: string; info: string };

		/**
		 * 权限状态
		 */
		_permission: { submit: boolean; page: boolean; info: boolean };

		request: Request;
	}

	interface PerformanceCourseRecite {
		/**
		 * submit
		 */
		submit(data?: any): Promise<any>;

		/**
		 * page
		 */
		page(data?: any): Promise<PerformanceCourseRecitePageResponse>;

		/**
		 * info
		 */
		info(data?: any): Promise<any>;

		/**
		 * 权限标识
		 */
		permission: { submit: string; page: string; info: string };

		/**
		 * 权限状态
		 */
		_permission: { submit: boolean; page: boolean; info: boolean };

		request: Request;
	}

	interface PerformanceCourse {
		/**
		 * enrollmentPage
		 */
		enrollmentPage(data?: any): Promise<any>;

		/**
		 * update
		 */
		update(data?: any): Promise<any>;

		/**
		 * delete
		 */
		delete(data?: any): Promise<any>;

		/**
		 * page
		 */
		page(data?: any): Promise<PerformanceCoursePageResponse>;

		/**
		 * info
		 */
		info(data?: any): Promise<any>;

		/**
		 * add
		 */
		add(data?: any): Promise<any>;

		/**
		 * 权限标识
		 */
		permission: {
			enrollmentPage: string;
			update: string;
			delete: string;
			page: string;
			info: string;
			add: string;
		};

		/**
		 * 权限状态
		 */
		_permission: {
			enrollmentPage: boolean;
			update: boolean;
			delete: boolean;
			page: boolean;
			info: boolean;
			add: boolean;
		};

		request: Request;
	}

	interface PerformanceDashboard {
		/**
		 * crossSummary
		 */
		crossSummary(data?: any): Promise<any>;

		/**
		 * summary
		 */
		summary(data?: any): Promise<any>;

		/**
		 * 权限标识
		 */
		permission: { crossSummary: string; summary: string };

		/**
		 * 权限状态
		 */
		_permission: { crossSummary: boolean; summary: boolean };

		request: Request;
	}

	interface PerformanceDesignCollab {
		/**
		 * update
		 */
		update(data?: any): Promise<any>;

		/**
		 * delete
		 */
		delete(data?: any): Promise<any>;

		/**
		 * stats
		 */
		stats(data?: any): Promise<any>;

		/**
		 * page
		 */
		page(data?: any): Promise<PerformanceDesignCollabPageResponse>;

		/**
		 * info
		 */
		info(data?: any): Promise<any>;

		/**
		 * add
		 */
		add(data?: any): Promise<any>;

		/**
		 * 权限标识
		 */
		permission: {
			update: string;
			delete: string;
			stats: string;
			page: string;
			info: string;
			add: string;
		};

		/**
		 * 权限状态
		 */
		_permission: {
			update: boolean;
			delete: boolean;
			stats: boolean;
			page: boolean;
			info: boolean;
			add: boolean;
		};

		request: Request;
	}

	interface PerformanceDocumentCenter {
		/**
		 * update
		 */
		update(data?: any): Promise<any>;

		/**
		 * delete
		 */
		delete(data?: any): Promise<any>;

		/**
		 * stats
		 */
		stats(data?: any): Promise<any>;

		/**
		 * page
		 */
		page(data?: any): Promise<PerformanceDocumentCenterPageResponse>;

		/**
		 * info
		 */
		info(data?: any): Promise<any>;

		/**
		 * add
		 */
		add(data?: any): Promise<any>;

		/**
		 * 权限标识
		 */
		permission: {
			update: string;
			delete: string;
			stats: string;
			page: string;
			info: string;
			add: string;
		};

		/**
		 * 权限状态
		 */
		_permission: {
			update: boolean;
			delete: boolean;
			stats: boolean;
			page: boolean;
			info: boolean;
			add: boolean;
		};

		request: Request;
	}

	interface PerformanceExpressCollab {
		/**
		 * update
		 */
		update(data?: any): Promise<any>;

		/**
		 * delete
		 */
		delete(data?: any): Promise<any>;

		/**
		 * stats
		 */
		stats(data?: any): Promise<any>;

		/**
		 * page
		 */
		page(data?: any): Promise<PerformanceExpressCollabPageResponse>;

		/**
		 * info
		 */
		info(data?: any): Promise<any>;

		/**
		 * add
		 */
		add(data?: any): Promise<any>;

		/**
		 * 权限标识
		 */
		permission: {
			update: string;
			delete: string;
			stats: string;
			page: string;
			info: string;
			add: string;
		};

		/**
		 * 权限状态
		 */
		_permission: {
			update: boolean;
			delete: boolean;
			stats: boolean;
			page: boolean;
			info: boolean;
			add: boolean;
		};

		request: Request;
	}

	interface PerformanceFeedback {
		/**
		 * summary
		 */
		summary(data?: any): Promise<any>;

		/**
		 * submit
		 */
		submit(data?: any): Promise<any>;

		/**
		 * export
		 */
		export(data?: any): Promise<any>;

		/**
		 * page
		 */
		page(data?: any): Promise<PerformanceFeedbackPageResponse>;

		/**
		 * info
		 */
		info(data?: any): Promise<any>;

		/**
		 * add
		 */
		add(data?: any): Promise<any>;

		/**
		 * 权限标识
		 */
		permission: {
			summary: string;
			submit: string;
			export: string;
			page: string;
			info: string;
			add: string;
		};

		/**
		 * 权限状态
		 */
		_permission: {
			summary: boolean;
			submit: boolean;
			export: boolean;
			page: boolean;
			info: boolean;
			add: boolean;
		};

		request: Request;
	}

	interface PerformanceGoal {
		/**
		 * opsDepartmentConfigSave
		 */
		opsDepartmentConfigSave(data?: any): Promise<any>;

		/**
		 * opsReportStatusUpdate
		 */
		opsReportStatusUpdate(data?: any): Promise<any>;

		/**
		 * opsDepartmentConfig
		 */
		opsDepartmentConfig(data?: any): Promise<any>;

		/**
		 * opsReportGenerate
		 */
		opsReportGenerate(data?: any): Promise<any>;

		/**
		 * opsAccessProfile
		 */
		opsAccessProfile(data?: any): Promise<any>;

		/**
		 * opsDailyFinalize
		 */
		opsDailyFinalize(data?: any): Promise<any>;

		/**
		 * progressUpdate
		 */
		progressUpdate(data?: any): Promise<any>;

		/**
		 * opsDailySubmit
		 */
		opsDailySubmit(data?: any): Promise<any>;

		/**
		 * opsPlanDelete
		 */
		opsPlanDelete(data?: any): Promise<any>;

		/**
		 * opsReportInfo
		 */
		opsReportInfo(data?: any): Promise<any>;

		/**
		 * opsPlanPage
		 */
		opsPlanPage(data?: any): Promise<any>;

		/**
		 * opsPlanInfo
		 */
		opsPlanInfo(data?: any): Promise<any>;

		/**
		 * opsPlanSave
		 */
		opsPlanSave(data?: any): Promise<any>;

		/**
		 * opsOverview
		 */
		opsOverview(data?: any): Promise<any>;

		/**
		 * update
		 */
		update(data?: any): Promise<any>;

		/**
		 * delete
		 */
		delete(data?: any): Promise<any>;

		/**
		 * export
		 */
		export(data?: any): Promise<any>;

		/**
		 * page
		 */
		page(data?: any): Promise<PerformanceGoalPageResponse>;

		/**
		 * info
		 */
		info(data?: any): Promise<any>;

		/**
		 * add
		 */
		add(data?: any): Promise<any>;

		/**
		 * 权限标识
		 */
		permission: {
			opsDepartmentConfigSave: string;
			opsReportStatusUpdate: string;
			opsDepartmentConfig: string;
			opsReportGenerate: string;
			opsAccessProfile: string;
			opsDailyFinalize: string;
			progressUpdate: string;
			opsDailySubmit: string;
			opsPlanDelete: string;
			opsReportInfo: string;
			opsPlanPage: string;
			opsPlanInfo: string;
			opsPlanSave: string;
			opsOverview: string;
			update: string;
			delete: string;
			export: string;
			page: string;
			info: string;
			add: string;
		};

		/**
		 * 权限状态
		 */
		_permission: {
			opsDepartmentConfigSave: boolean;
			opsReportStatusUpdate: boolean;
			opsDepartmentConfig: boolean;
			opsReportGenerate: boolean;
			opsAccessProfile: boolean;
			opsDailyFinalize: boolean;
			progressUpdate: boolean;
			opsDailySubmit: boolean;
			opsPlanDelete: boolean;
			opsReportInfo: boolean;
			opsPlanPage: boolean;
			opsPlanInfo: boolean;
			opsPlanSave: boolean;
			opsOverview: boolean;
			update: boolean;
			delete: boolean;
			export: boolean;
			page: boolean;
			info: boolean;
			add: boolean;
		};

		request: Request;
	}

	interface PerformanceHiring {
		/**
		 * updateStatus
		 */
		updateStatus(data?: any): Promise<any>;

		/**
		 * close
		 */
		close(data?: any): Promise<any>;

		/**
		 * page
		 */
		page(data?: any): Promise<PerformanceHiringPageResponse>;

		/**
		 * info
		 */
		info(data?: any): Promise<any>;

		/**
		 * add
		 */
		add(data?: any): Promise<any>;

		/**
		 * 权限标识
		 */
		permission: {
			updateStatus: string;
			close: string;
			page: string;
			info: string;
			add: string;
		};

		/**
		 * 权限状态
		 */
		_permission: {
			updateStatus: boolean;
			close: boolean;
			page: boolean;
			info: boolean;
			add: boolean;
		};

		request: Request;
	}

	interface PerformanceHonor {
		/**
		 * update
		 */
		update(data?: any): Promise<any>;

		/**
		 * delete
		 */
		delete(data?: any): Promise<any>;

		/**
		 * stats
		 */
		stats(data?: any): Promise<any>;

		/**
		 * page
		 */
		page(data?: any): Promise<PerformanceHonorPageResponse>;

		/**
		 * info
		 */
		info(data?: any): Promise<any>;

		/**
		 * add
		 */
		add(data?: any): Promise<any>;

		/**
		 * 权限标识
		 */
		permission: {
			update: string;
			delete: string;
			stats: string;
			page: string;
			info: string;
			add: string;
		};

		/**
		 * 权限状态
		 */
		_permission: {
			update: boolean;
			delete: boolean;
			stats: boolean;
			page: boolean;
			info: boolean;
			add: boolean;
		};

		request: Request;
	}

	interface PerformanceIndicator {
		/**
		 * update
		 */
		update(data?: any): Promise<any>;

		/**
		 * delete
		 */
		delete(data?: any): Promise<any>;

		/**
		 * page
		 */
		page(data?: any): Promise<PerformanceIndicatorPageResponse>;

		/**
		 * info
		 */
		info(data?: any): Promise<any>;

		/**
		 * add
		 */
		add(data?: any): Promise<any>;

		/**
		 * 权限标识
		 */
		permission: { update: string; delete: string; page: string; info: string; add: string };

		/**
		 * 权限状态
		 */
		_permission: {
			update: boolean;
			delete: boolean;
			page: boolean;
			info: boolean;
			add: boolean;
		};

		request: Request;
	}

	interface PerformanceIntellectualProperty {
		/**
		 * update
		 */
		update(data?: any): Promise<any>;

		/**
		 * delete
		 */
		delete(data?: any): Promise<any>;

		/**
		 * stats
		 */
		stats(data?: any): Promise<any>;

		/**
		 * page
		 */
		page(data?: any): Promise<PerformanceIntellectualPropertyPageResponse>;

		/**
		 * info
		 */
		info(data?: any): Promise<any>;

		/**
		 * add
		 */
		add(data?: any): Promise<any>;

		/**
		 * 权限标识
		 */
		permission: {
			update: string;
			delete: string;
			stats: string;
			page: string;
			info: string;
			add: string;
		};

		/**
		 * 权限状态
		 */
		_permission: {
			update: boolean;
			delete: boolean;
			stats: boolean;
			page: boolean;
			info: boolean;
			add: boolean;
		};

		request: Request;
	}

	interface PerformanceInterview {
		/**
		 * update
		 */
		update(data?: any): Promise<any>;

		/**
		 * delete
		 */
		delete(data?: any): Promise<any>;

		/**
		 * page
		 */
		page(data?: any): Promise<PerformanceInterviewPageResponse>;

		/**
		 * info
		 */
		info(data?: any): Promise<any>;

		/**
		 * add
		 */
		add(data?: any): Promise<any>;

		/**
		 * 权限标识
		 */
		permission: { update: string; delete: string; page: string; info: string; add: string };

		/**
		 * 权限状态
		 */
		_permission: {
			update: boolean;
			delete: boolean;
			page: boolean;
			info: boolean;
			add: boolean;
		};

		request: Request;
	}

	interface PerformanceJobStandard {
		/**
		 * setStatus
		 */
		setStatus(data?: any): Promise<any>;

		/**
		 * update
		 */
		update(data?: any): Promise<any>;

		/**
		 * page
		 */
		page(data?: any): Promise<PerformanceJobStandardPageResponse>;

		/**
		 * info
		 */
		info(data?: any): Promise<any>;

		/**
		 * add
		 */
		add(data?: any): Promise<any>;

		/**
		 * 权限标识
		 */
		permission: { setStatus: string; update: string; page: string; info: string; add: string };

		/**
		 * 权限状态
		 */
		_permission: {
			setStatus: boolean;
			update: boolean;
			page: boolean;
			info: boolean;
			add: boolean;
		};

		request: Request;
	}

	interface PerformanceKnowledgeBase {
		/**
		 * update
		 */
		update(data?: any): Promise<any>;

		/**
		 * delete
		 */
		delete(data?: any): Promise<any>;

		/**
		 * search
		 */
		search(data?: any): Promise<any>;

		/**
		 * qaList
		 */
		qaList(data?: any): Promise<any>;

		/**
		 * stats
		 */
		stats(data?: any): Promise<any>;

		/**
		 * graph
		 */
		graph(data?: any): Promise<any>;

		/**
		 * qaAdd
		 */
		qaAdd(data?: any): Promise<any>;

		/**
		 * page
		 */
		page(data?: any): Promise<PerformanceKnowledgeBasePageResponse>;

		/**
		 * add
		 */
		add(data?: any): Promise<any>;

		/**
		 * 权限标识
		 */
		permission: {
			update: string;
			delete: string;
			search: string;
			qaList: string;
			stats: string;
			graph: string;
			qaAdd: string;
			page: string;
			add: string;
		};

		/**
		 * 权限状态
		 */
		_permission: {
			update: boolean;
			delete: boolean;
			search: boolean;
			qaList: boolean;
			stats: boolean;
			graph: boolean;
			qaAdd: boolean;
			page: boolean;
			add: boolean;
		};

		request: Request;
	}

	interface PerformanceMeeting {
		/**
		 * checkIn
		 */
		checkIn(data?: any): Promise<any>;

		/**
		 * update
		 */
		update(data?: any): Promise<any>;

		/**
		 * delete
		 */
		delete(data?: any): Promise<any>;

		/**
		 * page
		 */
		page(data?: any): Promise<PerformanceMeetingPageResponse>;

		/**
		 * info
		 */
		info(data?: any): Promise<any>;

		/**
		 * add
		 */
		add(data?: any): Promise<any>;

		/**
		 * 权限标识
		 */
		permission: {
			checkIn: string;
			update: string;
			delete: string;
			page: string;
			info: string;
			add: string;
		};

		/**
		 * 权限状态
		 */
		_permission: {
			checkIn: boolean;
			update: boolean;
			delete: boolean;
			page: boolean;
			info: boolean;
			add: boolean;
		};

		request: Request;
	}

	interface PerformancePip {
		/**
		 * complete
		 */
		complete(data?: any): Promise<any>;

		/**
		 * update
		 */
		update(data?: any): Promise<any>;

		/**
		 * export
		 */
		export(data?: any): Promise<any>;

		/**
		 * start
		 */
		start(data?: any): Promise<any>;

		/**
		 * track
		 */
		track(data?: any): Promise<any>;

		/**
		 * close
		 */
		close(data?: any): Promise<any>;

		/**
		 * page
		 */
		page(data?: any): Promise<PerformancePipPageResponse>;

		/**
		 * info
		 */
		info(data?: any): Promise<any>;

		/**
		 * add
		 */
		add(data?: any): Promise<any>;

		/**
		 * 权限标识
		 */
		permission: {
			complete: string;
			update: string;
			export: string;
			start: string;
			track: string;
			close: string;
			page: string;
			info: string;
			add: string;
		};

		/**
		 * 权限状态
		 */
		_permission: {
			complete: boolean;
			update: boolean;
			export: boolean;
			start: boolean;
			track: boolean;
			close: boolean;
			page: boolean;
			info: boolean;
			add: boolean;
		};

		request: Request;
	}

	interface PerformancePromotion {
		/**
		 * update
		 */
		update(data?: any): Promise<any>;

		/**
		 * submit
		 */
		submit(data?: any): Promise<any>;

		/**
		 * review
		 */
		review(data?: any): Promise<any>;

		/**
		 * page
		 */
		page(data?: any): Promise<PerformancePromotionPageResponse>;

		/**
		 * info
		 */
		info(data?: any): Promise<any>;

		/**
		 * add
		 */
		add(data?: any): Promise<any>;

		/**
		 * 权限标识
		 */
		permission: {
			update: string;
			submit: string;
			review: string;
			page: string;
			info: string;
			add: string;
		};

		/**
		 * 权限状态
		 */
		_permission: {
			update: boolean;
			submit: boolean;
			review: boolean;
			page: boolean;
			info: boolean;
			add: boolean;
		};

		request: Request;
	}

	interface PerformancePublicityMaterial {
		/**
		 * update
		 */
		update(data?: any): Promise<any>;

		/**
		 * delete
		 */
		delete(data?: any): Promise<any>;

		/**
		 * stats
		 */
		stats(data?: any): Promise<any>;

		/**
		 * page
		 */
		page(data?: any): Promise<PerformancePublicityMaterialPageResponse>;

		/**
		 * info
		 */
		info(data?: any): Promise<any>;

		/**
		 * add
		 */
		add(data?: any): Promise<any>;

		/**
		 * 权限标识
		 */
		permission: {
			update: string;
			delete: string;
			stats: string;
			page: string;
			info: string;
			add: string;
		};

		/**
		 * 权限状态
		 */
		_permission: {
			update: boolean;
			delete: boolean;
			stats: boolean;
			page: boolean;
			info: boolean;
			add: boolean;
		};

		request: Request;
	}

	interface PerformancePurchaseOrder {
		/**
		 * submitApproval
		 */
		submitApproval(data?: any): Promise<any>;

		/**
		 * submitInquiry
		 */
		submitInquiry(data?: any): Promise<any>;

		/**
		 * approve
		 */
		approve(data?: any): Promise<any>;

		/**
		 * receive
		 */
		receive(data?: any): Promise<any>;

		/**
		 * update
		 */
		update(data?: any): Promise<any>;

		/**
		 * reject
		 */
		reject(data?: any): Promise<any>;

		/**
		 * delete
		 */
		delete(data?: any): Promise<any>;

		/**
		 * close
		 */
		close(data?: any): Promise<any>;

		/**
		 * page
		 */
		page(data?: any): Promise<PerformancePurchaseOrderPageResponse>;

		/**
		 * info
		 */
		info(data?: any): Promise<any>;

		/**
		 * add
		 */
		add(data?: any): Promise<any>;

		/**
		 * 权限标识
		 */
		permission: {
			submitApproval: string;
			submitInquiry: string;
			approve: string;
			receive: string;
			update: string;
			reject: string;
			delete: string;
			close: string;
			page: string;
			info: string;
			add: string;
		};

		/**
		 * 权限状态
		 */
		_permission: {
			submitApproval: boolean;
			submitInquiry: boolean;
			approve: boolean;
			receive: boolean;
			update: boolean;
			reject: boolean;
			delete: boolean;
			close: boolean;
			page: boolean;
			info: boolean;
			add: boolean;
		};

		request: Request;
	}

	interface PerformancePurchaseReport {
		/**
		 * supplierStats
		 */
		supplierStats(data?: any): Promise<any>;

		/**
		 * summary
		 */
		summary(data?: any): Promise<any>;

		/**
		 * trend
		 */
		trend(data?: any): Promise<any>;

		/**
		 * 权限标识
		 */
		permission: { supplierStats: string; summary: string; trend: string };

		/**
		 * 权限状态
		 */
		_permission: { supplierStats: boolean; summary: boolean; trend: boolean };

		request: Request;
	}

	interface PerformanceRecruitPlan {
		/**
		 * update
		 */
		update(data?: any): Promise<any>;

		/**
		 * delete
		 */
		delete(data?: any): Promise<any>;

		/**
		 * import
		 */
		import(data?: any): Promise<any>;

		/**
		 * export
		 */
		export(data?: any): Promise<any>;

		/**
		 * submit
		 */
		submit(data?: any): Promise<any>;

		/**
		 * reopen
		 */
		reopen(data?: any): Promise<any>;

		/**
		 * close
		 */
		close(data?: any): Promise<any>;

		/**
		 * page
		 */
		page(data?: any): Promise<PerformanceRecruitPlanPageResponse>;

		/**
		 * info
		 */
		info(data?: any): Promise<any>;

		/**
		 * void
		 */
		void(data?: any): Promise<any>;

		/**
		 * add
		 */
		add(data?: any): Promise<any>;

		/**
		 * 权限标识
		 */
		permission: {
			update: string;
			delete: string;
			import: string;
			export: string;
			submit: string;
			reopen: string;
			close: string;
			page: string;
			info: string;
			void: string;
			add: string;
		};

		/**
		 * 权限状态
		 */
		_permission: {
			update: boolean;
			delete: boolean;
			import: boolean;
			export: boolean;
			submit: boolean;
			reopen: boolean;
			close: boolean;
			page: boolean;
			info: boolean;
			void: boolean;
			add: boolean;
		};

		request: Request;
	}

	interface PerformanceResumePool {
		/**
		 * convertToTalentAsset
		 */
		convertToTalentAsset(data?: any): Promise<any>;

		/**
		 * downloadAttachment
		 */
		downloadAttachment(data?: any): Promise<any>;

		/**
		 * uploadAttachment
		 */
		uploadAttachment(data?: any): Promise<any>;

		/**
		 * createInterview
		 */
		createInterview(data?: any): Promise<any>;

		/**
		 * update
		 */
		update(data?: any): Promise<any>;

		/**
		 * import
		 */
		import(data?: any): Promise<any>;

		/**
		 * export
		 */
		export(data?: any): Promise<any>;

		/**
		 * page
		 */
		page(data?: any): Promise<PerformanceResumePoolPageResponse>;

		/**
		 * info
		 */
		info(data?: any): Promise<any>;

		/**
		 * add
		 */
		add(data?: any): Promise<any>;

		/**
		 * 权限标识
		 */
		permission: {
			convertToTalentAsset: string;
			downloadAttachment: string;
			uploadAttachment: string;
			createInterview: string;
			update: string;
			import: string;
			export: string;
			page: string;
			info: string;
			add: string;
		};

		/**
		 * 权限状态
		 */
		_permission: {
			convertToTalentAsset: boolean;
			downloadAttachment: boolean;
			uploadAttachment: boolean;
			createInterview: boolean;
			update: boolean;
			import: boolean;
			export: boolean;
			page: boolean;
			info: boolean;
			add: boolean;
		};

		request: Request;
	}

	interface PerformanceSalary {
		/**
		 * changeAdd
		 */
		changeAdd(data?: any): Promise<any>;

		/**
		 * confirm
		 */
		confirm(data?: any): Promise<any>;

		/**
		 * archive
		 */
		archive(data?: any): Promise<any>;

		/**
		 * update
		 */
		update(data?: any): Promise<any>;

		/**
		 * page
		 */
		page(data?: any): Promise<PerformanceSalaryPageResponse>;

		/**
		 * info
		 */
		info(data?: any): Promise<any>;

		/**
		 * add
		 */
		add(data?: any): Promise<any>;

		/**
		 * 权限标识
		 */
		permission: {
			changeAdd: string;
			confirm: string;
			archive: string;
			update: string;
			page: string;
			info: string;
			add: string;
		};

		/**
		 * 权限状态
		 */
		_permission: {
			changeAdd: boolean;
			confirm: boolean;
			archive: boolean;
			update: boolean;
			page: boolean;
			info: boolean;
			add: boolean;
		};

		request: Request;
	}

	interface PerformanceSuggestion {
		/**
		 * accept
		 */
		accept(data?: any): Promise<any>;

		/**
		 * ignore
		 */
		ignore(data?: any): Promise<any>;

		/**
		 * reject
		 */
		reject(data?: any): Promise<any>;

		/**
		 * revoke
		 */
		revoke(data?: any): Promise<any>;

		/**
		 * page
		 */
		page(data?: any): Promise<PerformanceSuggestionPageResponse>;

		/**
		 * info
		 */
		info(data?: any): Promise<any>;

		/**
		 * 权限标识
		 */
		permission: {
			accept: string;
			ignore: string;
			reject: string;
			revoke: string;
			page: string;
			info: string;
		};

		/**
		 * 权限状态
		 */
		_permission: {
			accept: boolean;
			ignore: boolean;
			reject: boolean;
			revoke: boolean;
			page: boolean;
			info: boolean;
		};

		request: Request;
	}

	interface PerformanceSupplier {
		/**
		 * update
		 */
		update(data?: any): Promise<any>;

		/**
		 * delete
		 */
		delete(data?: any): Promise<any>;

		/**
		 * page
		 */
		page(data?: any): Promise<PerformanceSupplierPageResponse>;

		/**
		 * info
		 */
		info(data?: any): Promise<any>;

		/**
		 * add
		 */
		add(data?: any): Promise<any>;

		/**
		 * 权限标识
		 */
		permission: { update: string; delete: string; page: string; info: string; add: string };

		/**
		 * 权限状态
		 */
		_permission: {
			update: boolean;
			delete: boolean;
			page: boolean;
			info: boolean;
			add: boolean;
		};

		request: Request;
	}

	interface PerformanceTalentAsset {
		/**
		 * update
		 */
		update(data?: any): Promise<any>;

		/**
		 * delete
		 */
		delete(data?: any): Promise<any>;

		/**
		 * page
		 */
		page(data?: any): Promise<PerformanceTalentAssetPageResponse>;

		/**
		 * info
		 */
		info(data?: any): Promise<any>;

		/**
		 * add
		 */
		add(data?: any): Promise<any>;

		/**
		 * 权限标识
		 */
		permission: { update: string; delete: string; page: string; info: string; add: string };

		/**
		 * 权限状态
		 */
		_permission: {
			update: boolean;
			delete: boolean;
			page: boolean;
			info: boolean;
			add: boolean;
		};

		request: Request;
	}

	interface PerformanceTeacherAgentAudit {
		/**
		 * page
		 */
		page(data?: any): Promise<PerformanceTeacherAgentAuditPageResponse>;

		/**
		 * info
		 */
		info(data?: any): Promise<any>;

		/**
		 * 权限标识
		 */
		permission: { page: string; info: string };

		/**
		 * 权限状态
		 */
		_permission: { page: boolean; info: boolean };

		request: Request;
	}

	interface PerformanceTeacherAgentRelation {
		/**
		 * update
		 */
		update(data?: any): Promise<any>;

		/**
		 * delete
		 */
		delete(data?: any): Promise<any>;

		/**
		 * page
		 */
		page(data?: any): Promise<PerformanceTeacherAgentRelationPageResponse>;

		/**
		 * add
		 */
		add(data?: any): Promise<any>;

		/**
		 * 权限标识
		 */
		permission: { update: string; delete: string; page: string; add: string };

		/**
		 * 权限状态
		 */
		_permission: { update: boolean; delete: boolean; page: boolean; add: boolean };

		request: Request;
	}

	interface PerformanceTeacherAgent {
		/**
		 * updateStatus
		 */
		updateStatus(data?: any): Promise<any>;

		/**
		 * unblacklist
		 */
		unblacklist(data?: any): Promise<any>;

		/**
		 * blacklist
		 */
		blacklist(data?: any): Promise<any>;

		/**
		 * update
		 */
		update(data?: any): Promise<any>;

		/**
		 * page
		 */
		page(data?: any): Promise<PerformanceTeacherAgentPageResponse>;

		/**
		 * info
		 */
		info(data?: any): Promise<any>;

		/**
		 * add
		 */
		add(data?: any): Promise<any>;

		/**
		 * 权限标识
		 */
		permission: {
			updateStatus: string;
			unblacklist: string;
			blacklist: string;
			update: string;
			page: string;
			info: string;
			add: string;
		};

		/**
		 * 权限状态
		 */
		_permission: {
			updateStatus: boolean;
			unblacklist: boolean;
			blacklist: boolean;
			update: boolean;
			page: boolean;
			info: boolean;
			add: boolean;
		};

		request: Request;
	}

	interface PerformanceTeacherAttributionConflict {
		/**
		 * resolve
		 */
		resolve(data?: any): Promise<any>;

		/**
		 * create
		 */
		create(data?: any): Promise<any>;

		/**
		 * page
		 */
		page(data?: any): Promise<PerformanceTeacherAttributionConflictPageResponse>;

		/**
		 * info
		 */
		info(data?: any): Promise<any>;

		/**
		 * 权限标识
		 */
		permission: { resolve: string; create: string; page: string; info: string };

		/**
		 * 权限状态
		 */
		_permission: { resolve: boolean; create: boolean; page: boolean; info: boolean };

		request: Request;
	}

	interface PerformanceTeacherAttribution {
		/**
		 * assign
		 */
		assign(data?: any): Promise<any>;

		/**
		 * change
		 */
		change(data?: any): Promise<any>;

		/**
		 * remove
		 */
		remove(data?: any): Promise<any>;

		/**
		 * page
		 */
		page(data?: any): Promise<PerformanceTeacherAttributionPageResponse>;

		/**
		 * info
		 */
		info(data?: any): Promise<any>;

		/**
		 * 权限标识
		 */
		permission: { assign: string; change: string; remove: string; page: string; info: string };

		/**
		 * 权限状态
		 */
		_permission: {
			assign: boolean;
			change: boolean;
			remove: boolean;
			page: boolean;
			info: boolean;
		};

		request: Request;
	}

	interface PerformanceTeacherClass {
		/**
		 * update
		 */
		update(data?: any): Promise<any>;

		/**
		 * delete
		 */
		delete(data?: any): Promise<any>;

		/**
		 * page
		 */
		page(data?: any): Promise<PerformanceTeacherClassPageResponse>;

		/**
		 * info
		 */
		info(data?: any): Promise<any>;

		/**
		 * add
		 */
		add(data?: any): Promise<any>;

		/**
		 * 权限标识
		 */
		permission: { update: string; delete: string; page: string; info: string; add: string };

		/**
		 * 权限状态
		 */
		_permission: {
			update: boolean;
			delete: boolean;
			page: boolean;
			info: boolean;
			add: boolean;
		};

		request: Request;
	}

	interface PerformanceTeacherCooperation {
		/**
		 * mark
		 */
		mark(data?: any): Promise<any>;

		/**
		 * 权限标识
		 */
		permission: { mark: string };

		/**
		 * 权限状态
		 */
		_permission: { mark: boolean };

		request: Request;
	}

	interface PerformanceTeacherDashboard {
		/**
		 * summary
		 */
		summary(data?: any): Promise<any>;

		/**
		 * 权限标识
		 */
		permission: { summary: string };

		/**
		 * 权限状态
		 */
		_permission: { summary: boolean };

		request: Request;
	}

	interface PerformanceTeacherFollow {
		/**
		 * page
		 */
		page(data?: any): Promise<PerformanceTeacherFollowPageResponse>;

		/**
		 * add
		 */
		add(data?: any): Promise<any>;

		/**
		 * 权限标识
		 */
		permission: { page: string; add: string };

		/**
		 * 权限状态
		 */
		_permission: { page: boolean; add: boolean };

		request: Request;
	}

	interface PerformanceTeacherInfo {
		/**
		 * attributionHistory
		 */
		attributionHistory(data?: any): Promise<any>;

		/**
		 * attributionInfo
		 */
		attributionInfo(data?: any): Promise<any>;

		/**
		 * updateStatus
		 */
		updateStatus(data?: any): Promise<any>;

		/**
		 * update
		 */
		update(data?: any): Promise<any>;

		/**
		 * assign
		 */
		assign(data?: any): Promise<any>;

		/**
		 * page
		 */
		page(data?: any): Promise<PerformanceTeacherInfoPageResponse>;

		/**
		 * info
		 */
		info(data?: any): Promise<any>;

		/**
		 * add
		 */
		add(data?: any): Promise<any>;

		/**
		 * 权限标识
		 */
		permission: {
			attributionHistory: string;
			attributionInfo: string;
			updateStatus: string;
			update: string;
			assign: string;
			page: string;
			info: string;
			add: string;
		};

		/**
		 * 权限状态
		 */
		_permission: {
			attributionHistory: boolean;
			attributionInfo: boolean;
			updateStatus: boolean;
			update: boolean;
			assign: boolean;
			page: boolean;
			info: boolean;
			add: boolean;
		};

		request: Request;
	}

	interface PerformanceTeacherTodo {
		/**
		 * page
		 */
		page(data?: any): Promise<PerformanceTeacherTodoPageResponse>;

		/**
		 * 权限标识
		 */
		permission: { page: string };

		/**
		 * 权限状态
		 */
		_permission: { page: boolean };

		request: Request;
	}

	interface PerformanceVehicle {
		/**
		 * update
		 */
		update(data?: any): Promise<any>;

		/**
		 * delete
		 */
		delete(data?: any): Promise<any>;

		/**
		 * stats
		 */
		stats(data?: any): Promise<any>;

		/**
		 * page
		 */
		page(data?: any): Promise<PerformanceVehiclePageResponse>;

		/**
		 * info
		 */
		info(data?: any): Promise<any>;

		/**
		 * add
		 */
		add(data?: any): Promise<any>;

		/**
		 * 权限标识
		 */
		permission: {
			update: string;
			delete: string;
			stats: string;
			page: string;
			info: string;
			add: string;
		};

		/**
		 * 权限状态
		 */
		_permission: {
			update: boolean;
			delete: boolean;
			stats: boolean;
			page: boolean;
			info: boolean;
			add: boolean;
		};

		request: Request;
	}

	interface PerformanceAssetAssignmentRequest {
		/**
		 * withdraw
		 */
		withdraw(data?: any): Promise<any>;

		/**
		 * update
		 */
		update(data?: any): Promise<any>;

		/**
		 * submit
		 */
		submit(data?: any): Promise<any>;

		/**
		 * assign
		 */
		assign(data?: any): Promise<any>;

		/**
		 * cancel
		 */
		cancel(data?: any): Promise<any>;

		/**
		 * page
		 */
		page(data?: any): Promise<PerformanceAssetAssignmentRequestPageResponse>;

		/**
		 * info
		 */
		info(data?: any): Promise<any>;

		/**
		 * add
		 */
		add(data?: any): Promise<any>;

		/**
		 * 权限标识
		 */
		permission: {
			withdraw: string;
			update: string;
			submit: string;
			assign: string;
			cancel: string;
			page: string;
			info: string;
			add: string;
		};

		/**
		 * 权限状态
		 */
		_permission: {
			withdraw: boolean;
			update: boolean;
			submit: boolean;
			assign: boolean;
			cancel: boolean;
			page: boolean;
			info: boolean;
			add: boolean;
		};

		request: Request;
	}

	interface PerformanceMaterialCatalog {
		/**
		 * updateStatus
		 */
		updateStatus(data?: any): Promise<any>;

		/**
		 * update
		 */
		update(data?: any): Promise<any>;

		/**
		 * delete
		 */
		delete(data?: any): Promise<any>;

		/**
		 * page
		 */
		page(data?: any): Promise<PerformanceMaterialCatalogPageResponse>;

		/**
		 * info
		 */
		info(data?: any): Promise<any>;

		/**
		 * add
		 */
		add(data?: any): Promise<any>;

		/**
		 * 权限标识
		 */
		permission: {
			updateStatus: string;
			update: string;
			delete: string;
			page: string;
			info: string;
			add: string;
		};

		/**
		 * 权限状态
		 */
		_permission: {
			updateStatus: boolean;
			update: boolean;
			delete: boolean;
			page: boolean;
			info: boolean;
			add: boolean;
		};

		request: Request;
	}

	interface PerformanceMaterialInbound {
		/**
		 * receive
		 */
		receive(data?: any): Promise<any>;

		/**
		 * update
		 */
		update(data?: any): Promise<any>;

		/**
		 * submit
		 */
		submit(data?: any): Promise<any>;

		/**
		 * cancel
		 */
		cancel(data?: any): Promise<any>;

		/**
		 * page
		 */
		page(data?: any): Promise<PerformanceMaterialInboundPageResponse>;

		/**
		 * info
		 */
		info(data?: any): Promise<any>;

		/**
		 * add
		 */
		add(data?: any): Promise<any>;

		/**
		 * 权限标识
		 */
		permission: {
			receive: string;
			update: string;
			submit: string;
			cancel: string;
			page: string;
			info: string;
			add: string;
		};

		/**
		 * 权限状态
		 */
		_permission: {
			receive: boolean;
			update: boolean;
			submit: boolean;
			cancel: boolean;
			page: boolean;
			info: boolean;
			add: boolean;
		};

		request: Request;
	}

	interface PerformanceMaterialIssue {
		/**
		 * update
		 */
		update(data?: any): Promise<any>;

		/**
		 * submit
		 */
		submit(data?: any): Promise<any>;

		/**
		 * cancel
		 */
		cancel(data?: any): Promise<any>;

		/**
		 * issue
		 */
		issue(data?: any): Promise<any>;

		/**
		 * page
		 */
		page(data?: any): Promise<PerformanceMaterialIssuePageResponse>;

		/**
		 * info
		 */
		info(data?: any): Promise<any>;

		/**
		 * add
		 */
		add(data?: any): Promise<any>;

		/**
		 * 权限标识
		 */
		permission: {
			update: string;
			submit: string;
			cancel: string;
			issue: string;
			page: string;
			info: string;
			add: string;
		};

		/**
		 * 权限状态
		 */
		_permission: {
			update: boolean;
			submit: boolean;
			cancel: boolean;
			issue: boolean;
			page: boolean;
			info: boolean;
			add: boolean;
		};

		request: Request;
	}

	interface PerformanceMaterialStock {
		/**
		 * summary
		 */
		summary(data?: any): Promise<any>;

		/**
		 * page
		 */
		page(data?: any): Promise<PerformanceMaterialStockPageResponse>;

		/**
		 * info
		 */
		info(data?: any): Promise<any>;

		/**
		 * 权限标识
		 */
		permission: { summary: string; page: string; info: string };

		/**
		 * 权限状态
		 */
		_permission: { summary: boolean; page: boolean; info: boolean };

		request: Request;
	}

	interface PerformanceMaterialStockLog {
		/**
		 * page
		 */
		page(data?: any): Promise<PerformanceMaterialStockLogPageResponse>;

		/**
		 * 权限标识
		 */
		permission: { page: string };

		/**
		 * 权限状态
		 */
		_permission: { page: boolean };

		request: Request;
	}

	interface PerformanceWorkPlan {
		/**
		 * callback
		 */
		callback(data?: any): Promise<any>;

		/**
		 * syncDingtalkApproval
		 */
		syncDingtalkApproval(data?: any): Promise<any>;

		/**
		 * complete
		 */
		complete(data?: any): Promise<any>;

		/**
		 * update
		 */
		update(data?: any): Promise<any>;

		/**
		 * delete
		 */
		delete(data?: any): Promise<any>;

		/**
		 * cancel
		 */
		cancel(data?: any): Promise<any>;

		/**
		 * start
		 */
		start(data?: any): Promise<any>;

		/**
		 * page
		 */
		page(data?: any): Promise<PerformanceWorkPlanPageResponse>;

		/**
		 * info
		 */
		info(data?: any): Promise<any>;

		/**
		 * add
		 */
		add(data?: any): Promise<any>;

		/**
		 * 权限标识
		 */
		permission: {
			callback: string;
			syncDingtalkApproval: string;
			complete: string;
			update: string;
			delete: string;
			cancel: string;
			start: string;
			page: string;
			info: string;
			add: string;
		};

		/**
		 * 权限状态
		 */
		_permission: {
			callback: boolean;
			syncDingtalkApproval: boolean;
			complete: boolean;
			update: boolean;
			delete: boolean;
			cancel: boolean;
			start: boolean;
			page: boolean;
			info: boolean;
			add: boolean;
		};

		request: Request;
	}

	interface PluginInfo {
		/**
		 * install
		 */
		install(data?: any): Promise<any>;

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
		info(data?: any): Promise<PluginInfoEntity>;

		/**
		 * list
		 */
		list(data?: any): Promise<PluginInfoEntity[]>;

		/**
		 * page
		 */
		page(data?: any): Promise<PluginInfoPageResponse>;

		/**
		 * add
		 */
		add(data?: any): Promise<any>;

		/**
		 * 权限标识
		 */
		permission: {
			install: string;
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
			install: boolean;
			delete: boolean;
			update: boolean;
			info: boolean;
			list: boolean;
			page: boolean;
			add: boolean;
		};

		request: Request;
	}

	interface RecycleData {
		/**
		 * restore
		 */
		restore(data?: any): Promise<any>;

		/**
		 * info
		 */
		info(data?: any): Promise<RecycleDataEntity>;

		/**
		 * page
		 */
		page(data?: any): Promise<RecycleDataPageResponse>;

		/**
		 * 权限标识
		 */
		permission: { restore: string; info: string; page: string };

		/**
		 * 权限状态
		 */
		_permission: { restore: boolean; info: boolean; page: boolean };

		request: Request;
	}

	interface SpaceInfo {
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
		info(data?: any): Promise<SpaceInfoEntity>;

		/**
		 * list
		 */
		list(data?: any): Promise<SpaceInfoEntity[]>;

		/**
		 * page
		 */
		page(data?: any): Promise<SpaceInfoPageResponse>;

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

		request: Request;
	}

	interface SpaceType {
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
		info(data?: any): Promise<SpaceTypeEntity>;

		/**
		 * list
		 */
		list(data?: any): Promise<SpaceTypeEntity[]>;

		/**
		 * page
		 */
		page(data?: any): Promise<SpaceTypePageResponse>;

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

		request: Request;
	}

	interface TaskInfo {
		/**
		 * delete
		 */
		delete(data?: any): Promise<any>;

		/**
		 * update
		 */
		update(data?: any): Promise<any>;

		/**
		 * start
		 */
		start(data?: any): Promise<any>;

		/**
		 * once
		 */
		once(data?: any): Promise<any>;

		/**
		 * stop
		 */
		stop(data?: any): Promise<any>;

		/**
		 * info
		 */
		info(data?: any): Promise<TaskInfoEntity>;

		/**
		 * page
		 */
		page(data?: any): Promise<TaskInfoPageResponse>;

		/**
		 * log
		 */
		log(data?: any): Promise<any>;

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
			start: string;
			once: string;
			stop: string;
			info: string;
			page: string;
			log: string;
			add: string;
		};

		/**
		 * 权限状态
		 */
		_permission: {
			delete: boolean;
			update: boolean;
			start: boolean;
			once: boolean;
			stop: boolean;
			info: boolean;
			page: boolean;
			log: boolean;
			add: boolean;
		};

		request: Request;
	}

	interface UserAddress {
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
		page(data?: any): Promise<UserAddressPageResponse>;

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

		request: Request;
	}

	interface UserInfo {
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
		info(data?: any): Promise<UserInfoEntity>;

		/**
		 * list
		 */
		list(data?: any): Promise<UserInfoEntity[]>;

		/**
		 * page
		 */
		page(data?: any): Promise<UserInfoPageResponse>;

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

		request: Request;
	}

	interface RequestOptions {
		url: string;
		method?: "OPTIONS" | "GET" | "HEAD" | "POST" | "PUT" | "DELETE" | "TRACE" | "CONNECT";
		data?: any;
		params?: any;
		headers?: any;
		timeout?: number;
		[key: string]: any;
	}

	type Request = (options: RequestOptions) => Promise<any>;

	type Service = {
		request: Request;

		base: {
			coding: BaseCoding;
			comm: BaseComm;
			open: BaseOpen;
			sys: {
				department: BaseSysDepartment;
				log: BaseSysLog;
				menu: BaseSysMenu;
				param: BaseSysParam;
				role: BaseSysRole;
				user: BaseSysUser;
			};
		};
		demo: { goods: DemoGoods; tenant: DemoTenant };
		dict: { info: DictInfo; type: DictType };
		performance: {
			annualInspection: PerformanceAnnualInspection;
			approvalFlow: PerformanceApprovalFlow;
			assessment: PerformanceAssessment;
			assetAssignment: PerformanceAssetAssignment;
			assetDashboard: PerformanceAssetDashboard;
			assetDepreciation: PerformanceAssetDepreciation;
			assetDisposal: PerformanceAssetDisposal;
			assetInfo: PerformanceAssetInfo;
			assetInventory: PerformanceAssetInventory;
			assetMaintenance: PerformanceAssetMaintenance;
			assetProcurement: PerformanceAssetProcurement;
			assetReport: PerformanceAssetReport;
			assetTransfer: PerformanceAssetTransfer;
			capabilityItem: PerformanceCapabilityItem;
			capabilityModel: PerformanceCapabilityModel;
			capabilityPortrait: PerformanceCapabilityPortrait;
			certificate: PerformanceCertificate;
			contract: PerformanceContract;
			courseExam: PerformanceCourseExam;
			coursePractice: PerformanceCoursePractice;
			courseRecite: PerformanceCourseRecite;
			course: PerformanceCourse;
			dashboard: PerformanceDashboard;
			designCollab: PerformanceDesignCollab;
			documentCenter: PerformanceDocumentCenter;
			expressCollab: PerformanceExpressCollab;
			feedback: PerformanceFeedback;
			goal: PerformanceGoal;
			hiring: PerformanceHiring;
			honor: PerformanceHonor;
			indicator: PerformanceIndicator;
			intellectualProperty: PerformanceIntellectualProperty;
			interview: PerformanceInterview;
			jobStandard: PerformanceJobStandard;
			knowledgeBase: PerformanceKnowledgeBase;
			meeting: PerformanceMeeting;
			pip: PerformancePip;
			promotion: PerformancePromotion;
			publicityMaterial: PerformancePublicityMaterial;
			purchaseOrder: PerformancePurchaseOrder;
			purchaseReport: PerformancePurchaseReport;
			recruitPlan: PerformanceRecruitPlan;
			resumePool: PerformanceResumePool;
			salary: PerformanceSalary;
			suggestion: PerformanceSuggestion;
			supplier: PerformanceSupplier;
			talentAsset: PerformanceTalentAsset;
			teacherAgentAudit: PerformanceTeacherAgentAudit;
			teacherAgentRelation: PerformanceTeacherAgentRelation;
			teacherAgent: PerformanceTeacherAgent;
			teacherAttributionConflict: PerformanceTeacherAttributionConflict;
			teacherAttribution: PerformanceTeacherAttribution;
			teacherClass: PerformanceTeacherClass;
			teacherCooperation: PerformanceTeacherCooperation;
			teacherDashboard: PerformanceTeacherDashboard;
			teacherFollow: PerformanceTeacherFollow;
			teacherInfo: PerformanceTeacherInfo;
			teacherTodo: PerformanceTeacherTodo;
			vehicle: PerformanceVehicle;
			assetAssignmentRequest: PerformanceAssetAssignmentRequest;
			materialCatalog: PerformanceMaterialCatalog;
			materialInbound: PerformanceMaterialInbound;
			materialIssue: PerformanceMaterialIssue;
			materialStock: PerformanceMaterialStock;
			materialStockLog: PerformanceMaterialStockLog;
			workPlan: PerformanceWorkPlan;
		};
		plugin: { info: PluginInfo };
		recycle: { data: RecycleData };
		space: { info: SpaceInfo; type: SpaceType };
		task: { info: TaskInfo };
		user: { address: UserAddress; info: UserInfo };
	};
}

/**
 * Repository OpenAPI SSOT augmentation for dynamic EPS admin consumers.
 * Do not hand edit this file; rerun scripts/sync-eps-openapi-ssot.mjs.
 */

declare namespace Eps {
	/**
	 * Non-performance EPS-derived fallback result. Unknown data shape is kept intentionally loose.
	 */
	type EpsAdminAnyValue = unknown;

	/**
	 * Loose EPS-derived request placeholder for /admin/base/coding/createCode.
	 */
	interface EpsAdminBaseCodingCreateCodeRequest {
		[key: string]: unknown;
	}

	/**
	 * Loose EPS-derived request placeholder for /admin/base/comm/logout.
	 */
	interface EpsAdminBaseCommLogoutRequest {
		[key: string]: unknown;
	}

	interface EpsAdminBaseCommPermMenuItem {
		id: number;
		parentId: number;
		path?: string | null;
		router?: string | null;
		viewPath?: string | null;
		type: number;
		name: string;
		icon: string;
		badge?: number | null;
		badgeColor?: string | null;
		orderNum: number;
		isShow: number | boolean;
		keepAlive?: number | null;
		meta?: Record<string, unknown> | null;
		children?: Array<EpsAdminBaseCommPermMenuItem> | null;
		component?: null;
		redirect?: string | null;
		[key: string]: unknown;
	}

	interface EpsAdminBaseCommPermMenuResult {
		menus: Array<EpsAdminBaseCommPermMenuItem>;
		perms: Array<string>;
	}

	/**
	 * Loose EPS-derived request placeholder for /admin/base/comm/personUpdate.
	 */
	interface EpsAdminBaseCommPersonUpdateRequest {
		[key: string]: unknown;
	}

	interface EpsAdminBaseCommUploadModeResult {
		mode: string;
		type: string;
	}

	interface EpsAdminBaseCommUploadPrepareResult {
		url?: string;
		host?: string;
		previewUrl?: string;
		publicDomain?: string;
		uploadUrl?: string;
		token?: string;
		policy?: string;
		signature?: string;
		OSSAccessKeyId?: string;
		fields?: Record<string, unknown> | null;
		credentials?: Record<string, unknown> | null;
		[key: string]: unknown;
	}

	interface EpsAdminBaseCommUploadRequest {
		key?: string | null;
	}

	interface EpsAdminBaseOpenCaptchaQuery {
		width?: number | null;
		height?: number | null;
		color?: string | null;
	}

	interface EpsAdminBaseOpenCaptchaResult {
		captchaId: string;
		data: string;
	}

	interface EpsAdminBaseOpenEpsApi {
		path: string;
		summary?: string | null;
		method?: string | null;
		prefix?: string | null;
		tag?: string | null;
		dts?: Record<string, unknown> | null;
		[key: string]: unknown;
	}

	interface EpsAdminBaseOpenEpsColumn {
		comment?: string | null;
		length?: number | null;
		nullable?: boolean | null;
		propertyName: string;
		type?: string | null;
		component?: string | null;
		defaultValue?: null;
		dict?: Array<string> | string | null;
		[key: string]: unknown;
	}

	interface EpsAdminBaseOpenEpsModule {
		api: Array<EpsAdminBaseOpenEpsApi>;
		columns: Array<EpsAdminBaseOpenEpsColumn>;
		prefix: string;
		router?: string | null;
		module?: string | null;
		fieldEq?: Array<string> | null;
		keyWordLikeFields?: Array<string> | null;
		[key: string]: unknown;
	}

	interface EpsAdminBaseOpenEpsResult {
		[key: string]: Array<EpsAdminBaseOpenEpsModule>;
	}

	interface EpsAdminBaseOpenHtmlQuery {
		key: string;
	}

	type EpsAdminBaseOpenHtmlResult = string;

	interface EpsAdminBaseOpenLoginRequest {
		username: string;
		password: string;
		captchaId: string;
		verifyCode: number;
	}

	interface EpsAdminBaseOpenRefreshTokenQuery {
		refreshToken: string;
	}

	interface EpsAdminBaseOpenRuntimeMetaResult {
		runtimeId: string;
		gitHash: string;
		sourceHash: string;
		startedAt: string;
		env: string;
		port?: number | null;
		seedMeta?: Record<string, unknown> | null;
	}

	interface EpsAdminBaseOpenTokenResult {
		token: string;
		expire: number;
		refreshToken: string;
		refreshExpire: number;
		permissionMask?: string | null;
	}

	/**
	 * EPS-derived loose entity schema for /admin/base/sys/department.
	 */
	interface EpsAdminBaseSysDepartmentEntity {
		[key: string]: unknown;
	}

	interface EpsAdminBaseSysDepartmentListQuery {

	}

	type EpsAdminBaseSysDepartmentListResponse = Array<EpsAdminBaseSysDepartmentEntity>;

	/**
	 * Loose EPS-derived request placeholder for /admin/base/sys/department/order.
	 */
	interface EpsAdminBaseSysDepartmentOrderRequest {
		[key: string]: unknown;
	}

	/**
	 * Loose EPS-derived request placeholder for /admin/base/sys/log/clear.
	 */
	interface EpsAdminBaseSysLogClearRequest {
		[key: string]: unknown;
	}

	/**
	 * EPS-derived loose entity schema for /admin/base/sys/log.
	 */
	interface EpsAdminBaseSysLogEntity {
		[key: string]: unknown;
	}

	interface EpsAdminBaseSysLogPageQuery {
		/**
		 * 关键字检索: name, action, ip
		 */
		keyword?: string | null;
		/**
		 * 页码
		 */
		page: number;
		/**
		 * 分页大小
		 */
		size: number;
	}

	interface EpsAdminBaseSysLogPageResponse {
		pagination: PagePagination;
		list: Array<EpsAdminBaseSysLogEntity>;
		[key: string]: unknown;
	}

	/**
	 * Loose EPS-derived request placeholder for /admin/base/sys/log/setKeep.
	 */
	interface EpsAdminBaseSysLogSetKeepRequest {
		[key: string]: unknown;
	}

	/**
	 * Loose EPS-derived request placeholder for /admin/base/sys/menu/create.
	 */
	interface EpsAdminBaseSysMenuCreateRequest {
		[key: string]: unknown;
	}

	/**
	 * EPS-derived loose entity schema for /admin/base/sys/menu.
	 */
	interface EpsAdminBaseSysMenuEntity {
		[key: string]: unknown;
	}

	/**
	 * Loose EPS-derived request placeholder for /admin/base/sys/menu/export.
	 */
	interface EpsAdminBaseSysMenuExportRequest {
		[key: string]: unknown;
	}

	/**
	 * Loose EPS-derived request placeholder for /admin/base/sys/menu/import.
	 */
	interface EpsAdminBaseSysMenuImportRequest {
		[key: string]: unknown;
	}

	interface EpsAdminBaseSysMenuInfoQuery {
		/**
		 * 主键 ID
		 */
		id: number;
	}

	interface EpsAdminBaseSysMenuListQuery {

	}

	type EpsAdminBaseSysMenuListResponse = Array<EpsAdminBaseSysMenuEntity>;

	interface EpsAdminBaseSysMenuPageQuery {
		/**
		 * 页码
		 */
		page: number;
		/**
		 * 分页大小
		 */
		size: number;
	}

	interface EpsAdminBaseSysMenuPageResponse {
		pagination: PagePagination;
		list: Array<EpsAdminBaseSysMenuEntity>;
		[key: string]: unknown;
	}

	/**
	 * Loose EPS-derived request placeholder for /admin/base/sys/menu/parse.
	 */
	interface EpsAdminBaseSysMenuParseRequest {
		[key: string]: unknown;
	}

	/**
	 * EPS-derived loose entity schema for /admin/base/sys/param.
	 */
	interface EpsAdminBaseSysParamEntity {
		[key: string]: unknown;
	}

	interface EpsAdminBaseSysParamInfoQuery {
		/**
		 * 主键 ID
		 */
		id: number;
	}

	interface EpsAdminBaseSysParamPageQuery {
		/**
		 * 数据类型 0-字符串 1-富文本 2-文件
		 */
		dataType?: number;
		/**
		 * 关键字检索: name, keyName
		 */
		keyword?: string | null;
		/**
		 * 页码
		 */
		page: number;
		/**
		 * 分页大小
		 */
		size: number;
	}

	interface EpsAdminBaseSysParamPageResponse {
		pagination: PagePagination;
		list: Array<EpsAdminBaseSysParamEntity>;
		[key: string]: unknown;
	}

	/**
	 * EPS-derived loose entity schema for /admin/base/sys/role.
	 */
	interface EpsAdminBaseSysRoleEntity {
		[key: string]: unknown;
	}

	interface EpsAdminBaseSysRoleInfoQuery {
		/**
		 * 主键 ID
		 */
		id: number;
	}

	interface EpsAdminBaseSysRoleListQuery {
		/**
		 * 关键字检索: name, label
		 */
		keyword?: string | null;
	}

	type EpsAdminBaseSysRoleListResponse = Array<EpsAdminBaseSysRoleEntity>;

	interface EpsAdminBaseSysRolePageQuery {
		/**
		 * 关键字检索: name, label
		 */
		keyword?: string | null;
		/**
		 * 页码
		 */
		page: number;
		/**
		 * 分页大小
		 */
		size: number;
	}

	interface EpsAdminBaseSysRolePageResponse {
		pagination: PagePagination;
		list: Array<EpsAdminBaseSysRoleEntity>;
		[key: string]: unknown;
	}

	/**
	 * EPS-derived loose entity schema for /admin/base/sys/user.
	 */
	interface EpsAdminBaseSysUserEntity {
		[key: string]: unknown;
	}

	interface EpsAdminBaseSysUserInfoQuery {
		/**
		 * 主键 ID
		 */
		id: number;
	}

	interface EpsAdminBaseSysUserListQuery {

	}

	type EpsAdminBaseSysUserListResponse = Array<EpsAdminBaseSysUserEntity>;

	/**
	 * Loose EPS-derived request placeholder for /admin/base/sys/user/move.
	 */
	interface EpsAdminBaseSysUserMoveRequest {
		[key: string]: unknown;
	}

	interface EpsAdminBaseSysUserPageQuery {
		/**
		 * 页码
		 */
		page: number;
		/**
		 * 分页大小
		 */
		size: number;
	}

	interface EpsAdminBaseSysUserPageResponse {
		pagination: PagePagination;
		list: Array<EpsAdminBaseSysUserEntity>;
		[key: string]: unknown;
	}

	interface EpsAdminDeleteRequest {
		ids: Array<number>;
	}

	/**
	 * EPS-derived loose entity schema for /admin/demo/goods.
	 */
	interface EpsAdminDemoGoodsEntity {
		[key: string]: unknown;
	}

	interface EpsAdminDemoGoodsInfoQuery {
		/**
		 * 主键 ID
		 */
		id: number;
	}

	interface EpsAdminDemoGoodsListQuery {
		/**
		 * 状态
		 */
		status?: "禁用" | "启用";
		/**
		 * 标题
		 */
		title?: string;
		/**
		 * 关键字检索: description
		 */
		keyword?: string | null;
	}

	type EpsAdminDemoGoodsListResponse = Array<EpsAdminDemoGoodsEntity>;

	interface EpsAdminDemoGoodsPageQuery {
		/**
		 * 状态
		 */
		status?: "禁用" | "启用";
		/**
		 * 标题
		 */
		title?: string;
		/**
		 * 关键字检索: description
		 */
		keyword?: string | null;
		/**
		 * 页码
		 */
		page: number;
		/**
		 * 分页大小
		 */
		size: number;
	}

	interface EpsAdminDemoGoodsPageResponse {
		pagination: PagePagination;
		list: Array<EpsAdminDemoGoodsEntity>;
		[key: string]: unknown;
	}

	/**
	 * Loose EPS-derived request placeholder for /admin/demo/tenant/noTenant.
	 */
	interface EpsAdminDemoTenantNoTenantRequest {
		[key: string]: unknown;
	}

	/**
	 * Loose EPS-derived request placeholder for /admin/demo/tenant/noUse.
	 */
	interface EpsAdminDemoTenantNoUseRequest {
		[key: string]: unknown;
	}

	/**
	 * Loose EPS-derived request placeholder for /admin/demo/tenant/use.
	 */
	interface EpsAdminDemoTenantUseRequest {
		[key: string]: unknown;
	}

	/**
	 * Loose EPS-derived request placeholder for /admin/dict/info/data.
	 */
	interface EpsAdminDictInfoDataRequest {
		[key: string]: unknown;
	}

	/**
	 * EPS-derived loose entity schema for /admin/dict/info.
	 */
	interface EpsAdminDictInfoEntity {
		[key: string]: unknown;
	}

	interface EpsAdminDictInfoInfoQuery {
		/**
		 * 主键 ID
		 */
		id: number;
	}

	interface EpsAdminDictInfoListQuery {

	}

	type EpsAdminDictInfoListResponse = Array<EpsAdminDictInfoEntity>;

	interface EpsAdminDictInfoPageQuery {
		/**
		 * 页码
		 */
		page: number;
		/**
		 * 分页大小
		 */
		size: number;
	}

	interface EpsAdminDictInfoPageResponse {
		pagination: PagePagination;
		list: Array<EpsAdminDictInfoEntity>;
		[key: string]: unknown;
	}

	/**
	 * EPS-derived loose entity schema for /admin/dict/type.
	 */
	interface EpsAdminDictTypeEntity {
		[key: string]: unknown;
	}

	interface EpsAdminDictTypeInfoQuery {
		/**
		 * 主键 ID
		 */
		id: number;
	}

	interface EpsAdminDictTypeListQuery {

	}

	type EpsAdminDictTypeListResponse = Array<EpsAdminDictTypeEntity>;

	interface EpsAdminDictTypePageQuery {
		/**
		 * 页码
		 */
		page: number;
		/**
		 * 分页大小
		 */
		size: number;
	}

	interface EpsAdminDictTypePageResponse {
		pagination: PagePagination;
		list: Array<EpsAdminDictTypeEntity>;
		[key: string]: unknown;
	}

	interface EpsAdminMutationResult {
		id: number;
		[key: string]: unknown;
	}

	/**
	 * EPS-derived loose entity schema for /admin/plugin/info.
	 */
	interface EpsAdminPluginInfoEntity {
		[key: string]: unknown;
	}

	interface EpsAdminPluginInfoInfoQuery {
		/**
		 * 主键 ID
		 */
		id: number;
	}

	/**
	 * Loose EPS-derived request placeholder for /admin/plugin/info/install.
	 */
	interface EpsAdminPluginInfoInstallRequest {
		[key: string]: unknown;
	}

	interface EpsAdminPluginInfoListQuery {

	}

	type EpsAdminPluginInfoListResponse = Array<EpsAdminPluginInfoEntity>;

	interface EpsAdminPluginInfoPageQuery {
		/**
		 * 页码
		 */
		page: number;
		/**
		 * 分页大小
		 */
		size: number;
	}

	interface EpsAdminPluginInfoPageResponse {
		pagination: PagePagination;
		list: Array<EpsAdminPluginInfoEntity>;
		[key: string]: unknown;
	}

	/**
	 * EPS-derived loose entity schema for /admin/recycle/data.
	 */
	interface EpsAdminRecycleDataEntity {
		[key: string]: unknown;
	}

	interface EpsAdminRecycleDataInfoQuery {
		/**
		 * 主键 ID
		 */
		id: number;
	}

	interface EpsAdminRecycleDataPageQuery {
		/**
		 * 关键字检索: userName, url
		 */
		keyword?: string | null;
		/**
		 * 页码
		 */
		page: number;
		/**
		 * 分页大小
		 */
		size: number;
	}

	interface EpsAdminRecycleDataPageResponse {
		pagination: PagePagination;
		list: Array<EpsAdminRecycleDataEntity>;
		[key: string]: unknown;
	}

	/**
	 * Loose EPS-derived request placeholder for /admin/recycle/data/restore.
	 */
	interface EpsAdminRecycleDataRestoreRequest {
		[key: string]: unknown;
	}

	/**
	 * EPS-derived loose entity schema for /admin/space/info.
	 */
	interface EpsAdminSpaceInfoEntity {
		[key: string]: unknown;
	}

	interface EpsAdminSpaceInfoInfoQuery {
		/**
		 * 主键 ID
		 */
		id: number;
	}

	interface EpsAdminSpaceInfoListQuery {
		/**
		 * 类型
		 */
		type?: string;
		/**
		 * 分类ID
		 */
		classifyId?: number | null;
	}

	type EpsAdminSpaceInfoListResponse = Array<EpsAdminSpaceInfoEntity>;

	interface EpsAdminSpaceInfoPageQuery {
		/**
		 * 类型
		 */
		type?: string;
		/**
		 * 分类ID
		 */
		classifyId?: number | null;
		/**
		 * 页码
		 */
		page: number;
		/**
		 * 分页大小
		 */
		size: number;
	}

	interface EpsAdminSpaceInfoPageResponse {
		pagination: PagePagination;
		list: Array<EpsAdminSpaceInfoEntity>;
		[key: string]: unknown;
	}

	/**
	 * EPS-derived loose entity schema for /admin/space/type.
	 */
	interface EpsAdminSpaceTypeEntity {
		[key: string]: unknown;
	}

	interface EpsAdminSpaceTypeInfoQuery {
		/**
		 * 主键 ID
		 */
		id: number;
	}

	interface EpsAdminSpaceTypeListQuery {

	}

	type EpsAdminSpaceTypeListResponse = Array<EpsAdminSpaceTypeEntity>;

	interface EpsAdminSpaceTypePageQuery {
		/**
		 * 页码
		 */
		page: number;
		/**
		 * 分页大小
		 */
		size: number;
	}

	interface EpsAdminSpaceTypePageResponse {
		pagination: PagePagination;
		list: Array<EpsAdminSpaceTypeEntity>;
		[key: string]: unknown;
	}

	/**
	 * EPS-derived loose entity schema for /admin/task/info.
	 */
	interface EpsAdminTaskInfoEntity {
		[key: string]: unknown;
	}

	interface EpsAdminTaskInfoInfoQuery {
		/**
		 * 主键 ID
		 */
		id: number;
	}

	interface EpsAdminTaskInfoLogPageResult {
		pagination: PagePagination;
		list: Array<EpsAdminTaskInfoLogRecord>;
		[key: string]: unknown;
	}

	interface EpsAdminTaskInfoLogQuery {
		id: number;
		status?: number | null;
		page?: number | null;
		size?: number | null;
	}

	interface EpsAdminTaskInfoLogRecord {
		id?: number | null;
		taskId?: number | null;
		detail?: string | null;
		status?: number | null;
		createTime?: string | null;
		updateTime?: string | null;
		[key: string]: unknown;
	}

	/**
	 * Loose EPS-derived request placeholder for /admin/task/info/once.
	 */
	interface EpsAdminTaskInfoOnceRequest {
		[key: string]: unknown;
	}

	interface EpsAdminTaskInfoPageQuery {
		/**
		 * 状态 0-停止 1-运行
		 */
		status?: number;
		/**
		 * 状态 0-系统 1-用户
		 */
		type?: number;
		/**
		 * 页码
		 */
		page: number;
		/**
		 * 分页大小
		 */
		size: number;
	}

	interface EpsAdminTaskInfoPageResponse {
		pagination: PagePagination;
		list: Array<EpsAdminTaskInfoEntity>;
		[key: string]: unknown;
	}

	/**
	 * Loose EPS-derived request placeholder for /admin/task/info/start.
	 */
	interface EpsAdminTaskInfoStartRequest {
		[key: string]: unknown;
	}

	/**
	 * Loose EPS-derived request placeholder for /admin/task/info/stop.
	 */
	interface EpsAdminTaskInfoStopRequest {
		[key: string]: unknown;
	}

	/**
	 * EPS-derived loose entity schema for /admin/user/address.
	 */
	interface EpsAdminUserAddressEntity {
		[key: string]: unknown;
	}

	interface EpsAdminUserAddressInfoQuery {
		/**
		 * 主键 ID
		 */
		id: number;
	}

	interface EpsAdminUserAddressListQuery {

	}

	type EpsAdminUserAddressListResponse = Array<EpsAdminUserAddressEntity>;

	interface EpsAdminUserAddressPageQuery {
		/**
		 * 页码
		 */
		page: number;
		/**
		 * 分页大小
		 */
		size: number;
	}

	interface EpsAdminUserAddressPageResponse {
		pagination: PagePagination;
		list: Array<EpsAdminUserAddressEntity>;
		[key: string]: unknown;
	}

	/**
	 * EPS-derived loose entity schema for /admin/user/info.
	 */
	interface EpsAdminUserInfoEntity {
		[key: string]: unknown;
	}

	interface EpsAdminUserInfoInfoQuery {
		/**
		 * 主键 ID
		 */
		id: number;
	}

	interface EpsAdminUserInfoListQuery {
		/**
		 * 状态
		 */
		status?: "禁用" | "正常" | "已注销";
		/**
		 * 性别
		 */
		gender?: "未知" | "男" | "女";
		/**
		 * 登录方式
		 */
		loginType?: "小程序" | "公众号" | "H5";
		/**
		 * 关键字检索: nickName, phone
		 */
		keyword?: string | null;
	}

	type EpsAdminUserInfoListResponse = Array<EpsAdminUserInfoEntity>;

	interface EpsAdminUserInfoPageQuery {
		/**
		 * 状态
		 */
		status?: "禁用" | "正常" | "已注销";
		/**
		 * 性别
		 */
		gender?: "未知" | "男" | "女";
		/**
		 * 登录方式
		 */
		loginType?: "小程序" | "公众号" | "H5";
		/**
		 * 关键字检索: nickName, phone
		 */
		keyword?: string | null;
		/**
		 * 页码
		 */
		page: number;
		/**
		 * 分页大小
		 */
		size: number;
	}

	interface EpsAdminUserInfoPageResponse {
		pagination: PagePagination;
		list: Array<EpsAdminUserInfoEntity>;
		[key: string]: unknown;
	}

	interface BaseCoding {
		/**
		 * base.coding getModuleTree
		 */
		getModuleTree(data?: never): Promise<EpsAdminAnyValue>;
		/**
		 * base.coding createCode
		 */
		createCode(data: EpsAdminBaseCodingCreateCodeRequest): Promise<EpsAdminAnyValue>;
	}

	interface BaseComm {
		/**
		 * base.comm personUpdate
		 */
		personUpdate(data: EpsAdminBaseCommPersonUpdateRequest): Promise<EpsAdminAnyValue>;
		/**
		 * base.comm uploadMode
		 */
		uploadMode(data?: never): Promise<EpsAdminBaseCommUploadModeResult>;
		/**
		 * base.comm permmenu
		 */
		permmenu(data?: never): Promise<{ menus: Menu.List; perms: string[] }>;
		/**
		 * base.comm program
		 */
		program(data?: never): Promise<EpsAdminAnyValue>;
		/**
		 * base.comm person
		 */
		person(data?: never): Promise<EpsAdminAnyValue>;
		/**
		 * base.comm upload
		 */
		upload(data: EpsAdminBaseCommUploadRequest): Promise<EpsAdminBaseCommUploadPrepareResult>;
		/**
		 * base.comm logout
		 */
		logout(data: EpsAdminBaseCommLogoutRequest): Promise<EpsAdminAnyValue>;
	}

	interface BaseOpen {
		/**
		 * base.open refreshToken
		 */
		refreshToken(data: EpsAdminBaseOpenRefreshTokenQuery): Promise<{ token: string; expire: number; refreshToken: string; refreshExpire: number; permissionMask?: string | null }>;
		/**
		 * base.open runtimeMeta
		 */
		runtimeMeta(data?: never): Promise<EpsAdminBaseOpenRuntimeMetaResult>;
		/**
		 * base.open captcha
		 */
		captcha(data: EpsAdminBaseOpenCaptchaQuery): Promise<EpsAdminBaseOpenCaptchaResult>;
		/**
		 * base.open login
		 */
		login(data: EpsAdminBaseOpenLoginRequest): Promise<{ token: string; expire: number; refreshToken: string; refreshExpire: number; permissionMask?: string | null }>;
		/**
		 * base.open html
		 */
		html(data: EpsAdminBaseOpenHtmlQuery): Promise<EpsAdminBaseOpenHtmlResult>;
		/**
		 * base.open eps
		 */
		eps(data?: never): Promise<EpsData>;
	}

	interface BaseSysDepartment {
		/**
		 * base.sys.department delete
		 */
		delete(data: EpsAdminDeleteRequest): Promise<void>;
		/**
		 * base.sys.department update
		 */
		update(data: EpsAdminBaseSysDepartmentEntity): Promise<EpsAdminMutationResult>;
		/**
		 * base.sys.department order
		 */
		order(data: EpsAdminBaseSysDepartmentOrderRequest): Promise<EpsAdminAnyValue>;
		/**
		 * base.sys.department list
		 */
		list(data: EpsAdminBaseSysDepartmentListQuery): Promise<Array<BaseSysDepartmentEntity>>;
		/**
		 * base.sys.department add
		 */
		add(data: EpsAdminBaseSysDepartmentEntity): Promise<EpsAdminMutationResult>;
	}

	interface BaseSysLog {
		/**
		 * base.sys.log setKeep
		 */
		setKeep(data: EpsAdminBaseSysLogSetKeepRequest): Promise<EpsAdminAnyValue>;
		/**
		 * base.sys.log getKeep
		 */
		getKeep(data?: never): Promise<EpsAdminAnyValue>;
		/**
		 * base.sys.log clear
		 */
		clear(data: EpsAdminBaseSysLogClearRequest): Promise<EpsAdminAnyValue>;
		/**
		 * base.sys.log page
		 */
		page(data: EpsAdminBaseSysLogPageQuery): Promise<BaseSysLogPageResponse>;
	}

	interface BaseSysMenu {
		/**
		 * base.sys.menu create
		 */
		create(data: EpsAdminBaseSysMenuCreateRequest): Promise<EpsAdminAnyValue>;
		/**
		 * base.sys.menu export
		 */
		export(data: EpsAdminBaseSysMenuExportRequest): Promise<EpsAdminAnyValue>;
		/**
		 * base.sys.menu import
		 */
		import(data: EpsAdminBaseSysMenuImportRequest): Promise<EpsAdminAnyValue>;
		/**
		 * base.sys.menu delete
		 */
		delete(data: EpsAdminDeleteRequest): Promise<void>;
		/**
		 * base.sys.menu update
		 */
		update(data: EpsAdminBaseSysMenuEntity): Promise<EpsAdminMutationResult>;
		/**
		 * base.sys.menu parse
		 */
		parse(data: EpsAdminBaseSysMenuParseRequest): Promise<EpsAdminAnyValue>;
		/**
		 * base.sys.menu info
		 */
		info(data: EpsAdminBaseSysMenuInfoQuery): Promise<BaseSysMenuEntity>;
		/**
		 * base.sys.menu list
		 */
		list(data: EpsAdminBaseSysMenuListQuery): Promise<Array<BaseSysMenuEntity>>;
		/**
		 * base.sys.menu page
		 */
		page(data: EpsAdminBaseSysMenuPageQuery): Promise<BaseSysMenuPageResponse>;
		/**
		 * base.sys.menu add
		 */
		add(data: EpsAdminBaseSysMenuEntity): Promise<EpsAdminMutationResult>;
	}

	interface BaseSysParam {
		/**
		 * base.sys.param delete
		 */
		delete(data: EpsAdminDeleteRequest): Promise<void>;
		/**
		 * base.sys.param update
		 */
		update(data: EpsAdminBaseSysParamEntity): Promise<EpsAdminMutationResult>;
		/**
		 * base.sys.param html
		 */
		html(data?: never): Promise<EpsAdminAnyValue>;
		/**
		 * base.sys.param info
		 */
		info(data: EpsAdminBaseSysParamInfoQuery): Promise<BaseSysParamEntity>;
		/**
		 * base.sys.param page
		 */
		page(data: EpsAdminBaseSysParamPageQuery): Promise<BaseSysParamPageResponse>;
		/**
		 * base.sys.param add
		 */
		add(data: EpsAdminBaseSysParamEntity): Promise<EpsAdminMutationResult>;
	}

	interface BaseSysRole {
		/**
		 * base.sys.role delete
		 */
		delete(data: EpsAdminDeleteRequest): Promise<void>;
		/**
		 * base.sys.role update
		 */
		update(data: EpsAdminBaseSysRoleEntity): Promise<EpsAdminMutationResult>;
		/**
		 * base.sys.role info
		 */
		info(data: EpsAdminBaseSysRoleInfoQuery): Promise<BaseSysRoleEntity>;
		/**
		 * base.sys.role list
		 */
		list(data: EpsAdminBaseSysRoleListQuery): Promise<Array<BaseSysRoleEntity>>;
		/**
		 * base.sys.role page
		 */
		page(data: EpsAdminBaseSysRolePageQuery): Promise<BaseSysRolePageResponse>;
		/**
		 * base.sys.role add
		 */
		add(data: EpsAdminBaseSysRoleEntity): Promise<EpsAdminMutationResult>;
	}

	interface BaseSysUser {
		/**
		 * base.sys.user delete
		 */
		delete(data: EpsAdminDeleteRequest): Promise<void>;
		/**
		 * base.sys.user update
		 */
		update(data: EpsAdminBaseSysUserEntity): Promise<EpsAdminMutationResult>;
		/**
		 * base.sys.user move
		 */
		move(data: EpsAdminBaseSysUserMoveRequest): Promise<EpsAdminAnyValue>;
		/**
		 * base.sys.user info
		 */
		info(data: EpsAdminBaseSysUserInfoQuery): Promise<BaseSysUserEntity>;
		/**
		 * base.sys.user list
		 */
		list(data: EpsAdminBaseSysUserListQuery): Promise<Array<BaseSysUserEntity>>;
		/**
		 * base.sys.user page
		 */
		page(data: EpsAdminBaseSysUserPageQuery): Promise<BaseSysUserPageResponse>;
		/**
		 * base.sys.user add
		 */
		add(data: EpsAdminBaseSysUserEntity): Promise<EpsAdminMutationResult>;
	}

	interface DemoGoods {
		/**
		 * demo.goods delete
		 */
		delete(data: EpsAdminDeleteRequest): Promise<void>;
		/**
		 * demo.goods update
		 */
		update(data: EpsAdminDemoGoodsEntity): Promise<EpsAdminMutationResult>;
		/**
		 * demo.goods info
		 */
		info(data: EpsAdminDemoGoodsInfoQuery): Promise<DemoGoodsEntity>;
		/**
		 * demo.goods list
		 */
		list(data: EpsAdminDemoGoodsListQuery): Promise<Array<DemoGoodsEntity>>;
		/**
		 * demo.goods page
		 */
		page(data: EpsAdminDemoGoodsPageQuery): Promise<DemoGoodsPageResponse>;
		/**
		 * demo.goods add
		 */
		add(data: EpsAdminDemoGoodsEntity): Promise<EpsAdminMutationResult>;
	}

	interface DemoTenant {
		/**
		 * demo.tenant noTenant
		 */
		noTenant(data: EpsAdminDemoTenantNoTenantRequest): Promise<EpsAdminAnyValue>;
		/**
		 * demo.tenant noUse
		 */
		noUse(data: EpsAdminDemoTenantNoUseRequest): Promise<EpsAdminAnyValue>;
		/**
		 * demo.tenant use
		 */
		use(data: EpsAdminDemoTenantUseRequest): Promise<EpsAdminAnyValue>;
	}

	interface DictInfo {
		/**
		 * dict.info delete
		 */
		delete(data: EpsAdminDeleteRequest): Promise<void>;
		/**
		 * dict.info update
		 */
		update(data: EpsAdminDictInfoEntity): Promise<EpsAdminMutationResult>;
		/**
		 * dict.info types
		 */
		types(data?: never): Promise<EpsAdminAnyValue>;
		/**
		 * dict.info data
		 */
		data(data: EpsAdminDictInfoDataRequest): Promise<EpsAdminAnyValue>;
		/**
		 * dict.info info
		 */
		info(data: EpsAdminDictInfoInfoQuery): Promise<DictInfoEntity>;
		/**
		 * dict.info list
		 */
		list(data: EpsAdminDictInfoListQuery): Promise<Array<DictInfoEntity>>;
		/**
		 * dict.info page
		 */
		page(data: EpsAdminDictInfoPageQuery): Promise<DictInfoPageResponse>;
		/**
		 * dict.info add
		 */
		add(data: EpsAdminDictInfoEntity): Promise<EpsAdminMutationResult>;
	}

	interface DictType {
		/**
		 * dict.type delete
		 */
		delete(data: EpsAdminDeleteRequest): Promise<void>;
		/**
		 * dict.type update
		 */
		update(data: EpsAdminDictTypeEntity): Promise<EpsAdminMutationResult>;
		/**
		 * dict.type info
		 */
		info(data: EpsAdminDictTypeInfoQuery): Promise<DictTypeEntity>;
		/**
		 * dict.type list
		 */
		list(data: EpsAdminDictTypeListQuery): Promise<Array<DictTypeEntity>>;
		/**
		 * dict.type page
		 */
		page(data: EpsAdminDictTypePageQuery): Promise<DictTypePageResponse>;
		/**
		 * dict.type add
		 */
		add(data: EpsAdminDictTypeEntity): Promise<EpsAdminMutationResult>;
	}

	interface PluginInfo {
		/**
		 * plugin.info install
		 */
		install(data: EpsAdminPluginInfoInstallRequest): Promise<EpsAdminAnyValue>;
		/**
		 * plugin.info delete
		 */
		delete(data: EpsAdminDeleteRequest): Promise<void>;
		/**
		 * plugin.info update
		 */
		update(data: EpsAdminPluginInfoEntity): Promise<EpsAdminMutationResult>;
		/**
		 * plugin.info info
		 */
		info(data: EpsAdminPluginInfoInfoQuery): Promise<PluginInfoEntity>;
		/**
		 * plugin.info list
		 */
		list(data: EpsAdminPluginInfoListQuery): Promise<Array<PluginInfoEntity>>;
		/**
		 * plugin.info page
		 */
		page(data: EpsAdminPluginInfoPageQuery): Promise<PluginInfoPageResponse>;
		/**
		 * plugin.info add
		 */
		add(data: EpsAdminPluginInfoEntity): Promise<EpsAdminMutationResult>;
	}

	interface RecycleData {
		/**
		 * recycle.data restore
		 */
		restore(data: EpsAdminRecycleDataRestoreRequest): Promise<EpsAdminAnyValue>;
		/**
		 * recycle.data info
		 */
		info(data: EpsAdminRecycleDataInfoQuery): Promise<RecycleDataEntity>;
		/**
		 * recycle.data page
		 */
		page(data: EpsAdminRecycleDataPageQuery): Promise<RecycleDataPageResponse>;
	}

	interface SpaceInfo {
		/**
		 * space.info delete
		 */
		delete(data: EpsAdminDeleteRequest): Promise<void>;
		/**
		 * space.info update
		 */
		update(data: EpsAdminSpaceInfoEntity): Promise<EpsAdminMutationResult>;
		/**
		 * space.info info
		 */
		info(data: EpsAdminSpaceInfoInfoQuery): Promise<SpaceInfoEntity>;
		/**
		 * space.info list
		 */
		list(data: EpsAdminSpaceInfoListQuery): Promise<Array<SpaceInfoEntity>>;
		/**
		 * space.info page
		 */
		page(data: EpsAdminSpaceInfoPageQuery): Promise<SpaceInfoPageResponse>;
		/**
		 * space.info add
		 */
		add(data: EpsAdminSpaceInfoEntity): Promise<EpsAdminMutationResult>;
	}

	interface SpaceType {
		/**
		 * space.type delete
		 */
		delete(data: EpsAdminDeleteRequest): Promise<void>;
		/**
		 * space.type update
		 */
		update(data: EpsAdminSpaceTypeEntity): Promise<EpsAdminMutationResult>;
		/**
		 * space.type info
		 */
		info(data: EpsAdminSpaceTypeInfoQuery): Promise<SpaceTypeEntity>;
		/**
		 * space.type list
		 */
		list(data: EpsAdminSpaceTypeListQuery): Promise<Array<SpaceTypeEntity>>;
		/**
		 * space.type page
		 */
		page(data: EpsAdminSpaceTypePageQuery): Promise<SpaceTypePageResponse>;
		/**
		 * space.type add
		 */
		add(data: EpsAdminSpaceTypeEntity): Promise<EpsAdminMutationResult>;
	}

	interface TaskInfo {
		/**
		 * task.info delete
		 */
		delete(data: EpsAdminDeleteRequest): Promise<void>;
		/**
		 * task.info update
		 */
		update(data: EpsAdminTaskInfoEntity): Promise<EpsAdminMutationResult>;
		/**
		 * task.info start
		 */
		start(data: EpsAdminTaskInfoStartRequest): Promise<EpsAdminAnyValue>;
		/**
		 * task.info once
		 */
		once(data: EpsAdminTaskInfoOnceRequest): Promise<EpsAdminAnyValue>;
		/**
		 * task.info stop
		 */
		stop(data: EpsAdminTaskInfoStopRequest): Promise<EpsAdminAnyValue>;
		/**
		 * task.info info
		 */
		info(data: EpsAdminTaskInfoInfoQuery): Promise<TaskInfoEntity>;
		/**
		 * task.info page
		 */
		page(data: EpsAdminTaskInfoPageQuery): Promise<TaskInfoPageResponse>;
		/**
		 * task.info log
		 */
		log(data: EpsAdminTaskInfoLogQuery): Promise<EpsAdminTaskInfoLogPageResult>;
		/**
		 * task.info add
		 */
		add(data: EpsAdminTaskInfoEntity): Promise<EpsAdminMutationResult>;
	}

	interface UserAddress {
		/**
		 * user.address delete
		 */
		delete(data: EpsAdminDeleteRequest): Promise<void>;
		/**
		 * user.address update
		 */
		update(data: EpsAdminUserAddressEntity): Promise<EpsAdminMutationResult>;
		/**
		 * user.address info
		 */
		info(data: EpsAdminUserAddressInfoQuery): Promise<UserAddressEntity>;
		/**
		 * user.address list
		 */
		list(data: EpsAdminUserAddressListQuery): Promise<Array<UserAddressEntity>>;
		/**
		 * user.address page
		 */
		page(data: EpsAdminUserAddressPageQuery): Promise<UserAddressPageResponse>;
		/**
		 * user.address add
		 */
		add(data: EpsAdminUserAddressEntity): Promise<EpsAdminMutationResult>;
	}

	interface UserInfo {
		/**
		 * user.info delete
		 */
		delete(data: EpsAdminDeleteRequest): Promise<void>;
		/**
		 * user.info update
		 */
		update(data: EpsAdminUserInfoEntity): Promise<EpsAdminMutationResult>;
		/**
		 * user.info info
		 */
		info(data: EpsAdminUserInfoInfoQuery): Promise<UserInfoEntity>;
		/**
		 * user.info list
		 */
		list(data: EpsAdminUserInfoListQuery): Promise<Array<UserInfoEntity>>;
		/**
		 * user.info page
		 */
		page(data: EpsAdminUserInfoPageQuery): Promise<UserInfoPageResponse>;
		/**
		 * user.info add
		 */
		add(data: EpsAdminUserInfoEntity): Promise<EpsAdminMutationResult>;
	}

}
