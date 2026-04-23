/**
 * 文件职责：校验主题4局部 contract evidence 的允许接口、枚举值域与非目标边界。
 * 不负责校验后端真实实现或前端页面行为，只校验当前合同快照是否仍符合冻结范围。
 * 维护重点：新增主题4字段、接口或状态时，必须同步更新本测试与仓库 OpenAPI 主源。
 */

import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const root = "/Users/shaotongli/Documents/xuedao/performance-management-system";
const openapiPath = `${root}/docs/contracts/current/theme4-openapi.json`;
const producerPath = `${root}/docs/contracts/current/theme4-producer-contract-model.ts`;
const consumerPath = `${root}/docs/contracts/current/theme4-consumer-api-types.ts`;
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

test("normal: theme4 contract exposes only frozen endpoints", () => {
  const openapi = readOpenapi();
  const paths = Object.keys(openapi.paths).sort();

  assert.deepEqual(paths, [
    "/admin/performance/indicator/add",
    "/admin/performance/indicator/delete",
    "/admin/performance/indicator/info",
    "/admin/performance/indicator/page",
    "/admin/performance/indicator/update",
  ]);
});

test("error-boundary: theme4 enums and pagination stay aligned", () => {
  const openapi = readOpenapi();
  const producer = readText(producerPath);
  const consumer = readText(consumerPath);

  assert.deepEqual(openapi.components.schemas.PagePagination.required, ["page", "size", "total"]);
  assert.deepEqual(openapi.components.schemas.IndicatorStatus.enum, [0, 1]);
  assert.deepEqual(openapi.components.schemas.IndicatorCategory.enum, [
    "assessment",
    "goal",
    "feedback",
  ]);

  for (const source of [producer, consumer]) {
    assert.match(source, /type IndicatorStatus = 0 \| 1;/);
    assert.match(source, /interface IndicatorPageResult[\s\S]*pagination: PagePagination;/);
  }
});

test("boundary: non-goal resources and forbidden fields stay excluded", () => {
  const combined = `${readText(openapiPath)}\n${readText(producerPath)}\n${readText(consumerPath)}`;

  for (const forbiddenText of [
    "/admin/performance/assessment",
    "/admin/performance/feedback",
    "feedbackUserIds",
    "grade",
    "relationType",
  ]) {
    assert.equal(combined.includes(forbiddenText), false, `unexpected contract evidence found: ${forbiddenText}`);
  }
});

test("normal: theme4 snapshot remains covered by repository openapi source", () => {
  const themeOpenapi = readOpenapi();
  const repoOpenapi = readRepoOpenapi();

  for (const route of Object.keys(themeOpenapi.paths)) {
    assert.notEqual(repoOpenapi.paths[route], undefined, `repository openapi is missing ${route}`);
  }

  for (const schemaName of [
    "PagePagination",
    "IndicatorCategory",
    "IndicatorApplyScope",
    "IndicatorStatus",
    "IndicatorPageQuery",
    "IndicatorRecord",
    "IndicatorSaveRequest",
    "IndicatorPageResult",
  ]) {
    assert.notEqual(
      repoOpenapi.components.schemas[schemaName],
      undefined,
      `repository openapi is missing schema ${schemaName}`
    );
  }
});
