/**
 * 文件职责：校验主题17局部 contract evidence 的允许接口、状态枚举与非目标边界。
 * 不负责校验后端真实实现或前端页面行为，只校验当前职位标准快照是否仍符合冻结范围。
 * 维护重点：新增主题17字段、接口或状态时，必须同步更新本测试与仓库 OpenAPI 主源。
 */

import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const root = "/Users/shaotongli/Documents/xuedao/performance-management-system";
const openapiPath = `${root}/docs/contracts/current/theme17-openapi.json`;
const producerPath = `${root}/docs/contracts/current/theme17-producer-contract-model.ts`;
const consumerPath = `${root}/docs/contracts/current/theme17-consumer-api-types.ts`;
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

test("normal: theme17 contract exposes only frozen endpoints", () => {
  const openapi = readOpenapi();
  const paths = Object.keys(openapi.paths).sort();

  assert.deepEqual(paths, [
    "/admin/performance/jobStandard/add",
    "/admin/performance/jobStandard/info",
    "/admin/performance/jobStandard/page",
    "/admin/performance/jobStandard/setStatus",
    "/admin/performance/jobStandard/update",
  ]);
});

test("error-boundary: theme17 status enum and pagination stay aligned", () => {
  const openapi = readOpenapi();
  const producer = readText(producerPath);
  const consumer = readText(consumerPath);

  assert.deepEqual(openapi.components.schemas.PagePagination.required, ["page", "size", "total"]);
  assert.deepEqual(openapi.components.schemas.JobStandardStatus.enum, [
    "draft",
    "active",
    "inactive",
  ]);

  for (const source of [producer, consumer]) {
    assert.match(
      source,
      /type JobStandardStatus = "draft" \| "active" \| "inactive";/
    );
    assert.match(source, /interface JobStandardPageResult[\s\S]*pagination: PagePagination;/);
    assert.match(source, /interface JobStandardStatusUpdateRequest[\s\S]*status: JobStandardStatus;/);
  }
});

test("boundary: non-goal routes and fields stay excluded from theme17 detail contract", () => {
  const openapiText = readText(openapiPath);
  const producer = readText(producerPath);
  const consumer = readText(consumerPath);
  const combined = `${openapiText}\n${producer}\n${consumer}`;

  for (const forbiddenText of [
    "/admin/performance/jobStandard/delete",
    "salaryRange",
    "resumeContent",
    "interviewComment",
    "hiringDecision",
    "recruitPlanList",
  ]) {
    assert.equal(
      combined.includes(forbiddenText),
      false,
      `unexpected contract evidence found: ${forbiddenText}`
    );
  }
});

test("normal: theme17 snapshot remains covered by repository openapi source", () => {
  const themeOpenapi = readOpenapi();
  const repoOpenapi = readRepoOpenapi();

  for (const route of Object.keys(themeOpenapi.paths)) {
    assert.notEqual(repoOpenapi.paths[route], undefined, `repository openapi is missing ${route}`);
  }

  for (const schemaName of [
    "PagePagination",
    "JobStandardStatus",
    "JobStandardPageQuery",
    "JobStandardRecord",
    "JobStandardSaveRequest",
    "JobStandardStatusUpdateRequest",
    "JobStandardPageResult",
  ]) {
    assert.notEqual(
      repoOpenapi.components.schemas[schemaName],
      undefined,
      `repository openapi is missing schema ${schemaName}`
    );
  }
});
