#!/usr/bin/env node

/**
 * 守卫 performance 前端领域模型 wrapper，要求实体模型只能来自 OpenAPI generated 契约。
 * 不负责修复业务代码，也不替代更大范围的 API/类型漂移扫描。
 * 依赖仓库内固定的 generated 目录与 wrapper 文件布局。
 * 维护重点：只阻断 wrapper 层重新手写 Record/PageResult/Status 这类平级领域模型。
 */

import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(scriptDir, '..');

const wrapperTargets = [
	...fs
		.readdirSync(path.join(repoRoot, 'cool-uni/types'))
		.filter(name => /^performance-.*\.ts$/.test(name))
		.map(name => path.join(repoRoot, 'cool-uni/types', name))
];
const adminPerformanceTypesFile = path.join(
	repoRoot,
	'cool-admin-vue/src/modules/performance/types.ts'
);
const adminCourseLearningTypesFile = path.join(
	repoRoot,
	'cool-admin-vue/src/modules/performance/course-learning.types.ts'
);
const adminDashboardDtoFile = path.join(
	repoRoot,
	'cool-admin-vue/src/modules/performance/views/dashboard/types/dashboard.dto.ts'
);
const performanceSharedErrorMessageFile = path.join(
	repoRoot,
	'cool-admin-vue/src/modules/performance/views/shared/error-message.ts'
);
const performanceSharedLookupWarningFile = path.join(
	repoRoot,
	'cool-admin-vue/src/modules/performance/views/shared/lookup-warning.ts'
);
const performanceRolesCatalogFile = path.join(
	repoRoot,
	'cool-admin-midway/src/modules/performance/domain/roles/catalog.ts'
);
const performanceServiceDir = path.join(repoRoot, 'cool-admin-vue/src/modules/performance/service');
const performanceComponentsDir = path.join(
	repoRoot,
	'cool-admin-vue/src/modules/performance/components'
);
const performanceViewsDir = path.join(repoRoot, 'cool-admin-vue/src/modules/performance/views');
const coolUniPerformanceServiceDir = path.join(repoRoot, 'cool-uni/service/performance');
const forbiddenLocalInterfacePattern =
	/^\s*(?:export\s+)?interface\s+([A-Za-z0-9]+(?:ViewRecord|LocalSourceSnapshot|FormModel|QaFormModel))\b/m;
const forbiddenLocalTypePattern =
	/^\s*(?:export\s+)?type\s+([A-Za-z0-9]+(?:ViewRecord|LocalSourceSnapshot|FormModel|QaFormModel))\s*=/m;
const forbiddenSharedTypeNames = [
	'AssetOption',
	'AssessmentFormRecord',
	'DepartmentOption',
	'GoalOpsTrendRow',
	'LookupErrorHandler',
	'MaterialOption',
	'PerformanceAccessContext',
	'PerformancePersonaOption',
	'PurchaseReportQuery',
	'SupplierOption',
	'UserOption'
];
const coolUniServiceLocalModelPattern =
	/^\s*(?:export\s+)?(?:interface|type)\s+([A-Za-z0-9]+(?:Record|Summary|PageResult))\b/m;
const coolUniServiceInlineDtoPattern =
	/^\s*([A-Za-z][A-Za-z0-9_]*)\([^)]*\b(?:data|params)\??:\s*(?:\{|any\b|Record<string,\s*unknown>)/m;
const forbiddenLocalResolveErrorMessagePattern =
	/^\s*(?:export\s+)?function\s+(resolveErrorMessage)\s*\(/m;
const forbiddenLocalResolveLookupErrorMessagePattern =
	/^\s*(?:export\s+)?function\s+(resolveLookupErrorMessage)\s*\(/m;
const forbiddenLocalCreateLookupWarningHandlerPattern =
	/^\s*(?:export\s+)?function\s+(createLookupWarningHandler)\s*\(/m;
const forbiddenInlineElementWarningFromErrorPattern =
	/ElMessage\.warning\(\s*resolveErrorMessage\(\s*error\s*,/m;
const forbiddenInlineElementErrorFromErrorPattern =
	/ElMessage\.error\(\s*resolveErrorMessage\(\s*error\s*,/m;
const forbiddenLocalIsUserCancelledPattern =
	/^\s*function\s+(isUserCancelled|isUserCancelledError)\s*\(/m;
const forbiddenInlineCancelComparisonPattern =
	/error\s*={2,3}\s*'cancel'|error\s*!==\s*'cancel'|error\s*={2,3}\s*'close'/m;
const contractEnumGuardFileNames = new Set(
	fs
		.readdirSync(performanceServiceDir)
		.filter(name => name.endsWith('-contract.ts'))
);
const localContractEnumPattern = /^\s*const\s+([A-Z0-9_]+)\s*=\s*(?:\[|\{)/gm;

const interfacePattern = /^\s*export interface\s+([A-Za-z0-9]+(?:Record|PageResult))\b/m;
const statusPattern = /^\s*export type\s+([A-Za-z0-9]+Status)\s*=/m;
const allowedLocalStatusSymbols = new Set(['WorkPlanSourceStatus']);
const adminGeneratedDerivedSymbols = [
	{
		symbol: 'CapabilityModelRecord',
		expectedToken: 'GeneratedCapabilityModelRecord'
	},
	{
		symbol: 'CapabilityModelPageResult',
		expectedToken: 'GeneratedCapabilityModelPageResponse'
	},
	{
		symbol: 'CapabilityItemRecord',
		expectedToken: 'GeneratedCapabilityItemRecord'
	},
	{
		symbol: 'CapabilityPortraitRecord',
		expectedToken: 'GeneratedCapabilityPortraitRecord'
	},
	{
		symbol: 'CertificateRecord',
		expectedToken: 'GeneratedCertificateRecord'
	},
	{
		symbol: 'CertificatePageResult',
		expectedToken: 'GeneratedCertificatePageResponse'
	},
	{
		symbol: 'CertificateLedgerRecord',
		expectedToken: 'GeneratedCertificateLedgerRecord'
	},
	{
		symbol: 'CertificateLedgerPageResult',
		expectedToken: 'GeneratedCertificateLedgerPageResponse'
	},
	{
		symbol: 'ContractRecord',
		expectedToken: 'GeneratedContractRecord'
	},
	{
		symbol: 'ContractPageResult',
		expectedToken: 'GeneratedContractPageResponse'
	},
	{
		symbol: 'CourseRecord',
		expectedToken: 'GeneratedCourseRecord'
	},
	{
		symbol: 'CoursePageResult',
		expectedToken: 'GeneratedCoursePageResponse'
	},
	{
		symbol: 'CourseEnrollmentRecord',
		expectedToken: 'GeneratedCourseEnrollmentRecord'
	},
	{
		symbol: 'CourseEnrollmentPageResult',
		expectedToken: 'GeneratedCourseEnrollmentPageResponse'
	},
	{
		symbol: 'DocumentCenterRecord',
		expectedToken: 'GeneratedDocumentCenterRecord'
	},
	{
		symbol: 'DocumentCenterPageResult',
		expectedToken: 'GeneratedDocumentCenterPageResponse'
	},
	{
		symbol: 'DocumentCenterStats',
		expectedToken: 'GeneratedDocumentCenterStatsResponse'
	},
	{
		symbol: 'DashboardSummaryQuery',
		expectedToken: 'GeneratedDashboardSummaryQuery'
	},
	{
		symbol: 'DashboardStageProgressItem',
		expectedToken: 'GeneratedDashboardStageProgressItem'
	},
	{
		symbol: 'DashboardDepartmentDistributionItem',
		expectedToken: 'GeneratedDashboardDepartmentDistributionItem'
	},
	{
		symbol: 'DashboardGradeDistributionItem',
		expectedToken: 'GeneratedDashboardGradeDistributionItem'
	},
	{
		symbol: 'DashboardSummary',
		expectedToken: 'GeneratedDashboardSummaryResponse'
	},
	{
		symbol: 'DashboardCrossSummaryQuery',
		expectedToken: 'GeneratedDashboardCrossSummaryQuery'
	},
	{
		symbol: 'DashboardCrossMetricCard',
		expectedToken: 'GeneratedDashboardCrossMetricCard'
	},
	{
		symbol: 'DashboardCrossSummary',
		expectedToken: 'GeneratedDashboardCrossSummaryResponse'
	},
	{
		symbol: 'InterviewRecord',
		expectedToken: 'GeneratedInterviewRecord'
	},
	{
		symbol: 'InterviewPageResult',
		expectedToken: 'GeneratedInterviewPageResponse'
	},
	{
		symbol: 'IndicatorRecord',
		expectedToken: 'GeneratedIndicatorRecord'
	},
	{
		symbol: 'IndicatorPageResult',
		expectedToken: 'GeneratedIndicatorPageResponse'
	},
	{
		symbol: 'JobStandardRecord',
		expectedToken: 'GeneratedJobStandardRecord'
	},
	{
		symbol: 'JobStandardPageResult',
		expectedToken: 'GeneratedJobStandardPageResponse'
	},
	{
		symbol: 'KnowledgeBaseRecord',
		expectedToken: 'GeneratedKnowledgeBaseRecord'
	},
	{
		symbol: 'KnowledgeBasePageResult',
		expectedToken: 'GeneratedKnowledgeBasePageResponse'
	},
	{
		symbol: 'KnowledgeBaseStats',
		expectedToken: 'GeneratedKnowledgeBaseStatsResponse'
	},
	{
		symbol: 'KnowledgeGraphNode',
		expectedToken: 'GeneratedKnowledgeGraphNode'
	},
	{
		symbol: 'KnowledgeGraphLink',
		expectedToken: 'GeneratedKnowledgeGraphLink'
	},
	{
		symbol: 'KnowledgeGraphSummary',
		expectedToken: 'GeneratedKnowledgeGraphSummaryResponse'
	},
	{
		symbol: 'KnowledgeQaRecord',
		expectedToken: 'GeneratedKnowledgeQaRecord'
	},
	{
		symbol: 'KnowledgeSearchResult',
		expectedToken: 'GeneratedKnowledgeSearchResultResponse'
	},
	{
		symbol: 'MeetingRecord',
		expectedToken: 'GeneratedMeetingRecord'
	},
	{
		symbol: 'MeetingPageResult',
		expectedToken: 'GeneratedMeetingPageResponse'
	},
	{
		symbol: 'RecruitPlanRecord',
		expectedToken: 'GeneratedRecruitPlanRecord'
	},
	{
		symbol: 'RecruitPlanPageResult',
		expectedToken: 'GeneratedRecruitPlanPageResponse'
	},
	{
		symbol: 'ResumePoolAttachmentSummary',
		expectedToken: 'GeneratedResumePoolAttachmentSummary'
	},
	{
		symbol: 'ResumePoolRecord',
		expectedToken: 'GeneratedResumePoolRecord'
	},
	{
		symbol: 'ResumePoolPageResult',
		expectedToken: 'GeneratedResumePoolPageResponse'
	},
	{
		symbol: 'SupplierRecord',
		expectedToken: 'GeneratedSupplierRecord'
	},
	{
		symbol: 'SupplierPageResult',
		expectedToken: 'GeneratedSupplierPageResponse'
	},
	{
		symbol: 'WorkPlanAssignee',
		expectedToken: 'GeneratedWorkPlanAssignee'
	},
	{
		symbol: 'WorkPlanRecord',
		expectedToken: 'GeneratedWorkPlanRecord'
	},
	{
		symbol: 'WorkPlanPageResult',
		expectedToken: 'GeneratedWorkPlanPageResponse'
	},
	{
		symbol: 'PipTrackRecord',
		expectedToken: 'GeneratedPipTrackRecord'
	},
	{
		symbol: 'PipRecord',
		expectedToken: 'GeneratedPipRecord'
	},
	{
		symbol: 'PipPageResult',
		expectedToken: 'GeneratedPipPageResponse'
	},
	{
		symbol: 'PipExportRow',
		expectedToken: 'GeneratedPipExportRow'
	},
	{
		symbol: 'FeedbackTaskRelationItem',
		expectedToken: 'GeneratedFeedbackTaskRelationItem'
	},
	{
		symbol: 'FeedbackRecord',
		expectedToken: 'GeneratedFeedbackRecord'
	},
	{
		symbol: 'FeedbackSummary',
		expectedToken: 'GeneratedFeedbackSummaryResponse'
	},
	{
		symbol: 'FeedbackTaskRecord',
		expectedToken: 'GeneratedFeedbackTaskRecord'
	},
	{
		symbol: 'FeedbackPageResult',
		expectedToken: 'GeneratedFeedbackPageResponse'
	},
	{
		symbol: 'FeedbackExportRow',
		expectedToken: 'GeneratedFeedbackExportRow'
	},
	{
		symbol: 'HiringRecord',
		expectedToken: 'GeneratedHiringRecord'
	},
	{
		symbol: 'HiringPageResult',
		expectedToken: 'GeneratedHiringPageResponse'
	},
	{
		symbol: 'SalaryChangeRecord',
		expectedToken: 'GeneratedSalaryChangeRecord'
	},
	{
		symbol: 'SalaryRecord',
		expectedToken: 'GeneratedSalaryRecord'
	},
	{
		symbol: 'SalaryPageResult',
		expectedToken: 'GeneratedSalaryPageResponse'
	},
	{
		symbol: 'AssetInfoRecord',
		expectedToken: 'GeneratedAssetInfoRecord'
	},
	{
		symbol: 'AssetInfoPageResult',
		expectedToken: 'GeneratedAssetInfoPageResponse'
	},
	{
		symbol: 'AssetAssignmentRecord',
		expectedToken: 'GeneratedAssetAssignmentRecord'
	},
	{
		symbol: 'AssetAssignmentPageResult',
		expectedToken: 'GeneratedAssetAssignmentPageResponse'
	},
	{
		symbol: 'AssetAssignmentRequestLevel',
		expectedToken: 'GeneratedAssetAssignmentRequestLevel'
	},
	{
		symbol: 'AssetAssignmentRequestType',
		expectedToken: 'GeneratedAssetAssignmentRequestType'
	},
	{
		symbol: 'AssetAssignmentRequestStatus',
		expectedToken: 'GeneratedAssetAssignmentRequestStatus'
	},
	{
		symbol: 'AssetStatusDistributionItem',
		expectedToken: 'GeneratedAssetStatusDistributionItem'
	},
	{
		symbol: 'AssetCategoryDistributionItem',
		expectedToken: 'GeneratedAssetCategoryDistributionItem'
	},
	{
		symbol: 'AssetDashboardActivityItem',
		expectedToken: 'GeneratedAssetDashboardActivityItem'
	},
	{
		symbol: 'AssetDashboardActionSummaryItem',
		expectedToken: 'GeneratedAssetDashboardActionSummaryItem'
	},
	{
		symbol: 'AssetDashboardSummary',
		expectedToken: 'GeneratedAssetDashboardSummaryResponse'
	},
	{
		symbol: 'AssetAssignmentRequestRecord',
		expectedToken: 'GeneratedAssetAssignmentRequestRecord'
	},
	{
		symbol: 'AssetAssignmentRequestPageResult',
		expectedToken: 'GeneratedAssetAssignmentRequestPageResponse'
	},
	{
		symbol: 'AssetMaintenanceStatus',
		expectedToken: 'GeneratedAssetMaintenanceStatus'
	},
	{
		symbol: 'AssetMaintenanceRecord',
		expectedToken: 'GeneratedAssetMaintenanceRecord'
	},
	{
		symbol: 'AssetMaintenancePageResult',
		expectedToken: 'GeneratedAssetMaintenancePageResponse'
	},
	{
		symbol: 'AssetProcurementStatus',
		expectedToken: 'GeneratedAssetProcurementStatus'
	},
	{
		symbol: 'AssetProcurementRecord',
		expectedToken: 'GeneratedAssetProcurementRecord'
	},
	{
		symbol: 'AssetProcurementPageResult',
		expectedToken: 'GeneratedAssetProcurementPageResponse'
	},
	{
		symbol: 'AssetTransferStatus',
		expectedToken: 'GeneratedAssetTransferStatus'
	},
	{
		symbol: 'AssetTransferRecord',
		expectedToken: 'GeneratedAssetTransferRecord'
	},
	{
		symbol: 'AssetTransferPageResult',
		expectedToken: 'GeneratedAssetTransferPageResponse'
	},
	{
		symbol: 'AssetInventoryStatus',
		expectedToken: 'GeneratedAssetInventoryStatus'
	},
	{
		symbol: 'AssetInventoryRecord',
		expectedToken: 'GeneratedAssetInventoryRecord'
	},
	{
		symbol: 'AssetInventoryPageResult',
		expectedToken: 'GeneratedAssetInventoryPageResponse'
	},
	{
		symbol: 'AssetDepreciationSummary',
		expectedToken: 'GeneratedAssetDepreciationSummaryResponse'
	},
	{
		symbol: 'AssetDepreciationRecord',
		expectedToken: 'GeneratedAssetDepreciationRecord'
	},
	{
		symbol: 'AssetDepreciationPageResult',
		expectedToken: 'GeneratedAssetDepreciationPageResponse'
	},
	{
		symbol: 'AssetDisposalStatus',
		expectedToken: 'GeneratedAssetDisposalStatus'
	},
	{
		symbol: 'AssetDisposalRecord',
		expectedToken: 'GeneratedAssetDisposalRecord'
	},
	{
		symbol: 'AssetDisposalPageResult',
		expectedToken: 'GeneratedAssetDisposalPageResponse'
	},
	{
		symbol: 'AssetReportSummary',
		expectedToken: 'GeneratedAssetReportSummaryResponse'
	},
	{
		symbol: 'AssetReportRecord',
		expectedToken: 'GeneratedAssetReportRecord'
	},
	{
		symbol: 'AssetReportPageResult',
		expectedToken: 'GeneratedAssetReportPageResponse'
	},
	{
		symbol: 'MaterialCatalogRecord',
		expectedToken: 'GeneratedMaterialCatalogRecord'
	},
	{
		symbol: 'MaterialCatalogPageResult',
		expectedToken: 'GeneratedMaterialCatalogPageResponse'
	},
	{
		symbol: 'MaterialStockRecord',
		expectedToken: 'GeneratedMaterialStockRecord'
	},
	{
		symbol: 'MaterialStockPageResult',
		expectedToken: 'GeneratedMaterialStockPageResponse'
	},
	{
		symbol: 'MaterialInboundStatus',
		expectedToken: 'GeneratedMaterialInboundStatus'
	},
	{
		symbol: 'MaterialInboundRecord',
		expectedToken: 'GeneratedMaterialInboundRecord'
	},
	{
		symbol: 'MaterialInboundPageResult',
		expectedToken: 'GeneratedMaterialInboundPageResponse'
	},
	{
		symbol: 'MaterialIssueStatus',
		expectedToken: 'GeneratedMaterialIssueStatus'
	},
	{
		symbol: 'MaterialIssueRecord',
		expectedToken: 'GeneratedMaterialIssueRecord'
	},
	{
		symbol: 'MaterialIssuePageResult',
		expectedToken: 'GeneratedMaterialIssuePageResponse'
	},
	{
		symbol: 'PromotionReviewRecord',
		expectedToken: 'GeneratedPromotionReviewRecord'
	},
	{
		symbol: 'PromotionRecord',
		expectedToken: 'GeneratedPromotionRecord'
	},
	{
		symbol: 'PromotionPageResult',
		expectedToken: 'GeneratedPromotionPageResponse'
	},
	{
		symbol: 'PurchaseOrderItemRecord',
		expectedToken: 'GeneratedPurchaseOrderItemRecord'
	},
	{
		symbol: 'PurchaseOrderInquiryRecord',
		expectedToken: 'GeneratedPurchaseOrderInquiryRecord'
	},
	{
		symbol: 'PurchaseOrderApprovalLog',
		expectedToken: 'GeneratedPurchaseOrderApprovalLog'
	},
	{
		symbol: 'PurchaseOrderReceiptRecord',
		expectedToken: 'GeneratedPurchaseOrderReceiptRecord'
	},
	{
		symbol: 'PurchaseOrderRecord',
		expectedToken: 'GeneratedPurchaseOrderRecord'
	},
	{
		symbol: 'PurchaseOrderPageResult',
		expectedToken: 'GeneratedPurchaseOrderPageResponse'
	},
	{
		symbol: 'PurchaseReportSummary',
		expectedToken: 'GeneratedPurchaseReportSummaryResponse'
	},
	{
		symbol: 'PurchaseReportTrendPoint',
		expectedToken: 'GeneratedPurchaseReportTrendPoint'
	},
	{
		symbol: 'PurchaseReportSupplierStat',
		expectedToken: 'GeneratedPurchaseReportSupplierStat'
	},
	{
		symbol: 'SuggestionRecord',
		expectedToken: 'GeneratedSuggestionRecord'
	},
	{
		symbol: 'SuggestionPageResult',
		expectedToken: 'GeneratedSuggestionPageResponse'
	},
	{
		symbol: 'SuggestionAcceptResult',
		expectedToken: 'GeneratedSuggestionAcceptResponse'
	},
	{
		symbol: 'TalentAssetRecord',
		expectedToken: 'GeneratedTalentAssetRecord'
	},
	{
		symbol: 'TalentAssetPageResult',
		expectedToken: 'GeneratedTalentAssetPageResponse'
	},
	{
		symbol: 'TeacherAgentRecord',
		expectedToken: 'GeneratedTeacherAgentRecord'
	},
	{
		symbol: 'TeacherAgentPageResult',
		expectedToken: 'GeneratedTeacherAgentPageResponse'
	},
	{
		symbol: 'TeacherAgentRelationRecord',
		expectedToken: 'GeneratedTeacherAgentRelationRecord'
	},
	{
		symbol: 'TeacherAgentRelationPageResult',
		expectedToken: 'GeneratedTeacherAgentRelationPageResponse'
	},
	{
		symbol: 'TeacherAgentAuditRecord',
		expectedToken: 'GeneratedTeacherAgentAuditRecord'
	},
	{
		symbol: 'TeacherAgentAuditPageResult',
		expectedToken: 'GeneratedTeacherAgentAuditPageResponse'
	},
	{
		symbol: 'TeacherFollowRecord',
		expectedToken: 'GeneratedTeacherFollowRecord'
	},
	{
		symbol: 'TeacherFollowPageResult',
		expectedToken: 'GeneratedTeacherFollowPageResponse'
	},
	{
		symbol: 'TeacherClassRecord',
		expectedToken: 'GeneratedTeacherClassRecord'
	},
	{
		symbol: 'TeacherClassPageResult',
		expectedToken: 'GeneratedTeacherClassPageResponse'
	},
	{
		symbol: 'TeacherDashboardDistributionItem',
		expectedToken: 'GeneratedTeacherDashboardDistributionItem'
	},
	{
		symbol: 'TeacherDashboardSummary',
		expectedToken: 'GeneratedTeacherDashboardSummaryResponse'
	},
	{
		symbol: 'TeacherAttributionRecord',
		expectedToken: 'GeneratedTeacherAttributionRecord'
	},
	{
		symbol: 'TeacherAttributionPageResult',
		expectedToken: 'GeneratedTeacherAttributionPageResponse'
	},
	{
		symbol: 'TeacherAttributionConflictRecord',
		expectedToken: 'GeneratedTeacherAttributionConflictRecord'
	},
	{
		symbol: 'TeacherAttributionConflictDetail',
		expectedToken: 'GeneratedTeacherAttributionConflictDetailResponse'
	},
	{
		symbol: 'TeacherAttributionConflictPageResult',
		expectedToken: 'GeneratedTeacherAttributionConflictPageResponse'
	},
	{
		symbol: 'TeacherAttributionInfo',
		expectedToken: 'GeneratedTeacherAttributionInfo'
	},
	{
		symbol: 'TeacherInfoRecord',
		expectedToken: 'GeneratedTeacherInfoRecord'
	},
	{
		symbol: 'TeacherInfoPageResult',
		expectedToken: 'GeneratedTeacherInfoPageResponse'
	},
	{
		symbol: 'TeacherTodoRecord',
		expectedToken: 'GeneratedTeacherTodoRecord'
	},
	{
		symbol: 'TeacherTodoPageResult',
		expectedToken: 'GeneratedTeacherTodoPageResponse'
	}
];

const violations = [];

function assertNoLocalContractEnums(filePath) {
	if (!contractEnumGuardFileNames.has(path.basename(filePath))) {
		return;
	}

	const fileText = fs.readFileSync(filePath, 'utf8');
	for (const match of fileText.matchAll(localContractEnumPattern)) {
		violations.push({
			filePath,
			symbol: match[1],
			rule: 'performance contract adapters must reuse shared/contract-enums.ts instead of redefining local runtime enum sources'
		});
	}
}

function escapeRegExp(value) {
	return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function extractExportBlock(fileText, startPattern, endPattern) {
	const blockPattern = new RegExp(`${startPattern}([\\s\\S]*?)${endPattern}`, 'm');
	const blockMatch = fileText.match(blockPattern);
	return blockMatch ? blockMatch[1] : null;
}

function extractObjectKeys(blockText) {
	return [
		...blockText.matchAll(/(?:^|\n)\s*(?:'([^']+)'|([A-Za-z_][A-Za-z0-9_]*)):\s*\{/g)
	].map(match => match[1] || match[2]);
}

function extractStringArrayMembers(blockText) {
	return [...blockText.matchAll(/'([^']+)'/g)].map(match => match[1]);
}

function collectDuplicates(values) {
	const seen = new Set();
	const duplicates = new Set();
	for (const value of values) {
		if (seen.has(value)) {
			duplicates.add(value);
			continue;
		}
		seen.add(value);
	}
	return [...duplicates];
}

function buildExactTypeDefinitionPattern(typeName) {
	return new RegExp(
		`^\\s*(?:export\\s+)?(?:interface\\s+(${escapeRegExp(typeName)})\\b|type\\s+(${escapeRegExp(typeName)})\\s*=)`,
		'm'
	);
}

function assertNoDuplicateUnionMembers(filePath, exportName) {
	if (!fs.existsSync(filePath)) {
		return;
	}

	const fileText = fs.readFileSync(filePath, 'utf8');
	const block = extractExportBlock(
		fileText,
		`export type\\s+${escapeRegExp(exportName)}\\s*=\\n`,
		'\\n\\nexport '
	);
	if (!block) {
		return;
	}

	const members = [...block.matchAll(/\|\s+'([^']+)'/g)].map(match => match[1]);
	const seen = new Set();
	const duplicates = new Set();
	for (const member of members) {
		if (seen.has(member)) {
			duplicates.add(member);
			continue;
		}
		seen.add(member);
	}

	for (const duplicate of duplicates) {
		violations.push({
			filePath,
			symbol: duplicate,
			rule: `${exportName} must not contain duplicate union members`
		});
	}
}

function assertNoDuplicateConstKeys(filePath, constName) {
	if (!fs.existsSync(filePath)) {
		return;
	}

	const fileText = fs.readFileSync(filePath, 'utf8');
	const block = extractExportBlock(
		fileText,
		`export const\\s+${escapeRegExp(constName)}\\s*=\\s*\\[`,
		'\\n\\] as const satisfies'
	);
	if (!block) {
		return;
	}

	const keys = [...block.matchAll(/\{\s*key:\s*'([^']+)'/g)].map(match => match[1]);
	const seen = new Set();
	const duplicates = new Set();
	for (const key of keys) {
		if (seen.has(key)) {
			duplicates.add(key);
			continue;
		}
		seen.add(key);
	}

	for (const duplicate of duplicates) {
		violations.push({
			filePath,
			symbol: duplicate,
			rule: `${constName} must not contain duplicate key entries`
		});
	}
}

function assertCapabilityScopeRuleCatalogConsistency(filePath) {
	if (!fs.existsSync(filePath)) {
		return;
	}

	const fileText = fs.readFileSync(filePath, 'utf8');
	const aliasBlock = extractExportBlock(
		fileText,
		'export type\\s+PerformanceLegacyPermissionAlias\\s*=\\n',
		'\\n\\nexport type PerformanceCapabilityScopePresetKey ='
	);
	const presetBlock = extractExportBlock(
		fileText,
		'export type\\s+PerformanceCapabilityScopePresetKey\\s*=\\n',
		'\\n\\nexport type PerformanceCapabilityScopeRuleGroupKey ='
	);
	const capabilityBlock = extractExportBlock(
		fileText,
		'export const\\s+PERFORMANCE_CAPABILITIES\\s*=\\s*\\[',
		'\\n\\] as const satisfies'
	);
	const ruleBlock = extractExportBlock(
		fileText,
		'export const\\s+PERFORMANCE_CAPABILITY_SCOPE_RULE_GROUPS\\s*=\\s*\\{',
		'\\n\\} as const satisfies'
	);
	if (!aliasBlock || !presetBlock || !capabilityBlock || !ruleBlock) {
		return;
	}

	const aliasMembers = new Set(
		[...aliasBlock.matchAll(/\|\s+'([^']+)'/g)].map(match => match[1])
	);
	const presetMembers = new Set(
		[...presetBlock.matchAll(/\|\s+'([^']+)'/g)].map(match => match[1])
	);
	const capabilityMembers = new Set(
		[...capabilityBlock.matchAll(/\{\s*key:\s*'([^']+)'/g)].map(match => match[1])
	);
	const ruleCapabilityKeys = [
		...ruleBlock.matchAll(/capabilityKey:\s*'([^']+)'/g)
	].map(match => match[1]);
	const rulePresetKeys = [...ruleBlock.matchAll(/scopePreset:\s*'([^']+)'/g)].map(
		match => match[1]
	);
	const ruleAliasKeys = [
		...ruleBlock.matchAll(/legacyPermissionAliases:\s*\[(.*?)\]/gs)
	].flatMap(match =>
		[...match[1].matchAll(/'([^']+)'/g)].map(aliasMatch => aliasMatch[1])
	);

	const seenRuleCapabilities = new Set();
	const duplicateRuleCapabilities = new Set();
	for (const capabilityKey of ruleCapabilityKeys) {
		if (!capabilityMembers.has(capabilityKey)) {
			violations.push({
				filePath,
				symbol: capabilityKey,
				rule: 'capability scope rule groups must reference registered capabilities'
			});
		}
		if (seenRuleCapabilities.has(capabilityKey)) {
			duplicateRuleCapabilities.add(capabilityKey);
			continue;
		}
		seenRuleCapabilities.add(capabilityKey);
	}

	for (const duplicate of duplicateRuleCapabilities) {
		violations.push({
			filePath,
			symbol: duplicate,
			rule: 'capability scope rule groups must not duplicate capabilityKey entries'
		});
	}

	for (const presetKey of rulePresetKeys) {
		if (!presetMembers.has(presetKey)) {
			violations.push({
				filePath,
				symbol: presetKey,
				rule: 'capability scope rule groups must reference registered scope presets'
			});
		}
	}

	for (const aliasKey of ruleAliasKeys) {
		if (!aliasMembers.has(aliasKey)) {
			violations.push({
				filePath,
				symbol: aliasKey,
				rule: 'capability scope rule groups must reference registered legacy permission aliases'
			});
		}
	}
}

function assertRolesCatalogCrossReferences(filePath) {
	if (!fs.existsSync(filePath)) {
		return;
	}

	const fileText = fs.readFileSync(filePath, 'utf8');
	const personaBlock = extractExportBlock(
		fileText,
		'export const\\s+PERFORMANCE_PERSONAS\\s*=\\s*\\[',
		'\\n\\] as const satisfies'
	);
	const scopeBlock = extractExportBlock(
		fileText,
		'export const\\s+PERFORMANCE_SCOPES\\s*=\\s*\\[',
		'\\n\\] as const satisfies'
	);
	const capabilityBlock = extractExportBlock(
		fileText,
		'export const\\s+PERFORMANCE_CAPABILITIES\\s*=\\s*\\[',
		'\\n\\] as const satisfies'
	);
	const personaOptionsBlock = extractExportBlock(
		fileText,
		'export const\\s+PERFORMANCE_PERSONA_OPTIONS_BY_KEY\\s*=\\s*\\{',
		'\\n\\} as const satisfies'
	);
	const personaPriorityBlock = extractExportBlock(
		fileText,
		'export const\\s+PERFORMANCE_PERSONA_PRIORITY\\s*=\\s*\\[',
		'\\n\\] as const satisfies'
	);
	const personaWorkbenchPagesBlock = extractExportBlock(
		fileText,
		'export const\\s+PERFORMANCE_PERSONA_WORKBENCH_PAGES\\s*=\\s*\\{',
		'\\n\\} as const satisfies'
	);
	const personaRoleKindBlock = extractExportBlock(
		fileText,
		'export const\\s+PERFORMANCE_PERSONA_ROLE_KIND_BY_KEY\\s*=\\s*\\{',
		'\\n\\} as const satisfies'
	);
	const personaInferenceRulesBlock = extractExportBlock(
		fileText,
		'export const\\s+PERFORMANCE_PERSONA_INFERENCE_RULES\\s*=\\s*\\{',
		'\\n\\} as const satisfies'
	);
	const surfaceAccessRulesBlock = extractExportBlock(
		fileText,
		'export const\\s+PERFORMANCE_SURFACE_ACCESS_RULES\\s*=\\s*\\{',
		'\\n\\} as const satisfies'
	);
	const workbenchPageAccessRulesBlock = extractExportBlock(
		fileText,
		'export const\\s+PERFORMANCE_WORKBENCH_PAGE_ACCESS_RULES\\s*=\\s*\\{',
		'\\n\\} as const satisfies'
	);
	const stateGuardsBlock = extractExportBlock(
		fileText,
		'export const\\s+PERFORMANCE_STATE_GUARDS\\s*=\\s*\\[',
		'\\n\\] as const satisfies'
	);
	if (
		!personaBlock ||
		!scopeBlock ||
		!capabilityBlock ||
		!personaOptionsBlock ||
		!personaPriorityBlock ||
		!personaWorkbenchPagesBlock ||
		!personaRoleKindBlock ||
		!personaInferenceRulesBlock ||
		!surfaceAccessRulesBlock ||
		!workbenchPageAccessRulesBlock ||
		!stateGuardsBlock
	) {
		return;
	}

	const personaKeys = new Set(
		[...personaBlock.matchAll(/\{\s*key:\s*'([^']+)'/g)].map(match => match[1])
	);
	const scopeKeys = new Set(
		[...scopeBlock.matchAll(/\{\s*key:\s*'([^']+)'/g)].map(match => match[1])
	);
	const capabilityKeys = new Set(
		[...capabilityBlock.matchAll(/\{\s*key:\s*'([^']+)'/g)].map(match => match[1])
	);
	const personaOptionKeys = extractObjectKeys(personaOptionsBlock);
	const personaPriorityKeys = extractStringArrayMembers(personaPriorityBlock);
	const personaWorkbenchKeys = extractObjectKeys(personaWorkbenchPagesBlock);
	const personaWorkbenchPageIds = [
		...personaWorkbenchPagesBlock.matchAll(/:\s*\[([\s\S]*?)\]/g)
	].flatMap(match => extractStringArrayMembers(match[1]));
	const personaRoleKindKeys = extractObjectKeys(personaRoleKindBlock);
	const personaInferenceRuleKeys = extractObjectKeys(personaInferenceRulesBlock);
	const personaInferenceCapabilityKeys = [
		...personaInferenceRulesBlock.matchAll(/capabilityKeys:\s*\[([\s\S]*?)\]/g)
	].flatMap(match => extractStringArrayMembers(match[1]));
	const personaInferenceScopedCapabilityKeys = [
		...personaInferenceRulesBlock.matchAll(/scopedCapabilityKeys:\s*\[([\s\S]*?)\]/g)
	].flatMap(match => extractStringArrayMembers(match[1]));
	const personaInferenceScopeKeys = [
		...personaInferenceRulesBlock.matchAll(/scopeKeys:\s*\[([\s\S]*?)\]/g)
	].flatMap(match => extractStringArrayMembers(match[1]));
	const workbenchPageAccessKeys = extractObjectKeys(workbenchPageAccessRulesBlock);
	const workbenchPageAccessAliases = [
		...workbenchPageAccessRulesBlock.matchAll(/legacyPermissionAliases:\s*\[([\s\S]*?)\]/g)
	].flatMap(match => extractStringArrayMembers(match[1]));
	const surfaceAccessRuleKeys = extractObjectKeys(surfaceAccessRulesBlock);
	const surfaceCapabilityKeys = [
		...surfaceAccessRulesBlock.matchAll(/capabilityKeys:\s*\[([\s\S]*?)\]/g)
	].flatMap(match => extractStringArrayMembers(match[1]));
	const stateGuardCapabilityKeys = [
		...stateGuardsBlock.matchAll(/capabilityKey:\s*'([^']+)'/g)
	].map(match => match[1]);
	const stateGuardKeys = [...stateGuardsBlock.matchAll(/key:\s*'([^']+)'/g)].map(
		match => match[1]
	);

	for (const duplicate of collectDuplicates(personaOptionKeys)) {
		violations.push({
			filePath,
			symbol: duplicate,
			rule: 'persona option table must not contain duplicate persona keys'
		});
	}

	for (const duplicate of collectDuplicates(personaPriorityKeys)) {
		violations.push({
			filePath,
			symbol: duplicate,
			rule: 'persona priority list must not contain duplicate persona keys'
		});
	}

	for (const duplicate of collectDuplicates(personaWorkbenchKeys)) {
		violations.push({
			filePath,
			symbol: duplicate,
			rule: 'persona workbench table must not contain duplicate persona keys'
		});
	}

	for (const duplicate of collectDuplicates(personaRoleKindKeys)) {
		violations.push({
			filePath,
			symbol: duplicate,
			rule: 'persona role kind table must not contain duplicate persona keys'
		});
	}

	for (const duplicate of collectDuplicates(personaInferenceRuleKeys)) {
		violations.push({
			filePath,
			symbol: duplicate,
			rule: 'persona inference table must not contain duplicate persona keys'
		});
	}

	for (const duplicate of collectDuplicates(workbenchPageAccessKeys)) {
		violations.push({
			filePath,
			symbol: duplicate,
			rule: 'workbench page access rules must not contain duplicate page ids'
		});
	}

	for (const duplicate of collectDuplicates(surfaceAccessRuleKeys)) {
		violations.push({
			filePath,
			symbol: duplicate,
			rule: 'surface access rules must not contain duplicate surface keys'
		});
	}

	for (const duplicate of collectDuplicates(stateGuardKeys)) {
		violations.push({
			filePath,
			symbol: duplicate,
			rule: 'state guards must not contain duplicate guard keys'
		});
	}

	for (const key of [
		...personaOptionKeys,
		...personaPriorityKeys,
		...personaWorkbenchKeys,
		...personaRoleKindKeys,
		...personaInferenceRuleKeys
	]) {
		if (!personaKeys.has(key)) {
			violations.push({
				filePath,
				symbol: key,
				rule: 'persona metadata tables must only reference registered persona keys'
			});
		}
	}

	const workbenchPageKeySet = new Set(workbenchPageAccessKeys);
	for (const pageId of personaWorkbenchPageIds) {
		if (!workbenchPageKeySet.has(pageId)) {
			violations.push({
				filePath,
				symbol: pageId,
				rule: 'persona workbench page lists must only reference registered workbench page access rules'
			});
		}
	}

	for (const match of personaWorkbenchPagesBlock.matchAll(/:\s*\[([\s\S]*?)\]/g)) {
		for (const duplicate of collectDuplicates(extractStringArrayMembers(match[1]))) {
			violations.push({
				filePath,
				symbol: duplicate,
				rule: 'persona workbench page lists must not contain duplicate page ids'
			});
		}
	}

	for (const capabilityKey of [
		...personaInferenceCapabilityKeys,
		...personaInferenceScopedCapabilityKeys,
		...surfaceCapabilityKeys,
		...stateGuardCapabilityKeys
	]) {
		if (!capabilityKeys.has(capabilityKey)) {
			violations.push({
				filePath,
				symbol: capabilityKey,
				rule: 'roles metadata tables must only reference registered capability keys'
			});
		}
	}

	for (const scopeKey of personaInferenceScopeKeys) {
		if (!scopeKeys.has(scopeKey)) {
			violations.push({
				filePath,
				symbol: scopeKey,
				rule: 'persona inference rules must only reference registered scope keys'
			});
		}
	}

	const aliasBlock = extractExportBlock(
		fileText,
		'export type\\s+PerformanceLegacyPermissionAlias\\s*=\\n',
		'\\n\\nexport type PerformanceCapabilityScopePresetKey ='
	);
	if (aliasBlock) {
		const aliasKeys = new Set(extractStringArrayMembers(aliasBlock));
		for (const aliasKey of workbenchPageAccessAliases) {
			if (!aliasKeys.has(aliasKey)) {
				violations.push({
					filePath,
					symbol: aliasKey,
					rule: 'workbench page access rules must only reference registered legacy permission aliases'
				});
			}
		}
	}
}

function collectFilesByExtension(rootDir, extension) {
	if (!fs.existsSync(rootDir)) {
		return [];
	}

	const collected = [];
	const pending = [rootDir];

	while (pending.length) {
		const currentDir = pending.pop();
		for (const entry of fs.readdirSync(currentDir, { withFileTypes: true })) {
			const entryPath = path.join(currentDir, entry.name);
			if (entry.isDirectory()) {
				pending.push(entryPath);
				continue;
			}
			if (entry.isFile() && entry.name.endsWith(extension)) {
				collected.push(entryPath);
			}
		}
	}

	return collected;
}

function assertNoGeneratedImports(filePaths, importPathPattern, rule) {
	for (const filePath of filePaths) {
		const fileText = fs.readFileSync(filePath, 'utf8');
		const importMatches = fileText.matchAll(importPathPattern);

		for (const match of importMatches) {
			violations.push({
				filePath,
				symbol: match[1],
				rule
			});
		}
	}
}

for (const filePath of wrapperTargets) {
	if (!fs.existsSync(filePath)) {
		continue;
	}

	const fileText = fs.readFileSync(filePath, 'utf8');
	const interfaceMatch = fileText.match(interfacePattern);
	if (interfaceMatch) {
		violations.push({
			filePath,
			symbol: interfaceMatch[1],
			rule: 'wrapper files must not handwrite Record/PageResult interfaces',
		});
	}

	const statusMatch = fileText.match(statusPattern);
	if (statusMatch && !allowedLocalStatusSymbols.has(statusMatch[1])) {
		violations.push({
			filePath,
			symbol: statusMatch[1],
			rule: 'wrapper files must not handwrite Status unions',
		});
	}
}

if (fs.existsSync(adminPerformanceTypesFile)) {
	const adminTypesText = fs.readFileSync(adminPerformanceTypesFile, 'utf8');

	for (const rule of adminGeneratedDerivedSymbols) {
		const interfacePatternForSymbol = new RegExp(
			`^\\s*export interface\\s+${rule.symbol}\\b`,
			'm'
		);
		if (interfacePatternForSymbol.test(adminTypesText)) {
			violations.push({
				filePath: adminPerformanceTypesFile,
				symbol: rule.symbol,
				rule: 'admin performance types must not handwrite interface-based SSOT entities'
			});
			continue;
		}

		const typeDefinitionPattern = new RegExp(
			`export type\\s+${rule.symbol}\\s*=([\\s\\S]{0,500})`,
			'm'
		);
		const definitionMatch = adminTypesText.match(typeDefinitionPattern);
		if (!definitionMatch || !definitionMatch[1].includes(rule.expectedToken)) {
			violations.push({
				filePath: adminPerformanceTypesFile,
				symbol: rule.symbol,
				rule: `admin performance types must stay derived from ${rule.expectedToken}`
			});
		}
	}
}

if (fs.existsSync(adminCourseLearningTypesFile)) {
	const courseLearningTypesText = fs.readFileSync(adminCourseLearningTypesFile, 'utf8');
	const courseLearningRules = [
		{
			symbol: 'CourseLearningTaskType',
			expectedToken: 'GeneratedCourseLearningTaskType'
		},
		{
			symbol: 'CourseLearningTaskStatus',
			expectedToken: 'GeneratedCourseLearningTaskStatus'
		},
		{
			symbol: 'CourseExamResultStatus',
			expectedToken: 'GeneratedCourseExamResultStatus'
		},
		{
			symbol: 'CourseLearningTaskRecord',
			expectedToken: 'GeneratedCourseLearningTaskRecord'
		},
		{
			symbol: 'CourseLearningPageResult',
			expectedToken: 'GeneratedCourseLearningPageResponse'
		},
		{
			symbol: 'CourseLearningSubmitPayload',
			expectedToken: 'GeneratedCourseLearningSubmitPayload'
		},
		{
			symbol: 'CourseExamSummary',
			expectedToken: 'GeneratedCourseExamSummaryResponse'
		}
	];

	for (const rule of courseLearningRules) {
		const interfacePatternForSymbol = new RegExp(
			`^\\s*export interface\\s+${rule.symbol}\\b`,
			'm'
		);
		if (interfacePatternForSymbol.test(courseLearningTypesText)) {
			violations.push({
				filePath: adminCourseLearningTypesFile,
				symbol: rule.symbol,
				rule: 'course learning types must not handwrite interface-based SSOT entities'
			});
			continue;
		}

		const typeDefinitionPattern = new RegExp(
			`export type\\s+${rule.symbol}\\s*=([\\s\\S]{0,500})`,
			'm'
		);
		const definitionMatch = courseLearningTypesText.match(typeDefinitionPattern);
		if (!definitionMatch || !definitionMatch[1].includes(rule.expectedToken)) {
			violations.push({
				filePath: adminCourseLearningTypesFile,
				symbol: rule.symbol,
				rule: `course learning types must stay derived from ${rule.expectedToken}`
			});
		}
	}
}

const extraDerivedFileRules = [
	{
		filePath: adminDashboardDtoFile,
		entityLabel: 'dashboard dto types',
		interfaceRule: 'dashboard dto types must not handwrite interface-based SSOT entities',
		rules: [
			{
				symbol: 'DashboardScopeType',
				expectedToken: 'SsotDashboardCrossScopeType'
			},
			{
				symbol: 'DashboardMetricStatus',
				expectedToken: 'SsotDashboardCrossDataStatus'
			},
			{
				symbol: 'DashboardSummaryQueryDto',
				expectedToken: 'SsotDashboardSummaryQuery'
			},
			{
				symbol: 'DashboardCrossMetricCode',
				expectedToken: 'SsotDashboardCrossMetricCode'
			},
			{
				symbol: 'DashboardCrossSummaryQueryDto',
				expectedToken: 'SsotDashboardCrossSummaryQuery'
			},
			{
				symbol: 'DashboardSummaryResponseDto',
				expectedToken: 'SsotDashboardSummary'
			},
			{
				symbol: 'DashboardStageProgressItemDto',
				expectedToken: 'SsotDashboardStageProgressItem'
			},
			{
				symbol: 'DashboardDepartmentDistributionItemDto',
				expectedToken: 'SsotDashboardDepartmentDistributionItem'
			},
			{
				symbol: 'DashboardGradeDistributionItemDto',
				expectedToken: 'SsotDashboardGradeDistributionItem'
			},
			{
				symbol: 'DashboardCrossSummaryResponseDto',
				expectedToken: 'SsotDashboardCrossSummary'
			},
			{
				symbol: 'DashboardCrossMetricCardDto',
				expectedToken: 'SsotDashboardCrossMetricCard'
			}
		]
	}
];

for (const derivedFile of extraDerivedFileRules) {
	if (!fs.existsSync(derivedFile.filePath)) {
		continue;
	}

	const fileText = fs.readFileSync(derivedFile.filePath, 'utf8');
	for (const rule of derivedFile.rules) {
		const interfacePatternForSymbol = new RegExp(
			`^\\s*export interface\\s+${rule.symbol}\\b`,
			'm'
		);
		if (interfacePatternForSymbol.test(fileText)) {
			violations.push({
				filePath: derivedFile.filePath,
				symbol: rule.symbol,
				rule: derivedFile.interfaceRule
			});
			continue;
		}

		const typeDefinitionPattern = new RegExp(
			`export type\\s+${rule.symbol}\\s*=([\\s\\S]{0,500})`,
			'm'
		);
		const definitionMatch = fileText.match(typeDefinitionPattern);
		if (!definitionMatch || !definitionMatch[1].includes(rule.expectedToken)) {
			violations.push({
				filePath: derivedFile.filePath,
				symbol: rule.symbol,
				rule: `${derivedFile.entityLabel} must stay derived from ${rule.expectedToken}`
			});
		}
	}
}

assertNoGeneratedImports(
	collectFilesByExtension(performanceServiceDir, '.ts'),
	/from\s+['"](\.\.\/generated\/[^'"]+)['"]/g,
	'performance services must import all module domain/query types from ../types instead of ../generated'
);

assertNoGeneratedImports(
	[
		...collectFilesByExtension(performanceViewsDir, '.vue'),
		...collectFilesByExtension(performanceViewsDir, '.ts'),
		...collectFilesByExtension(performanceViewsDir, '.js')
	],
	/from\s+['"]((?:\.\.\/)+generated\/[^'"]+)['"]/g,
	'performance views must import all module domain/query types from ../../types instead of ../../generated'
);

for (const viewFilePath of [
	...collectFilesByExtension(performanceViewsDir, '.vue'),
	...collectFilesByExtension(performanceViewsDir, '.ts')
]) {
	const viewText = fs.readFileSync(viewFilePath, 'utf8');
	const localViewModelMatch =
		viewText.match(forbiddenLocalInterfacePattern) || viewText.match(forbiddenLocalTypePattern);
	if (!localViewModelMatch) {
		continue;
	}

	violations.push({
		filePath: viewFilePath,
		symbol: localViewModelMatch[1],
		rule: 'performance views must not define local ViewRecord/LocalSourceSnapshot/FormModel models; derive from ../../types instead'
	});
}

for (const filePath of [
	...collectFilesByExtension(performanceViewsDir, '.vue'),
	...collectFilesByExtension(performanceViewsDir, '.ts'),
	...collectFilesByExtension(performanceComponentsDir, '.vue'),
	...collectFilesByExtension(performanceComponentsDir, '.ts'),
	...collectFilesByExtension(performanceServiceDir, '.ts')
]) {
	const fileText = fs.readFileSync(filePath, 'utf8');
	for (const typeName of forbiddenSharedTypeNames) {
		const definitionMatch = fileText.match(buildExactTypeDefinitionPattern(typeName));
		if (!definitionMatch) {
			continue;
		}

		violations.push({
			filePath,
			symbol: definitionMatch[1] || definitionMatch[2],
			rule: 'performance shared option/access/query helper types must stay centralized in src/modules/performance/types.ts'
		});
	}
}

for (const serviceFilePath of collectFilesByExtension(performanceServiceDir, '.ts')) {
	assertNoLocalContractEnums(serviceFilePath);
}

for (const filePath of [
	...collectFilesByExtension(performanceViewsDir, '.vue'),
	...collectFilesByExtension(performanceViewsDir, '.ts'),
	...collectFilesByExtension(performanceComponentsDir, '.vue'),
	...collectFilesByExtension(performanceComponentsDir, '.ts')
]) {
	if (filePath === performanceSharedErrorMessageFile) {
		continue;
	}

	const fileText = fs.readFileSync(filePath, 'utf8');
	const resolveErrorMessageMatch = fileText.match(forbiddenLocalResolveErrorMessagePattern);
	if (!resolveErrorMessageMatch) {
		continue;
	}

	violations.push({
		filePath,
		symbol: resolveErrorMessageMatch[1],
		rule: 'performance views/components must reuse views/shared/error-message.ts instead of redefining local resolveErrorMessage helpers'
	});
}

for (const filePath of [
	...collectFilesByExtension(performanceViewsDir, '.vue'),
	...collectFilesByExtension(performanceViewsDir, '.ts'),
	...collectFilesByExtension(performanceComponentsDir, '.vue'),
	...collectFilesByExtension(performanceComponentsDir, '.ts')
]) {
	if (
		filePath === performanceSharedLookupWarningFile ||
		filePath === performanceSharedErrorMessageFile
	) {
		continue;
	}

	const fileText = fs.readFileSync(filePath, 'utf8');
	const resolveLookupErrorMessageMatch = fileText.match(
		forbiddenLocalResolveLookupErrorMessagePattern
	);
	if (resolveLookupErrorMessageMatch) {
		violations.push({
			filePath,
			symbol: resolveLookupErrorMessageMatch[1],
			rule: 'performance views/components must reuse views/shared/lookup-warning.ts instead of redefining local resolveLookupErrorMessage helpers'
		});
	}

	const createLookupWarningHandlerMatch = fileText.match(
		forbiddenLocalCreateLookupWarningHandlerPattern
	);
	if (createLookupWarningHandlerMatch) {
		violations.push({
			filePath,
			symbol: createLookupWarningHandlerMatch[1],
			rule: 'performance views/components must reuse views/shared/lookup-warning.ts instead of redefining local createLookupWarningHandler helpers'
		});
	}

	const inlineElementWarningFromErrorMatch = fileText.match(
		forbiddenInlineElementWarningFromErrorPattern
	);
	if (inlineElementWarningFromErrorMatch) {
		violations.push({
			filePath,
			symbol: 'ElMessage.warning(resolveErrorMessage(error, ...))',
			rule: 'performance views/components must reuse views/shared/error-message.ts warning helpers instead of inlining warning resolution'
		});
	}

	const inlineElementErrorFromErrorMatch = fileText.match(
		forbiddenInlineElementErrorFromErrorPattern
	);
	if (inlineElementErrorFromErrorMatch) {
		violations.push({
			filePath,
			symbol: 'ElMessage.error(resolveErrorMessage(error, ...))',
			rule: 'performance views/components must reuse views/shared/error-message.ts error helpers instead of inlining error resolution'
		});
	}

	const localIsUserCancelledMatch = fileText.match(forbiddenLocalIsUserCancelledPattern);
	if (localIsUserCancelledMatch) {
		violations.push({
			filePath,
			symbol: localIsUserCancelledMatch[1],
			rule: 'performance views/components must reuse views/shared/error-message.ts cancellation helpers instead of redefining local cancel detection'
		});
	}

	const inlineCancelComparisonMatch = fileText.match(forbiddenInlineCancelComparisonPattern);
	if (inlineCancelComparisonMatch) {
		violations.push({
			filePath,
			symbol: inlineCancelComparisonMatch[0],
			rule: 'performance views/components must reuse views/shared/error-message.ts cancellation helpers instead of comparing cancel/close sentinel values inline'
		});
	}
}

for (const serviceFilePath of collectFilesByExtension(coolUniPerformanceServiceDir, '.ts')) {
	const serviceText = fs.readFileSync(serviceFilePath, 'utf8');
	const localModelMatch = serviceText.match(coolUniServiceLocalModelPattern);
	if (!localModelMatch) {
		const inlineDtoMatch = serviceText.match(coolUniServiceInlineDtoPattern);
		if (!inlineDtoMatch) {
			continue;
		}

		violations.push({
			filePath: serviceFilePath,
			symbol: inlineDtoMatch[1],
			rule: 'cool-uni performance services must not inline data/params DTOs or any; import request/query contracts from /@/types/performance-* instead'
		});
		continue;
	}

	violations.push({
		filePath: serviceFilePath,
		symbol: localModelMatch[1],
		rule: 'cool-uni performance services must not define local Record/Summary/PageResult models; import from /@/types/performance-* instead'
	});
}

assertNoDuplicateUnionMembers(
	performanceRolesCatalogFile,
	'PerformanceLegacyPermissionAlias'
);
assertNoDuplicateConstKeys(performanceRolesCatalogFile, 'PERFORMANCE_CAPABILITIES');
assertCapabilityScopeRuleCatalogConsistency(performanceRolesCatalogFile);
assertRolesCatalogCrossReferences(performanceRolesCatalogFile);

if (violations.length) {
	console.error('[performance-domain-model-ssot] failed');
	for (const violation of violations) {
		console.error(
			`- ${path.relative(repoRoot, violation.filePath)}: ${violation.symbol} -> ${violation.rule}`
		);
	}
	process.exit(1);
}

console.log('[performance-domain-model-ssot] passed');
