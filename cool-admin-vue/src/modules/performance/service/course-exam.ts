/**
 * 主题 14 课程考试结果摘要前端请求服务。
 * 这里只封装课程关联的考试摘要查询，不负责试卷题目、标准答案、题库配置或改分动作。
 * 维护重点是只消费 summary 摘要接口，不扩写未冻结的考试明细能力。
 */
import { BaseService } from '/@/cool';
import type { CourseExamSummary } from '../course-learning.types';

export default class PerformanceCourseExamService extends BaseService {
	permission = {
		summary: 'performance:courseExam:summary'
	};

	constructor() {
		super('admin/performance/courseExam');
	}

	fetchSummary(params: { courseId: number }) {
		return this.request({
			url: '/summary',
			method: 'GET',
			params
		}) as unknown as Promise<CourseExamSummary>;
	}
}

export const performanceCourseExamService = new PerformanceCourseExamService();
