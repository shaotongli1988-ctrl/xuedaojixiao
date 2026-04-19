/**
 * 文件职责：校验主题13局部 contract evidence 的允许接口、分页结构与非目标边界。
 * 不负责校验后端真实实现或前端页面行为，只校验当前合同快照是否仍符合冻结范围。
 * 维护重点：新增主题13字段或接口时，必须同步更新本测试与合同源，避免局部 contract drift。
 */

import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const root = "/Users/shaotongli/Documents/xuedao/performance-management-system";
const openapiPath = `${root}/docs/contracts/current/theme13-openapi.json`;
const producerPath = `${root}/docs/contracts/current/theme13-producer-contract-model.ts`;
const consumerPath = `${root}/docs/contracts/current/theme13-consumer-api-types.ts`;

function readText(path) {
  return readFileSync(path, "utf8");
}

function readOpenapi() {
  return JSON.parse(readText(openapiPath));
}

test("normal: theme13 contract exposes only frozen endpoints", () => {
  const openapi = readOpenapi();
  const paths = Object.keys(openapi.paths).sort();

  assert.deepEqual(paths, [
    "/admin/performance/capabilityItem/info",
    "/admin/performance/capabilityModel/add",
    "/admin/performance/capabilityModel/info",
    "/admin/performance/capabilityModel/page",
    "/admin/performance/capabilityModel/update",
    "/admin/performance/capabilityPortrait/info",
    "/admin/performance/certificate/add",
    "/admin/performance/certificate/info",
    "/admin/performance/certificate/issue",
    "/admin/performance/certificate/page",
    "/admin/performance/certificate/recordPage",
    "/admin/performance/certificate/update",
  ]);
});

test("error-boundary: pagination contract stays aligned across openapi and ts snapshots", () => {
  const openapi = readOpenapi();
  const producer = readText(producerPath);
  const consumer = readText(consumerPath);

  assert.deepEqual(openapi.components.schemas.PagePagination.required, ["page", "size", "total"]);

  for (const resultName of [
    "CapabilityModelPageResult",
    "CertificatePageResult",
    "CertificateLedgerPageResult",
  ]) {
    assert.match(producer, new RegExp(`interface ${resultName}[\\s\\S]*pagination: PagePagination;`));
    assert.match(consumer, new RegExp(`interface ${resultName}[\\s\\S]*pagination: PagePagination;`));
  }
});

test("boundary: non-goal resources and forbidden detail fields stay excluded", () => {
  const openapiText = readText(openapiPath);
  const producer = readText(producerPath);
  const consumer = readText(consumerPath);
  const combined = `${openapiText}\n${producer}\n${consumer}`;

  for (const forbiddenText of [
    "/admin/performance/course",
    "/admin/performance/interview",
    "/admin/performance/talentAsset",
    "attachmentUrl",
    "resume",
  ]) {
    assert.equal(
      combined.includes(forbiddenText),
      false,
      `unexpected contract evidence found: ${forbiddenText}`
    );
  }
});
