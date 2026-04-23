/**
 * performance service 运行时契约守卫测试。
 * 场景覆盖：关键服务必须通过共享 decoder 校验高价值响应，避免回退到散落的裸 Promise 强转。
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const root = new URL('../src/modules/performance/service/', import.meta.url);

async function readService(name) {
	return readFile(new URL(name, root), 'utf8');
}

test('goal ops service routes critical responses through shared goal contract decoders', async () => {
	const source = await readService('goal.ts');

	assert.match(source, /from '\.\/goal-contract'/);
	assert.match(source, /decodeGoalOpsAccessProfile/);
	assert.match(source, /decodeGoalOpsDepartmentConfig/);
	assert.match(source, /decodeGoalOpsPlanPageResult/);
	assert.match(source, /decodeGoalOpsPlanRecord/);
	assert.match(source, /decodeGoalOpsOverview/);
	assert.match(source, /decodeGoalOpsDailyFinalizeResult/);
	assert.match(source, /decodeGoalOpsReportInfo/);
});

test('assessment and pip services route list detail and action responses through shared runtime contracts', async () => {
	const [assessmentSource, pipSource] = await Promise.all([
		readService('assessment.ts'),
		readService('pip.ts')
	]);

	assert.match(assessmentSource, /from '\.\/assessment-contract'/);
	assert.match(assessmentSource, /decodeAssessmentPageResult/);
	assert.match(assessmentSource, /decodeAssessmentRecord/);
	assert.match(assessmentSource, /decodeAssessmentExportRows/);

	assert.match(pipSource, /from '\.\/pip-contract'/);
	assert.match(pipSource, /decodePipPageResult/);
	assert.match(pipSource, /decodePipRecord/);
	assert.match(pipSource, /decodePipExportRows/);
});

test('recruit plan and resume pool services route list detail and action responses through shared runtime contracts', async () => {
	const [recruitPlanSource, resumePoolSource] = await Promise.all([
		readService('recruit-plan.ts'),
		readService('resumePool.ts')
	]);

	assert.match(recruitPlanSource, /from '\.\/recruit-plan-contract'/);
	assert.match(recruitPlanSource, /decodeRecruitPlanPageResult/);
	assert.match(recruitPlanSource, /decodeRecruitPlanRecord/);
	assert.match(recruitPlanSource, /decodeRecruitPlanDeleteResult/);
	assert.match(recruitPlanSource, /decodeRecruitPlanImportResult/);
	assert.match(recruitPlanSource, /decodeRecruitPlanExportRows/);

	assert.match(resumePoolSource, /from '\.\/resume-pool-contract'/);
	assert.match(resumePoolSource, /decodeResumePoolPageResult/);
	assert.match(resumePoolSource, /decodeResumePoolRecord/);
	assert.match(resumePoolSource, /decodeResumePoolImportResult/);
	assert.match(resumePoolSource, /decodeResumePoolExportRows/);
	assert.match(resumePoolSource, /decodeResumePoolAttachmentDownloadResult/);
	assert.match(resumePoolSource, /decodeResumePoolTalentAssetConvertResult/);
	assert.match(resumePoolSource, /decodeResumePoolCreateInterviewResult/);
});

test('teacher channel core services route list and detail responses through shared teacher contract decoders', async () => {
	const [
		infoSource,
		agentSource,
		relationSource,
		conflictSource,
		dashboardSource,
		todoSource,
		classSource,
		followSource
	] = await Promise.all([
		readService('teacherInfo.ts'),
		readService('teacherAgent.ts'),
		readService('teacherAgentRelation.ts'),
		readService('teacherAttributionConflict.ts'),
		readService('teacherDashboard.ts'),
		readService('teacherTodo.ts'),
		readService('teacherClass.ts'),
		readService('teacherFollow.ts')
	]);

	assert.match(infoSource, /from '\.\/teacher-contract'/);
	assert.match(infoSource, /decodeTeacherInfoPageResult/);
	assert.match(infoSource, /decodeTeacherInfoRecord/);
	assert.match(infoSource, /decodeTeacherAttributionInfo/);
	assert.match(infoSource, /decodeTeacherAttributionRecord/);

	assert.match(agentSource, /decodeTeacherAgentPageResult/);
	assert.match(agentSource, /decodeTeacherAgentRecord/);

	assert.match(relationSource, /decodeTeacherAgentRelationPageResult/);
	assert.match(relationSource, /decodeTeacherAgentRelationRecord/);

	assert.match(conflictSource, /decodeTeacherAttributionConflictPageResult/);
	assert.match(conflictSource, /decodeTeacherAttributionConflictDetail/);
	assert.match(conflictSource, /decodeTeacherAttributionConflictRecord/);
	assert.match(conflictSource, /decodeTeacherAttributionConflictResolveResult/);

	assert.match(dashboardSource, /decodeTeacherDashboardSummary/);

	assert.match(todoSource, /decodeTeacherTodoPageResult/);

	assert.match(classSource, /decodeTeacherClassPageResult/);
	assert.match(classSource, /decodeTeacherClassRecord/);

	assert.match(followSource, /decodeTeacherFollowPageResult/);
	assert.match(followSource, /decodeTeacherFollowRecord/);
});

test('work plan service routes list detail and action responses through shared work plan contract decoders', async () => {
	const source = await readService('workPlan.ts');

	assert.match(source, /from '\.\/work-plan-contract'/);
	assert.match(source, /decodeWorkPlanPageResult/);
	assert.match(source, /decodeWorkPlanRecord/);
});

test('purchase order service routes list detail and workflow responses through shared runtime contracts', async () => {
	const source = await readService('purchase-order.ts');

	assert.match(source, /from '\.\/purchase-order-contract'/);
	assert.match(source, /decodePurchaseOrderPageResult/);
	assert.match(source, /decodePurchaseOrderRecord/);
});

test('purchase report and dashboard services route aggregate responses through shared runtime contracts', async () => {
	const [purchaseReportSource, dashboardSource] = await Promise.all([
		readService('purchase-report.ts'),
		readService('dashboard.ts')
	]);

	assert.match(purchaseReportSource, /from '\.\/purchase-report-contract'/);
	assert.match(purchaseReportSource, /decodePurchaseReportSummary/);
	assert.match(purchaseReportSource, /decodePurchaseReportTrendPoints/);
	assert.match(purchaseReportSource, /decodePurchaseReportSupplierStats/);

	assert.match(dashboardSource, /from '\.\/dashboard-contract'/);
	assert.match(dashboardSource, /decodeDashboardSummary/);
	assert.match(dashboardSource, /decodeDashboardCrossSummary/);
});

test('knowledge base service routes page graph search and qa responses through shared runtime contracts', async () => {
	const source = await readService('knowledgeBase.ts');

	assert.match(source, /from '\.\/knowledge-base-contract'/);
	assert.match(source, /decodeKnowledgeBasePageResult/);
	assert.match(source, /decodeKnowledgeBaseRecord/);
	assert.match(source, /decodeKnowledgeBaseStats/);
	assert.match(source, /decodeKnowledgeGraphSummary/);
	assert.match(source, /decodeKnowledgeSearchResult/);
	assert.match(source, /decodeKnowledgeQaListResult/);
	assert.match(source, /decodeKnowledgeQaRecord/);
});

test('job standard interview and hiring services route recruitment-chain responses through shared runtime contracts', async () => {
	const [jobStandardSource, interviewSource, hiringSource] = await Promise.all([
		readService('job-standard.ts'),
		readService('interview.ts'),
		readService('hiring.ts')
	]);

	assert.match(jobStandardSource, /from '\.\/job-standard-contract'/);
	assert.match(jobStandardSource, /decodeJobStandardPageResult/);
	assert.match(jobStandardSource, /decodeJobStandardRecord/);

	assert.match(interviewSource, /from '\.\/interview-contract'/);
	assert.match(interviewSource, /decodeInterviewPageResult/);
	assert.match(interviewSource, /decodeInterviewRecord/);

	assert.match(hiringSource, /from '\.\/hiring-contract'/);
	assert.match(hiringSource, /decodeHiringPageResult/);
	assert.match(hiringSource, /decodeHiringTransportRecord/);
});

test('indicator contract and certificate services route CRUD responses through shared runtime contracts', async () => {
	const [indicatorSource, contractSource, certificateSource] = await Promise.all([
		readService('indicator.ts'),
		readService('contract.ts'),
		readService('certificate.ts')
	]);

	assert.match(indicatorSource, /from '\.\/indicator-contract'/);
	assert.match(indicatorSource, /decodeIndicatorPageResult/);
	assert.match(indicatorSource, /decodeIndicatorRecord/);

	assert.match(contractSource, /from '\.\/contract-contract'/);
	assert.match(contractSource, /decodeContractPageResult/);
	assert.match(contractSource, /decodeContractRecord/);

	assert.match(certificateSource, /from '\.\/certificate-contract'/);
	assert.match(certificateSource, /decodeCertificatePageResult/);
	assert.match(certificateSource, /decodeCertificateRecord/);
	assert.match(certificateSource, /decodeCertificateLedgerPageResult/);
});

test('feedback meeting and document center services route key responses through shared runtime contracts', async () => {
	const [feedbackSource, meetingSource, documentCenterSource] = await Promise.all([
		readService('feedback.ts'),
		readService('meeting.ts'),
		readService('documentCenter.ts')
	]);

	assert.match(feedbackSource, /from '\.\/feedback-contract'/);
	assert.match(feedbackSource, /decodeFeedbackPageResult/);
	assert.match(feedbackSource, /decodeFeedbackTaskRecord/);
	assert.match(feedbackSource, /decodeFeedbackSummary/);
	assert.match(feedbackSource, /decodeFeedbackExportRows/);

	assert.match(meetingSource, /from '\.\/meeting-contract'/);
	assert.match(meetingSource, /decodeMeetingPageResult/);
	assert.match(meetingSource, /decodeMeetingRecord/);

	assert.match(documentCenterSource, /from '\.\/document-center-contract'/);
	assert.match(documentCenterSource, /decodeDocumentCenterPageResult/);
	assert.match(documentCenterSource, /decodeDocumentCenterRecord/);
	assert.match(documentCenterSource, /decodeDocumentCenterStats/);
});

test('supplier talent asset and salary services route key responses through shared runtime contracts', async () => {
	const [supplierSource, talentAssetSource, salarySource] = await Promise.all([
		readService('supplier.ts'),
		readService('talentAsset.ts'),
		readService('salary.ts')
	]);

	assert.match(supplierSource, /from '\.\/supplier-contract'/);
	assert.match(supplierSource, /decodeSupplierPageResult/);
	assert.match(supplierSource, /decodeSupplierRecord/);

	assert.match(talentAssetSource, /from '\.\/talent-asset-contract'/);
	assert.match(talentAssetSource, /decodeTalentAssetPageResult/);
	assert.match(talentAssetSource, /decodeTalentAssetRecord/);

	assert.match(salarySource, /from '\.\/salary-contract'/);
	assert.match(salarySource, /decodeSalaryPageResult/);
	assert.match(salarySource, /decodeSalaryRecord/);
});

test('capability course promotion and suggestion services route key responses through shared runtime contracts', async () => {
	const [capabilitySource, courseSource, promotionSource, suggestionSource] = await Promise.all([
		readService('capability.ts'),
		readService('course.ts'),
		readService('promotion.ts'),
		readService('suggestion.ts')
	]);

	assert.match(capabilitySource, /from '\.\/capability-contract'/);
	assert.match(capabilitySource, /decodeCapabilityModelPageResult/);
	assert.match(capabilitySource, /decodeCapabilityModelRecord/);
	assert.match(capabilitySource, /decodeCapabilityItemRecord/);
	assert.match(capabilitySource, /decodeCapabilityPortraitRecord/);

	assert.match(courseSource, /from '\.\/course-contract'/);
	assert.match(courseSource, /decodeCoursePageResult/);
	assert.match(courseSource, /decodeCourseRecord/);
	assert.match(courseSource, /decodeCourseEnrollmentPageResult/);

	assert.match(promotionSource, /from '\.\/promotion-contract'/);
	assert.match(promotionSource, /decodePromotionPageResult/);
	assert.match(promotionSource, /decodePromotionRecord/);

	assert.match(suggestionSource, /from '\.\/suggestion-contract'/);
	assert.match(suggestionSource, /decodeSuggestionPageResult/);
	assert.match(suggestionSource, /decodeSuggestionRecord/);
	assert.match(suggestionSource, /decodeSuggestionAcceptResult/);
});

test('asset info assignment inventory and disposal services route key responses through shared runtime contracts', async () => {
	const [assetInfoSource, assetAssignmentSource, assetInventorySource, assetDisposalSource] =
		await Promise.all([
			readService('asset-info.ts'),
			readService('asset-assignment.ts'),
			readService('asset-inventory.ts'),
			readService('asset-disposal.ts')
		]);

	assert.match(assetInfoSource, /from '\.\/asset-info-contract'/);
	assert.match(assetInfoSource, /decodeAssetInfoPageResult/);
	assert.match(assetInfoSource, /decodeAssetInfoRecord/);

	assert.match(assetAssignmentSource, /from '\.\/asset-assignment-contract'/);
	assert.match(assetAssignmentSource, /decodeAssetAssignmentPageResult/);
	assert.match(assetAssignmentSource, /decodeAssetAssignmentRecord/);

	assert.match(assetInventorySource, /from '\.\/asset-inventory-contract'/);
	assert.match(assetInventorySource, /decodeAssetInventoryPageResult/);
	assert.match(assetInventorySource, /decodeAssetInventoryRecord/);

	assert.match(assetDisposalSource, /from '\.\/asset-disposal-contract'/);
	assert.match(assetDisposalSource, /decodeAssetDisposalPageResult/);
	assert.match(assetDisposalSource, /decodeAssetDisposalRecord/);
});

test('asset maintenance procurement transfer and dashboard services route key responses through shared runtime contracts', async () => {
	const [
		assetMaintenanceSource,
		assetProcurementSource,
		assetTransferSource,
		assetDashboardSource
	] = await Promise.all([
		readService('asset-maintenance.ts'),
		readService('asset-procurement.ts'),
		readService('asset-transfer.ts'),
		readService('asset-dashboard.ts')
	]);

	assert.match(assetMaintenanceSource, /from '\.\/asset-maintenance-contract'/);
	assert.match(assetMaintenanceSource, /decodeAssetMaintenancePageResult/);
	assert.match(assetMaintenanceSource, /decodeAssetMaintenanceRecord/);

	assert.match(assetProcurementSource, /from '\.\/asset-procurement-contract'/);
	assert.match(assetProcurementSource, /decodeAssetProcurementPageResult/);
	assert.match(assetProcurementSource, /decodeAssetProcurementRecord/);

	assert.match(assetTransferSource, /from '\.\/asset-transfer-contract'/);
	assert.match(assetTransferSource, /decodeAssetTransferPageResult/);
	assert.match(assetTransferSource, /decodeAssetTransferRecord/);

	assert.match(assetDashboardSource, /from '\.\/asset-dashboard-contract'/);
	assert.match(assetDashboardSource, /decodeAssetDashboardSummary/);
});

test('asset assignment request depreciation and report services route key responses through shared runtime contracts', async () => {
	const [
		assetAssignmentRequestSource,
		assetDepreciationSource,
		assetReportSource
	] = await Promise.all([
		readService('asset-assignment-request.ts'),
		readService('asset-depreciation.ts'),
		readService('asset-report.ts')
	]);

	assert.match(assetAssignmentRequestSource, /from '\.\/asset-assignment-request-contract'/);
	assert.match(assetAssignmentRequestSource, /decodeAssetAssignmentRequestPageResult/);
	assert.match(assetAssignmentRequestSource, /decodeAssetAssignmentRequestRecord/);

	assert.match(assetDepreciationSource, /from '\.\/asset-depreciation-contract'/);
	assert.match(assetDepreciationSource, /decodeAssetDepreciationPageResult/);
	assert.match(assetDepreciationSource, /decodeAssetDepreciationSummary/);

	assert.match(assetReportSource, /from '\.\/asset-report-contract'/);
	assert.match(assetReportSource, /decodeAssetReportSummary/);
	assert.match(assetReportSource, /decodeAssetReportPageResult/);
	assert.match(assetReportSource, /decodeAssetReportExportResult/);
});

test('material catalog inbound issue and stock services route key responses through shared runtime contracts', async () => {
	const [
		materialCatalogSource,
		materialInboundSource,
		materialIssueSource,
		materialStockSource
	] = await Promise.all([
		readService('material-catalog.ts'),
		readService('material-inbound.ts'),
		readService('material-issue.ts'),
		readService('material-stock.ts')
	]);

	assert.match(materialCatalogSource, /from '\.\/material-catalog-contract'/);
	assert.match(materialCatalogSource, /decodeMaterialCatalogPageResult/);
	assert.match(materialCatalogSource, /decodeMaterialCatalogRecord/);

	assert.match(materialInboundSource, /from '\.\/material-inbound-contract'/);
	assert.match(materialInboundSource, /decodeMaterialInboundPageResult/);
	assert.match(materialInboundSource, /decodeMaterialInboundRecord/);

	assert.match(materialIssueSource, /from '\.\/material-issue-contract'/);
	assert.match(materialIssueSource, /decodeMaterialIssuePageResult/);
	assert.match(materialIssueSource, /decodeMaterialIssueRecord/);

	assert.match(materialStockSource, /from '\.\/material-stock-contract'/);
	assert.match(materialStockSource, /decodeMaterialStockPageResult/);
	assert.match(materialStockSource, /decodeMaterialStockRecord/);
});

test('teacher agent audit teacher cooperation and course exam services route key responses through shared runtime contracts', async () => {
	const [teacherAgentAuditSource, teacherCooperationSource, courseExamSource] = await Promise.all([
		readService('teacherAgentAudit.ts'),
		readService('teacherCooperation.ts'),
		readService('course-exam.ts')
	]);

	assert.match(teacherAgentAuditSource, /from '\.\/teacher-contract'/);
	assert.match(teacherAgentAuditSource, /decodeTeacherAgentAuditPageResult/);
	assert.match(teacherAgentAuditSource, /decodeTeacherAgentAuditRecord/);

	assert.match(teacherCooperationSource, /from '\.\/teacher-contract'/);
	assert.match(teacherCooperationSource, /decodeTeacherInfoRecord/);

	assert.match(courseExamSource, /from '\.\/course-exam-contract'/);
	assert.match(courseExamSource, /decodeCourseExamSummary/);
});

test('teacher attribution and course practice recite services route key responses through shared runtime contracts', async () => {
	const [teacherAttributionSource, coursePracticeSource, courseReciteSource] = await Promise.all([
		readService('teacherAttribution.ts'),
		readService('course-practice.ts'),
		readService('course-recite.ts')
	]);

	assert.match(teacherAttributionSource, /from '\.\/teacher-contract'/);
	assert.match(teacherAttributionSource, /decodeTeacherAttributionPageResult/);
	assert.match(teacherAttributionSource, /decodeTeacherAttributionInfoOrRecord/);
	assert.match(teacherAttributionSource, /decodeTeacherAttributionInfo/);

	assert.match(coursePracticeSource, /from '\.\/course-learning-contract'/);
	assert.match(coursePracticeSource, /decodeCourseLearningPageResult/);
	assert.match(coursePracticeSource, /decodeCourseLearningTaskRecord/);

	assert.match(courseReciteSource, /from '\.\/course-learning-contract'/);
	assert.match(courseReciteSource, /decodeCourseLearningPageResult/);
	assert.match(courseReciteSource, /decodeCourseLearningTaskRecord/);
});

test('course learning registry services route practice recite and exam responses through shared runtime contracts', async () => {
	const source = await readService('course-learning.ts');

	assert.match(source, /from '\.\/course-learning-contract'/);
	assert.match(source, /from '\.\/course-exam-contract'/);
	assert.match(source, /decodeCourseLearningPageResult/);
	assert.match(source, /decodeCourseLearningTaskRecord/);
	assert.match(source, /decodeCourseExamSummary/);
});

test('office ledger domain services route field-level responses through shared runtime contracts', async () => {
	const [
		annualInspectionSource,
		honorSource,
		publicityMaterialSource,
		designCollabSource,
		expressCollabSource,
		vehicleSource,
		intellectualPropertySource
	] = await Promise.all([
		readService('annualInspection.ts'),
		readService('honor.ts'),
		readService('publicityMaterial.ts'),
		readService('designCollab.ts'),
		readService('expressCollab.ts'),
		readService('vehicle.ts'),
		readService('intellectualProperty.ts')
	]);

	for (const source of [
		annualInspectionSource,
		honorSource,
		publicityMaterialSource,
		designCollabSource,
		expressCollabSource,
		vehicleSource,
		intellectualPropertySource
	]) {
		assert.match(source, /from '\.\/office-ledger-contract'/);
	}

	assert.match(annualInspectionSource, /decodeAnnualInspectionRecord/);
	assert.match(annualInspectionSource, /decodeAnnualInspectionStats/);
	assert.match(honorSource, /decodeHonorRecord/);
	assert.match(honorSource, /decodeHonorStats/);
	assert.match(publicityMaterialSource, /decodePublicityMaterialRecord/);
	assert.match(publicityMaterialSource, /decodePublicityMaterialStats/);
	assert.match(designCollabSource, /decodeDesignCollabRecord/);
	assert.match(designCollabSource, /decodeDesignCollabStats/);
	assert.match(expressCollabSource, /decodeExpressCollabRecord/);
	assert.match(expressCollabSource, /decodeExpressCollabStats/);
	assert.match(vehicleSource, /decodeVehicleRecord/);
	assert.match(vehicleSource, /decodeVehicleStats/);
	assert.match(intellectualPropertySource, /decodeIntellectualPropertyRecord/);
	assert.match(intellectualPropertySource, /decodeIntellectualPropertyStats/);
});

test('office ledger generic service routes page info and stats through shared runtime contracts', async () => {
	const source = await readService('office-ledger.ts');

	assert.match(source, /from '\.\/office-ledger-contract'/);
	assert.match(source, /decodeOfficeLedgerPageResult/);
	assert.match(source, /decodeOfficeLedgerBaseRecord/);
	assert.match(source, /decodeOfficeLedgerStats/);
});
