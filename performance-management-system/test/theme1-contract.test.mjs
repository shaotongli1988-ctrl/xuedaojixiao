/**
 * 文件职责：校验主题1局部 contract evidence 的允许接口、状态枚举、导出摘要和非目标边界。
 * 不负责校验后端真实实现或前端页面行为，只校验当前评估单快照是否仍符合冻结范围。
 * 维护重点：新增主题1字段、接口或导出列时，必须同步更新本测试与仓库 OpenAPI 主源。
 */

import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const root = "/Users/shaotongli/Documents/xuedao/performance-management-system";
const openapiPath = `${root}/docs/contracts/current/theme1-openapi.json`;
const producerPath = `${root}/docs/contracts/current/theme1-producer-contract-model.ts`;
const consumerPath = `${root}/docs/contracts/current/theme1-consumer-api-types.ts`;
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

test("normal: theme1 contract exposes only frozen endpoints", () => {
  const openapi = readOpenapi();
  const paths = Object.keys(openapi.paths).sort();

  assert.deepEqual(paths, [
    "/admin/performance/assessment/add",
    "/admin/performance/assessment/approve",
    "/admin/performance/assessment/delete",
    "/admin/performance/assessment/export",
    "/admin/performance/assessment/info",
    "/admin/performance/assessment/page",
    "/admin/performance/assessment/reject",
    "/admin/performance/assessment/submit",
    "/admin/performance/assessment/update",
  ]);
});

test("error-boundary: theme1 enums, delete request and export rows stay aligned", () => {
  const openapi = readOpenapi();
  const producer = readText(producerPath);
  const consumer = readText(consumerPath);

  assert.deepEqual(openapi.components.schemas.PagePagination.required, ["page", "size", "total"]);
  assert.deepEqual(openapi.components.schemas.AssessmentPageMode.enum, [
    "initiated",
    "my",
    "pending",
  ]);
  assert.deepEqual(openapi.components.schemas.AssessmentStatus.enum, [
    "draft",
    "submitted",
    "approved",
    "rejected",
  ]);

  for (const source of [producer, consumer]) {
    assert.match(
      source,
      /type AssessmentPageMode = "initiated" \| "my" \| "pending";/
    );
    assert.match(
      source,
      /type AssessmentStatus = "draft" \| "submitted" \| "approved" \| "rejected";/
    );
    assert.match(source, /interface DeleteIdsRequest[\s\S]*ids: Array<number>;/);
    assert.match(source, /interface AssessmentExportRow[\s\S]*totalScore: number;/);
    assert.match(source, /interface AssessmentPageResult[\s\S]*pagination: PagePagination;/);
  }
});

test("boundary: theme1 keeps score summary fields while excluding non-goal payloads", () => {
  const openapiText = readText(openapiPath);
  const producer = readText(producerPath);
  const consumer = readText(consumerPath);
  const combined = `${openapiText}\n${producer}\n${consumer}`;

  for (const requiredText of [
    "AssessmentScoreItem",
    "weightedScore",
    "AssessmentExportRow",
    "DeleteIdsRequest",
    "AssessmentReviewRequest",
  ]) {
    assert.equal(combined.includes(requiredText), true, `missing contract evidence: ${requiredText}`);
  }

  for (const forbiddenText of [
    "approvalInstanceId",
    "workflowNodes",
    "goalProgressList",
    "suggestionList",
    "feedbackList",
    "salaryAdjustment",
  ]) {
    assert.equal(combined.includes(forbiddenText), false, `unexpected contract evidence found: ${forbiddenText}`);
  }
});

test("normal: theme1 snapshot remains covered by repository openapi source", () => {
  const themeOpenapi = readOpenapi();
  const repoOpenapi = readRepoOpenapi();

  for (const route of Object.keys(themeOpenapi.paths)) {
    assert.notEqual(repoOpenapi.paths[route], undefined, `repository openapi is missing ${route}`);
  }

  for (const schemaName of [
    "PagePagination",
    "DeleteIdsRequest",
    "AssessmentPageMode",
    "AssessmentStatus",
    "AssessmentScoreItem",
    "AssessmentPageQuery",
    "AssessmentRecord",
    "AssessmentSaveRequest",
    "AssessmentActionRequest",
    "AssessmentReviewRequest",
    "AssessmentExportQuery",
    "AssessmentExportRow",
    "AssessmentExportRows",
    "AssessmentPageResult",
  ]) {
    assert.notEqual(
      repoOpenapi.components.schemas[schemaName],
      undefined,
      `repository openapi is missing schema ${schemaName}`
    );
  }
});
