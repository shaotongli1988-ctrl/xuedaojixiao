/**
 * 文件职责：封装 cool-uni 对班主任待办移动页的 teacherTodo / teacherInfo / teacherFollow 接口访问；
 * 不负责代理体系、班级管理、合作标记或页面级权限判断；
 * 维护重点是只复用主题19已冻结的最小闭环接口。
 */
import { createServiceRequester } from "/@/cool/service/requester";
import { PERMISSIONS } from "/@/generated/permissions.generated";
import type {
	TeacherClassFetchInfoQuery,
	TeacherClassFetchPageRequest,
	TeacherClassPageResult,
	TeacherClassRecord,
	TeacherDashboardFetchSummaryQuery,
	TeacherDashboardSummary,
	TeacherFollowCreateTeacherFollowRequest,
	TeacherFollowFetchPageRequest,
	TeacherFollowPageResult,
	TeacherFollowRecord,
	TeacherInfoFetchInfoQuery,
	TeacherInfoFetchPageRequest,
	TeacherInfoPageResult,
	TeacherInfoRecord,
	TeacherTodoFetchPageRequest,
	TeacherTodoPageResult,
} from "/@/types/performance-teacher-channel";

class PerformanceTeacherTodoService {
	private requester = createServiceRequester("admin/performance/teacherTodo");

	permission = {
		page: PERMISSIONS.performance.teacherTodo.page,
	};

	fetchPage(data: TeacherTodoFetchPageRequest) {
		return this.requester.request({
			url: "/page",
			method: "POST",
			data,
		}) as Promise<TeacherTodoPageResult>;
	}
}

class PerformanceTeacherDashboardService {
	private requester = createServiceRequester("admin/performance/teacherDashboard");

	permission = {
		summary: PERMISSIONS.performance.teacherDashboard.summary,
	};

	fetchSummary(params?: TeacherDashboardFetchSummaryQuery) {
		return this.requester.request({
			url: "/summary",
			method: "GET",
			params,
		}) as Promise<TeacherDashboardSummary>;
	}
}

class PerformanceTeacherInfoService {
	private requester = createServiceRequester("admin/performance/teacherInfo");

	permission = {
		page: PERMISSIONS.performance.teacherInfo.page,
		info: PERMISSIONS.performance.teacherInfo.info,
	};

	fetchPage(data: TeacherInfoFetchPageRequest) {
		return this.requester.request({
			url: "/page",
			method: "POST",
			data,
		}) as Promise<TeacherInfoPageResult>;
	}

	fetchInfo(params: TeacherInfoFetchInfoQuery) {
		return this.requester.info(params) as Promise<TeacherInfoRecord>;
	}
}

class PerformanceTeacherClassService {
	private requester = createServiceRequester("admin/performance/teacherClass");

	permission = {
		page: PERMISSIONS.performance.teacherClass.page,
		info: PERMISSIONS.performance.teacherClass.info,
	};

	fetchPage(data: TeacherClassFetchPageRequest) {
		return this.requester.request({
			url: "/page",
			method: "POST",
			data,
		}) as Promise<TeacherClassPageResult>;
	}

	fetchInfo(params: TeacherClassFetchInfoQuery) {
		return this.requester.request({
			url: "/info",
			method: "GET",
			params,
		}) as Promise<TeacherClassRecord>;
	}
}

class PerformanceTeacherFollowService {
	private requester = createServiceRequester("admin/performance/teacherFollow");

	permission = {
		page: PERMISSIONS.performance.teacherFollow.page,
		add: PERMISSIONS.performance.teacherFollow.add,
	};

	fetchPage(data: TeacherFollowFetchPageRequest) {
		return this.requester.request({
			url: "/page",
			method: "POST",
			data,
		}) as Promise<TeacherFollowPageResult>;
	}

	createFollow(data: TeacherFollowCreateTeacherFollowRequest) {
		return this.requester.request({
			url: "/add",
			method: "POST",
			data,
		}) as Promise<TeacherFollowRecord>;
	}
}

export const performanceTeacherTodoService = new PerformanceTeacherTodoService();
export const performanceTeacherDashboardService = new PerformanceTeacherDashboardService();
export const performanceTeacherInfoService = new PerformanceTeacherInfoService();
export const performanceTeacherFollowService = new PerformanceTeacherFollowService();
export const performanceTeacherClassService = new PerformanceTeacherClassService();
