/**
 * 文件职责：校验主题23局部 contract evidence 的允许接口、状态枚举、日报闭环结构和非目标边界。
 * 不负责校验后端真实实现或前端页面行为，只校验当前目标与目标运营台快照是否仍符合冻结范围。
 * 维护重点：新增 goal / goal ops 字段、接口或日报结构时，必须同步更新本测试与仓库 OpenAPI 主源。
 */

import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const root = "/Users/shaotongli/Documents/xuedao/performance-management-system";
const openapiPath = `${root}/docs/contracts/current/theme23-openapi.json`;
const producerPath = `${root}/docs/contracts/current/theme23-producer-contract-model.ts`;
const consumerPath = `${root}/docs/contracts/current/theme23-consumer-api-types.ts`;
const repoOpenapiPath = "/Users/shaotongli/Documents/xuedao/contracts/openapi/xuedao.openapi.json";

function readText(path) {
  return readFileSync(path, "utf8");
}

function readOpenapi() {
  return JSON.parse(readText(openapiPath));
}

function readRepoOpenapi() {
  return JSON.parse(readText(repoOpenapiPath));
}

test("normal: theme23 contract exposes only frozen endpoints", () => {
  const openapi = readOpenapi();
  const paths = Object.keys(openapi.paths).sort();

  assert.deepEqual(paths, [
    "/admin/performance/goal/add",
    "/admin/performance/goal/delete",
    "/admin/performance/goal/export",
    "/admin/performance/goal/info",
    "/admin/performance/goal/opsAccessProfile",
    "/admin/performance/goal/opsDailyFinalize",
    "/admin/performance/goal/opsDailySubmit",
    "/admin/performance/goal/opsDepartmentConfig",
    "/admin/performance/goal/opsDepartmentConfigSave",
    "/admin/performance/goal/opsOverview",
    "/admin/performance/goal/opsPlanDelete",
    "/admin/performance/goal/opsPlanInfo",
    "/admin/performance/goal/opsPlanPage",
    "/admin/performance/goal/opsPlanSave",
    "/admin/performance/goal/opsReportGenerate",
    "/admin/performance/goal/opsReportInfo",
    "/admin/performance/goal/opsReportStatusUpdate",
    "/admin/performance/goal/page",
    "/admin/performance/goal/progressUpdate",
    "/admin/performance/goal/update",
  ]);
});

test("error-boundary: theme23 enums and daily-submit contract stay aligned", () => {
  const openapi = readOpenapi();
  const producer = readText(producerPath);
  const consumer = readText(consumerPath);

  assert.deepEqual(openapi.components.schemas.PagePagination.required, ["page", "size", "total"]);
  assert.deepEqual(openapi.components.schemas.GoalStatus.enum, [
    "draft",
    "in-progress",
    "completed",
    "cancelled",
  ]);
  assert.deepEqual(openapi.components.schemas.GoalOpsPeriodType.enum, ["day", "week", "month"]);
  assert.deepEqual(openapi.components.schemas.GoalOpsSourceType.enum, ["public", "personal"]);
  assert.deepEqual(openapi.components.schemas.GoalOpsPlanStatus.enum, [
    "assigned",
    "submitted",
    "auto_zero",
  ]);
  assert.deepEqual(openapi.components.schemas.GoalOpsReportStatus.enum, [
    "generated",
    "sent",
    "intercepted",
    "delayed",
  ]);
  assert.deepEqual(openapi.components.schemas.GoalOpsAccessProfile.required, [
    "departmentId",
    "activePersonaKey",
    "roleKind",
    "scopeKey",
    "isHr",
    "canManageDepartment",
    "canMaintainPersonalPlan",
    "manageableDepartmentIds",
  ]);
  assert.deepEqual(openapi.components.schemas.GoalOpsAccessProfile.properties.roleKind.enum, [
    "employee",
    "manager",
    "hr",
    "readonly",
    "unsupported",
  ]);
  assert.deepEqual(openapi.components.schemas.GoalOpsAccessProfile.properties.scopeKey.enum, [
    "self",
    "department",
    "company",
  ]);

  for (const source of [producer, consumer]) {
    assert.match(
      source,
      /type GoalStatus = "draft" \| "in-progress" \| "completed" \| "cancelled";/
    );
    assert.match(source, /type GoalOpsPeriodType = "day" \| "week" \| "month";/);
    assert.match(source, /type GoalOpsSourceType = "public" \| "personal";/);
    assert.match(
      source,
      /type GoalOpsPlanStatus = "assigned" \| "submitted" \| "auto_zero";/
    );
    assert.match(
      source,
      /type GoalOpsReportStatus = "generated" \| "sent" \| "intercepted" \| "delayed";/
    );
    assert.match(source, /interface DeleteIdsRequest[\s\S]*ids: Array<number>;/);
    assert.match(
      source,
      /interface GoalOpsDailySubmitRequest[\s\S]*items: Array<GoalOpsDailyResultItem>;/
    );
    assert.match(
      source,
      /interface GoalOpsOverview[\s\S]*departmentSummary: GoalOpsDepartmentSummary;[\s\S]*leaderboard: GoalOpsLeaderboard;[\s\S]*rows: Array<GoalOpsOverviewRow>;/
    );
    assert.match(
      source,
      /interface GoalOpsAccessProfile[\s\S]*activePersonaKey: string \| null;[\s\S]*roleKind: "employee" \| "manager" \| "hr" \| "readonly" \| "unsupported";[\s\S]*scopeKey: "self" \| "department" \| "company";/
    );
  }
});

test("boundary: theme23 keeps goal ops report and contribution structures while excluding non-goal payloads", () => {
  const openapiText = readText(openapiPath);
  const producer = readText(producerPath);
  const consumer = readText(consumerPath);
  const combined = `${openapiText}\n${producer}\n${consumer}`;

  for (const requiredText of [
    "GoalProgressRecord",
    "GoalOpsPlanSaveRequest",
    "GoalOpsOverview",
    "GoalOpsReportInfo",
    "GoalOpsReportSummary",
    "GoalOpsDailySubmitRequest",
    "GoalOpsDailyFinalizeResult",
  ]) {
    assert.equal(combined.includes(requiredText), true, `missing contract evidence: ${requiredText}`);
  }

  for (const forbiddenText of [
    "assessmentId",
    "feedbackSummary",
    "salaryAdjustment",
    "hiringDecision",
    "resumePoolSummary",
    "promotionReview",
  ]) {
    assert.equal(combined.includes(forbiddenText), false, `unexpected contract evidence found: ${forbiddenText}`);
  }
});

test("normal: theme23 snapshot remains covered by repository openapi source", () => {
  const themeOpenapi = readOpenapi();
  const repoOpenapi = readRepoOpenapi();

  for (const route of Object.keys(themeOpenapi.paths)) {
    assert.notEqual(repoOpenapi.paths[route], undefined, `repository openapi is missing ${route}`);
  }

  for (const schemaName of [
    "PagePagination",
    "DeleteIdsRequest",
    "GoalStatus",
    "GoalProgressRecord",
    "GoalRecord",
    "GoalPageQuery",
    "GoalCreateRequest",
    "GoalUpdateRequest",
    "GoalProgressUpdateRequest",
    "GoalExportQuery",
    "GoalExportRow",
    "GoalExportRows",
    "GoalPageResult",
    "GoalOpsPeriodType",
    "GoalOpsSourceType",
    "GoalOpsPlanStatus",
    "GoalOpsReportStatus",
    "GoalOpsDepartmentConfig",
    "GoalOpsAccessProfile",
    "GoalOpsPlanPageQuery",
    "GoalOpsPlanRecord",
    "GoalOpsPlanSaveRequest",
    "GoalOpsPlanPageResult",
    "GoalOpsOverviewRow",
    "GoalOpsDepartmentSummary",
    "GoalOpsLeaderboard",
    "GoalOpsOverview",
    "GoalOpsReportAutoZeroEmployee",
    "GoalOpsReportSummary",
    "GoalOpsReportInfo",
    "GoalOpsDailyResultItem",
    "GoalOpsDailySubmitRequest",
    "GoalOpsDailyFinalizeRequest",
    "GoalOpsDailyFinalizeResult",
    "GoalOpsOverviewQuery",
    "GoalOpsReportQuery",
    "GoalOpsReportGenerateRequest",
    "GoalOpsReportStatusUpdateRequest",
  ]) {
    assert.notEqual(
      repoOpenapi.components.schemas[schemaName],
      undefined,
      `repository openapi is missing schema ${schemaName}`
    );
  }
});
