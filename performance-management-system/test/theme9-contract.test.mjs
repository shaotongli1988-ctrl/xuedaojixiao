/**
 * 文件职责：校验主题9局部 contract evidence 的允许接口、状态枚举与非目标边界。
 * 不负责校验后端真实实现或前端页面行为，只校验当前合同快照是否仍符合冻结范围。
 * 维护重点：新增主题9字段、接口或状态时，必须同步更新本测试与仓库 OpenAPI 主源。
 */

import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const root = "/Users/shaotongli/Documents/xuedao/performance-management-system";
const openapiPath = `${root}/docs/contracts/current/theme9-openapi.json`;
const producerPath = `${root}/docs/contracts/current/theme9-producer-contract-model.ts`;
const consumerPath = `${root}/docs/contracts/current/theme9-consumer-api-types.ts`;
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

test("normal: theme9 contract exposes only frozen endpoints", () => {
  const openapi = readOpenapi();
  const paths = Object.keys(openapi.paths).sort();

  assert.deepEqual(paths, [
    "/admin/performance/meeting/add",
    "/admin/performance/meeting/checkIn",
    "/admin/performance/meeting/delete",
    "/admin/performance/meeting/info",
    "/admin/performance/meeting/page",
    "/admin/performance/meeting/update",
  ]);
});

test("error-boundary: theme9 status enum and pagination stay aligned", () => {
  const openapi = readOpenapi();
  const producer = readText(producerPath);
  const consumer = readText(consumerPath);

  assert.deepEqual(openapi.components.schemas.PagePagination.required, ["page", "size", "total"]);
  assert.deepEqual(openapi.components.schemas.MeetingStatus.enum, [
    "scheduled",
    "in_progress",
    "completed",
    "cancelled",
  ]);

  for (const source of [producer, consumer]) {
    assert.match(
      source,
      /type MeetingStatus = "scheduled" \| "in_progress" \| "completed" \| "cancelled";/
    );
    assert.match(source, /interface MeetingPageResult[\s\S]*pagination: PagePagination;/);
  }
});

test("boundary: non-goal fields stay excluded from theme9 detail contract", () => {
  const openapi = readOpenapi();
  const producer = readText(producerPath);
  const consumer = readText(consumerPath);
  const detailText = JSON.stringify(openapi.components.schemas.MeetingRecord);

  for (const forbiddenText of [
    "lastCheckInTime",
    "minutesContent",
    "commentContent",
    "participantPhone",
  ]) {
    assert.equal(
      `${detailText}\n${producer}\n${consumer}`.includes(forbiddenText),
      false,
      `unexpected contract evidence found: ${forbiddenText}`
    );
  }

  assert.equal(detailText.includes("participantIds"), false, "MeetingRecord must not expose participantIds");
});

test("normal: theme9 snapshot remains covered by repository openapi source", () => {
  const themeOpenapi = readOpenapi();
  const repoOpenapi = readRepoOpenapi();

  for (const route of Object.keys(themeOpenapi.paths)) {
    assert.notEqual(repoOpenapi.paths[route], undefined, `repository openapi is missing ${route}`);
  }

  for (const schemaName of [
    "PagePagination",
    "MeetingStatus",
    "MeetingPageQuery",
    "MeetingRecord",
    "MeetingSaveRequest",
    "MeetingPageResult",
    "MeetingCheckInRequest",
  ]) {
    assert.notEqual(
      repoOpenapi.components.schemas[schemaName],
      undefined,
      `repository openapi is missing schema ${schemaName}`
    );
  }
});
