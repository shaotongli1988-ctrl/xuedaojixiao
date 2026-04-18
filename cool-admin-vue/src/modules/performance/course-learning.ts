/**
 * 课程学习与考试增强前端类型。
 * 这里只描述主题14页面消费的最小任务/考试摘要结构，不承接课程管理、题库平台或共享基础类型扩展。
 */
export type CourseLearningTaskStatus = 'pending' | 'submitted' | 'evaluated';

export interface CourseLearningTaskRecord {
	id: number;
	courseId: number;
	courseTitle: string;
	title: string;
	taskType: 'recite' | 'practice';
	promptText?: string;
	status: CourseLearningTaskStatus;
	latestScore: number | null;
	feedbackSummary: string | null;
	submissionText?: string | null;
	submittedAt: string | null;
	evaluatedAt: string | null;
}

export interface CourseLearningTaskPageResult {
	list: CourseLearningTaskRecord[];
	pagination: {
		page: number;
		size: number;
		total: number;
	};
}

export interface CourseExamSummaryRecord {
	courseId: number;
	courseTitle: string;
	resultStatus: 'locked' | 'pending' | 'passed' | 'failed';
	latestScore: number | null;
	passThreshold: number | null;
	summaryText: string | null;
	updatedAt: string | null;
}
