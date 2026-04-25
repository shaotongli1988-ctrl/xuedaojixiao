/**
 * 文件职责：封装 cool-uni 对课程学习移动页的背诵、练习和考试摘要接口访问；
 * 不负责课程管理主链、课程选择来源或页面状态编排；
 * 维护重点是只复用 courseRecite / coursePractice / courseExam 既有冻结契约。
 */
import { createServiceRequester } from "/@/cool/service/requester";
import { PERMISSIONS } from "/@/generated/permissions.generated";
import type {
	CourseExamFetchSummaryQuery,
	CourseExamSummary,
	CourseLearningSubmitPayload,
	CoursePracticeFetchInfoQuery,
	CoursePracticeFetchPageRequest,
	CourseReciteFetchInfoQuery,
	CourseReciteFetchPageRequest,
	CourseLearningTaskPageResult,
	CourseLearningTaskRecord,
} from "/@/types/performance-course-learning";

class PerformanceCourseReciteService {
	private requester = createServiceRequester("admin/performance/courseRecite");

	permission = {
		page: PERMISSIONS.performance.courseRecite.page,
		info: PERMISSIONS.performance.courseRecite.info,
		submit: PERMISSIONS.performance.courseRecite.submit,
	};

	fetchPage(data: CourseReciteFetchPageRequest) {
		return this.requester.request({
			url: "/page",
			method: "POST",
			data,
		}) as Promise<CourseLearningTaskPageResult>;
	}

	fetchInfo(params: CourseReciteFetchInfoQuery) {
		return this.requester.info(params) as Promise<CourseLearningTaskRecord>;
	}

	submitTask(data: CourseLearningSubmitPayload) {
		return this.requester.request({
			url: "/submit",
			method: "POST",
			data,
		}) as Promise<CourseLearningTaskRecord>;
	}
}

class PerformanceCoursePracticeService {
	private requester = createServiceRequester("admin/performance/coursePractice");

	permission = {
		page: PERMISSIONS.performance.coursePractice.page,
		info: PERMISSIONS.performance.coursePractice.info,
		submit: PERMISSIONS.performance.coursePractice.submit,
	};

	fetchPage(data: CoursePracticeFetchPageRequest) {
		return this.requester.request({
			url: "/page",
			method: "POST",
			data,
		}) as Promise<CourseLearningTaskPageResult>;
	}

	fetchInfo(params: CoursePracticeFetchInfoQuery) {
		return this.requester.info(params) as Promise<CourseLearningTaskRecord>;
	}

	submitTask(data: CourseLearningSubmitPayload) {
		return this.requester.request({
			url: "/submit",
			method: "POST",
			data,
		}) as Promise<CourseLearningTaskRecord>;
	}
}

class PerformanceCourseExamService {
	private requester = createServiceRequester("admin/performance/courseExam");

	permission = {
		summary: PERMISSIONS.performance.courseExam.summary,
	};

	fetchSummary(params: CourseExamFetchSummaryQuery) {
		return this.requester.request({
			url: "/summary",
			method: "GET",
			params,
		}) as Promise<CourseExamSummary>;
	}
}

export const performanceCourseReciteService = new PerformanceCourseReciteService();
export const performanceCoursePracticeService = new PerformanceCoursePracticeService();
export const performanceCourseExamService = new PerformanceCourseExamService();
