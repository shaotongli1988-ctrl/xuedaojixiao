/**
 * 业务字典 SSOT 前端静态回归测试。
 * 这里只验证 Web/Uni 已切换到统一业务字典 key，不负责挂载页面、请求接口或断言视觉渲染。
 * 维护重点是避免页面重新引入本地 statusOptions、标签 switch 或 types 层业务文案函数。
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, '..', '..');

async function readRepoFile(relativePath) {
	return readFile(path.join(repoRoot, relativePath), 'utf8');
}

test('frontend normal web pages consume business dict keys instead of local status option arrays', async () => {
	const [
		jobStandardPage,
		assessmentPage,
		certificatePage,
		coursePage,
		hiringPage,
		promotionPage,
		promotionReviewDrawer,
		talentAssetPage,
		workPlanPage,
		recruitPlanPage,
		resumePoolPage,
		supplierPage,
		meetingPage,
		meetingDetailDrawer,
		pipPage,
		feedbackPage,
		feedbackSummaryDrawer,
		feedbackSubmitDrawer,
		feedbackTaskForm,
		suggestionPage,
		suggestionDetailDrawer,
		salaryPage,
		capabilityPage,
		contractPage,
		interviewPage
	] = await Promise.all([
		readRepoFile('cool-admin-vue/src/modules/performance/views/job-standard/index.vue'),
		readRepoFile('cool-admin-vue/src/modules/performance/components/assessment-page.vue'),
		readRepoFile('cool-admin-vue/src/modules/performance/views/certificate/index.vue'),
		readRepoFile('cool-admin-vue/src/modules/performance/views/course/index.vue'),
		readRepoFile('cool-admin-vue/src/modules/performance/views/hiring/index.vue'),
		readRepoFile('cool-admin-vue/src/modules/performance/views/promotion/index.vue'),
		readRepoFile(
			'cool-admin-vue/src/modules/performance/components/promotion-review-drawer.vue'
		),
		readRepoFile('cool-admin-vue/src/modules/performance/views/talentAsset/index.vue'),
		readRepoFile('cool-admin-vue/src/modules/performance/views/work-plan/index.vue'),
		readRepoFile('cool-admin-vue/src/modules/performance/views/recruit-plan/index.vue'),
		readRepoFile('cool-admin-vue/src/modules/performance/views/resumePool/index.vue'),
		readRepoFile('cool-admin-vue/src/modules/performance/views/supplier/index.vue'),
		readRepoFile('cool-admin-vue/src/modules/performance/views/meeting/index.vue'),
		readRepoFile('cool-admin-vue/src/modules/performance/components/meeting-detail-drawer.vue'),
		readRepoFile('cool-admin-vue/src/modules/performance/views/pip/index.vue'),
		readRepoFile('cool-admin-vue/src/modules/performance/views/feedback/index.vue'),
		readRepoFile(
			'cool-admin-vue/src/modules/performance/components/feedback-summary-drawer.vue'
		),
		readRepoFile(
			'cool-admin-vue/src/modules/performance/components/feedback-submit-drawer.vue'
		),
		readRepoFile('cool-admin-vue/src/modules/performance/components/feedback-task-form.vue'),
		readRepoFile('cool-admin-vue/src/modules/performance/views/suggestion/index.vue'),
		readRepoFile(
			'cool-admin-vue/src/modules/performance/components/suggestion-detail-drawer.vue'
		),
		readRepoFile('cool-admin-vue/src/modules/performance/views/salary/index.vue'),
		readRepoFile('cool-admin-vue/src/modules/performance/views/capability/index.vue'),
		readRepoFile('cool-admin-vue/src/modules/performance/views/contract/index.vue'),
		readRepoFile('cool-admin-vue/src/modules/performance/views/interview/index.vue')
	]);

	assert.match(
		jobStandardPage,
		/const JOB_STANDARD_STATUS_DICT_KEY = 'performance\.jobStandard\.status'/
	);
	assert.match(jobStandardPage, /dict\.getLabel\(JOB_STANDARD_STATUS_DICT_KEY, status\)/);
	assert.match(jobStandardPage, /dict\.getMeta\(JOB_STANDARD_STATUS_DICT_KEY, status\)\?\.tone/);
	assert.doesNotMatch(jobStandardPage, /const statusOptions:\s*Array/);

	assert.match(
		assessmentPage,
		/const ASSESSMENT_STATUS_DICT_KEY = 'performance\.assessment\.status'/
	);
	assert.match(assessmentPage, /dict\.getLabel\(ASSESSMENT_STATUS_DICT_KEY, status\)/);
	assert.match(assessmentPage, /dict\.getMeta\(ASSESSMENT_STATUS_DICT_KEY, status\)\?\.tone/);
	assert.doesNotMatch(assessmentPage, /const statusOptions = \[/);

	assert.match(
		certificatePage,
		/const CERTIFICATE_STATUS_DICT_KEY = 'performance\.certificate\.status'/
	);
	assert.match(
		certificatePage,
		/const CERTIFICATE_RECORD_STATUS_DICT_KEY = 'performance\.certificate\.recordStatus'/
	);
	assert.match(certificatePage, /dict\.getLabel\(CERTIFICATE_STATUS_DICT_KEY, status\)/);
	assert.match(certificatePage, /dict\.getLabel\(CERTIFICATE_RECORD_STATUS_DICT_KEY, status\)/);
	assert.doesNotMatch(certificatePage, /const filterStatusOptions:/);
	assert.doesNotMatch(certificatePage, /const recordStatusOptions:/);

	assert.match(coursePage, /const COURSE_STATUS_DICT_KEY = 'performance\.course\.status'/);
	assert.match(coursePage, /dict\.getLabel\(COURSE_STATUS_DICT_KEY, status\)/);
	assert.match(coursePage, /dict\.getMeta\(COURSE_STATUS_DICT_KEY, status\)\?\.tone/);
	assert.doesNotMatch(coursePage, /const courseStatusOptions:\s*Array/);

	assert.match(hiringPage, /const HIRING_STATUS_DICT_KEY = 'performance\.hiring\.status'/);
	assert.match(
		hiringPage,
		/const HIRING_SOURCE_TYPE_DICT_KEY = 'performance\.hiring\.sourceType'/
	);
	assert.match(hiringPage, /dict\.getLabel\(HIRING_STATUS_DICT_KEY, status\)/);
	assert.match(hiringPage, /dict\.getMeta\(HIRING_STATUS_DICT_KEY, status\)\?\.tone/);
	assert.match(hiringPage, /dict\.getLabel\(HIRING_SOURCE_TYPE_DICT_KEY, value\)/);
	assert.doesNotMatch(hiringPage, /const statusOptions:\s*Array/);
	assert.doesNotMatch(hiringPage, /const sourceTypeOptions:\s*Array/);

	assert.match(
		promotionPage,
		/const PROMOTION_STATUS_DICT_KEY = 'performance\.promotion\.status'/
	);
	assert.match(promotionPage, /dict\.getLabel\(PROMOTION_STATUS_DICT_KEY, status\)/);
	assert.match(promotionPage, /dict\.getMeta\(PROMOTION_STATUS_DICT_KEY, status\)\?\.tone/);
	assert.doesNotMatch(promotionPage, /const statusOptions = \[/);
	assert.match(
		promotionReviewDrawer,
		/const PROMOTION_STATUS_DICT_KEY = 'performance\.promotion\.status'/
	);
	assert.match(
		promotionReviewDrawer,
		/dict\.getLabel\(PROMOTION_STATUS_DICT_KEY, props\.promotion\?\.status\)/
	);

	assert.match(
		talentAssetPage,
		/const TALENT_ASSET_STATUS_DICT_KEY = 'performance\.talentAsset\.status'/
	);
	assert.match(talentAssetPage, /dict\.getLabel\(TALENT_ASSET_STATUS_DICT_KEY, status\)/);
	assert.match(talentAssetPage, /dict\.getMeta\(TALENT_ASSET_STATUS_DICT_KEY, status\)\?\.tone/);
	assert.doesNotMatch(talentAssetPage, /const statusOptions:\s*Array/);

	assert.match(workPlanPage, /const WORK_PLAN_STATUS_DICT_KEY = 'performance\.workPlan\.status'/);
	assert.match(
		workPlanPage,
		/const WORK_PLAN_SOURCE_STATUS_DICT_KEY = 'performance\.workPlan\.sourceStatus'/
	);
	assert.match(
		workPlanPage,
		/const WORK_PLAN_PRIORITY_DICT_KEY = 'performance\.workPlan\.priority'/
	);
	assert.match(
		workPlanPage,
		/const WORK_PLAN_SOURCE_TYPE_DICT_KEY = 'performance\.workPlan\.sourceType'/
	);
	assert.match(workPlanPage, /dict\.getLabel\(WORK_PLAN_STATUS_DICT_KEY, status\)/);
	assert.match(workPlanPage, /dict\.getLabel\(WORK_PLAN_SOURCE_STATUS_DICT_KEY, status\)/);
	assert.match(workPlanPage, /dict\.getLabel\(WORK_PLAN_PRIORITY_DICT_KEY, priority\)/);
	assert.match(workPlanPage, /dict\.getLabel\(WORK_PLAN_SOURCE_TYPE_DICT_KEY, sourceType\)/);
	assert.doesNotMatch(workPlanPage, /const statusOptions:\s*Array/);
	assert.doesNotMatch(workPlanPage, /const sourceStatusOptions:\s*Array/);
	assert.doesNotMatch(workPlanPage, /const priorityOptions:\s*Array/);

	assert.match(
		recruitPlanPage,
		/const RECRUIT_PLAN_STATUS_DICT_KEY = 'performance\.recruitPlan\.status'/
	);
	assert.match(recruitPlanPage, /dict\.getLabel\(RECRUIT_PLAN_STATUS_DICT_KEY, status\)/);
	assert.match(recruitPlanPage, /dict\.getMeta\(RECRUIT_PLAN_STATUS_DICT_KEY, status\)\?\.tone/);
	assert.doesNotMatch(recruitPlanPage, /const statusOptions:\s*Array/);

	assert.match(
		resumePoolPage,
		/const RESUME_POOL_STATUS_DICT_KEY = 'performance\.resumePool\.status'/
	);
	assert.match(
		resumePoolPage,
		/const RESUME_POOL_SOURCE_TYPE_DICT_KEY = 'performance\.resumePool\.sourceType'/
	);
	assert.match(resumePoolPage, /dict\.getLabel\(RESUME_POOL_STATUS_DICT_KEY, status\)/);
	assert.match(resumePoolPage, /dict\.getMeta\(RESUME_POOL_STATUS_DICT_KEY, status\)\?\.tone/);
	assert.match(resumePoolPage, /dict\.getLabel\(RESUME_POOL_SOURCE_TYPE_DICT_KEY, sourceType\)/);
	assert.doesNotMatch(resumePoolPage, /const statusOptions:\s*Array/);
	assert.doesNotMatch(resumePoolPage, /const sourceTypeOptions:\s*Array/);

	assert.match(supplierPage, /const SUPPLIER_STATUS_DICT_KEY = 'performance\.supplier\.status'/);
	assert.match(supplierPage, /dict\.getLabel\(SUPPLIER_STATUS_DICT_KEY, status\)/);
	assert.match(supplierPage, /dict\.getMeta\(SUPPLIER_STATUS_DICT_KEY, status\)\?\.tone/);
	assert.doesNotMatch(supplierPage, /const filterStatusOptions:\s*Array/);

	assert.match(meetingPage, /const MEETING_STATUS_DICT_KEY = 'performance\.meeting\.status'/);
	assert.match(meetingPage, /dict\.getLabel\(MEETING_STATUS_DICT_KEY, status\)/);
	assert.match(meetingPage, /dict\.getMeta\(MEETING_STATUS_DICT_KEY, status\)\?\.tone/);
	assert.doesNotMatch(meetingPage, /const filterStatusOptions:\s*Array/);
	assert.match(
		meetingDetailDrawer,
		/const MEETING_STATUS_DICT_KEY = 'performance\.meeting\.status'/
	);
	assert.match(
		meetingDetailDrawer,
		/dict\.getLabel\(MEETING_STATUS_DICT_KEY, props\.meeting\?\.status\)/
	);

	assert.match(pipPage, /const PIP_STATUS_DICT_KEY = 'performance\.pip\.status'/);
	assert.match(pipPage, /dict\.getLabel\(PIP_STATUS_DICT_KEY, status\)/);
	assert.match(pipPage, /dict\.getMeta\(PIP_STATUS_DICT_KEY, status\)\?\.tone/);
	assert.doesNotMatch(pipPage, /const statusOptions = \[/);

	assert.match(
		feedbackPage,
		/const FEEDBACK_TASK_STATUS_DICT_KEY = 'performance\.feedback\.taskStatus'/
	);
	assert.match(feedbackPage, /dict\.getLabel\(FEEDBACK_TASK_STATUS_DICT_KEY, status\)/);
	assert.match(feedbackPage, /dict\.getMeta\(FEEDBACK_TASK_STATUS_DICT_KEY, status\)\?\.tone/);
	assert.doesNotMatch(feedbackPage, /const statusOptions = \[/);
	assert.match(
		feedbackSummaryDrawer,
		/const FEEDBACK_RECORD_STATUS_DICT_KEY = 'performance\.feedback\.recordStatus'/
	);
	assert.match(
		feedbackSummaryDrawer,
		/const FEEDBACK_RELATION_TYPE_DICT_KEY = 'performance\.feedback\.relationType'/
	);
	assert.match(feedbackSummaryDrawer, /dict\.getLabel\(FEEDBACK_RECORD_STATUS_DICT_KEY, value\)/);
	assert.match(feedbackSummaryDrawer, /dict\.getLabel\(FEEDBACK_RELATION_TYPE_DICT_KEY, value\)/);
	assert.doesNotMatch(feedbackSummaryDrawer, /row\.status === 'submitted'/);
	assert.match(
		feedbackSubmitDrawer,
		/const FEEDBACK_RELATION_TYPE_DICT_KEY = 'performance\.feedback\.relationType'/
	);
	assert.match(feedbackSubmitDrawer, /dict\.get\(FEEDBACK_RELATION_TYPE_DICT_KEY\)\.value\.map/);
	assert.doesNotMatch(feedbackSubmitDrawer, /const relationOptions = \[/);
	assert.match(
		feedbackTaskForm,
		/const FEEDBACK_RELATION_TYPE_DICT_KEY = 'performance\.feedback\.relationType'/
	);
	assert.match(feedbackTaskForm, /dict\.get\(FEEDBACK_RELATION_TYPE_DICT_KEY\)\.value\.map/);
	assert.doesNotMatch(feedbackTaskForm, /const relationOptions: Array/);

	assert.match(
		suggestionPage,
		/const SUGGESTION_TYPE_DICT_KEY = 'performance\.suggestion\.type'/
	);
	assert.match(
		suggestionPage,
		/const SUGGESTION_STATUS_DICT_KEY = 'performance\.suggestion\.status'/
	);
	assert.match(
		suggestionPage,
		/const SUGGESTION_REVOKE_REASON_CODE_DICT_KEY = 'performance\.suggestion\.revokeReasonCode'/
	);
	assert.match(suggestionPage, /dict\.getLabel\(SUGGESTION_TYPE_DICT_KEY, type\)/);
	assert.match(suggestionPage, /dict\.getLabel\(SUGGESTION_STATUS_DICT_KEY, status\)/);
	assert.match(suggestionPage, /dict\.get\(SUGGESTION_REVOKE_REASON_CODE_DICT_KEY\)\.value\.map/);
	assert.doesNotMatch(suggestionPage, /const suggestionTypeOptions = \[/);
	assert.doesNotMatch(suggestionPage, /const statusOptions = \[/);
	assert.doesNotMatch(suggestionPage, /const revokeReasonOptions = \[/);
	assert.match(
		suggestionDetailDrawer,
		/const SUGGESTION_TYPE_DICT_KEY = 'performance\.suggestion\.type'/
	);
	assert.match(
		suggestionDetailDrawer,
		/const SUGGESTION_STATUS_DICT_KEY = 'performance\.suggestion\.status'/
	);
	assert.match(
		suggestionDetailDrawer,
		/dict\.getLabel\(SUGGESTION_STATUS_DICT_KEY, props\.suggestion\?\.status\)/
	);
	assert.doesNotMatch(suggestionDetailDrawer, /switch \(props\.suggestion\?\.status\)/);

	assert.match(salaryPage, /const SALARY_STATUS_DICT_KEY = 'performance\.salary\.status'/);
	assert.match(salaryPage, /dict\.getLabel\(SALARY_STATUS_DICT_KEY, status\)/);
	assert.match(salaryPage, /dict\.getMeta\(SALARY_STATUS_DICT_KEY, status\)\?\.tone/);
	assert.doesNotMatch(salaryPage, /const statusOptions = \[/);

	assert.match(
		capabilityPage,
		/const CAPABILITY_STATUS_DICT_KEY = 'performance\.capability\.status'/
	);
	assert.match(capabilityPage, /dict\.getLabel\(CAPABILITY_STATUS_DICT_KEY, status\)/);
	assert.match(capabilityPage, /dict\.getMeta\(CAPABILITY_STATUS_DICT_KEY, status\)\?\.tone/);
	assert.doesNotMatch(capabilityPage, /const filterStatusOptions:\s*Array/);

	assert.match(contractPage, /const CONTRACT_TYPE_DICT_KEY = 'performance\.contract\.type'/);
	assert.match(contractPage, /const CONTRACT_STATUS_DICT_KEY = 'performance\.contract\.status'/);
	assert.match(contractPage, /dict\.getLabel\(CONTRACT_TYPE_DICT_KEY, value\)/);
	assert.match(contractPage, /dict\.getLabel\(CONTRACT_STATUS_DICT_KEY, status\)/);
	assert.match(contractPage, /dict\.getMeta\(CONTRACT_STATUS_DICT_KEY, status\)\?\.tone/);
	assert.doesNotMatch(contractPage, /const typeOptions:\s*Array/);
	assert.doesNotMatch(contractPage, /const filterStatusOptions:\s*Array/);
	assert.doesNotMatch(contractPage, /const editableStatusOptions:\s*Array/);

	assert.match(
		interviewPage,
		/const INTERVIEW_STATUS_DICT_KEY = 'performance\.interview\.status'/
	);
	assert.match(interviewPage, /const INTERVIEW_TYPE_DICT_KEY = 'performance\.interview\.type'/);
	assert.match(interviewPage, /dict\.getLabel\(INTERVIEW_STATUS_DICT_KEY, status\)/);
	assert.match(interviewPage, /dict\.getMeta\(INTERVIEW_STATUS_DICT_KEY, status\)\?\.tone/);
	assert.match(interviewPage, /dict\.getLabel\(INTERVIEW_TYPE_DICT_KEY, value\)/);
	assert.doesNotMatch(interviewPage, /const statusOptions:\s*Array/);
	assert.doesNotMatch(interviewPage, /const interviewTypeOptions:\s*Array/);
});

test('frontend boundary uni pages and types no longer carry local business status label helpers', async () => {
	const [
		jobStandardPage,
		assessmentListPage,
		assessmentInitiatedPage,
		assessmentDetailPage,
		approvalListPage,
		certificatePage,
		coursePage,
		promotionPage,
		workPlanPage,
		recruitPlanPage,
		resumePoolPage,
		supplierPage,
		meetingPage,
		talentAssetPage,
		pipPage,
		feedbackListPage,
		feedbackDetailPage,
		feedbackStatusTag,
		suggestionPage,
		salaryPage,
		capabilityPage,
		contractPage,
		jobStandardTypes,
		assessmentTypes,
		certificateTypes,
		courseTypes,
		promotionTypes,
		workPlanTypes,
		recruitPlanTypes,
		resumePoolTypes,
		supplierTypes,
		meetingTypes,
		talentAssetTypes,
		pipTypes,
		feedbackTypes,
		feedbackUtils,
		suggestionTypes,
		salaryTypes,
		capabilityTypes,
		contractTypes
	] = await Promise.all([
		readRepoFile('cool-uni/pages/performance/job-standard/index.vue'),
		readRepoFile('cool-uni/pages/performance/assessment/list.vue'),
		readRepoFile('cool-uni/pages/performance/assessment/initiated.vue'),
		readRepoFile('cool-uni/pages/performance/assessment/detail.vue'),
		readRepoFile('cool-uni/pages/performance/approval/list.vue'),
		readRepoFile('cool-uni/pages/performance/certificate/index.vue'),
		readRepoFile('cool-uni/pages/performance/course/index.vue'),
		readRepoFile('cool-uni/pages/performance/promotion/index.vue'),
		readRepoFile('cool-uni/pages/performance/work-plan/index.vue'),
		readRepoFile('cool-uni/pages/performance/recruit-plan/index.vue'),
		readRepoFile('cool-uni/pages/performance/resume-pool/index.vue'),
		readRepoFile('cool-uni/pages/performance/supplier/index.vue'),
		readRepoFile('cool-uni/pages/performance/meeting/index.vue'),
		readRepoFile('cool-uni/pages/performance/talent-asset/index.vue'),
		readRepoFile('cool-uni/pages/performance/pip/index.vue'),
		readRepoFile('cool-uni/pages/performance/feedback/list.vue'),
		readRepoFile('cool-uni/pages/performance/feedback/detail.vue'),
		readRepoFile('cool-uni/pages/performance/feedback/components/feedback-status-tag.vue'),
		readRepoFile('cool-uni/pages/performance/suggestion/index.vue'),
		readRepoFile('cool-uni/pages/performance/salary/index.vue'),
		readRepoFile('cool-uni/pages/performance/capability/index.vue'),
		readRepoFile('cool-uni/pages/performance/contract/index.vue'),
		readRepoFile('cool-uni/types/performance-job-standard.ts'),
		readRepoFile('cool-uni/types/performance-assessment.ts'),
		readRepoFile('cool-uni/types/performance-certificate.ts'),
		readRepoFile('cool-uni/types/performance-course.ts'),
		readRepoFile('cool-uni/types/performance-promotion.ts'),
		readRepoFile('cool-uni/types/performance-work-plan.ts'),
		readRepoFile('cool-uni/types/performance-recruit-plan.ts'),
		readRepoFile('cool-uni/types/performance-resume-pool.ts'),
		readRepoFile('cool-uni/types/performance-supplier.ts'),
		readRepoFile('cool-uni/types/performance-meeting.ts'),
		readRepoFile('cool-uni/types/performance-talent-asset.ts'),
		readRepoFile('cool-uni/types/performance-pip.ts'),
		readRepoFile('cool-uni/types/performance-feedback.ts'),
		readRepoFile('cool-uni/pages/performance/feedback/utils.ts'),
		readRepoFile('cool-uni/types/performance-suggestion.ts'),
		readRepoFile('cool-uni/types/performance-salary.ts'),
		readRepoFile('cool-uni/types/performance-capability.ts'),
		readRepoFile('cool-uni/types/performance-contract.ts')
	]);

	assert.match(
		jobStandardPage,
		/const JOB_STANDARD_STATUS_DICT_KEY = "performance\.jobStandard\.status"/
	);
	assert.match(jobStandardPage, /dict\.getLabel\(JOB_STANDARD_STATUS_DICT_KEY, value\)/);
	assert.doesNotMatch(jobStandardTypes, /jobStandardStatusLabel|jobStandardStatusTone/);

	assert.match(
		assessmentListPage,
		/const ASSESSMENT_STATUS_DICT_KEY = "performance\.assessment\.status"/
	);
	assert.match(assessmentListPage, /dict\.getLabel\(ASSESSMENT_STATUS_DICT_KEY, value\)/);
	assert.match(
		assessmentInitiatedPage,
		/const ASSESSMENT_STATUS_DICT_KEY = "performance\.assessment\.status"/
	);
	assert.match(assessmentInitiatedPage, /dict\.getLabel\(ASSESSMENT_STATUS_DICT_KEY, value\)/);
	assert.match(
		assessmentDetailPage,
		/const ASSESSMENT_STATUS_DICT_KEY = "performance\.assessment\.status"/
	);
	assert.match(assessmentDetailPage, /dict\.getLabel\(ASSESSMENT_STATUS_DICT_KEY, value\)/);
	assert.match(
		approvalListPage,
		/const ASSESSMENT_STATUS_DICT_KEY = "performance\.assessment\.status"/
	);
	assert.match(approvalListPage, /dict\.getLabel\(ASSESSMENT_STATUS_DICT_KEY, value\)/);
	assert.doesNotMatch(assessmentTypes, /assessmentStatusLabel|assessmentStatusTone/);

	assert.match(
		certificatePage,
		/const CERTIFICATE_STATUS_DICT_KEY = "performance\.certificate\.status"/
	);
	assert.match(certificatePage, /dict\.getLabel\(CERTIFICATE_STATUS_DICT_KEY, value\)/);
	assert.doesNotMatch(certificatePage, /certificateStatusLabel|certificateStatusTone/);
	assert.doesNotMatch(certificateTypes, /export function certificateStatusLabel/);
	assert.doesNotMatch(certificateTypes, /export function certificateStatusTone/);

	assert.match(coursePage, /const COURSE_STATUS_DICT_KEY = "performance\.course\.status"/);
	assert.match(coursePage, /dict\.getLabel\(COURSE_STATUS_DICT_KEY, value\)/);
	assert.doesNotMatch(courseTypes, /courseStatusLabel|courseStatusTone/);

	assert.match(
		promotionPage,
		/const PROMOTION_STATUS_DICT_KEY = "performance\.promotion\.status"/
	);
	assert.match(promotionPage, /dict\.getLabel\(PROMOTION_STATUS_DICT_KEY, value\)/);
	assert.doesNotMatch(promotionTypes, /promotionStatusLabel|promotionStatusTone/);

	assert.match(workPlanPage, /const WORK_PLAN_STATUS_DICT_KEY = "performance\.workPlan\.status"/);
	assert.match(
		workPlanPage,
		/const WORK_PLAN_SOURCE_STATUS_DICT_KEY = "performance\.workPlan\.sourceStatus"/
	);
	assert.match(
		workPlanPage,
		/const WORK_PLAN_PRIORITY_DICT_KEY = "performance\.workPlan\.priority"/
	);
	assert.match(
		workPlanPage,
		/const WORK_PLAN_SOURCE_TYPE_DICT_KEY = "performance\.workPlan\.sourceType"/
	);
	assert.match(workPlanPage, /dict\.getLabel\(WORK_PLAN_STATUS_DICT_KEY, value\)/);
	assert.match(workPlanPage, /dict\.getLabel\(WORK_PLAN_SOURCE_STATUS_DICT_KEY, value\)/);
	assert.match(workPlanPage, /dict\.getLabel\(WORK_PLAN_PRIORITY_DICT_KEY, value\)/);
	assert.match(workPlanPage, /dict\.getLabel\(WORK_PLAN_SOURCE_TYPE_DICT_KEY, value\)/);
	assert.doesNotMatch(
		workPlanTypes,
		/workPlanStatusLabel|workPlanStatusTone|workPlanSourceStatusLabel|workPlanPriorityLabel|workPlanSourceTypeLabel/
	);

	assert.match(
		recruitPlanPage,
		/const RECRUIT_PLAN_STATUS_DICT_KEY = "performance\.recruitPlan\.status"/
	);
	assert.match(recruitPlanPage, /dict\.getLabel\(RECRUIT_PLAN_STATUS_DICT_KEY, value\)/);
	assert.doesNotMatch(recruitPlanTypes, /recruitPlanStatusLabel|recruitPlanStatusTone/);

	assert.match(
		resumePoolPage,
		/const RESUME_POOL_STATUS_DICT_KEY = "performance\.resumePool\.status"/
	);
	assert.match(
		resumePoolPage,
		/const RESUME_POOL_SOURCE_TYPE_DICT_KEY = "performance\.resumePool\.sourceType"/
	);
	assert.match(resumePoolPage, /dict\.getLabel\(RESUME_POOL_STATUS_DICT_KEY, value\)/);
	assert.match(resumePoolPage, /dict\.getLabel\(RESUME_POOL_SOURCE_TYPE_DICT_KEY, value\)/);
	assert.doesNotMatch(
		resumePoolTypes,
		/resumePoolStatusLabel|resumePoolStatusTone|resumePoolSourceTypeLabel/
	);

	assert.match(supplierPage, /const SUPPLIER_STATUS_DICT_KEY = "performance\.supplier\.status"/);
	assert.match(supplierPage, /dict\.getLabel\(SUPPLIER_STATUS_DICT_KEY, value\)/);
	assert.doesNotMatch(supplierTypes, /supplierStatusLabel|supplierStatusTone/);

	assert.match(meetingPage, /const MEETING_STATUS_DICT_KEY = "performance\.meeting\.status"/);
	assert.match(meetingPage, /dict\.getLabel\(MEETING_STATUS_DICT_KEY, value\)/);
	assert.doesNotMatch(meetingTypes, /meetingStatusLabel|meetingStatusTone/);

	assert.match(
		talentAssetPage,
		/const TALENT_ASSET_STATUS_DICT_KEY = "performance\.talentAsset\.status"/
	);
	assert.match(talentAssetPage, /dict\.getLabel\(TALENT_ASSET_STATUS_DICT_KEY, value\)/);
	assert.doesNotMatch(talentAssetTypes, /talentAssetStatusLabel|talentAssetStatusTone/);

	assert.match(pipPage, /const PIP_STATUS_DICT_KEY = "performance\.pip\.status"/);
	assert.match(pipPage, /dict\.getLabel\(PIP_STATUS_DICT_KEY, value\)/);
	assert.doesNotMatch(pipTypes, /pipStatusLabel|pipStatusTone/);

	assert.match(
		feedbackListPage,
		/const FEEDBACK_TASK_STATUS_DICT_KEY = "performance\.feedback\.taskStatus"/
	);
	assert.match(feedbackListPage, /dict\.getLabel\(FEEDBACK_TASK_STATUS_DICT_KEY, value\)/);
	assert.match(
		feedbackDetailPage,
		/const FEEDBACK_TASK_STATUS_DICT_KEY = "performance\.feedback\.taskStatus"/
	);
	assert.match(
		feedbackDetailPage,
		/const FEEDBACK_RECORD_STATUS_DICT_KEY = "performance\.feedback\.recordStatus"/
	);
	assert.match(feedbackDetailPage, /dict\.getLabel\(FEEDBACK_TASK_STATUS_DICT_KEY, value\)/);
	assert.match(feedbackDetailPage, /dict\.getLabel\(FEEDBACK_RECORD_STATUS_DICT_KEY, value\)/);
	assert.match(
		feedbackStatusTag,
		/const FEEDBACK_TASK_STATUS_DICT_KEY = "performance\.feedback\.taskStatus"/
	);
	assert.match(
		feedbackStatusTag,
		/dict\.getLabel\(FEEDBACK_TASK_STATUS_DICT_KEY, props\.status\)/
	);
	assert.doesNotMatch(feedbackTypes, /feedbackStatusLabel|feedbackStatusTone/);
	assert.doesNotMatch(feedbackUtils, /FEEDBACK_RELATION_OPTIONS/);

	assert.match(
		suggestionPage,
		/const SUGGESTION_TYPE_DICT_KEY = "performance\.suggestion\.type"/
	);
	assert.match(
		suggestionPage,
		/const SUGGESTION_STATUS_DICT_KEY = "performance\.suggestion\.status"/
	);
	assert.match(suggestionPage, /dict\.getLabel\(SUGGESTION_TYPE_DICT_KEY, value\)/);
	assert.match(suggestionPage, /dict\.getLabel\(SUGGESTION_STATUS_DICT_KEY, value\)/);
	assert.match(suggestionPage, /dict\.get\(SUGGESTION_STATUS_DICT_KEY\)\.map/);
	assert.match(suggestionPage, /dict\.get\(SUGGESTION_TYPE_DICT_KEY\)\.map/);
	assert.doesNotMatch(
		suggestionTypes,
		/suggestionTypeLabel|suggestionStatusLabel|suggestionStatusTone/
	);

	assert.match(salaryPage, /const SALARY_STATUS_DICT_KEY = "performance\.salary\.status"/);
	assert.match(salaryPage, /dict\.getLabel\(SALARY_STATUS_DICT_KEY, value\)/);
	assert.match(salaryPage, /dict\.get\(SALARY_STATUS_DICT_KEY\)\.map/);
	assert.doesNotMatch(salaryTypes, /salaryStatusLabel|salaryStatusTone/);

	assert.match(
		capabilityPage,
		/const CAPABILITY_STATUS_DICT_KEY = "performance\.capability\.status"/
	);
	assert.match(capabilityPage, /dict\.getLabel\(CAPABILITY_STATUS_DICT_KEY, value\)/);
	assert.match(capabilityPage, /dict\.get\(CAPABILITY_STATUS_DICT_KEY\)\.map/);
	assert.doesNotMatch(capabilityTypes, /capabilityStatusLabel|capabilityStatusTone/);

	assert.match(contractPage, /const CONTRACT_TYPE_DICT_KEY = "performance\.contract\.type"/);
	assert.match(contractPage, /const CONTRACT_STATUS_DICT_KEY = "performance\.contract\.status"/);
	assert.match(contractPage, /dict\.getLabel\(CONTRACT_TYPE_DICT_KEY, value\)/);
	assert.match(contractPage, /dict\.getLabel\(CONTRACT_STATUS_DICT_KEY, value\)/);
	assert.match(contractPage, /dict\.get\(CONTRACT_STATUS_DICT_KEY\)\.map/);
	assert.doesNotMatch(contractTypes, /contractStatusLabel|contractStatusTone|contractTypeLabel/);
});

test('frontend remaining business pages consume dict store instead of local business constants', async () => {
	const [
		goalPage,
		courseLearningPage,
		teacherListPage,
		teacherClassPage,
		teacherTodoPage,
		purchaseWorkspacePage,
		documentCenterPage,
		knowledgeBasePage,
		indicatorLibraryPage
	] = await Promise.all([
		readRepoFile('cool-admin-vue/src/modules/performance/views/goals/index.vue'),
		readRepoFile('cool-admin-vue/src/modules/performance/views/course-learning/index.vue'),
		readRepoFile(
			'cool-admin-vue/src/modules/performance/views/teacher-channel/teacher-list.vue'
		),
		readRepoFile('cool-admin-vue/src/modules/performance/views/teacher-channel/class-list.vue'),
		readRepoFile('cool-admin-vue/src/modules/performance/views/teacher-channel/todo-list.vue'),
		readRepoFile('cool-admin-vue/src/modules/performance/views/purchase-order/workspace.vue'),
		readRepoFile('cool-admin-vue/src/modules/performance/views/office/documentCenter.vue'),
		readRepoFile('cool-admin-vue/src/modules/performance/views/office/knowledgeBase.vue'),
		readRepoFile('cool-admin-vue/src/modules/performance/views/indicator-library/index.vue')
	]);

	assert.match(goalPage, /const GOAL_SOURCE_TYPE_DICT_KEY = 'performance\.goal\.sourceType'/);
	assert.match(goalPage, /const GOAL_PERIOD_TYPE_DICT_KEY = 'performance\.goal\.periodType'/);
	assert.match(goalPage, /const GOAL_PLAN_STATUS_DICT_KEY = 'performance\.goal\.planStatus'/);
	assert.match(goalPage, /const GOAL_REPORT_STATUS_DICT_KEY = 'performance\.goal\.reportStatus'/);
	assert.match(goalPage, /dict\.getLabel\(GOAL_PLAN_STATUS_DICT_KEY, value\)/);
	assert.match(goalPage, /dict\.getMeta\(GOAL_REPORT_STATUS_DICT_KEY, value\)\?\.tone/);
	assert.doesNotMatch(goalPage, /const goalStatusOptions = \[/);

	assert.match(
		courseLearningPage,
		/const COURSE_LEARNING_TASK_STATUS_DICT_KEY = 'performance\.courseLearning\.taskStatus'/
	);
	assert.match(
		courseLearningPage,
		/const COURSE_LEARNING_EXAM_STATUS_DICT_KEY = 'performance\.courseLearning\.examStatus'/
	);
	assert.match(
		courseLearningPage,
		/dict\.getLabel\(COURSE_LEARNING_TASK_STATUS_DICT_KEY, status\)/
	);
	assert.match(
		courseLearningPage,
		/dict\.getMeta\(COURSE_LEARNING_EXAM_STATUS_DICT_KEY, status\)\?\.tone/
	);
	assert.doesNotMatch(courseLearningPage, /const taskStatusOptions = \[/);

	assert.match(
		teacherListPage,
		/const TEACHER_COOPERATION_STATUS_DICT_KEY = 'performance\.teacherChannel\.cooperationStatus'/
	);
	assert.match(teacherListPage, /dict\.getLabel\(TEACHER_COOPERATION_STATUS_DICT_KEY, value\)/);
	assert.match(
		teacherListPage,
		/dict\.getMeta\(TEACHER_COOPERATION_STATUS_DICT_KEY, value\)\?\.tone/
	);
	assert.doesNotMatch(teacherListPage, /teacherCooperationStatusOptions/);
	assert.doesNotMatch(teacherListPage, /teacherCooperationStatusTagType/);

	assert.match(
		teacherClassPage,
		/const TEACHER_CLASS_STATUS_DICT_KEY = 'performance\.teacherChannel\.classStatus'/
	);
	assert.match(teacherClassPage, /dict\.getLabel\(TEACHER_CLASS_STATUS_DICT_KEY, value\)/);
	assert.match(teacherClassPage, /dict\.getMeta\(TEACHER_CLASS_STATUS_DICT_KEY, value\)\?\.tone/);
	assert.doesNotMatch(teacherClassPage, /teacherClassStatusOptions/);

	assert.match(
		teacherTodoPage,
		/const TEACHER_TODO_BUCKET_DICT_KEY = 'performance\.teacherChannel\.todoBucket'/
	);
	assert.match(
		teacherTodoPage,
		/const TEACHER_COOPERATION_STATUS_DICT_KEY = 'performance\.teacherChannel\.cooperationStatus'/
	);
	assert.match(teacherTodoPage, /dict\.getLabel\(TEACHER_TODO_BUCKET_DICT_KEY, value\)/);
	assert.match(
		teacherTodoPage,
		/dict\.getMeta\(TEACHER_COOPERATION_STATUS_DICT_KEY, value\)\?\.tone/
	);
	assert.doesNotMatch(teacherTodoPage, /teacherTodoBucketOptions/);

	assert.match(
		purchaseWorkspacePage,
		/const PURCHASE_ORDER_STATUS_DICT_KEY = 'performance\.purchaseOrder\.status'/
	);
	assert.match(purchaseWorkspacePage, /dict\.getLabel\(PURCHASE_ORDER_STATUS_DICT_KEY, status\)/);
	assert.match(
		purchaseWorkspacePage,
		/dict\.getMeta\(PURCHASE_ORDER_STATUS_DICT_KEY, status\)\?\.tone/
	);
	assert.doesNotMatch(purchaseWorkspacePage, /ALL_STATUS_OPTIONS/);

	assert.match(
		documentCenterPage,
		/const DOCUMENT_CENTER_CATEGORY_DICT_KEY = 'performance\.documentCenter\.category'/
	);
	assert.match(
		documentCenterPage,
		/const DOCUMENT_CENTER_FILE_TYPE_DICT_KEY = 'performance\.documentCenter\.fileType'/
	);
	assert.match(
		documentCenterPage,
		/const DOCUMENT_CENTER_STORAGE_DICT_KEY = 'performance\.documentCenter\.storage'/
	);
	assert.match(
		documentCenterPage,
		/const DOCUMENT_CENTER_CONFIDENTIALITY_DICT_KEY = 'performance\.documentCenter\.confidentiality'/
	);
	assert.match(
		documentCenterPage,
		/const DOCUMENT_CENTER_STATUS_DICT_KEY = 'performance\.documentCenter\.status'/
	);
	assert.match(documentCenterPage, /dict\.getLabel\(DOCUMENT_CENTER_CATEGORY_DICT_KEY, value\)/);
	assert.match(
		documentCenterPage,
		/dict\.getMeta\(DOCUMENT_CENTER_CONFIDENTIALITY_DICT_KEY, value\)\?\.tone/
	);
	assert.doesNotMatch(documentCenterPage, /const statusOptions: Array/);
	assert.doesNotMatch(documentCenterPage, /const categoryOptions: Array/);
	assert.doesNotMatch(documentCenterPage, /const fileTypeOptions: Array/);

	assert.match(
		knowledgeBasePage,
		/const KNOWLEDGE_BASE_STATUS_DICT_KEY = 'performance\.knowledgeBase\.status'/
	);
	assert.match(
		knowledgeBasePage,
		/const DOCUMENT_CENTER_STATUS_DICT_KEY = 'performance\.documentCenter\.status'/
	);
	assert.match(knowledgeBasePage, /dict\.getLabel\(KNOWLEDGE_BASE_STATUS_DICT_KEY, value\)/);
	assert.match(knowledgeBasePage, /dict\.getLabel\(DOCUMENT_CENTER_STATUS_DICT_KEY, value\)/);
	assert.doesNotMatch(knowledgeBasePage, /const statusOptions: Array/);

	assert.match(
		indicatorLibraryPage,
		/const INDICATOR_CATEGORY_DICT_KEY = 'performance\.indicator\.category'/
	);
	assert.match(indicatorLibraryPage, /dict\.getLabel\(INDICATOR_CATEGORY_DICT_KEY, category\)/);
	assert.doesNotMatch(indicatorLibraryPage, /const categoryOptions: Array/);
});

test('frontend remaining uni pages consume dict store and types no longer export business label helpers', async () => {
	const [
		goalListPage,
		goalDetailPage,
		goalStatusTag,
		courseLearningIndexPage,
		courseLearningDetailPage,
		teacherPage,
		teacherDetailPage,
		teacherClassPage,
		teacherTodoPage,
		indicatorPage,
		goalTypes,
		courseLearningTypes,
		teacherTypes,
		indicatorTypes
	] = await Promise.all([
		readRepoFile('cool-uni/pages/performance/goal/list.vue'),
		readRepoFile('cool-uni/pages/performance/goal/detail.vue'),
		readRepoFile('cool-uni/pages/performance/goal/components/goal-status-tag.vue'),
		readRepoFile('cool-uni/pages/performance/course-learning/index.vue'),
		readRepoFile('cool-uni/pages/performance/course-learning/detail.vue'),
		readRepoFile('cool-uni/pages/performance/teacher-channel/teacher.vue'),
		readRepoFile('cool-uni/pages/performance/teacher-channel/detail.vue'),
		readRepoFile('cool-uni/pages/performance/teacher-channel/class.vue'),
		readRepoFile('cool-uni/pages/performance/teacher-channel/todo.vue'),
		readRepoFile('cool-uni/pages/performance/indicator-library/index.vue'),
		readRepoFile('cool-uni/types/performance-goal.ts'),
		readRepoFile('cool-uni/types/performance-course-learning.ts'),
		readRepoFile('cool-uni/types/performance-teacher-channel.ts'),
		readRepoFile('cool-uni/types/performance-indicator.ts')
	]);

	assert.match(goalListPage, /const GOAL_STATUS_DICT_KEY = "performance\.goal\.status"/);
	assert.match(goalDetailPage, /const GOAL_STATUS_DICT_KEY = "performance\.goal\.status"/);
	assert.match(goalStatusTag, /const GOAL_STATUS_DICT_KEY = "performance\.goal\.status"/);
	assert.doesNotMatch(goalTypes, /goalStatusLabel|goalStatusTone/);

	assert.match(
		courseLearningIndexPage,
		/const COURSE_LEARNING_TASK_STATUS_DICT_KEY = "performance\.courseLearning\.taskStatus"/
	);
	assert.match(
		courseLearningIndexPage,
		/const COURSE_LEARNING_EXAM_STATUS_DICT_KEY = "performance\.courseLearning\.examStatus"/
	);
	assert.match(
		courseLearningIndexPage,
		/dict\.getLabel\(COURSE_LEARNING_TASK_STATUS_DICT_KEY, value\)/
	);
	assert.match(
		courseLearningDetailPage,
		/const COURSE_LEARNING_TASK_STATUS_DICT_KEY = "performance\.courseLearning\.taskStatus"/
	);
	assert.doesNotMatch(
		courseLearningTypes,
		/courseTaskStatusLabel|courseTaskStatusTone|courseExamStatusLabel|courseExamStatusTone/
	);

	assert.match(
		teacherPage,
		/const TEACHER_COOPERATION_STATUS_DICT_KEY = "performance\.teacherChannel\.cooperationStatus"/
	);
	assert.match(
		teacherDetailPage,
		/const TEACHER_COOPERATION_STATUS_DICT_KEY = "performance\.teacherChannel\.cooperationStatus"/
	);
	assert.match(
		teacherClassPage,
		/const TEACHER_CLASS_STATUS_DICT_KEY = "performance\.teacherChannel\.classStatus"/
	);
	assert.match(
		teacherTodoPage,
		/const TEACHER_TODO_BUCKET_DICT_KEY = "performance\.teacherChannel\.todoBucket"/
	);
	assert.match(
		teacherTodoPage,
		/const TEACHER_COOPERATION_STATUS_DICT_KEY = "performance\.teacherChannel\.cooperationStatus"/
	);
	assert.doesNotMatch(
		teacherTypes,
		/teacherTodoBucketLabel|teacherCooperationStatusLabel|teacherCooperationStatusTone|teacherClassStatusLabel|teacherClassStatusTone/
	);

	assert.match(
		indicatorPage,
		/const INDICATOR_CATEGORY_DICT_KEY = "performance\.indicator\.category"/
	);
	assert.match(indicatorPage, /dict\.getLabel\(INDICATOR_CATEGORY_DICT_KEY, value\)/);
	assert.doesNotMatch(indicatorTypes, /indicatorCategoryLabel/);
});
