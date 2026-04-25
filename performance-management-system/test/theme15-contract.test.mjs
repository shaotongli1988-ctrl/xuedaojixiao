/**
 * 文件职责：校验主题15局部 contract evidence 的允许接口、状态枚举、附件与弱引用边界。
 * 不负责校验后端真实实现或前端页面行为，只校验当前简历池快照是否仍符合冻结范围。
 * 维护重点：新增主题15字段、接口或状态时，必须同步更新本测试与仓库 OpenAPI 主源。
 */

import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const root = "/Users/shaotongli/Documents/xuedao/performance-management-system";
const openapiPath = `${root}/docs/contracts/current/theme15-openapi.json`;
const producerPath = `${root}/docs/contracts/current/theme15-producer-contract-model.ts`;
const consumerPath = `${root}/docs/contracts/current/theme15-consumer-api-types.ts`;
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

test("normal: theme15 contract exposes only frozen endpoints", () => {
  const openapi = readOpenapi();
  const paths = Object.keys(openapi.paths).sort();

  assert.deepEqual(paths, [
    "/admin/performance/resumePool/add",
    "/admin/performance/resumePool/convertToTalentAsset",
    "/admin/performance/resumePool/createInterview",
    "/admin/performance/resumePool/downloadAttachment",
    "/admin/performance/resumePool/export",
    "/admin/performance/resumePool/import",
    "/admin/performance/resumePool/info",
    "/admin/performance/resumePool/page",
    "/admin/performance/resumePool/update",
    "/admin/performance/resumePool/uploadAttachment",
  ]);
});

test("error-boundary: theme15 enum and import counters stay aligned", () => {
  const openapi = readOpenapi();
  const producer = readText(producerPath);
  const consumer = readText(consumerPath);

  assert.deepEqual(openapi.components.schemas.PagePagination.required, ["page", "size", "total"]);
  assert.deepEqual(openapi.components.schemas.ResumePoolStatus.enum, [
    "new",
    "screening",
    "interviewing",
    "archived",
  ]);
  assert.deepEqual(openapi.components.schemas.ResumePoolSourceType.enum, [
    "manual",
    "attachment",
    "external",
    "referral",
  ]);

  for (const source of [producer, consumer]) {
    assert.match(
      source,
      /type ResumePoolStatus = "new" \| "screening" \| "interviewing" \| "archived";/
    );
    assert.match(
      source,
      /type ResumePoolSourceType = "manual" \| "attachment" \| "external" \| "referral";/
    );
    assert.match(source, /interface ResumePoolImportResult[\s\S]*overwrittenCount: number;/);
    assert.match(source, /interface ResumePoolAttachmentDownloadResult[\s\S]*downloadUrl: string;/);
  }
});

test("boundary: attachment and weak-reference fields stay present while non-goal fields stay excluded", () => {
  const openapiText = readText(openapiPath);
  const producer = readText(producerPath);
  const consumer = readText(consumerPath);
  const combined = `${openapiText}\n${producer}\n${consumer}`;

  for (const requiredText of [
    "attachmentSummaryList",
    "recruitPlanSummary",
    "jobStandardSummary",
    "ResumePoolAttachmentDownloadResult",
    "ResumePoolCreateInterviewResult",
    "convertToTalentAsset",
  ]) {
    assert.equal(combined.includes(requiredText), true, `missing boundary evidence: ${requiredText}`);
  }

  for (const forbiddenText of [
    "/admin/performance/resumePool/delete",
    "deleteResumePool",
    "offerDetail",
    "resumeAttachmentBinary",
    "talentAssetFullRecord",
  ]) {
    assert.equal(combined.includes(forbiddenText), false, `unexpected contract evidence found: ${forbiddenText}`);
  }
});

test("normal: theme15 snapshot remains covered by repository openapi source", () => {
  const themeOpenapi = readOpenapi();
  const repoOpenapi = readRepoOpenapi();

  for (const route of Object.keys(themeOpenapi.paths)) {
    assert.notEqual(repoOpenapi.paths[route], undefined, `repository openapi is missing ${route}`);
  }

  for (const schemaName of [
    "PagePagination",
    "ResumePoolStatus",
    "ResumePoolSourceType",
    "ResumePoolAttachmentSummary",
    "ResumePoolRecruitPlanSnapshot",
    "ResumePoolJobStandardSnapshot",
    "ResumePoolReferenceSnapshot",
    "ResumePoolInterviewSourceSnapshot",
    "ResumePoolPageQuery",
    "ResumePoolRecord",
    "ResumePoolSaveRequest",
    "ResumePoolImportRequest",
    "ResumePoolImportResult",
    "ResumePoolExportQuery",
    "ResumePoolExportRow",
    "ResumePoolAttachmentDownloadResult",
    "ResumePoolActionRequest",
    "ResumePoolTalentAssetConvertResult",
    "ResumePoolCreateInterviewResult",
    "ResumePoolPageResult",
  ]) {
    assert.notEqual(
      repoOpenapi.components.schemas[schemaName],
      undefined,
      `repository openapi is missing schema ${schemaName}`
    );
  }
});
