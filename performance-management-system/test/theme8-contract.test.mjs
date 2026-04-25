/**
 * 文件职责：校验主题8局部 contract evidence 的允许接口、状态枚举、弱引用快照边界与隐私边界。
 * 不负责校验后端真实实现或前端页面行为，只校验当前面试快照是否仍符合冻结范围。
 * 维护重点：新增主题8字段、接口或来源快照时，必须同步更新本测试与仓库 OpenAPI 主源。
 */

import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const root = "/Users/shaotongli/Documents/xuedao/performance-management-system";
const openapiPath = `${root}/docs/contracts/current/theme8-openapi.json`;
const producerPath = `${root}/docs/contracts/current/theme8-producer-contract-model.ts`;
const consumerPath = `${root}/docs/contracts/current/theme8-consumer-api-types.ts`;
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

test("normal: theme8 contract exposes only frozen endpoints", () => {
  const openapi = readOpenapi();
  const paths = Object.keys(openapi.paths).sort();

  assert.deepEqual(paths, [
    "/admin/performance/interview/add",
    "/admin/performance/interview/delete",
    "/admin/performance/interview/info",
    "/admin/performance/interview/page",
    "/admin/performance/interview/update",
  ]);
});

test("error-boundary: theme8 enum and weak-reference snapshots stay aligned", () => {
  const openapi = readOpenapi();
  const producer = readText(producerPath);
  const consumer = readText(consumerPath);

  assert.deepEqual(openapi.components.schemas.PagePagination.required, ["page", "size", "total"]);
  assert.deepEqual(openapi.components.schemas.InterviewStatus.enum, [
    "scheduled",
    "completed",
    "cancelled",
  ]);
  assert.deepEqual(openapi.components.schemas.InterviewType.enum, [
    "technical",
    "behavioral",
    "manager",
    "hr",
  ]);

  for (const source of [producer, consumer]) {
    assert.match(
      source,
      /type InterviewStatus = "scheduled" \| "completed" \| "cancelled";/
    );
    assert.match(
      source,
      /type InterviewSourceResource =[\s\S]*"resumePool"[\s\S]*"talentAsset";/
    );
    assert.match(source, /interface InterviewPageResult[\s\S]*pagination: PagePagination;/);
    assert.match(source, /interface DeleteIdsRequest[\s\S]*ids: number\[];/);
  }
});

test("boundary: source snapshots stay summary-only and do not expose contact info", () => {
  const openapiText = readText(openapiPath);
  const producer = readText(producerPath);
  const consumer = readText(consumerPath);
  const combined = `${openapiText}\n${producer}\n${consumer}`;

  for (const requiredText of [
    "resumePoolSummary",
    "recruitPlanSummary",
    "InterviewSourceSnapshot",
    "talentAssetId",
    "sourceStatusSnapshot",
  ]) {
    assert.equal(combined.includes(requiredText), true, `missing contract evidence: ${requiredText}`);
  }

  for (const forbiddenText of [
    "phone",
    "email",
    "resumeText",
    "attachmentBinary",
    "createHiring",
  ]) {
    assert.equal(combined.includes(forbiddenText), false, `unexpected contract evidence found: ${forbiddenText}`);
  }
});

test("normal: theme8 snapshot remains covered by repository openapi source", () => {
  const themeOpenapi = readOpenapi();
  const repoOpenapi = readRepoOpenapi();

  for (const route of Object.keys(themeOpenapi.paths)) {
    assert.notEqual(repoOpenapi.paths[route], undefined, `repository openapi is missing ${route}`);
  }

  for (const schemaName of [
    "PagePagination",
    "DeleteIdsRequest",
    "InterviewStatus",
    "InterviewType",
    "InterviewSourceResource",
    "InterviewSourceSnapshot",
    "InterviewResumePoolSummary",
    "InterviewRecruitPlanSummary",
    "InterviewPageQuery",
    "InterviewRecord",
    "InterviewSaveRequest",
    "InterviewPageResult",
  ]) {
    assert.notEqual(
      repoOpenapi.components.schemas[schemaName],
      undefined,
      `repository openapi is missing schema ${schemaName}`
    );
  }
});
