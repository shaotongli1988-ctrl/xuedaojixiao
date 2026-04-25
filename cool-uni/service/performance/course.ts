/**
 * 文件职责：封装 cool-uni 对课程管理移动页的列表与详情读取；
 * 不负责课程编辑、报名明细或员工报名主链；
 * 维护重点是只复用 course 既有接口与权限键。
 */
import { createServiceRequester } from "/@/cool/service/requester";
import type {
	CourseFetchInfoQuery,
	CourseFetchPageRequest,
	CoursePageResult,
	CourseRecord,
} from "/@/types/performance-course";
import { PERMISSIONS } from "/@/generated/permissions.generated";

class PerformanceCourseService {
	private requester = createServiceRequester("admin/performance/course");

	permission = {
		page: PERMISSIONS.performance.course.page,
		info: PERMISSIONS.performance.course.info,
		enrollmentPage: PERMISSIONS.performance.course.enrollmentPage,
	};

	fetchPage(data: CourseFetchPageRequest) {
		return this.requester.page(data) as Promise<CoursePageResult>;
	}

	fetchInfo(params: CourseFetchInfoQuery) {
		return this.requester.info(params) as Promise<CourseRecord>;
	}
}

export const performanceCourseService = new PerformanceCourseService();
