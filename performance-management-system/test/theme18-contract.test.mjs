/**
 * 文件职责：校验主题18局部 contract evidence 的允许接口、状态枚举、来源摘要边界与隐私边界。
 * 不负责校验后端真实实现或前端页面行为，只校验当前录用快照是否仍符合冻结范围。
 * 维护重点：新增主题18字段、接口或来源摘要时，必须同步更新本测试与仓库 OpenAPI 主源。
 */

import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const root = "/Users/shaotongli/Documents/xuedao/performance-management-system";
const openapiPath = `${root}/docs/contracts/current/theme18-openapi.json`;
const producerPath = `${root}/docs/contracts/current/theme18-producer-contract-model.ts`;
const consumerPath = `${root}/docs/contracts/current/theme18-consumer-api-types.ts`;
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

test("normal: theme18 contract exposes only frozen endpoints", () => {
  const openapi = readOpenapi();
  const paths = Object.keys(openapi.paths).sort();

  assert.deepEqual(paths, [
    "/admin/performance/hiring/add",
    "/admin/performance/hiring/close",
    "/admin/performance/hiring/info",
    "/admin/performance/hiring/page",
    "/admin/performance/hiring/updateStatus",
  ]);
});

test("error-boundary: theme18 enum and action request stay aligned", () => {
  const openapi = readOpenapi();
  const producer = readText(producerPath);
  const consumer = readText(consumerPath);

  assert.deepEqual(openapi.components.schemas.PagePagination.required, ["page", "size", "total"]);
  assert.deepEqual(openapi.components.schemas.HiringStatus.enum, [
    "offered",
    "accepted",
    "rejected",
    "closed",
  ]);
  assert.deepEqual(openapi.components.schemas.HiringUpdateStatus.enum, [
    "accepted",
    "rejected",
  ]);

  for (const source of [producer, consumer]) {
    assert.match(
      source,
      /type HiringStatus = "offered" \| "accepted" \| "rejected" \| "closed";/
    );
    assert.match(source, /type HiringUpdateStatus = "accepted" \| "rejected";/);
    assert.match(source, /interface HiringStatusUpdateRequest[\s\S]*status: HiringUpdateStatus;/);
    assert.match(source, /interface HiringCloseRequest[\s\S]*closeReason: string;/);
    assert.match(source, /interface HiringPageResult[\s\S]*pagination: PagePagination;/);
  }
});

test("boundary: hiring snapshots stay summary-only and do not expose contact info", () => {
  const openapiText = readText(openapiPath);
  const producer = readText(producerPath);
  const consumer = readText(consumerPath);
  const combined = `${openapiText}\n${producer}\n${consumer}`;

  for (const requiredText of [
    "resumePoolSummary",
    "resumePoolSnapshot",
    "HiringSourceSnapshot",
    "HiringInterviewSummary",
    "sourceStatusSnapshot",
    "decisionContent",
  ]) {
    assert.equal(combined.includes(requiredText), true, `missing contract evidence: ${requiredText}`);
  }

  for (const forbiddenText of [
    "phone",
    "email",
    "resumeText",
    "attachmentBinary",
    "createEmployee",
    "syncTalentAssetStatus",
  ]) {
    assert.equal(combined.includes(forbiddenText), false, `unexpected contract evidence found: ${forbiddenText}`);
  }
});

test("normal: theme18 snapshot remains covered by repository openapi source", () => {
  const themeOpenapi = readOpenapi();
  const repoOpenapi = readRepoOpenapi();

  for (const route of Object.keys(themeOpenapi.paths)) {
    assert.notEqual(repoOpenapi.paths[route], undefined, `repository openapi is missing ${route}`);
  }

  for (const schemaName of [
    "PagePagination",
    "HiringStatus",
    "HiringSourceType",
    "HiringUpdateStatus",
    "HiringSourceSnapshot",
    "HiringInterviewSummary",
    "HiringResumePoolSummary",
    "HiringRecruitPlanSummary",
    "HiringPageQuery",
    "HiringRecord",
    "HiringSaveRequest",
    "HiringStatusUpdateRequest",
    "HiringCloseRequest",
    "HiringPageResult",
  ]) {
    assert.notEqual(
      repoOpenapi.components.schemas[schemaName],
      undefined,
      `repository openapi is missing schema ${schemaName}`
    );
  }
});
