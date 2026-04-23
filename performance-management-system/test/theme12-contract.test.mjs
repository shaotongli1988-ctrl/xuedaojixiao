/**
 * 文件职责：校验主题12局部 contract evidence 的允许接口、状态枚举和非目标边界。
 * 不负责校验后端真实实现或前端页面行为，只校验当前人才资产快照是否仍符合冻结范围。
 * 维护重点：新增主题12字段、接口或状态时，必须同步更新本测试与仓库 OpenAPI 主源。
 */

import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const root = "/Users/shaotongli/Documents/xuedao/performance-management-system";
const openapiPath = `${root}/docs/contracts/current/theme12-openapi.json`;
const producerPath = `${root}/docs/contracts/current/theme12-producer-contract-model.ts`;
const consumerPath = `${root}/docs/contracts/current/theme12-consumer-api-types.ts`;
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

test("normal: theme12 contract exposes only frozen endpoints", () => {
  const openapi = readOpenapi();
  const paths = Object.keys(openapi.paths).sort();

  assert.deepEqual(paths, [
    "/admin/performance/talentAsset/add",
    "/admin/performance/talentAsset/delete",
    "/admin/performance/talentAsset/info",
    "/admin/performance/talentAsset/page",
    "/admin/performance/talentAsset/update",
  ]);
});

test("error-boundary: theme12 enum and pagination stay aligned", () => {
  const openapi = readOpenapi();
  const producer = readText(producerPath);
  const consumer = readText(consumerPath);

  assert.deepEqual(openapi.components.schemas.PagePagination.required, ["page", "size", "total"]);
  assert.deepEqual(openapi.components.schemas.TalentAssetStatus.enum, [
    "new",
    "tracking",
    "archived",
  ]);

  for (const source of [producer, consumer]) {
    assert.match(
      source,
      /type TalentAssetStatus = "new" \| "tracking" \| "archived";/
    );
    assert.match(source, /interface TalentAssetPageResult[\s\S]*pagination: PagePagination;/);
    assert.match(source, /interface DeleteIdsRequest[\s\S]*ids: number\[];/);
  }
});

test("boundary: summary fields stay present while non-goal fields stay excluded", () => {
  const openapiText = readText(openapiPath);
  const producer = readText(producerPath);
  const consumer = readText(consumerPath);
  const combined = `${openapiText}\n${producer}\n${consumer}`;

  for (const requiredText of [
    "candidateName",
    "targetDepartmentId",
    "source",
    "tagList",
    "followUpSummary",
    "nextFollowUpDate",
    "/admin/performance/talentAsset/delete",
  ]) {
    assert.equal(combined.includes(requiredText), true, `missing contract evidence: ${requiredText}`);
  }

  for (const forbiddenText of [
    "resumeText",
    "phone",
    "email",
    "attachmentIdList",
    "convertToInterview",
    "downloadAttachment",
  ]) {
    assert.equal(combined.includes(forbiddenText), false, `unexpected contract evidence found: ${forbiddenText}`);
  }
});

test("normal: theme12 snapshot remains covered by repository openapi source", () => {
  const themeOpenapi = readOpenapi();
  const repoOpenapi = readRepoOpenapi();

  for (const route of Object.keys(themeOpenapi.paths)) {
    assert.notEqual(repoOpenapi.paths[route], undefined, `repository openapi is missing ${route}`);
  }

  for (const schemaName of [
    "PagePagination",
    "TalentAssetStatus",
    "TalentAssetPageQuery",
    "TalentAssetRecord",
    "TalentAssetSaveRequest",
    "TalentAssetPageResult",
    "DeleteIdsRequest",
  ]) {
    assert.notEqual(
      repoOpenapi.components.schemas[schemaName],
      undefined,
      `repository openapi is missing schema ${schemaName}`
    );
  }
});
