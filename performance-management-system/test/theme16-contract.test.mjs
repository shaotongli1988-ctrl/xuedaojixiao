/**
 * 文件职责：校验主题16局部 contract evidence 的允许接口、状态枚举、来源摘要快照与非目标边界。
 * 不负责校验后端真实实现或前端页面行为，只校验当前招聘计划快照是否仍符合冻结范围。
 * 维护重点：新增主题16字段、接口或状态时，必须同步更新本测试与仓库 OpenAPI 主源。
 */

import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const root = "/Users/shaotongli/Documents/xuedao/performance-management-system";
const openapiPath = `${root}/docs/contracts/current/theme16-openapi.json`;
const producerPath = `${root}/docs/contracts/current/theme16-producer-contract-model.ts`;
const consumerPath = `${root}/docs/contracts/current/theme16-consumer-api-types.ts`;
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

test("normal: theme16 contract exposes only frozen endpoints", () => {
  const openapi = readOpenapi();
  const paths = Object.keys(openapi.paths).sort();

  assert.deepEqual(paths, [
    "/admin/performance/recruitPlan/add",
    "/admin/performance/recruitPlan/close",
    "/admin/performance/recruitPlan/delete",
    "/admin/performance/recruitPlan/export",
    "/admin/performance/recruitPlan/import",
    "/admin/performance/recruitPlan/info",
    "/admin/performance/recruitPlan/page",
    "/admin/performance/recruitPlan/reopen",
    "/admin/performance/recruitPlan/submit",
    "/admin/performance/recruitPlan/update",
    "/admin/performance/recruitPlan/void",
  ]);
});

test("error-boundary: theme16 status enum and pagination stay aligned", () => {
  const openapi = readOpenapi();
  const producer = readText(producerPath);
  const consumer = readText(consumerPath);

  assert.deepEqual(openapi.components.schemas.PagePagination.required, ["page", "size", "total"]);
  assert.deepEqual(openapi.components.schemas.RecruitPlanStatus.enum, [
    "draft",
    "active",
    "voided",
    "closed",
  ]);

  for (const source of [producer, consumer]) {
    assert.match(
      source,
      /type RecruitPlanStatus = "draft" \| "active" \| "voided" \| "closed";/
    );
    assert.match(source, /interface RecruitPlanPageResult[\s\S]*pagination: PagePagination;/);
    assert.match(source, /interface RecruitPlanActionRequest[\s\S]*id: number;/);
  }
});

test("boundary: weak source snapshot stays present while non-goal fields stay excluded", () => {
  const openapiText = readText(openapiPath);
  const producer = readText(producerPath);
  const consumer = readText(consumerPath);
  const combined = `${openapiText}\n${producer}\n${consumer}`;

  for (const requiredText of [
    "jobStandardId",
    "jobStandardSummary",
    "jobStandardSnapshot",
  ]) {
    assert.equal(combined.includes(requiredText), true, `missing weak reference field: ${requiredText}`);
  }

  for (const forbiddenText of [
    "/admin/performance/recruitPlan/approve",
    "approvalNodes",
    "budgetDetail",
    "candidateList",
    "offerDetail",
    "interviewComment",
  ]) {
    assert.equal(
      combined.includes(forbiddenText),
      false,
      `unexpected contract evidence found: ${forbiddenText}`
    );
  }
});

test("normal: theme16 snapshot remains covered by repository openapi source", () => {
  const themeOpenapi = readOpenapi();
  const repoOpenapi = readRepoOpenapi();

  for (const route of Object.keys(themeOpenapi.paths)) {
    assert.notEqual(repoOpenapi.paths[route], undefined, `repository openapi is missing ${route}`);
  }

  for (const schemaName of [
    "PagePagination",
    "RecruitPlanStatus",
    "RecruitPlanSourceSnapshot",
    "RecruitPlanPageQuery",
    "RecruitPlanRecord",
    "RecruitPlanSaveRequest",
    "RecruitPlanActionRequest",
    "RecruitPlanDeleteResult",
    "RecruitPlanImportCellValue",
    "RecruitPlanImportRow",
    "RecruitPlanImportRequest",
    "RecruitPlanImportResult",
    "RecruitPlanExportQuery",
    "RecruitPlanExportRow",
    "RecruitPlanPageResult",
  ]) {
    assert.notEqual(
      repoOpenapi.components.schemas[schemaName],
      undefined,
      `repository openapi is missing schema ${schemaName}`
    );
  }
});
