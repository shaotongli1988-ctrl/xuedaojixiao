/**
 * 主题 14 培训学习与考试增强前端专用类型。
 * 这里只描述课程关联学习页消费的冻结契约，不负责课程管理、证书管理或独立 AI 平台抽象。
 * 维护重点是字段集合必须严格对齐 courseRecite、coursePractice、courseExam 三类最小接口。
 */

export type CourseLearningTaskType = 'recite' | 'practice';

export type CourseLearningTaskStatus = 'pending' | 'submitted' | 'evaluated';

export type CourseExamResultStatus = 'locked' | 'pending' | 'passed' | 'failed';

export interface CourseLearningTaskRecord {
	id: number;
	courseId: number;
	courseTitle?: string | null;
	title: string;
	taskType: CourseLearningTaskType;
	promptText?: string | null;
	status: CourseLearningTaskStatus;
	latestScore?: number | null;
	feedbackSummary?: string | null;
	submittedAt?: string | null;
	evaluatedAt?: string | null;
}

export interface CourseLearningPageResult {
	list?: CourseLearningTaskRecord[];
	pagination?: {
		page?: number;
		size?: number;
		total?: number;
	};
}

export interface CourseLearningSubmitPayload {
	id: number;
	submissionText: string;
}

export interface CourseExamSummary {
	courseId: number;
	courseTitle?: string | null;
	resultStatus: CourseExamResultStatus;
	latestScore?: number | null;
	passThreshold?: number | null;
	summaryText?: string | null;
	updatedAt?: string | null;
}
