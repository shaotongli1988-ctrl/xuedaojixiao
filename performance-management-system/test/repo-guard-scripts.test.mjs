/**
 * 文件职责：验证仓库本地交付守卫脚本可执行，并具备最小报告输出能力。
 * 不负责校验守卫规则是否覆盖全部业务语义，只锁定本地脚本存在且能被统一入口调用。
 * 维护重点：新增或重命名守卫脚本时，必须同步更新这里的命令矩阵。
 */

import test from "node:test";
import assert from "node:assert/strict";
import { existsSync, mkdirSync, mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { spawnSync, execFileSync } from "node:child_process";
import { pathToFileURL } from "node:url";

const repoRoot = "/Users/shaotongli/Documents/xuedao";
const scriptsRoot = `${repoRoot}/scripts`;

function run(command) {
  const result = spawnSync(command[0], command.slice(1), {
    cwd: repoRoot,
    encoding: "utf8",
  });
  return result;
}

function runInCwd(command, cwd) {
  return spawnSync(command[0], command.slice(1), {
    cwd,
    encoding: "utf8",
  });
}

function writeTempFile(root, relativePath, content) {
  const targetPath = join(root, relativePath);
  mkdirSync(join(targetPath, ".."), { recursive: true });
  writeFileSync(targetPath, content);
  return targetPath;
}

function createPackageTarball(registryRoot, packageName, version, packageJsonExtra = {}) {
  const workRoot = mkdtempSync(join(tmpdir(), `${packageName.replace(/[^a-z0-9]/gi, "-")}-`));
  const packageRoot = join(workRoot, "package");
  mkdirSync(packageRoot, { recursive: true });

  writeFileSync(
    join(packageRoot, "package.json"),
    JSON.stringify(
      {
        name: packageName,
        version,
        main: "index.js",
        ...packageJsonExtra,
      },
      null,
      2
    )
  );
  writeFileSync(join(packageRoot, "index.js"), `module.exports = "${packageName}@${version}";\n`);

  const tarballPath = join(registryRoot, `${packageName}-${version}.tgz`);
  execFileSync("tar", ["-czf", tarballPath, "-C", workRoot, "package"]);
  return tarballPath;
}

function writeRegistryMetadata(registryRoot, packageName, versions, distTag = "latest") {
  const metadata = {
    name: packageName,
    "dist-tags": {
      [distTag]: versions[versions.length - 1].version,
    },
    versions: Object.fromEntries(
      versions.map(entry => [
        entry.version,
        {
          name: packageName,
          version: entry.version,
          dependencies: entry.dependencies || {},
          optionalDependencies: entry.optionalDependencies || {},
          dist: {
            tarball: pathToFileURL(entry.tarballPath).href,
          },
        },
      ])
    ),
  };

  writeFileSync(join(registryRoot, `${packageName}.json`), JSON.stringify(metadata, null, 2));
}

test("normal: local guard scripts exist", () => {
  for (const name of [
    "rbac_alignment_guard.py",
    "state_machine_guard.py",
    "component_reuse_guard.py",
    "unified_delivery_guard.py",
    "check-environment-config-ssot.mjs",
    "check-database-schema-ssot.mjs",
    "check-mobile-shared-contract.mjs",
    "check-shared-error-semantics.mjs",
    "check-performance-contract-closure.mjs",
    "check-performance-domain-model-ssot.mjs",
    "check-xuedao-ssot-conformance.mjs",
    "sync-eps-openapi-ssot.mjs",
    "check-global-domain-ssot.mjs",
    "check-base-permission-domain-ssot.mjs",
  ]) {
    assert.equal(existsSync(`${scriptsRoot}/${name}`), true, `${name} should exist`);
  }
});

test("normal: performance openapi sync does not read generated consumer contracts", () => {
  const script = readFileSync(`${scriptsRoot}/sync-performance-openapi-ssot.mjs`, "utf8");
  assert.equal(
    script.includes("cool-admin-vue/src/modules/performance/generated"),
    false,
    "sync-performance-openapi-ssot should not treat generated consumer files as SSOT input"
  );
});

test("normal: performance openapi sync guards class heritage access before checking office wrappers", () => {
  const script = readFileSync(`${scriptsRoot}/sync-performance-openapi-ssot.mjs`, "utf8");
  assert.equal(
    script.includes("const firstHeritageClause = classNode.heritageClauses?.[0];"),
    true,
    "sync-performance-openapi-ssot should guard missing heritage clauses before office wrapper detection"
  );
  assert.equal(
    script.includes("ts.isHeritageClause(classNode.heritageClauses?.[0])"),
    false,
    "sync-performance-openapi-ssot should not call ts.isHeritageClause on an optional heritage clause directly"
  );
});

test("normal: repo consistency guard runs ssot sync stages in write mode before checks", () => {
  const script = readFileSync(`${scriptsRoot}/run-repo-consistency-guards.mjs`, "utf8");
  assert.equal(script.includes("script: 'check-xuedao-ssot-manifest.mjs'"), true);
  assert.equal(script.includes("script: 'check-xuedao-ssot-conformance.mjs'"), true);
  assert.equal(script.includes("script: 'sync-repo-openapi-ssot.mjs'"), true);
  assert.equal(script.includes("script: 'sync-performance-openapi-ssot.mjs'"), true);
  assert.equal(script.includes("script: 'openapi-contract-sync.mjs'"), true);
  assert.equal(script.includes("script: 'check-performance-contract-closure.mjs'"), true);
  assert.equal(script.includes("script: 'check-global-domain-ssot.mjs'"), true);
  assert.equal(script.includes("script: 'check-base-permission-domain-ssot.mjs'"), true);
  assert.equal(script.includes("script: 'sync-eps-openapi-ssot.mjs'"), true);
  assert.equal(script.includes("args: ['--write']"), true, "repo consistency guard should self-heal SSOT outputs before strict checks");
});

test("normal: xuedao ssot manifest loader resolves repository artifact root and command-backed paths", async () => {
  const manifestModule = await import(`${scriptsRoot}/xuedao-ssot-manifest.mjs`);
  const manifest = manifestModule.loadXuedaoSsotManifest();

  assert.equal(manifest.repository.key, "xuedao");
  assert.equal(manifest.sourceOfTruth.apiContract.sourceFile, "contracts/openapi/xuedao.openapi.json");
  assert.equal(
    manifest.sourceOfTruth.permissionBits.sourceFiles.includes(
      "cool-admin-midway/src/modules/base/domain/permissions/source.json"
    ),
    true
  );
  assert.equal(
    manifest.sourceOfTruth.performanceContractSource.sourceFiles.includes(
      "cool-admin-midway/src/modules/performance/domain/registry/contract-source.json"
    ),
    true
  );
  assert.equal(
    manifest.sourceOfTruth.performanceContractSource.sourceFiles.includes(
      "cool-admin-midway/src/modules/performance/domain/registry/contract-source.mjs"
    ),
    true
  );
  assert.equal(
    manifest.sourceOfTruth.performanceContractSource.sourceFiles.includes(
      "cool-admin-midway/src/modules/performance/domain/registry/contracts.ts"
    ),
    true
  );
  assert.equal(
    manifest.sourceOfTruth.stateMachines.sourceFiles.includes(
      "cool-admin-midway/src/modules/performance/domain/states/approval-flow.ts"
    ),
    true
  );
  assert.equal(
    manifest.sourceOfTruth.userAuthSemantics.sourceFiles.includes(
      "cool-admin-midway/src/modules/user/domain/auth/catalog.ts"
    ),
    true
  );
  assert.equal(
    manifest.sourceOfTruth.runtimeConfig.sourceFiles.includes(
      "cool-admin-midway/src/modules/base/config.ts"
    ),
    true
  );
  assert.equal(
    manifest.sourceOfTruth.mobileSharedContract.sourceFile,
    "cool-uni/types/performance-mobile.ts"
  );
  assert.equal(
    manifest.sourceOfTruth.environmentConfig.sourceFile,
    "contracts/ssot/environment-config.catalog.json"
  );
  assert.equal(
    manifest.sourceOfTruth.databaseSchema.sourceFile,
    "contracts/ssot/database-schema.catalog.json"
  );
  assert.equal(
    manifest.sourceOfTruth.menuRouteTopology.sourceFile,
    "contracts/ssot/menu-route-topology.catalog.json"
  );
  assert.equal(
    manifest.sourceOfTruth.businessDictionaries.sourceFile,
    "cool-admin-midway/src/modules/performance/domain/dicts/catalog.ts"
  );
  assert.equal(
    manifest.sourceOfTruth.dictBusinessCatalog.sourceFiles.includes(
      "cool-admin-midway/src/modules/dict/domain/dicts/catalog.ts"
    ),
    true
  );
  assert.equal(
    manifest.sourceOfTruth.sharedErrorSemantics.sourceFiles.includes(
      "cool-admin-midway/src/modules/base/domain/errors/catalog.ts"
    ),
    true
  );
  assert.equal(
    manifest.sourceOfTruth.errorCatalog.sourceFile,
    "cool-admin-midway/src/modules/performance/domain/errors/catalog.ts"
  );
  assert.equal(manifest.records.artifactRoot, "reports/delivery");
  assert.equal(
    manifestModule.extractCommandBackedPath("node ./scripts/check-unified-delivery.mjs --phase final --all"),
    "scripts/check-unified-delivery.mjs"
  );
  assert.equal(
    manifestModule.extractCommandBackedPath("node --test ./cool-admin-midway/test/user-domain-registry.test.ts"),
    "cool-admin-midway/test/user-domain-registry.test.ts"
  );
  assert.equal(
    manifestModule.extractCommandBackedPath("node --test ./cool-admin-midway/test/shared-error-semantics.test.ts"),
    "cool-admin-midway/test/shared-error-semantics.test.ts"
  );
});

test("normal: xuedao ssot manifest check script passes with current repository mappings", () => {
  const result = run(["node", "./scripts/check-xuedao-ssot-manifest.mjs"]);
  assert.equal(result.status, 0, result.stderr || result.stdout);
  assert.match(result.stdout, /\[xuedao-ssot-manifest\] OK/);
});

test("normal: xuedao ssot conformance script passes with current repository bindings", () => {
  const result = run(["node", "./scripts/check-xuedao-ssot-conformance.mjs"]);
  assert.equal(result.status, 0, result.stderr || result.stdout);
  assert.match(result.stdout, /\[xuedao-ssot-conformance\] PASS/);
});

test("normal: environment config ssot script passes with current repository bindings", () => {
  const result = run(["node", "./scripts/check-environment-config-ssot.mjs"]);
  assert.equal(result.status, 0, result.stderr || result.stdout);
  assert.match(result.stdout, /\[environment-config-ssot\] PASS/);
});

test("normal: database schema ssot script passes with current repository bindings", () => {
  const result = run(["node", "./scripts/check-database-schema-ssot.mjs"]);
  assert.equal(result.status, 0, result.stderr || result.stdout);
  assert.match(result.stdout, /\[database-schema-ssot\] PASS/);
});

test("normal: performance contract closure script passes with current repository bindings", () => {
  const result = run(["node", "./scripts/check-performance-contract-closure.mjs"]);
  assert.equal(result.status, 0, result.stderr || result.stdout);
  assert.match(result.stdout, /\[performance-contract-closure\] PASS/);
});

test("normal: performance domain model ssot script passes with current repository bindings", () => {
  const result = run(["node", "./scripts/check-performance-domain-model-ssot.mjs"]);
  assert.equal(result.status, 0, result.stderr || result.stdout);
  assert.match(result.stdout, /\[performance-domain-model-ssot\] passed/);
});

test("normal: performance contract source promotes capability shared-service modules into serviceModules", () => {
  const contractSource = JSON.parse(
    readFileSync(
      `${repoRoot}/cool-admin-midway/src/modules/performance/domain/registry/contract-source.json`,
      "utf8"
    )
  );
  assert.deepEqual(contractSource.producer.publishOnlyModules, []);
  const capabilityServiceModules = contractSource.producer.serviceModules
    .filter(item => item.serviceFile === "capability.ts")
    .map(item => item.moduleRoot)
    .sort();
  assert.deepEqual(capabilityServiceModules, [
    "capabilityItem",
    "capabilityModel",
    "capabilityPortrait",
  ]);
  for (const moduleRoot of [
    "assessment",
    "certificate",
    "contract",
    "goal",
    "hiring",
    "indicator",
    "interview",
    "jobStandard",
    "meeting",
    "recruitPlan",
    "resumePool",
    "talentAsset",
  ]) {
    assert.equal(
      contractSource.producer.serviceModules.some(item => item.moduleRoot === moduleRoot),
      true,
      `${moduleRoot} should be promoted into serviceModules`
    );
  }
});

test("normal: mobile shared contract script passes with current repository bindings", () => {
  const result = run(["node", "./scripts/check-mobile-shared-contract.mjs"]);
  assert.equal(result.status, 0, result.stderr || result.stdout);
  assert.match(result.stdout, /\[mobile-shared-contract\] PASS/);
});

test("normal: shared error semantics script passes with current repository bindings", () => {
  const result = run(["node", "./scripts/check-shared-error-semantics.mjs"]);
  assert.equal(result.status, 0, result.stderr || result.stdout);
  assert.match(result.stdout, /\[shared-error-semantics\] PASS/);
});

test("normal: xuedao ssot conformance script writes markdown and json reports", () => {
  const tempRoot = mkdtempSync(join(tmpdir(), "xuedao-ssot-conformance-"));
  const reportMd = join(tempRoot, "conformance.md");
  const reportJson = join(tempRoot, "conformance.json");
  const result = run([
    "node",
    "./scripts/check-xuedao-ssot-conformance.mjs",
    "--report-md",
    reportMd,
    "--report-json",
    reportJson,
  ]);
  assert.equal(result.status, 0, result.stderr || result.stdout);
  assert.equal(existsSync(reportMd), true, "conformance markdown report should exist");
  assert.equal(existsSync(reportJson), true, "conformance json report should exist");
  assert.match(readFileSync(reportMd, "utf8"), /\[xuedao-ssot-conformance\] PASS|\[xuedao-ssot-conformance\] WARN/);
  const payload = JSON.parse(readFileSync(reportJson, "utf8"));
  assert.equal(typeof payload.verdict, "string");
});

test("normal: unified delivery wrapper defaults report output into the ssot artifact root", () => {
  const script = readFileSync(`${scriptsRoot}/check-unified-delivery.mjs`, "utf8");
  assert.equal(
    script.includes("import { getSsotArtifactRoot } from './xuedao-ssot-manifest.mjs';"),
    true,
    "unified delivery wrapper should read default report root from the ssot manifest"
  );
  assert.equal(
    script.includes("unified-delivery-${phase}.latest."),
    true,
    "unified delivery wrapper should write default report artifacts under a stable file name"
  );
});

test("normal: github workflow covers repo guard CI and release gate trigger paths", () => {
  const workflow = readFileSync(`${repoRoot}/.github/workflows/rbac-governance.yml`, "utf8");
  assert.equal(
    workflow.includes('name: Repository Guard Governance'),
    true,
    "workflow should expose the repository guard governance gate"
  );
  for (const requiredPath of [
    '".github/workflows/**"',
    '"contracts/**"',
    '"scripts/**"',
    '"cool-admin-midway/src/modules/base/**"',
    '"cool-admin-midway/src/modules/dict/**"',
    '"cool-admin-midway/src/modules/user/**"',
    '"cool-admin-vue/build/cool/**"',
    '"cool-admin-vue/src/modules/base/**"',
    '"cool-admin-vue/src/modules/performance/**"',
    '"cool-uni/types/**"',
    '"performance-management-system/docs/**"',
    '"performance-management-system/test/**"'
  ]) {
    assert.equal(
      workflow.includes(`- ${requiredPath}`),
      true,
      `workflow should trigger on ${requiredPath}`
    );
  }
  assert.equal(
    workflow.includes('- "release/**"'),
    true,
    "workflow should run final gate on release branches"
  );
  assert.equal(
    workflow.includes('- "hotfix/**"'),
    true,
    "workflow should run final gate on hotfix branches"
  );
  assert.equal(
    workflow.includes('node ./scripts/check-unified-delivery.mjs'),
    true,
    "workflow should execute the unified delivery guard"
  );
  assert.equal(
    workflow.includes('node ./scripts/check-xuedao-ssot-conformance.mjs'),
    true,
    "workflow should execute the repository ssot conformance guard"
  );
  assert.equal(
    workflow.includes('reports/delivery/xuedao-ssot-conformance-batch.md'),
    true,
    "workflow should persist batch conformance markdown artifacts"
  );
  assert.equal(
    workflow.includes('reports/delivery/xuedao-ssot-conformance-final.json'),
    true,
    "workflow should persist final conformance json artifacts"
  );
  assert.equal(
    workflow.includes('run: corepack enable'),
    true,
    "workflow should enable corepack before installing pnpm workspaces"
  );
  for (const installStep of [
    'working-directory: cool-admin-midway',
    'run: npm ci',
    'working-directory: cool-admin-vue',
    'run: corepack pnpm install --frozen-lockfile',
    'working-directory: cool-uni'
  ]) {
    assert.equal(
      workflow.includes(installStep),
      true,
      `workflow should include ${installStep}`
    );
  }
  for (const qualityStep of [
    'name: Midway Build',
    'name: Vue Format Check',
    'name: Vue Lint Check',
    'name: Vue Type Check',
    'name: Vue Build',
    'name: Uni Format Check',
    'name: Uni Lint Check',
    'name: Uni Type Check',
    'node ./scripts/check-changed-workspace-quality.mjs --workspace cool-admin-vue --tool prettier',
    'node ./scripts/check-changed-workspace-quality.mjs --workspace cool-admin-vue --tool eslint',
    'node ./scripts/check-changed-workspace-quality.mjs --workspace cool-uni --tool prettier',
    'node ./scripts/check-changed-workspace-quality.mjs --workspace cool-uni --tool eslint',
    'run: corepack pnpm run type-check'
  ]) {
    assert.equal(
      workflow.includes(qualityStep),
      true,
      `workflow should include ${qualityStep}`
    );
  }
});

test("normal: ssot and delivery readmes describe conformance and worktree split report artifacts", () => {
  const ssotReadme = readFileSync(`${repoRoot}/contracts/ssot/README.md`, "utf8");
  const repoReadme = readFileSync(`${repoRoot}/README.md`, "utf8");
  const contractsReadme = readFileSync(`${repoRoot}/contracts/README.md`, "utf8");
  const ssotInventory = readFileSync(`${repoRoot}/contracts/ssot/xuedao-ssot-inventory.md`, "utf8");
  const deliveryReadme = readFileSync(`${repoRoot}/reports/delivery/README.md`, "utf8");

  assert.equal(
    ssotReadme.includes("node ./scripts/check-xuedao-ssot-conformance.mjs"),
    true,
    "contracts/ssot README should document the conformance command"
  );
  assert.equal(
    ssotReadme.includes("reports/delivery/xuedao-ssot-conformance.latest.md"),
    true,
    "contracts/ssot README should document default conformance markdown report"
  );
  assert.equal(
    deliveryReadme.includes("xuedao-ssot-conformance.latest.json"),
    true,
    "delivery README should list the default conformance json report"
  );
  assert.equal(
    deliveryReadme.includes("xuedao-ssot-conformance-final.md"),
    true,
    "delivery README should list CI final conformance report artifacts"
  );
  assert.equal(
    ssotReadme.includes("权限主源"),
    true,
    "contracts/ssot README should mention repo-level machine sources beyond openapi"
  );
  assert.equal(
    ssotReadme.includes("user` 鉴权语义目录"),
    true,
    "contracts/ssot README should mention user auth semantics as a machine source"
  );
  assert.equal(
    ssotReadme.includes("共享错误语义主源"),
    true,
    "contracts/ssot README should mention shared error semantics as a machine source"
  );
  assert.equal(
    ssotReadme.includes("performanceContractSource"),
    true,
    "contracts/ssot README should mention performanceContractSource as an explicit machine source"
  );
  assert.equal(
    ssotReadme.includes("environment-config.catalog.json"),
    true,
    "contracts/ssot README should list the environment config catalog"
  );
  assert.equal(
    ssotReadme.includes("database-schema.catalog.json"),
    true,
    "contracts/ssot README should list the database schema catalog"
  );
  assert.equal(
    deliveryReadme.includes("strict-change"),
    true,
    "delivery README should mention strict-change record expectations"
  );
  assert.equal(
    repoReadme.includes("node ./scripts/audit-worktree-split.mjs"),
    true,
    "repo README should document the worktree split audit command"
  );
  assert.equal(
    repoReadme.includes("xuedao-ssot-inventory.md"),
    true,
    "repo README should link the SSOT inventory"
  );
  assert.equal(
    repoReadme.includes("contract-source.{json,mjs}"),
    true,
    "repo README should mention performance contract-source registry files"
  );
  assert.equal(
    contractsReadme.includes("check-environment-config-ssot.mjs"),
    true,
    "contracts README should document the environment config guard"
  );
  assert.equal(
    contractsReadme.includes("check-database-schema-ssot.mjs"),
    true,
    "contracts README should document the database schema guard"
  );
  assert.equal(
    contractsReadme.includes("check-performance-contract-closure.mjs"),
    true,
    "contracts README should document the performance contract closure guard"
  );
  assert.equal(
    contractsReadme.includes("performanceContractSource"),
    true,
    "contracts README should mention performanceContractSource"
  );
  assert.equal(
    /^# xuedao 全域 SSOT Inventory/m.test(ssotInventory),
    true,
    "ssot inventory should exist as the repo-level SSOT map"
  );
  assert.equal(
    deliveryReadme.includes("worktree-split-audit.latest.json"),
    true,
    "delivery README should list the stable worktree split json report"
  );
});

test("normal: repo ssot records and templates include strict-change structure", () => {
  const changeRecord = readFileSync(`${repoRoot}/contracts/ssot/records/change-record.yaml`, "utf8");
  const verificationRecord = readFileSync(`${repoRoot}/contracts/ssot/records/verification-record.yaml`, "utf8");
  const changeTemplate = readFileSync(`${repoRoot}/contracts/ssot/records/change-record.template.yaml`, "utf8");
  const verificationTemplate = readFileSync(`${repoRoot}/contracts/ssot/records/verification-record.template.yaml`, "utf8");

  for (const text of [changeRecord, changeTemplate]) {
    assert.equal(/requestedAt:\s*/.test(text), true, "change records should include requestedAt");
    assert.equal(/targetRelease:\s*/.test(text), true, "change records should include targetRelease");
    assert.equal(/^classification:\s*$/m.test(text), true, "change records should include classification");
    assert.equal(/machineSourcesTouched:\s*/.test(text), true, "change records should include machineSourcesTouched");
    assert.equal(/deliveryEvidenceRequired:\s*/.test(text), true, "change records should include deliveryEvidenceRequired");
    assert.equal(/^releaseAndRollback:\s*$/m.test(text), true, "change records should include releaseAndRollback");
  }

  for (const text of [verificationRecord, verificationTemplate]) {
    assert.equal(/executedAt:\s*/.test(text), true, "verification records should include executedAt");
    assert.equal(/^coverage:\s*$/m.test(text), true, "verification records should include coverage");
    assert.equal(/type:\s*/.test(text), true, "verification checks should include type");
    assert.equal(/scope:\s*/.test(text), true, "verification checks should include scope");
    assert.equal(/^findings:\s*$/m.test(text), true, "verification records should include findings");
    assert.equal(/^summary:\s*$/m.test(text), true, "verification records should include summary");
  }
});

test("normal: pre-push gate runs repo guard tests for workflow, script, and governance doc changes", () => {
  const prePushGate = readFileSync(`${repoRoot}/scripts/git-pre-push-gate.mjs`, "utf8");

  assert.equal(
    prePushGate.includes("id: 'repo-guard-tests'"),
    true,
    "pre-push gate should include repo-guard-tests command group"
  );
  assert.equal(
    prePushGate.includes("node', '--test', './performance-management-system/test/repo-guard-scripts.test.mjs"),
    true,
    "pre-push gate should execute repo guard script regression tests"
  );
  assert.equal(
    prePushGate.includes("filePath.startsWith('.github/workflows/')"),
    true,
    "pre-push gate should run repo guard tests when workflow files change"
  );
  assert.equal(
    prePushGate.includes("filePath === automationGovernanceDocPath"),
    true,
    "pre-push gate should run repo guard tests when the automation governance doc changes"
  );
  assert.equal(
    prePushGate.includes("filePath.startsWith('performance-management-system/test/')"),
    true,
    "pre-push gate should run repo guard tests when repo-guard tests change"
  );
  for (const commandId of [
    "id: 'midway-build'",
    "id: 'vue-format-check'",
    "id: 'vue-lint-check'",
    "id: 'uni-format-check'",
    "id: 'uni-lint-check'"
  ]) {
    assert.equal(
      prePushGate.includes(commandId),
      true,
      `pre-push gate should include ${commandId}`
    );
  }
  for (const commandSnippet of [
    "command: ['npm', 'run', 'build']",
    "command: ['node', './scripts/check-changed-workspace-quality.mjs', '--workspace', 'cool-admin-vue', '--tool', 'prettier']",
    "command: ['node', './scripts/check-changed-workspace-quality.mjs', '--workspace', 'cool-admin-vue', '--tool', 'eslint']",
    "command: ['node', './scripts/check-changed-workspace-quality.mjs', '--workspace', 'cool-uni', '--tool', 'prettier']",
    "command: ['node', './scripts/check-changed-workspace-quality.mjs', '--workspace', 'cool-uni', '--tool', 'eslint']",
    "command: ['corepack', 'pnpm', 'run', 'type-check']"
  ]) {
    assert.equal(
      prePushGate.includes(commandSnippet),
      true,
      `pre-push gate should include ${commandSnippet}`
    );
  }
});

test("normal: changed workspace quality script can scope prettier and eslint to changed files", () => {
  const script = readFileSync(`${repoRoot}/scripts/check-changed-workspace-quality.mjs`, "utf8");
  assert.equal(
    script.includes("collectChangedFiles"),
    true,
    "changed workspace quality script should derive the current changed-file set"
  );
  assert.equal(
    script.includes("IGNORED_SEGMENTS"),
    true,
    "changed workspace quality script should ignore generated and vendor directories"
  );
  assert.equal(
    script.includes("--workspace', 'cool-admin-vue', '--tool', 'prettier"),
    false,
    "changed workspace quality script should stay generic instead of hardcoding one workspace command"
  );
});

test("normal: midway local lint remains wired through the compatibility bootstrap", () => {
  const midwayPackage = JSON.parse(
    readFileSync(`${repoRoot}/cool-admin-midway/package.json`, "utf8")
  );
  const repoReadme = readFileSync(`${repoRoot}/README.md`, "utf8");
  const installLocalDepsScript = readFileSync(
    `${repoRoot}/cool-admin-midway/scripts/install-local-deps.mjs`,
    "utf8"
  );

  assert.equal(
    midwayPackage.scripts.lint,
    "node ./scripts/ensure-local-lint-compat.mjs && mwts check",
    "midway lint should always bootstrap the local compatibility shim first"
  );
  assert.equal(
    midwayPackage.scripts["lint:fix"],
    "node ./scripts/ensure-local-lint-compat.mjs && mwts fix",
    "midway lint:fix should always bootstrap the local compatibility shim first"
  );
  assert.equal(
    midwayPackage.scripts["deps:local:install"],
    "node ./scripts/install-local-deps.mjs",
    "midway should expose an explicit local shared-deps install entrypoint"
  );
  assert.equal(
    midwayPackage.scripts["deps:local:repair"],
    "node ./scripts/install-local-deps.mjs --compat-only",
    "midway should expose an explicit local shared-deps repair entrypoint"
  );
  assert.equal(
    installLocalDepsScript.includes("ensure-local-lint-compat.mjs"),
    true,
    "local dependency installer should converge onto the same lint compatibility bootstrap"
  );
  assert.equal(
    repoReadme.includes("cool-admin-midway/scripts/ensure-local-lint-compat.mjs"),
    true,
    "README should document the local midway lint compatibility bootstrap"
  );
  assert.equal(
    repoReadme.includes("本地先跑 `npm run lint`"),
    true,
    "README should require local midway lint as part of the repository verification baseline"
  );
});

test("normal: midway lint compatibility bootstrap can repair a temp shared-deps workspace", () => {
  const tempRoot = mkdtempSync(join(tmpdir(), "midway-lint-compat-"));
  const tempNodeModulesRoot = join(tempRoot, ".shared-deps", "js", "node_modules");

  writeTempFile(
    tempRoot,
    ".shared-deps/js/node_modules/eslint-plugin-prettier/eslint-plugin-prettier.js",
    `module.exports = {\n  rules: {\n    prettier: {\n      create(context) {\n        return {\n          Program() {\n            if (!prettier) {\n              prettier = require('prettier');\n            }\n            const eslintPrettierOptions = context.options[0] || {};\n            return eslintPrettierOptions;\n          }\n        };\n      }\n    }\n  }\n};\n`
  );
  writeTempFile(
    tempRoot,
    ".shared-deps/js/node_modules/mwts/dist/src/cli.js",
    `const execa = require("execa");\nconst updateNotifier = require("update-notifier");\nfunction getPrettierVersion() {\n    const packageJson = (0, util_1.readJSON)(require.resolve('prettier/package.json'));\n    return packageJson.version;\n}\n`
  );

  const result = run([
    "node",
    "./cool-admin-midway/scripts/ensure-local-lint-compat.mjs",
    "--project-root",
    tempRoot,
  ]);

  assert.equal(result.status, 0, result.stderr || result.stdout);
  assert.match(result.stdout, /\[ensure-local-lint-compat\] OK/);
  assert.equal(
    existsSync(join(tempNodeModulesRoot, "ajv", "lib", "refs", "json-schema-draft-04.json")),
    true,
    "compat bootstrap should materialize the draft-04 schema shim"
  );
  assert.equal(
    existsSync(join(tempNodeModulesRoot, "prettier", "index.js")),
    true,
    "compat bootstrap should materialize the local prettier shim"
  );

  const patchedPrettierPlugin = readFileSync(
    join(tempNodeModulesRoot, "eslint-plugin-prettier", "eslint-plugin-prettier.js"),
    "utf8"
  );
  const patchedMwtsCli = readFileSync(
    join(tempNodeModulesRoot, "mwts", "dist", "src", "cli.js"),
    "utf8"
  );
  const patchedAjvCompat = readFileSync(
    join(tempNodeModulesRoot, "eslint", "lib", "shared", "ajv.js"),
    "utf8"
  );

  assert.equal(
    patchedPrettierPlugin.includes("Prettier 3 removed the sync config/file-info APIs"),
    true,
    "compat bootstrap should patch eslint-plugin-prettier for the Prettier 3 sync API removal"
  );
  assert.equal(
    patchedMwtsCli.includes("let updateNotifier = () => ({ notify() { } });"),
    true,
    "compat bootstrap should patch mwts cli to degrade gracefully when update-notifier is absent"
  );
  assert.equal(
    patchedMwtsCli.includes("return 'unavailable';"),
    true,
    "compat bootstrap should patch mwts cli to tolerate missing prettier package metadata"
  );
  assert.equal(
    patchedAjvCompat.includes("delete normalizedAdditionalOptions.missingRefs;"),
    true,
    "compat bootstrap should write the ajv compatibility bridge"
  );
});

test("normal: midway local dependency installer supports compat-only temp workspace repair", () => {
  const tempRoot = mkdtempSync(join(tmpdir(), "midway-local-deps-compat-"));
  const tempNodeModulesRoot = join(tempRoot, ".shared-deps", "js", "node_modules");

  writeTempFile(
    tempRoot,
    ".shared-deps/js/node_modules/eslint-plugin-prettier/eslint-plugin-prettier.js",
    `module.exports = {\n  rules: {\n    prettier: {\n      create(context) {\n        return {\n          Program() {\n            if (!prettier) {\n              prettier = require('prettier');\n            }\n            const eslintPrettierOptions = context.options[0] || {};\n            return eslintPrettierOptions;\n          }\n        };\n      }\n    }\n  }\n};\n`
  );
  writeTempFile(
    tempRoot,
    ".shared-deps/js/node_modules/mwts/dist/src/cli.js",
    `const execa = require("execa");\nconst updateNotifier = require("update-notifier");\nfunction getPrettierVersion() {\n    const packageJson = (0, util_1.readJSON)(require.resolve('prettier/package.json'));\n    return packageJson.version;\n}\n`
  );

  const result = run([
    "node",
    "./cool-admin-midway/scripts/install-local-deps.mjs",
    "--project-root",
    tempRoot,
    "--compat-only",
  ]);

  assert.equal(result.status, 0, result.stderr || result.stdout);
  assert.match(result.stdout, /\[ensure-local-lint-compat\] OK/);
  assert.match(result.stdout, /Compatibility bootstrap completed/);
  assert.equal(
    existsSync(join(tempNodeModulesRoot, "prettier", "index.js")),
    true,
    "compat-only installer mode should still materialize the local prettier shim"
  );
  assert.equal(
    existsSync(join(tempNodeModulesRoot, "eslint", "lib", "shared", "ajv.js")),
    true,
    "compat-only installer mode should still materialize the ajv compatibility bridge"
  );
});

test("normal: midway local dependency installer can install from a temp local registry and converge compatibility", () => {
  const tempRoot = mkdtempSync(join(tmpdir(), "midway-local-deps-install-"));
  const registryRoot = join(tempRoot, "registry");
  const tempNodeModulesRoot = join(tempRoot, ".shared-deps", "js", "node_modules");

  mkdirSync(registryRoot, { recursive: true });
  writeTempFile(
    tempRoot,
    "package.json",
    JSON.stringify(
      {
        name: "temp-midway-project",
        version: "1.0.0",
        dependencies: {
          "dummy-dep": "^1.0.0",
        },
        devDependencies: {},
      },
      null,
      2
    )
  );

  const nestedTarball = createPackageTarball(registryRoot, "nested-dep", "2.1.3");
  writeRegistryMetadata(registryRoot, "nested-dep", [
    { version: "2.1.3", tarballPath: nestedTarball },
  ]);

  const dummyTarball = createPackageTarball(registryRoot, "dummy-dep", "1.0.0", {
    dependencies: {
      "nested-dep": "~2.1.0",
    },
  });
  writeRegistryMetadata(registryRoot, "dummy-dep", [
    {
      version: "1.0.0",
      tarballPath: dummyTarball,
      dependencies: {
        "nested-dep": "~2.1.0",
      },
    },
  ]);

  const result = run([
    "node",
    "./cool-admin-midway/scripts/install-local-deps.mjs",
    "--project-root",
    tempRoot,
    "--registry-dir",
    registryRoot,
  ]);

  assert.equal(result.status, 0, result.stderr || result.stdout);
  assert.match(result.stdout, /\[ensure-local-lint-compat\] OK/);
  assert.match(result.stdout, /Installed 2 packages into/);
  assert.equal(
    JSON.parse(readFileSync(join(tempNodeModulesRoot, "dummy-dep", "package.json"), "utf8")).version,
    "1.0.0",
    "installer should place root dependency into the temp shared-deps tree"
  );
  assert.equal(
    JSON.parse(readFileSync(join(tempNodeModulesRoot, "nested-dep", "package.json"), "utf8")).version,
    "2.1.3",
    "installer should resolve and install transitive dependencies from the temp local registry"
  );
  assert.equal(
    existsSync(join(tempNodeModulesRoot, "prettier", "index.js")),
    true,
    "full install path should still converge onto the local prettier compatibility shim"
  );
});

test("normal: permission generation script reads base domain source helper instead of hardcoding generation rules", () => {
  const script = readFileSync(`${scriptsRoot}/generate-permissions.mjs`, "utf8");
  assert.equal(
    script.includes("domain/permissions/source.mjs"),
    true,
    "generate-permissions should import the base domain source helper"
  );
  assert.equal(
    script.includes("const WRITE_ACTIONS = new Set(["),
    false,
    "generate-permissions should not keep a local hardcoded write action list"
  );
  assert.equal(
    script.includes("const ROUTE_PERMISSION_PRIORITY = new Map(["),
    false,
    "generate-permissions should not keep a local hardcoded route priority map"
  );
});

test("normal: permission check script reads base domain scan roots instead of keeping a local scan directory list", () => {
  const script = readFileSync(`${scriptsRoot}/check-permissions.mjs`, "utf8");
  assert.equal(
    script.includes("resolveBasePermissionUsageScanRoots"),
    true,
    "check-permissions should import the base domain scan-root helper"
  );
  assert.equal(
    script.includes("const SCAN_DIRECTORIES = ["),
    false,
    "check-permissions should not keep a local SCAN_DIRECTORIES allowlist"
  );
  assert.equal(
    script.includes("resolveBasePermissionUsageIgnoredPathSegments"),
    true,
    "check-permissions should import the base domain ignored-path helper"
  );
  assert.equal(
    script.includes("resolveBasePermissionUsageAllowedFiles"),
    true,
    "check-permissions should import the base domain allowed-file helper"
  );
  assert.equal(
    script.includes("resolveBasePermissionUsageScanExtensions"),
    true,
    "check-permissions should import the base domain scan-extension helper"
  );
  assert.equal(
    script.includes("const IGNORED_SEGMENTS = ['/generated/'"),
    false,
    "check-permissions should not keep a local IGNORED_SEGMENTS list"
  );
  assert.equal(
    script.includes("['.ts', '.tsx', '.js', '.mjs', '.vue', '.json']"),
    false,
    "check-permissions should not keep a local scan extension list"
  );
});

test("normal: base runtime permission consumers read domain entry instead of generated permission files", () => {
  const permissionSsot = readFileSync(
    `${repoRoot}/cool-admin-midway/src/modules/base/service/sys/permission-ssot.ts`,
    "utf8"
  );
  const permsService = readFileSync(
    `${repoRoot}/cool-admin-midway/src/modules/base/service/sys/perms.ts`,
    "utf8"
  );
  const loginService = readFileSync(
    `${repoRoot}/cool-admin-midway/src/modules/base/service/sys/login.ts`,
    "utf8"
  );

  assert.equal(
    permissionSsot.includes("from '../../domain'"),
    true,
    "permission-ssot should read permission runtime facts from base/domain"
  );
  assert.equal(
    permissionSsot.includes("generated/permission-bits.generated"),
    false,
    "permission-ssot should not read generated permission bits directly"
  );
  assert.equal(
    permsService.includes("generated/permission-bits.generated"),
    false,
    "perms service should not read generated permission bits directly"
  );
  assert.equal(
    loginService.includes("generated/permission-bits.generated"),
    false,
    "login service should not read generated permission bits directly"
  );
});

test("normal: authority middleware reads route auth aliases from base domain instead of local literals", () => {
  const authority = readFileSync(
    `${repoRoot}/cool-admin-midway/src/modules/base/middleware/authority.ts`,
    "utf8"
  );

  assert.equal(
    authority.includes("BASE_RUNTIME_PERMISSION_ALIASES"),
    false,
    "authority middleware should not reach into alias constants directly anymore"
  );
  assert.equal(
    authority.includes("baseResolveRuntimePermissionCandidates"),
    true,
    "authority middleware should read permission candidate helper from base/domain"
  );
  assert.equal(
    authority.includes("baseIsLoginOnlyRoute"),
    true,
    "authority middleware should read login-only route helper from base/domain"
  );
  assert.equal(
    authority.includes("private readonly permissionAliases"),
    false,
    "authority middleware should not keep a local permissionAliases map"
  );
  assert.equal(
    authority.includes("private readonly loginOnlyPrefixes"),
    false,
    "authority middleware should not keep a local loginOnlyPrefixes list"
  );
  assert.equal(
    authority.includes("private resolvePermissionCandidates"),
    false,
    "authority middleware should not keep a local resolvePermissionCandidates helper"
  );
  assert.equal(
    authority.includes("private isLoginOnlyRoute"),
    false,
    "authority middleware should not keep a local isLoginOnlyRoute helper"
  );
});

test("normal: user auth runtime consumers read cache-key and claim helpers from user domain", () => {
  const loginService = readFileSync(
    `${repoRoot}/cool-admin-midway/src/modules/base/service/sys/login.ts`,
    "utf8"
  );
  const permsService = readFileSync(
    `${repoRoot}/cool-admin-midway/src/modules/base/service/sys/perms.ts`,
    "utf8"
  );
  const authority = readFileSync(
    `${repoRoot}/cool-admin-midway/src/modules/base/middleware/authority.ts`,
    "utf8"
  );
  const userService = readFileSync(
    `${repoRoot}/cool-admin-midway/src/modules/base/service/sys/user.ts`,
    "utf8"
  );
  const departmentService = readFileSync(
    `${repoRoot}/cool-admin-midway/src/modules/base/service/sys/department.ts`,
    "utf8"
  );
  const commController = readFileSync(
    `${repoRoot}/cool-admin-midway/src/modules/base/controller/admin/comm.ts`,
    "utf8"
  );
  const roleController = readFileSync(
    `${repoRoot}/cool-admin-midway/src/modules/base/controller/admin/sys/role.ts`,
    "utf8"
  );
  const tenantSubscriber = readFileSync(
    `${repoRoot}/cool-admin-midway/src/modules/base/db/tenant.ts`,
    "utf8"
  );
  const logMiddleware = readFileSync(
    `${repoRoot}/cool-admin-midway/src/modules/base/middleware/log.ts`,
    "utf8"
  );
  const userController = readFileSync(
    `${repoRoot}/cool-admin-midway/src/modules/base/controller/admin/sys/user.ts`,
    "utf8"
  );
  const departmentController = readFileSync(
    `${repoRoot}/cool-admin-midway/src/modules/base/controller/admin/sys/department.ts`,
    "utf8"
  );
  const menuService = readFileSync(
    `${repoRoot}/cool-admin-midway/src/modules/base/service/sys/menu.ts`,
    "utf8"
  );
  const roleService = readFileSync(
    `${repoRoot}/cool-admin-midway/src/modules/base/service/sys/role.ts`,
    "utf8"
  );
  const userLoginService = readFileSync(
    `${repoRoot}/cool-admin-midway/src/modules/user/service/login.ts`,
    "utf8"
  );
  const userMiddleware = readFileSync(
    `${repoRoot}/cool-admin-midway/src/modules/user/middleware/app.ts`,
    "utf8"
  );
  const userAddressController = readFileSync(
    `${repoRoot}/cool-admin-midway/src/modules/user/controller/app/address.ts`,
    "utf8"
  );
  const userInfoController = readFileSync(
    `${repoRoot}/cool-admin-midway/src/modules/user/controller/app/info.ts`,
    "utf8"
  );
  const userAddressService = readFileSync(
    `${repoRoot}/cool-admin-midway/src/modules/user/service/address.ts`,
    "utf8"
  );

  assert.equal(
    loginService.includes("buildUserAuthCacheKey"),
    true,
    "login service should build admin auth cache keys from user/domain"
  );
  assert.equal(
    loginService.includes("buildUserAdminTokenPayload"),
    true,
    "login service should build admin token payloads from user/domain"
  );
  assert.equal(
    permsService.includes("buildUserAuthCacheKey"),
    true,
    "perms service should build admin auth cache keys from user/domain"
  );
  assert.equal(
    loginService.includes("verifyUserAdminToken"),
    true,
    "login service should verify refresh token through user/domain"
  );
  assert.equal(
    permsService.includes("verifyUserAdminToken"),
    true,
    "perms service should verify fallback admin token through user/domain"
  );
  assert.equal(
    permsService.includes("resolveUserAdminRuntimeContext"),
    true,
    "perms service should normalize fallback admin runtime context through user/domain"
  );
  assert.equal(
    permsService.includes("jwt.verify("),
    false,
    "perms service should not keep a local jwt.verify fallback"
  );
  assert.equal(
    authority.includes("buildUserAuthCacheKey"),
    true,
    "authority middleware should build admin auth cache keys from user/domain"
  );
  assert.equal(
    authority.includes("resolveUserAdminPasswordVersion"),
    true,
    "authority middleware should read passwordVersion through user/domain claim helper"
  );
  assert.equal(
    authority.includes("verifyUserAdminToken"),
    true,
    "authority middleware should verify admin token through user/domain"
  );
  assert.equal(
    authority.includes("jwt.verify("),
    false,
    "authority middleware should not keep a local jwt.verify fallback"
  );
  assert.equal(
    userService.includes("verifyUserAdminToken"),
    true,
    "user service should verify fallback admin token through user/domain"
  );
  assert.equal(
    userService.includes("buildUserAuthCacheKey"),
    true,
    "user service should build auth cache keys from user/domain"
  );
  assert.equal(
    userService.includes("resolveUserAdminRuntimeContext"),
    true,
    "user service should normalize fallback admin runtime context through user/domain"
  );
  assert.equal(
    departmentService.includes("verifyUserAdminToken"),
    true,
    "department service should verify fallback admin token through user/domain"
  );
  assert.equal(
    departmentService.includes("resolveUserAdminRuntimeContext"),
    true,
    "department service should normalize fallback admin runtime context through user/domain"
  );
  assert.equal(
    commController.includes("verifyUserAdminToken"),
    true,
    "comm controller should verify fallback admin token through user/domain"
  );
  assert.equal(
    commController.includes("resolveUserAdminRuntimeContext"),
    true,
    "comm controller should normalize fallback admin runtime context through user/domain"
  );
  assert.equal(
    userController.includes("resolveUserAdminRuntimeContext"),
    true,
    "user controller should normalize current admin context through user/domain"
  );
  assert.equal(
    departmentController.includes("resolveUserAdminRuntimeContext"),
    true,
    "department controller should normalize current admin context through user/domain"
  );
  assert.equal(
    roleController.includes("resolveUserAdminRuntimeContext"),
    true,
    "role controller should normalize current admin context through user/domain"
  );
  assert.equal(
    tenantSubscriber.includes("resolveUserAdminRuntimeContext"),
    true,
    "tenant subscriber should normalize current admin context through user/domain"
  );
  assert.equal(
    logMiddleware.includes("resolveUserAdminUserId"),
    true,
    "log middleware should normalize current admin userId through user/domain"
  );
  assert.equal(
    menuService.includes("resolveUserAdminRuntimeContext"),
    true,
    "menu service should normalize current admin context through user/domain"
  );
  assert.equal(
    roleService.includes("resolveUserAdminRuntimeContext"),
    true,
    "role service should normalize current admin context through user/domain"
  );
  assert.equal(
    userLoginService.includes("buildUserAppTokenPayload"),
    true,
    "user login service should build app token payloads from user/domain"
  );
  assert.equal(
    userLoginService.includes("verifyUserAppToken"),
    true,
    "user login service should verify app refresh token through user/domain"
  );
  assert.equal(
    userLoginService.includes("jwt.verify("),
    false,
    "user login service should not keep a local jwt.verify refresh-token check"
  );
  assert.equal(
    userMiddleware.includes("verifyUserAppToken"),
    true,
    "user middleware should verify app token through user/domain"
  );
  assert.equal(
    userMiddleware.includes("isUserAppRefreshToken"),
    true,
    "user middleware should detect refresh token through user/domain"
  );
  assert.equal(
    userMiddleware.includes("jwt.verify("),
    false,
    "user middleware should not keep a local jwt.verify access-token check"
  );
  assert.equal(
    userAddressController.includes("resolveUserAppRuntimeContext"),
    true,
    "user address controller should normalize current app user context through user/domain"
  );
  assert.equal(
    userInfoController.includes("resolveUserAppRuntimeContext"),
    true,
    "user info controller should normalize current app user context through user/domain"
  );
  assert.equal(
    userAddressService.includes("resolveUserAppUserId"),
    true,
    "user address service should normalize current app user id through user/domain"
  );
});

test("normal: dict business catalog points certificate provider at dedicated dict entry", () => {
  const dictCatalog = readFileSync(
    `${repoRoot}/cool-admin-midway/src/modules/dict/domain/dicts/catalog.ts`,
    "utf8"
  );
  const certificateDictProvider = readFileSync(
    `${repoRoot}/cool-admin-midway/src/modules/performance/service/certificate-dict.ts`,
    "utf8"
  );

  assert.equal(
    dictCatalog.includes("performance/service/certificate-dict"),
    true,
    "dict business catalog should import certificate provider from certificate-dict"
  );
  assert.equal(
    dictCatalog.includes("performance/service/certificate-helper"),
    false,
    "dict business catalog should not import certificate provider directly from certificate-helper"
  );
  assert.equal(
    dictCatalog.includes("src/modules/performance/service/certificate-dict.ts"),
    true,
    "dict business catalog should trace certificate provider sourcePath to certificate-dict.ts"
  );
  assert.equal(
    certificateDictProvider.includes("getCertificateBusinessDictGroups"),
    true,
    "certificate-dict entry should export certificate business dict groups"
  );
});

test("normal: approval-flow helper reads instance states and actions from performance domain state machine", () => {
  const approvalFlowDomain = readFileSync(
    `${repoRoot}/cool-admin-midway/src/modules/performance/domain/states/approval-flow.ts`,
    "utf8"
  );
  const approvalFlowHelper = readFileSync(
    `${repoRoot}/cool-admin-midway/src/modules/performance/service/approval-flow-helper.ts`,
    "utf8"
  );

  assert.equal(
    approvalFlowDomain.includes("APPROVAL_FLOW_INSTANCE_STATUSES"),
    true,
    "approval-flow domain should expose instance statuses"
  );
  assert.equal(
    approvalFlowDomain.includes("APPROVAL_FLOW_ALLOWED_ACTIONS_BY_STATUS"),
    true,
    "approval-flow domain should expose allowed actions by status"
  );
  assert.equal(
    approvalFlowHelper.includes("APPROVAL_FLOW_INSTANCE_STATUSES"),
    true,
    "approval-flow helper should import instance statuses from domain"
  );
  assert.equal(
    approvalFlowHelper.includes("APPROVAL_FLOW_ALLOWED_ACTIONS_BY_STATUS"),
    true,
    "approval-flow helper should import allowed actions by status from domain"
  );
  assert.equal(
    approvalFlowHelper.includes("export const APPROVAL_INSTANCE_STATUSES = ["),
    false,
    "approval-flow helper should not keep a local instance-status array"
  );
});

test("normal: performance services read shared domain error messages instead of hardcoded auth or approval strings", () => {
  const performanceErrors = readFileSync(
    `${repoRoot}/cool-admin-midway/src/modules/performance/domain/errors/catalog.ts`,
    "utf8"
  );
  const accessContext = readFileSync(
    `${repoRoot}/cool-admin-midway/src/modules/performance/service/access-context.ts`,
    "utf8"
  );
  const approvalFlowHelper = readFileSync(
    `${repoRoot}/cool-admin-midway/src/modules/performance/service/approval-flow-helper.ts`,
    "utf8"
  );
  const assessmentHelper = readFileSync(
    `${repoRoot}/cool-admin-midway/src/modules/performance/service/assessment-helper.ts`,
    "utf8"
  );
  const approvalFlowService = readFileSync(
    `${repoRoot}/cool-admin-midway/src/modules/performance/service/approval-flow.ts`,
    "utf8"
  );
  const assetDomainService = readFileSync(
    `${repoRoot}/cool-admin-midway/src/modules/performance/service/asset-domain.ts`,
    "utf8"
  );
  const resumePoolService = readFileSync(
    `${repoRoot}/cool-admin-midway/src/modules/performance/service/resumePool.ts`,
    "utf8"
  );
  const talentAssetService = readFileSync(
    `${repoRoot}/cool-admin-midway/src/modules/performance/service/talentAsset.ts`,
    "utf8"
  );
  const contractService = readFileSync(
    `${repoRoot}/cool-admin-midway/src/modules/performance/service/contract.ts`,
    "utf8"
  );
  const salaryService = readFileSync(
    `${repoRoot}/cool-admin-midway/src/modules/performance/service/salary.ts`,
    "utf8"
  );
  const suggestionHelper = readFileSync(
    `${repoRoot}/cool-admin-midway/src/modules/performance/service/suggestion-helper.ts`,
    "utf8"
  );
  const goalHelper = readFileSync(
    `${repoRoot}/cool-admin-midway/src/modules/performance/service/goal-helper.ts`,
    "utf8"
  );
  const capabilityService = readFileSync(
    `${repoRoot}/cool-admin-midway/src/modules/performance/service/capability.ts`,
    "utf8"
  );
  const promotionHelper = readFileSync(
    `${repoRoot}/cool-admin-midway/src/modules/performance/service/promotion-helper.ts`,
    "utf8"
  );
  const courseHelper = readFileSync(
    `${repoRoot}/cool-admin-midway/src/modules/performance/service/course-helper.ts`,
    "utf8"
  );
  const capabilityHelper = readFileSync(
    `${repoRoot}/cool-admin-midway/src/modules/performance/service/capability-helper.ts`,
    "utf8"
  );
  const certificateHelper = readFileSync(
    `${repoRoot}/cool-admin-midway/src/modules/performance/service/certificate-helper.ts`,
    "utf8"
  );
  const assessmentService = readFileSync(
    `${repoRoot}/cool-admin-midway/src/modules/performance/service/assessment.ts`,
    "utf8"
  );
  const certificateService = readFileSync(
    `${repoRoot}/cool-admin-midway/src/modules/performance/service/certificate.ts`,
    "utf8"
  );
  const courseService = readFileSync(
    `${repoRoot}/cool-admin-midway/src/modules/performance/service/course.ts`,
    "utf8"
  );
  const courseExamService = readFileSync(
    `${repoRoot}/cool-admin-midway/src/modules/performance/service/course-exam.ts`,
    "utf8"
  );
  const coursePracticeService = readFileSync(
    `${repoRoot}/cool-admin-midway/src/modules/performance/service/course-practice.ts`,
    "utf8"
  );
  const courseReciteService = readFileSync(
    `${repoRoot}/cool-admin-midway/src/modules/performance/service/course-recite.ts`,
    "utf8"
  );
  const goalService = readFileSync(
    `${repoRoot}/cool-admin-midway/src/modules/performance/service/goal.ts`,
    "utf8"
  );
  const goalOperationsService = readFileSync(
    `${repoRoot}/cool-admin-midway/src/modules/performance/service/goal-operations.ts`,
    "utf8"
  );
  const goalOperationsHelper = readFileSync(
    `${repoRoot}/cool-admin-midway/src/modules/performance/service/goal-operations-helper.ts`,
    "utf8"
  );
  const documentCenterService = readFileSync(
    `${repoRoot}/cool-admin-midway/src/modules/performance/service/documentCenter.ts`,
    "utf8"
  );
  const hiringService = readFileSync(
    `${repoRoot}/cool-admin-midway/src/modules/performance/service/hiring.ts`,
    "utf8"
  );
  const indicatorService = readFileSync(
    `${repoRoot}/cool-admin-midway/src/modules/performance/service/indicator.ts`,
    "utf8"
  );
  const interviewService = readFileSync(
    `${repoRoot}/cool-admin-midway/src/modules/performance/service/interview.ts`,
    "utf8"
  );
  const jobStandardService = readFileSync(
    `${repoRoot}/cool-admin-midway/src/modules/performance/service/job-standard.ts`,
    "utf8"
  );
  const materialDomainService = readFileSync(
    `${repoRoot}/cool-admin-midway/src/modules/performance/service/material-domain.ts`,
    "utf8"
  );
  const knowledgeBaseService = readFileSync(
    `${repoRoot}/cool-admin-midway/src/modules/performance/service/knowledgeBase.ts`,
    "utf8"
  );
  const intellectualPropertyService = readFileSync(
    `${repoRoot}/cool-admin-midway/src/modules/performance/service/intellectualProperty.ts`,
    "utf8"
  );
  const meetingService = readFileSync(
    `${repoRoot}/cool-admin-midway/src/modules/performance/service/meeting.ts`,
    "utf8"
  );
  const officeCollabRecordService = readFileSync(
    `${repoRoot}/cool-admin-midway/src/modules/performance/service/office-collab-record.ts`,
    "utf8"
  );
  const pipService = readFileSync(
    `${repoRoot}/cool-admin-midway/src/modules/performance/service/pip.ts`,
    "utf8"
  );
  const promotionService = readFileSync(
    `${repoRoot}/cool-admin-midway/src/modules/performance/service/promotion.ts`,
    "utf8"
  );
  const feedbackService = readFileSync(
    `${repoRoot}/cool-admin-midway/src/modules/performance/service/feedback.ts`,
    "utf8"
  );
  const purchaseOrderService = readFileSync(
    `${repoRoot}/cool-admin-midway/src/modules/performance/service/purchase-order.ts`,
    "utf8"
  );
  const purchaseReportService = readFileSync(
    `${repoRoot}/cool-admin-midway/src/modules/performance/service/purchase-report.ts`,
    "utf8"
  );
  const recruitPlanService = readFileSync(
    `${repoRoot}/cool-admin-midway/src/modules/performance/service/recruit-plan.ts`,
    "utf8"
  );
  const suggestionService = readFileSync(
    `${repoRoot}/cool-admin-midway/src/modules/performance/service/suggestion.ts`,
    "utf8"
  );
  const supplierService = readFileSync(
    `${repoRoot}/cool-admin-midway/src/modules/performance/service/supplier.ts`,
    "utf8"
  );
  const teacherChannelCoreService = readFileSync(
    `${repoRoot}/cool-admin-midway/src/modules/performance/service/teacher-channel-core.ts`,
    "utf8"
  );
  const vehicleService = readFileSync(
    `${repoRoot}/cool-admin-midway/src/modules/performance/service/vehicle.ts`,
    "utf8"
  );
  const workPlanService = readFileSync(
    `${repoRoot}/cool-admin-midway/src/modules/performance/service/workPlan.ts`,
    "utf8"
  );
  const resumePoolServiceUpdated = readFileSync(
    `${repoRoot}/cool-admin-midway/src/modules/performance/service/resumePool.ts`,
    "utf8"
  );

  assert.equal(
    performanceErrors.includes("resolvePerformanceDomainErrorMessage"),
    true,
    "performance error catalog should expose a shared error-message resolver"
  );
  assert.equal(
    performanceErrors.includes("stateActionNotAllowed"),
    true,
    "performance error catalog should register shared state-action-not-allowed semantics"
  );
  assert.equal(
    performanceErrors.includes("stateEditNotAllowed"),
    true,
    "performance error catalog should register shared state-edit-not-allowed semantics"
  );
  assert.equal(
    performanceErrors.includes("stateDeleteNotAllowed"),
    true,
    "performance error catalog should register shared state-delete-not-allowed semantics"
  );
  assert.equal(
    performanceErrors.includes("stateDraftEditOnly"),
    true,
    "performance error catalog should register shared state-draft-edit-only semantics"
  );
  assert.equal(
    performanceErrors.includes("stateDraftSubmitOnly"),
    true,
    "performance error catalog should register shared state-draft-submit-only semantics"
  );
  assert.equal(
    performanceErrors.includes("stateCancelNotAllowed"),
    true,
    "performance error catalog should register shared state-cancel-not-allowed semantics"
  );
  assert.equal(
    performanceErrors.includes("stateSubmittedReceiveOnly"),
    true,
    "performance error catalog should register shared state-submitted-receive-only semantics"
  );
  assert.equal(
    performanceErrors.includes("stateSubmittedApproveOnly"),
    true,
    "performance error catalog should register shared state-submitted-approve-only semantics"
  );
  assert.equal(
    performanceErrors.includes("stateApprovedExecuteOnly"),
    true,
    "performance error catalog should register shared state-approved-execute-only semantics"
  );
  assert.equal(
    performanceErrors.includes("stateCloseNotAllowed"),
    true,
    "performance error catalog should register shared state-close-not-allowed semantics"
  );
  assert.equal(
    performanceErrors.includes("stateMissing"),
    true,
    "performance error catalog should register shared state-missing semantics"
  );
  assert.equal(
    performanceErrors.includes("targetDepartmentRequired"),
    true,
    "performance error catalog should register shared target-department-required semantics"
  );
  assert.equal(
    performanceErrors.includes("goalTitleRequired"),
    true,
    "performance error catalog should register shared goal-title-required semantics"
  );
  assert.equal(
    performanceErrors.includes("ownerRequired"),
    true,
    "performance error catalog should register shared owner-required semantics"
  );
  assert.equal(
    performanceErrors.includes("employeeRequired"),
    true,
    "performance error catalog should register shared employee-required semantics"
  );
  assert.equal(
    performanceErrors.includes("sourceTypeInvalid"),
    true,
    "performance error catalog should register shared source-type-invalid semantics"
  );
  assert.equal(
    performanceErrors.includes("suggestionActionUnsupported"),
    true,
    "performance error catalog should register shared suggestion-action-unsupported semantics"
  );
  assert.equal(
    performanceErrors.includes("targetValuePositive"),
    true,
    "performance error catalog should register shared target-value-positive semantics"
  );
  assert.equal(
    performanceErrors.includes("dateRangeRequired"),
    true,
    "performance error catalog should register shared date-range-required semantics"
  );
  assert.equal(
    performanceErrors.includes("dateRangeInvalid"),
    true,
    "performance error catalog should register shared date-range-invalid semantics"
  );
  assert.equal(
    performanceErrors.includes("importFileNotFound"),
    true,
    "performance error catalog should register shared import-file-not-found semantics"
  );
  assert.equal(
    performanceErrors.includes("idRequired"),
    true,
    "performance error catalog should register shared id-required semantics"
  );
  assert.equal(
    performanceErrors.includes("numericFieldInvalid"),
    true,
    "performance error catalog should register shared numeric-field-invalid semantics"
  );
  assert.equal(
    performanceErrors.includes("pipActionUnsupported"),
    true,
    "performance error catalog should register shared pip-action-unsupported semantics"
  );
  assert.equal(
    performanceErrors.includes("invalidRelatedFiles"),
    true,
    "performance error catalog should register shared invalid-related-files semantics"
  );
  assert.equal(
    performanceErrors.includes("stateTargetUpdateNotAllowed"),
    true,
    "performance error catalog should register shared state-target-update-not-allowed semantics"
  );
  assert.equal(
    performanceErrors.includes("importFileRequired"),
    true,
    "performance error catalog should register shared import-file-required semantics"
  );
  assert.equal(
    performanceErrors.includes("employeeIdInvalid"),
    true,
    "performance error catalog should register shared employee-id-invalid semantics"
  );
  assert.equal(
    performanceErrors.includes("stateInterviewCreateNotAllowed"),
    true,
    "performance error catalog should register shared state-interview-create-not-allowed semantics"
  );
  assert.equal(
    performanceErrors.includes("stateInterviewRecreateNotAllowed"),
    true,
    "performance error catalog should register shared state-interview-recreate-not-allowed semantics"
  );
  assert.equal(
    performanceErrors.includes("invalidRelatedKnowledge"),
    true,
    "performance error catalog should register shared invalid-related-knowledge semantics"
  );
  assert.equal(
    performanceErrors.includes("qaQuestionRequired"),
    true,
    "performance error catalog should register shared qa-question-required semantics"
  );
  assert.equal(
    performanceErrors.includes("qaAnswerRequired"),
    true,
    "performance error catalog should register shared qa-answer-required semantics"
  );
  assert.equal(
    performanceErrors.includes("meetingStatusInvalid"),
    true,
    "performance error catalog should register shared meeting-status-invalid semantics"
  );
  assert.equal(
    performanceErrors.includes("pipTitleRequired"),
    true,
    "performance error catalog should register shared pip-title-required semantics"
  );
  assert.equal(
    performanceErrors.includes("pipImprovementGoalRequired"),
    true,
    "performance error catalog should register shared pip-improvement-goal-required semantics"
  );
  assert.equal(
    performanceErrors.includes("pipSourceReasonRequired"),
    true,
    "performance error catalog should register shared pip-source-reason-required semantics"
  );
  assert.equal(
    performanceErrors.includes("pipStartDraftOnly"),
    true,
    "performance error catalog should register shared pip-start-draft-only semantics"
  );
  assert.equal(
    performanceErrors.includes("pipTrackActiveOnly"),
    true,
    "performance error catalog should register shared pip-track-active-only semantics"
  );
  assert.equal(
    performanceErrors.includes("pipCompleteActiveOnly"),
    true,
    "performance error catalog should register shared pip-complete-active-only semantics"
  );
  assert.equal(
    performanceErrors.includes("pipCloseActiveOnly"),
    true,
    "performance error catalog should register shared pip-close-active-only semantics"
  );
  assert.equal(
    performanceErrors.includes("pipEditNotAllowed"),
    true,
    "performance error catalog should register shared pip-edit-not-allowed semantics"
  );
  assert.equal(
    performanceErrors.includes("suggestionRevokeHrOnly"),
    true,
    "performance error catalog should register shared suggestion-revoke-hr-only semantics"
  );
  assert.equal(
    performanceErrors.includes("meetingCancelRoleDenied"),
    true,
    "performance error catalog should register shared meeting-cancel-role-denied semantics"
  );
  assert.equal(
    performanceErrors.includes("stateTransitionTargetNotAllowed"),
    true,
    "performance error catalog should register shared state-transition-target-not-allowed semantics"
  );
  assert.equal(
    performanceErrors.includes("courseEvaluatedTaskResubmitDenied"),
    true,
    "performance error catalog should register shared course-evaluated-task-resubmit-denied semantics"
  );
  assert.equal(
    performanceErrors.includes("certificateIdInvalid"),
    true,
    "performance error catalog should register shared certificate-id-invalid semantics"
  );
  assert.equal(
    performanceErrors.includes("purchaseOrderOperateDenied"),
    true,
    "performance error catalog should register shared purchase-order-operate-denied semantics"
  );
  assert.equal(
    performanceErrors.includes("teacherClassClosedEditDenied"),
    true,
    "performance error catalog should register shared teacher-class-closed-edit-denied semantics"
  );
  assert.equal(
    performanceErrors.includes("goalOpsReportDateRequired"),
    true,
    "performance error catalog should register shared goal-ops-report-date-required semantics"
  );
  assert.equal(
    performanceErrors.includes("feedbackTaskViewDenied"),
    true,
    "performance error catalog should register shared feedback-task-view-denied semantics"
  );
  assert.equal(
    performanceErrors.includes("assetNoDuplicate"),
    true,
    "performance error catalog should register shared asset-no-duplicate semantics"
  );
  assert.equal(
    performanceErrors.includes("goalOpsAutoZeroDateRequired"),
    true,
    "performance error catalog should register shared goal-ops-auto-zero-date-required semantics"
  );
  assert.equal(
    performanceErrors.includes("goalOpsQueryDateRequired"),
    true,
    "performance error catalog should register shared goal-ops-query-date-required semantics"
  );
  assert.equal(
    performanceErrors.includes("goalOpsResultSubmitStateDenied"),
    true,
    "performance error catalog should register shared goal-ops-result-submit-state-denied semantics"
  );
  assert.equal(
    performanceErrors.includes("feedbackSummaryDraftDenied"),
    true,
    "performance error catalog should register shared feedback-summary-draft-denied semantics"
  );
  assert.equal(
    performanceErrors.includes("feedbackTaskClosed"),
    true,
    "performance error catalog should register shared feedback-task-closed semantics"
  );
  assert.equal(
    performanceErrors.includes("resumeImportOverwriteStateDenied"),
    true,
    "performance error catalog should register shared resume-import-overwrite-state-denied semantics"
  );
  assert.equal(
    performanceErrors.includes("resumeUploadAttachmentStateDenied"),
    true,
    "performance error catalog should register shared resume-upload-attachment-state-denied semantics"
  );
  assert.equal(
    performanceErrors.includes("resumeConvertTalentAssetStateDenied"),
    true,
    "performance error catalog should register shared resume-convert-talent-asset-state-denied semantics"
  );
  assert.equal(
    performanceErrors.includes("resumeAttachmentFileNotFound"),
    true,
    "performance error catalog should register shared resume-attachment-file-not-found semantics"
  );
  assert.equal(
    performanceErrors.includes("resumeStatusInvalid"),
    true,
    "performance error catalog should register shared resume-status-invalid semantics"
  );
  assert.equal(
    performanceErrors.includes("resumeSourceTypeInvalid"),
    true,
    "performance error catalog should register shared resume-source-type-invalid semantics"
  );
  assert.equal(
    performanceErrors.includes("resumeExternalLinkExternalOnly"),
    true,
    "performance error catalog should register shared resume-external-link-external-only semantics"
  );
  assert.equal(
    performanceErrors.includes("resumeCreateNewOnly"),
    true,
    "performance error catalog should register shared resume-create-new-only semantics"
  );
  assert.equal(
    performanceErrors.includes("resumeInterviewTransitionActionRequired"),
    true,
    "performance error catalog should register shared resume-interview-transition-action-required semantics"
  );
  assert.equal(
    performanceErrors.includes("resumeInterviewPositionRequired"),
    true,
    "performance error catalog should register shared resume-interview-position-required semantics"
  );
  assert.equal(
    performanceErrors.includes("resumeRecruitPlanDepartmentMismatch"),
    true,
    "performance error catalog should register shared resume-recruit-plan-department-mismatch semantics"
  );
  assert.equal(
    performanceErrors.includes("resumeJobStandardDepartmentMismatch"),
    true,
    "performance error catalog should register shared resume-job-standard-department-mismatch semantics"
  );
  assert.equal(
    performanceErrors.includes("resumeOperateDenied"),
    true,
    "performance error catalog should register shared resume-operate-denied semantics"
  );
  assert.equal(
    performanceErrors.includes("purchaseOrderSubmitInquiryStateDenied"),
    true,
    "performance error catalog should register shared purchase-order-submit-inquiry-state-denied semantics"
  );
  assert.equal(
    performanceErrors.includes("purchaseOrderSubmitApprovalStateDenied"),
    true,
    "performance error catalog should register shared purchase-order-submit-approval-state-denied semantics"
  );
  assert.equal(
    performanceErrors.includes("purchaseOrderApproveStateDenied"),
    true,
    "performance error catalog should register shared purchase-order-approve-state-denied semantics"
  );
  assert.equal(
    performanceErrors.includes("purchaseOrderRejectStateDenied"),
    true,
    "performance error catalog should register shared purchase-order-reject-state-denied semantics"
  );
  assert.equal(
    performanceErrors.includes("purchaseOrderReceiveStateDenied"),
    true,
    "performance error catalog should register shared purchase-order-receive-state-denied semantics"
  );
  assert.equal(
    performanceErrors.includes("purchaseOrderStatusInvalid"),
    true,
    "performance error catalog should register shared purchase-order-status-invalid semantics"
  );
  assert.equal(
    performanceErrors.includes("purchaseOrderCurrencyInvalid"),
    true,
    "performance error catalog should register shared purchase-order-currency-invalid semantics"
  );
  assert.equal(
    performanceErrors.includes("purchaseOrderTotalAmountInvalid"),
    true,
    "performance error catalog should register shared purchase-order-total-amount-invalid semantics"
  );
  assert.equal(
    performanceErrors.includes("purchaseOrderItemsInvalid"),
    true,
    "performance error catalog should register shared purchase-order-items-invalid semantics"
  );
  assert.equal(
    performanceErrors.includes("purchaseOrderOrderNoDuplicate"),
    true,
    "performance error catalog should register shared purchase-order-order-no-duplicate semantics"
  );
  assert.equal(
    performanceErrors.includes("purchaseOrderRequesterNotFound"),
    true,
    "performance error catalog should register shared purchase-order-requester-not-found semantics"
  );
  assert.equal(
    performanceErrors.includes("purchaseOrderStatusActionRequired"),
    true,
    "performance error catalog should register shared purchase-order-status-action-required semantics"
  );
  assert.equal(
    performanceErrors.includes("purchaseOrderReceiptQuantityExceeded"),
    true,
    "performance error catalog should register shared purchase-order-receipt-quantity-exceeded semantics"
  );
  assert.equal(
    performanceErrors.includes("jsonFieldInvalid"),
    true,
    "performance error catalog should register shared json-field-invalid semantics"
  );
  assert.equal(
    performanceErrors.includes("teacherClassCreatePartneredOnly"),
    true,
    "performance error catalog should register shared teacher-class-create-partnered-only semantics"
  );
  assert.equal(
    performanceErrors.includes("teacherClassDeleteDraftOnly"),
    true,
    "performance error catalog should register shared teacher-class-delete-draft-only semantics"
  );
  assert.equal(
    performanceErrors.includes("teacherClassDraftTransitionOnly"),
    true,
    "performance error catalog should register shared teacher-class-draft-transition-only semantics"
  );
  assert.equal(
    performanceErrors.includes("teacherClassActionNotAllowed"),
    true,
    "performance error catalog should register shared teacher-class-action-not-allowed semantics"
  );
  assert.equal(
    performanceErrors.includes("teacherNegotiatingTransitionDenied"),
    true,
    "performance error catalog should register shared teacher-negotiating-transition-denied semantics"
  );
  assert.equal(
    performanceErrors.includes("teacherTerminateRoleDenied"),
    true,
    "performance error catalog should register shared teacher-terminate-role-denied semantics"
  );
  assert.equal(
    performanceErrors.includes("teacherTerminatePartneredOnly"),
    true,
    "performance error catalog should register shared teacher-terminate-partnered-only semantics"
  );
  assert.equal(
    performanceErrors.includes("teacherStatusActionUnsupported"),
    true,
    "performance error catalog should register shared teacher-status-action-unsupported semantics"
  );
  assert.equal(
    performanceErrors.includes("teacherCooperationMarkFollowRequired"),
    true,
    "performance error catalog should register shared teacher-cooperation-mark-follow-required semantics"
  );
  assert.equal(
    performanceErrors.includes("teacherCooperationMarkStateDenied"),
    true,
    "performance error catalog should register shared teacher-cooperation-mark-state-denied semantics"
  );
  assert.equal(
    performanceErrors.includes("teacherClassCreateTerminatedDenied"),
    true,
    "performance error catalog should register shared teacher-class-create-terminated-denied semantics"
  );
  assert.equal(
    performanceErrors.includes("teacherCooperationStatusInvalid"),
    true,
    "performance error catalog should register shared teacher-cooperation-status-invalid semantics"
  );
  assert.equal(
    performanceErrors.includes("teacherClassStatusInvalid"),
    true,
    "performance error catalog should register shared teacher-class-status-invalid semantics"
  );
  assert.equal(
    performanceErrors.includes("teacherCooperationStatusPresetDenied"),
    true,
    "performance error catalog should register shared teacher-cooperation-status-preset-denied semantics"
  );
  assert.equal(
    performanceErrors.includes("teacherAssignDenied"),
    true,
    "performance error catalog should register shared teacher-assign-denied semantics"
  );
  assert.equal(
    performanceErrors.includes("teacherAssignTargetDepartmentDenied"),
    true,
    "performance error catalog should register shared teacher-assign-target-department-denied semantics"
  );
  assert.equal(
    performanceErrors.includes("teacherClassCloseRoleDenied"),
    true,
    "performance error catalog should register shared teacher-class-close-role-denied semantics"
  );
  assert.equal(
    performanceErrors.includes("teacherAgentStatusInvalid"),
    true,
    "performance error catalog should register shared teacher-agent-status-invalid semantics"
  );
  assert.equal(
    performanceErrors.includes("teacherAgentBlacklistStatusInvalid"),
    true,
    "performance error catalog should register shared teacher-agent-blacklist-status-invalid semantics"
  );
  assert.equal(
    performanceErrors.includes("teacherAgentRelationStatusInvalid"),
    true,
    "performance error catalog should register shared teacher-agent-relation-status-invalid semantics"
  );
  assert.equal(
    performanceErrors.includes("teacherAgentAuditViewDenied"),
    true,
    "performance error catalog should register shared teacher-agent-audit-view-denied semantics"
  );
  assert.equal(
    performanceErrors.includes("teacherAgentRelationSelfLoopDenied"),
    true,
    "performance error catalog should register shared teacher-agent-relation-self-loop-denied semantics"
  );
  assert.equal(
    performanceErrors.includes("teacherAgentRelationTargetInactive"),
    true,
    "performance error catalog should register shared teacher-agent-relation-target-inactive semantics"
  );
  assert.equal(
    performanceErrors.includes("teacherAgentCycleDenied"),
    true,
    "performance error catalog should register shared teacher-agent-cycle-denied semantics"
  );
  assert.equal(
    performanceErrors.includes("teacherAttributionStatusInvalid"),
    true,
    "performance error catalog should register shared teacher-attribution-status-invalid semantics"
  );
  assert.equal(
    performanceErrors.includes("teacherAttributionConflictResolveDenied"),
    true,
    "performance error catalog should register shared teacher-attribution-conflict-resolve-denied semantics"
  );
  assert.equal(
    performanceErrors.includes("teacherAttributionCreateTerminatedDenied"),
    true,
    "performance error catalog should register shared teacher-attribution-create-terminated-denied semantics"
  );
  assert.equal(
    performanceErrors.includes("teacherAttributionAssignExistingDenied"),
    true,
    "performance error catalog should register shared teacher-attribution-assign-existing-denied semantics"
  );
  assert.equal(
    performanceErrors.includes("teacherAttributionAgentInactive"),
    true,
    "performance error catalog should register shared teacher-attribution-agent-inactive semantics"
  );
  assert.equal(
    performanceErrors.includes("teacherAttributionAgentBlacklisted"),
    true,
    "performance error catalog should register shared teacher-attribution-agent-blacklisted semantics"
  );
  assert.equal(
    performanceErrors.includes("teacherAttributionConflictStatusInvalid"),
    true,
    "performance error catalog should register shared teacher-attribution-conflict-status-invalid semantics"
  );
  assert.equal(
    performanceErrors.includes("teacherAttributionConflictClosed"),
    true,
    "performance error catalog should register shared teacher-attribution-conflict-closed semantics"
  );
  assert.equal(
    performanceErrors.includes("teacherAttributionConflictResolutionInvalid"),
    true,
    "performance error catalog should register shared teacher-attribution-conflict-resolution-invalid semantics"
  );
  assert.equal(
    performanceErrors.includes("teacherCurrentAttributionMissing"),
    true,
    "performance error catalog should register shared teacher-current-attribution-missing semantics"
  );
  assert.equal(
    performanceErrors.includes("suggestionLinkedEntityTypeMismatch"),
    true,
    "performance error catalog should register shared suggestion-linked-entity-type-mismatch semantics"
  );
  assert.equal(
    performanceErrors.includes("suggestionAcceptedOnly"),
    true,
    "performance error catalog should register shared suggestion-accepted-only semantics"
  );
  assert.equal(
    performanceErrors.includes("suggestionEmployeeMismatch"),
    true,
    "performance error catalog should register shared suggestion-employee-mismatch semantics"
  );
  assert.equal(
    performanceErrors.includes("suggestionAssessmentMismatch"),
    true,
    "performance error catalog should register shared suggestion-assessment-mismatch semantics"
  );
  assert.equal(
    performanceErrors.includes("suggestionAlreadyLinked"),
    true,
    "performance error catalog should register shared suggestion-already-linked semantics"
  );
  assert.equal(
    performanceErrors.includes("readonlyWriteDenied"),
    true,
    "performance error catalog should register shared readonly-write-denied semantics"
  );
  assert.equal(
    performanceErrors.includes("resourceNotFound"),
    true,
    "performance error catalog should register shared resource-not-found semantics"
  );
  assert.equal(
    performanceErrors.includes("employeeNotFound"),
    true,
    "performance error catalog should register shared employee-not-found semantics"
  );
  assert.equal(
    performanceErrors.includes("assessmentNotFound"),
    true,
    "performance error catalog should register shared assessment-not-found semantics"
  );
  assert.equal(
    performanceErrors.includes("resumeNotFound"),
    true,
    "performance error catalog should register shared resume-not-found semantics"
  );
  assert.equal(
    performanceErrors.includes("recruitPlanNotFound"),
    true,
    "performance error catalog should register shared recruit-plan-not-found semantics"
  );
  assert.equal(
    performanceErrors.includes("jobStandardNotFound"),
    true,
    "performance error catalog should register shared job-standard-not-found semantics"
  );
  assert.equal(
    performanceErrors.includes("jobStandardInactiveEditDenied"),
    true,
    "performance error catalog should register shared job-standard-inactive-edit-denied semantics"
  );
  assert.equal(
    performanceErrors.includes("jobStandardIdInvalid"),
    true,
    "performance error catalog should register shared job-standard-id-invalid semantics"
  );
  assert.equal(
    performanceErrors.includes("jobStandardTransitionDenied"),
    true,
    "performance error catalog should register shared job-standard-transition-denied semantics"
  );
  assert.equal(
    performanceErrors.includes("jobStandardPositionNameRequired"),
    true,
    "performance error catalog should register shared job-standard-position-name-required semantics"
  );
  assert.equal(
    performanceErrors.includes("jobStandardCreateDraftOnly"),
    true,
    "performance error catalog should register shared job-standard-create-draft-only semantics"
  );
  assert.equal(
    performanceErrors.includes("jobStandardStatusActionRequired"),
    true,
    "performance error catalog should register shared job-standard-status-action-required semantics"
  );
  assert.equal(
    performanceErrors.includes("jobStandardStatusInvalid"),
    true,
    "performance error catalog should register shared job-standard-status-invalid semantics"
  );
  assert.equal(
    performanceErrors.includes("talentAssetNotFound"),
    true,
    "performance error catalog should register shared talent-asset-not-found semantics"
  );
  assert.equal(
    performanceErrors.includes("sourceSuggestionNotFound"),
    true,
    "performance error catalog should register shared source-suggestion-not-found semantics"
  );
  assert.equal(
    performanceErrors.includes("attachmentNotFound"),
    true,
    "performance error catalog should register shared attachment-not-found semantics"
  );
  assert.equal(
    performanceErrors.includes("departmentNotFound"),
    true,
    "performance error catalog should register shared department-not-found semantics"
  );
  assert.equal(
    performanceErrors.includes("targetDepartmentNotFound"),
    true,
    "performance error catalog should register shared target-department-not-found semantics"
  );
  assert.equal(
    performanceErrors.includes("supplierNotFound"),
    true,
    "performance error catalog should register shared supplier-not-found semantics"
  );
  assert.equal(
    performanceErrors.includes("assetNotFound"),
    true,
    "performance error catalog should register shared asset-not-found semantics"
  );
  assert.equal(
    performanceErrors.includes("purchaseOrderNotFound"),
    true,
    "performance error catalog should register shared purchase-order-not-found semantics"
  );
  assert.equal(
    performanceErrors.includes("assetAssignmentRequestNotFound"),
    true,
    "performance error catalog should register shared asset-assignment-request-not-found semantics"
  );
  assert.equal(
    performanceErrors.includes("assetAssignmentRecordNotFound"),
    true,
    "performance error catalog should register shared asset-assignment-record-not-found semantics"
  );
  assert.equal(
    performanceErrors.includes("assetMaintenanceRecordNotFound"),
    true,
    "performance error catalog should register shared asset-maintenance-record-not-found semantics"
  );
  assert.equal(
    performanceErrors.includes("materialCatalogNotFound"),
    true,
    "performance error catalog should register shared material-catalog-not-found semantics"
  );
  assert.equal(
    performanceErrors.includes("approvalInstanceNotFound"),
    true,
    "performance error catalog should register shared approval-instance-not-found semantics"
  );
  assert.equal(
    performanceErrors.includes("assetProcurementNotFound"),
    true,
    "performance error catalog should register shared asset-procurement-not-found semantics"
  );
  assert.equal(
    performanceErrors.includes("assetTransferNotFound"),
    true,
    "performance error catalog should register shared asset-transfer-not-found semantics"
  );
  assert.equal(
    performanceErrors.includes("assetInventoryNotFound"),
    true,
    "performance error catalog should register shared asset-inventory-not-found semantics"
  );
  assert.equal(
    performanceErrors.includes("assetDisposalNotFound"),
    true,
    "performance error catalog should register shared asset-disposal-not-found semantics"
  );
  assert.equal(
    performanceErrors.includes("materialInboundNotFound"),
    true,
    "performance error catalog should register shared material-inbound-not-found semantics"
  );
  assert.equal(
    performanceErrors.includes("materialIssueNotFound"),
    true,
    "performance error catalog should register shared material-issue-not-found semantics"
  );
  assert.equal(
    performanceErrors.includes("goalOpsReportNotFound"),
    true,
    "performance error catalog should register shared goal-ops-report-not-found semantics"
  );
  assert.equal(
    accessContext.includes("PERFORMANCE_DOMAIN_ERROR_CODES"),
    true,
    "access-context should read error codes from performance domain"
  );
  assert.equal(
    accessContext.includes("resolvePerformanceDomainErrorMessage"),
    true,
    "access-context should read error messages from performance domain"
  );
  assert.equal(
    approvalFlowHelper.includes("PERFORMANCE_DOMAIN_ERROR_CODES"),
    true,
    "approval-flow helper should read error codes from performance domain"
  );
  assert.equal(
    approvalFlowHelper.includes("resolvePerformanceDomainErrorMessage"),
    true,
    "approval-flow helper should read error messages from performance domain"
  );
  assert.equal(
    approvalFlowHelper.includes("PERFORMANCE_DOMAIN_ERROR_CODES.numericFieldInvalid"),
    true,
    "approval-flow helper should read shared numeric-field-invalid semantics from performance domain"
  );
  assert.equal(
    approvalFlowHelper.includes("'数字字段不合法'"),
    false,
    "approval-flow helper should not hardcode shared numeric-field-invalid messages"
  );
  assert.equal(
    assessmentHelper.includes("PERFORMANCE_DOMAIN_ERROR_CODES"),
    true,
    "assessment helper should read error codes from performance domain"
  );
  assert.equal(
    assessmentHelper.includes("resolvePerformanceDomainErrorMessage"),
    true,
    "assessment helper should read error messages from performance domain"
  );
  assert.equal(
    approvalFlowService.includes("resolvePerformanceDomainErrorMessage"),
    true,
    "approval-flow service should read auth-context error messages from performance domain"
  );
  assert.equal(
    approvalFlowService.includes("PERFORMANCE_DOMAIN_ERROR_CODES.assetAssignmentRequestNotFound"),
    true,
    "approval-flow service should read shared asset-assignment-request-not-found semantics from performance domain"
  );
  assert.equal(
    approvalFlowService.includes("PERFORMANCE_DOMAIN_ERROR_CODES.approvalInstanceNotFound"),
    true,
    "approval-flow service should read shared approval-instance-not-found semantics from performance domain"
  );
  assert.equal(
    assetDomainService.includes("resolvePerformanceDomainErrorMessage"),
    true,
    "asset-domain service should read auth-context error messages from performance domain"
  );
  assert.equal(
    assetDomainService.includes("PERFORMANCE_DOMAIN_ERROR_CODES.employeeDepartmentNotFound"),
    true,
    "asset-domain service should map applicant-department missing semantics to shared employee-department-not-found code"
  );
  assert.equal(
    assetDomainService.includes("PERFORMANCE_DOMAIN_ERROR_CODES.targetDepartmentRequired"),
    true,
    "asset-domain service should read shared target-department-required semantics from performance domain"
  );
  assert.equal(
    assetDomainService.includes("PERFORMANCE_DOMAIN_ERROR_CODES.assetNotFound"),
    true,
    "asset-domain service should read shared asset-not-found semantics from performance domain"
  );
  assert.equal(
    assetDomainService.includes("PERFORMANCE_DOMAIN_ERROR_CODES.purchaseOrderNotFound"),
    true,
    "asset-domain service should read shared purchase-order-not-found semantics from performance domain"
  );
  assert.equal(
    assetDomainService.includes("PERFORMANCE_DOMAIN_ERROR_CODES.assetAssignmentRequestNotFound"),
    true,
    "asset-domain service should read shared asset-assignment-request-not-found semantics from performance domain"
  );
  assert.equal(
    assetDomainService.includes("PERFORMANCE_DOMAIN_ERROR_CODES.assetAssignmentRecordNotFound"),
    true,
    "asset-domain service should read shared asset-assignment-record-not-found semantics from performance domain"
  );
  assert.equal(
    assetDomainService.includes("PERFORMANCE_DOMAIN_ERROR_CODES.assetMaintenanceRecordNotFound"),
    true,
    "asset-domain service should read shared asset-maintenance-record-not-found semantics from performance domain"
  );
  assert.equal(
    assetDomainService.includes("PERFORMANCE_DOMAIN_ERROR_CODES.stateDraftEditOnly"),
    true,
    "asset-domain service should read shared draft-edit-only state semantics from performance domain"
  );
  assert.equal(
    assetDomainService.includes("PERFORMANCE_DOMAIN_ERROR_CODES.stateDraftSubmitOnly"),
    true,
    "asset-domain service should read shared draft-submit-only state semantics from performance domain"
  );
  assert.equal(
    assetDomainService.includes("PERFORMANCE_DOMAIN_ERROR_CODES.stateCancelNotAllowed"),
    true,
    "asset-domain service should read shared cancel-not-allowed state semantics from performance domain"
  );
  assert.equal(
    assetDomainService.includes("PERFORMANCE_DOMAIN_ERROR_CODES.stateSubmittedReceiveOnly"),
    true,
    "asset-domain service should read shared submitted-receive-only state semantics from performance domain"
  );
  assert.equal(
    assetDomainService.includes("PERFORMANCE_DOMAIN_ERROR_CODES.stateSubmittedApproveOnly"),
    true,
    "asset-domain service should read shared submitted-approve-only state semantics from performance domain"
  );
  assert.equal(
    assetDomainService.includes("PERFORMANCE_DOMAIN_ERROR_CODES.stateApprovedExecuteOnly"),
    true,
    "asset-domain service should read shared approved-execute-only state semantics from performance domain"
  );
  assert.equal(
    assetDomainService.includes("PERFORMANCE_DOMAIN_ERROR_CODES.assetProcurementNotFound"),
    true,
    "asset-domain service should read shared asset-procurement-not-found semantics from performance domain"
  );
  assert.equal(
    assetDomainService.includes("PERFORMANCE_DOMAIN_ERROR_CODES.assetTransferNotFound"),
    true,
    "asset-domain service should read shared asset-transfer-not-found semantics from performance domain"
  );
  assert.equal(
    assetDomainService.includes("PERFORMANCE_DOMAIN_ERROR_CODES.assetInventoryNotFound"),
    true,
    "asset-domain service should read shared asset-inventory-not-found semantics from performance domain"
  );
  assert.equal(
    assetDomainService.includes("PERFORMANCE_DOMAIN_ERROR_CODES.assetDisposalNotFound"),
    true,
    "asset-domain service should read shared asset-disposal-not-found semantics from performance domain"
  );
  assert.equal(
    assetDomainService.includes("PERFORMANCE_DOMAIN_ERROR_CODES.assetNoDuplicate"),
    true,
    "asset-domain service should read shared asset-no-duplicate semantics from performance domain"
  );
  assert.equal(
    resumePoolService.includes("resolvePerformanceDomainErrorMessage"),
    true,
    "resumePool service should read auth-context error messages from performance domain"
  );
  assert.equal(
    resumePoolServiceUpdated.includes("PERFORMANCE_DOMAIN_ERROR_CODES.targetDepartmentRequired"),
    true,
    "resumePool service should read shared target-department-required semantics from performance domain"
  );
  assert.equal(
    resumePoolServiceUpdated.includes("PERFORMANCE_DOMAIN_ERROR_CODES.employeeNotFound"),
    true,
    "resumePool service should map current-login-user missing semantics to shared employee-not-found code"
  );
  assert.equal(
    resumePoolServiceUpdated.includes("'数据不存在'"),
    false,
    "resumePool service should not hardcode resource-not-found messages"
  );
  assert.equal(
    resumePoolServiceUpdated.includes("'当前状态不允许执行该操作'"),
    false,
    "resumePool service should not hardcode shared state-action-not-allowed messages"
  );
  assert.equal(
    resumePoolServiceUpdated.includes("'当前状态不允许编辑'"),
    false,
    "resumePool service should not hardcode shared state-edit-not-allowed messages"
  );
  assert.equal(
    resumePoolServiceUpdated.includes("'目标部门不能为空'"),
    false,
    "resumePool service should not hardcode shared target-department-required messages"
  );
  assert.equal(
    talentAssetService.includes("PERFORMANCE_DOMAIN_ERROR_CODES"),
    true,
    "talentAsset service should read shared error codes from performance domain"
  );
  assert.equal(
    talentAssetService.includes("resolvePerformanceDomainErrorMessage"),
    true,
    "talentAsset service should read shared error messages from performance domain"
  );
  assert.equal(
    talentAssetService.includes("PERFORMANCE_DOMAIN_ERROR_CODES.targetDepartmentRequired"),
    true,
    "talentAsset service should read shared target-department-required semantics from performance domain"
  );
  assert.equal(
    talentAssetService.includes("'数据不存在'"),
    false,
    "talentAsset service should not hardcode resource-not-found messages"
  );
  assert.equal(
    talentAssetService.includes("'当前状态不允许执行该操作'"),
    false,
    "talentAsset service should not hardcode shared state-action-not-allowed messages"
  );
  assert.equal(
    talentAssetService.includes("'当前状态不允许编辑'"),
    false,
    "talentAsset service should not hardcode shared state-edit-not-allowed messages"
  );
  assert.equal(
    talentAssetService.includes("'当前状态不允许删除'"),
    false,
    "talentAsset service should not hardcode shared state-delete-not-allowed messages"
  );
  assert.equal(
    talentAssetService.includes("'目标部门不能为空'"),
    false,
    "talentAsset service should not hardcode shared target-department-required messages"
  );
  assert.equal(
    contractService.includes("PERFORMANCE_DOMAIN_ERROR_CODES"),
    true,
    "contract service should read shared error codes from performance domain"
  );
  assert.equal(
    contractService.includes("resolvePerformanceDomainErrorMessage"),
    true,
    "contract service should read shared error messages from performance domain"
  );
  assert.equal(
    contractService.includes("PERFORMANCE_DOMAIN_ERROR_CODES.contractCreateDraftOnly"),
    true,
    "contract service should read shared contract-create-draft-only semantics from performance domain"
  );
  assert.equal(
    contractService.includes("PERFORMANCE_DOMAIN_ERROR_CODES.contractTypeInvalid"),
    true,
    "contract service should read shared contract-type-invalid semantics from performance domain"
  );
  assert.equal(
    contractService.includes("PERFORMANCE_DOMAIN_ERROR_CODES.contractStatusInvalid"),
    true,
    "contract service should read shared contract-status-invalid semantics from performance domain"
  );
  assert.equal(
    contractService.includes("PERFORMANCE_DOMAIN_ERROR_CODES.contractProbationInvalid"),
    true,
    "contract service should read shared contract-probation-invalid semantics from performance domain"
  );
  assert.equal(
    contractService.includes("PERFORMANCE_DOMAIN_ERROR_CODES.contractSalaryInvalid"),
    true,
    "contract service should read shared contract-salary-invalid semantics from performance domain"
  );
  assert.equal(
    contractService.includes("PERFORMANCE_DOMAIN_ERROR_CODES.contractDateRangeInvalid"),
    true,
    "contract service should read shared contract-date-range-invalid semantics from performance domain"
  );
  assert.equal(
    contractService.includes("'数据不存在'"),
    false,
    "contract service should not hardcode resource-not-found messages"
  );
  assert.equal(
    contractService.includes("'员工不存在'"),
    false,
    "contract service should not hardcode employee-not-found messages"
  );
  assert.equal(
    contractService.includes("'当前状态不允许执行该操作'"),
    false,
    "contract service should not hardcode shared state-action-not-allowed messages"
  );
  assert.equal(
    contractService.includes("'当前状态不允许编辑'"),
    false,
    "contract service should not hardcode shared state-edit-not-allowed messages"
  );
  assert.equal(
    contractService.includes("'当前状态不允许删除'"),
    false,
    "contract service should not hardcode shared state-delete-not-allowed messages"
  );
  assert.equal(
    contractService.includes("'部门不存在'"),
    false,
    "contract service should not hardcode department-not-found messages"
  );
  assert.equal(
    contractService.includes("'新增合同状态只能为 draft'"),
    false,
    "contract service should not hardcode shared contract-create-draft-only messages"
  );
  assert.equal(
    contractService.includes("'合同类型不合法'"),
    false,
    "contract service should not hardcode shared contract-type-invalid messages"
  );
  assert.equal(
    contractService.includes("'合同状态不合法'"),
    false,
    "contract service should not hardcode shared contract-status-invalid messages"
  );
  assert.equal(
    contractService.includes("'试用期不合法'"),
    false,
    "contract service should not hardcode shared contract-probation-invalid messages"
  );
  assert.equal(
    contractService.includes("'薪资金额不合法'"),
    false,
    "contract service should not hardcode shared contract-salary-invalid messages"
  );
  assert.equal(
    contractService.includes("'结束日期必须晚于开始日期'"),
    false,
    "contract service should not hardcode shared contract-date-range-invalid messages"
  );
  assert.equal(
    salaryService.includes("PERFORMANCE_DOMAIN_ERROR_CODES"),
    true,
    "salary service should read shared error codes from performance domain"
  );
  assert.equal(
    salaryService.includes("resolvePerformanceDomainErrorMessage"),
    true,
    "salary service should read shared error messages from performance domain"
  );
  assert.equal(
    salaryService.includes("PERFORMANCE_DOMAIN_ERROR_CODES.salaryConfirmedEditDenied"),
    true,
    "salary service should read shared salary-confirmed-edit-denied semantics from performance domain"
  );
  assert.equal(
    salaryService.includes("PERFORMANCE_DOMAIN_ERROR_CODES.salaryChangeReasonRequired"),
    true,
    "salary service should read shared salary-change-reason-required semantics from performance domain"
  );
  assert.equal(
    salaryService.includes("PERFORMANCE_DOMAIN_ERROR_CODES.salaryPeriodRequired"),
    true,
    "salary service should read shared salary-period-required semantics from performance domain"
  );
  assert.equal(
    salaryService.includes("PERFORMANCE_DOMAIN_ERROR_CODES.salaryEffectiveDateRequired"),
    true,
    "salary service should read shared salary-effective-date-required semantics from performance domain"
  );
  assert.equal(
    salaryService.includes("'数据不存在'"),
    false,
    "salary service should not hardcode resource-not-found messages"
  );
  assert.equal(
    salaryService.includes("'员工不存在'"),
    false,
    "salary service should not hardcode employee-not-found messages"
  );
  assert.equal(
    salaryService.includes("'评估单不存在'"),
    false,
    "salary service should not hardcode assessment-not-found messages"
  );
  assert.equal(
    salaryService.includes("'当前状态不允许执行该操作'"),
    false,
    "salary service should not hardcode shared state-action-not-allowed messages"
  );
  assert.equal(
    salaryService.includes("'已确认薪资不允许直接修改金额'"),
    false,
    "salary service should not hardcode shared salary-confirmed-edit-denied messages"
  );
  assert.equal(
    salaryService.includes("'调整原因不能为空'"),
    false,
    "salary service should not hardcode shared salary-change-reason-required messages"
  );
  assert.equal(
    salaryService.includes("'期间不能为空'"),
    false,
    "salary service should not hardcode shared salary-period-required messages"
  );
  assert.equal(
    salaryService.includes("'生效日期不能为空'"),
    false,
    "salary service should not hardcode shared salary-effective-date-required messages"
  );
  assert.equal(
    salaryService.includes("PERFORMANCE_DOMAIN_ERROR_CODES.employeeRequired"),
    true,
    "salary service should read shared employee-required semantics from performance domain"
  );
  assert.equal(
    salaryService.includes("'员工不能为空'"),
    false,
    "salary service should not hardcode shared employee-required messages"
  );
  assert.equal(
    suggestionHelper.includes("PERFORMANCE_DOMAIN_ERROR_CODES"),
    true,
    "suggestion helper should read shared error codes from performance domain"
  );
  assert.equal(
    suggestionHelper.includes("resolvePerformanceDomainErrorMessage"),
    true,
    "suggestion helper should read shared error messages from performance domain"
  );
  assert.equal(
    suggestionHelper.includes("'当前状态不允许执行该操作'"),
    false,
    "suggestion helper should not hardcode shared state-action-not-allowed messages"
  );
  assert.equal(
    suggestionHelper.includes("PERFORMANCE_DOMAIN_ERROR_CODES.suggestionRevokeHrOnly"),
    true,
    "suggestion helper should read shared suggestion-revoke-hr-only semantics from performance domain"
  );
  assert.equal(
    suggestionHelper.includes("'只有 HR 可以撤销建议'"),
    false,
    "suggestion helper should not hardcode shared suggestion-revoke-hr-only messages"
  );
  assert.equal(
    suggestionHelper.includes("PERFORMANCE_DOMAIN_ERROR_CODES.suggestionActionUnsupported"),
    true,
    "suggestion helper should read shared suggestion-action-unsupported semantics from performance domain"
  );
  assert.equal(
    suggestionHelper.includes("'不支持的建议动作'"),
    false,
    "suggestion helper should not hardcode shared suggestion-action-unsupported messages"
  );
  assert.equal(
    goalHelper.includes("PERFORMANCE_DOMAIN_ERROR_CODES"),
    true,
    "goal helper should read shared error codes from performance domain"
  );
  assert.equal(
    goalHelper.includes("resolvePerformanceDomainErrorMessage"),
    true,
    "goal helper should read shared error messages from performance domain"
  );
  assert.equal(
    goalHelper.includes("PERFORMANCE_DOMAIN_ERROR_CODES.targetValuePositive"),
    true,
    "goal helper should read shared target-value-positive semantics from performance domain"
  );
  assert.equal(
    goalHelper.includes("PERFORMANCE_DOMAIN_ERROR_CODES.dateRangeRequired"),
    true,
    "goal helper should read shared date-range-required semantics from performance domain"
  );
  assert.equal(
    goalHelper.includes("PERFORMANCE_DOMAIN_ERROR_CODES.dateRangeInvalid"),
    true,
    "goal helper should read shared date-range-invalid semantics from performance domain"
  );
  assert.equal(
    goalHelper.includes("PERFORMANCE_DOMAIN_ERROR_CODES.goalCurrentValueNonNegative"),
    true,
    "goal helper should read shared goal-current-value-non-negative semantics from performance domain"
  );
  assert.equal(
    goalHelper.includes("PERFORMANCE_DOMAIN_ERROR_CODES.goalCompletedRollbackDenied"),
    true,
    "goal helper should read shared goal-completed-rollback-denied semantics from performance domain"
  );
  assert.equal(
    goalHelper.includes("PERFORMANCE_DOMAIN_ERROR_CODES.goalCompletedProgressUpdateDenied"),
    true,
    "goal helper should read shared goal-completed-progress-update-denied semantics from performance domain"
  );
  assert.equal(
    goalHelper.includes("PERFORMANCE_DOMAIN_ERROR_CODES.goalCancelledProgressUpdateDenied"),
    true,
    "goal helper should read shared goal-cancelled-progress-update-denied semantics from performance domain"
  );
  assert.equal(
    goalHelper.includes("PERFORMANCE_DOMAIN_ERROR_CODES.goalEditStateDenied"),
    true,
    "goal helper should read shared goal-edit-state-denied semantics from performance domain"
  );
  assert.equal(
    goalHelper.includes("'目标值必须大于 0'"),
    false,
    "goal helper should not hardcode shared target-value-positive messages"
  );
  assert.equal(
    goalHelper.includes("'开始日期和结束日期不能为空'"),
    false,
    "goal helper should not hardcode shared date-range-required messages"
  );
  assert.equal(
    goalHelper.includes("'开始日期不能晚于结束日期'"),
    false,
    "goal helper should not hardcode shared date-range-invalid messages"
  );
  assert.equal(
    goalHelper.includes("'当前值不能小于 0'"),
    false,
    "goal helper should not hardcode shared goal-current-value-non-negative messages"
  );
  assert.equal(
    goalHelper.includes("'已完成目标不能回退为进行中'"),
    false,
    "goal helper should not hardcode shared goal-completed-rollback-denied messages"
  );
  assert.equal(
    goalHelper.includes("'已完成目标不能继续更新进度'"),
    false,
    "goal helper should not hardcode shared goal-completed-progress-update-denied messages"
  );
  assert.equal(
    goalHelper.includes("'已取消目标不能继续更新进度'"),
    false,
    "goal helper should not hardcode shared goal-cancelled-progress-update-denied messages"
  );
  assert.equal(
    goalHelper.includes("'当前状态不允许编辑目标'"),
    false,
    "goal helper should not hardcode shared goal-edit-state-denied messages"
  );
  assert.equal(
    capabilityService.includes("PERFORMANCE_DOMAIN_ERROR_CODES"),
    true,
    "capability service should read shared error codes from performance domain"
  );
  assert.equal(
    capabilityService.includes("resolvePerformanceDomainErrorMessage"),
    true,
    "capability service should read shared error messages from performance domain"
  );
  assert.equal(
    capabilityService.includes("PERFORMANCE_DOMAIN_ERROR_CODES.employeeIdInvalid"),
    true,
    "capability service should read shared employee-id-invalid semantics from performance domain"
  );
  assert.equal(
    capabilityService.includes("'员工 ID 不合法'"),
    false,
    "capability service should not hardcode shared employee-id-invalid messages"
  );
  assert.equal(
    promotionHelper.includes("PERFORMANCE_DOMAIN_ERROR_CODES"),
    true,
    "promotion helper should read shared error codes from performance domain"
  );
  assert.equal(
    promotionHelper.includes("resolvePerformanceDomainErrorMessage"),
    true,
    "promotion helper should read shared error messages from performance domain"
  );
  assert.equal(
    promotionHelper.includes("'当前状态不允许执行该操作'"),
    false,
    "promotion helper should not hardcode shared state-action-not-allowed messages"
  );
  assert.equal(
    promotionHelper.includes("PERFORMANCE_DOMAIN_ERROR_CODES.employeeRequired"),
    true,
    "promotion helper should read shared employee-required semantics from performance domain"
  );
  assert.equal(
    promotionHelper.includes("PERFORMANCE_DOMAIN_ERROR_CODES.promotionSponsorRequired"),
    true,
    "promotion helper should read shared promotion-sponsor-required semantics from performance domain"
  );
  assert.equal(
    promotionHelper.includes("PERFORMANCE_DOMAIN_ERROR_CODES.promotionFromPositionRequired"),
    true,
    "promotion helper should read shared promotion-from-position-required semantics from performance domain"
  );
  assert.equal(
    promotionHelper.includes("PERFORMANCE_DOMAIN_ERROR_CODES.promotionToPositionRequired"),
    true,
    "promotion helper should read shared promotion-to-position-required semantics from performance domain"
  );
  assert.equal(
    promotionHelper.includes("PERFORMANCE_DOMAIN_ERROR_CODES.promotionIndependentReasonRequired"),
    true,
    "promotion helper should read shared promotion-independent-reason-required semantics from performance domain"
  );
  assert.equal(
    promotionHelper.includes("PERFORMANCE_DOMAIN_ERROR_CODES.promotionDecisionInvalid"),
    true,
    "promotion helper should read shared promotion-decision-invalid semantics from performance domain"
  );
  assert.equal(
    promotionHelper.includes("'员工不能为空'"),
    false,
    "promotion helper should not hardcode shared employee-required messages"
  );
  assert.equal(
    promotionHelper.includes("'发起人不能为空'"),
    false,
    "promotion helper should not hardcode shared promotion-sponsor-required messages"
  );
  assert.equal(
    promotionHelper.includes("'当前岗位不能为空'"),
    false,
    "promotion helper should not hardcode shared promotion-from-position-required messages"
  );
  assert.equal(
    promotionHelper.includes("'目标岗位不能为空'"),
    false,
    "promotion helper should not hardcode shared promotion-to-position-required messages"
  );
  assert.equal(
    promotionHelper.includes("'独立创建时必须填写原因说明'"),
    false,
    "promotion helper should not hardcode shared promotion-independent-reason-required messages"
  );
  assert.equal(
    promotionHelper.includes("'评审结论不正确'"),
    false,
    "promotion helper should not hardcode shared promotion-decision-invalid messages"
  );
  assert.equal(
    courseHelper.includes("PERFORMANCE_DOMAIN_ERROR_CODES"),
    true,
    "course helper should read shared error codes from performance domain"
  );
  assert.equal(
    courseHelper.includes("resolvePerformanceDomainErrorMessage"),
    true,
    "course helper should read shared error messages from performance domain"
  );
  assert.equal(
    courseHelper.includes("PERFORMANCE_DOMAIN_ERROR_CODES.courseStatusInvalid"),
    true,
    "course helper should read shared course-status-invalid semantics from performance domain"
  );
  assert.equal(
    courseHelper.includes("PERFORMANCE_DOMAIN_ERROR_CODES.courseTitleRequired"),
    true,
    "course helper should read shared course-title-required semantics from performance domain"
  );
  assert.equal(
    courseHelper.includes("PERFORMANCE_DOMAIN_ERROR_CODES.courseAddDraftOnly"),
    true,
    "course helper should read shared course-add-draft-only semantics from performance domain"
  );
  assert.equal(
    courseHelper.includes("PERFORMANCE_DOMAIN_ERROR_CODES.coursePublishedTitleEditDenied"),
    true,
    "course helper should read shared course-published-title-edit-denied semantics from performance domain"
  );
  assert.equal(
    courseHelper.includes("PERFORMANCE_DOMAIN_ERROR_CODES.coursePublishedCodeEditDenied"),
    true,
    "course helper should read shared course-published-code-edit-denied semantics from performance domain"
  );
  assert.equal(
    courseHelper.includes("PERFORMANCE_DOMAIN_ERROR_CODES.coursePublishedCategoryEditDenied"),
    true,
    "course helper should read shared course-published-category-edit-denied semantics from performance domain"
  );
  assert.equal(
    courseHelper.includes("PERFORMANCE_DOMAIN_ERROR_CODES.coursePublishedStartDateEditDenied"),
    true,
    "course helper should read shared course-published-start-date-edit-denied semantics from performance domain"
  );
  assert.equal(
    courseHelper.includes("'当前状态不允许编辑'"),
    false,
    "course helper should not hardcode shared state-edit-not-allowed messages"
  );
  assert.equal(
    courseHelper.includes("'当前状态不允许删除'"),
    false,
    "course helper should not hardcode shared state-delete-not-allowed messages"
  );
  assert.equal(
    courseHelper.includes("'课程状态不合法'"),
    false,
    "course helper should not hardcode shared course-status-invalid messages"
  );
  assert.equal(
    courseHelper.includes("'课程标题不能为空'"),
    false,
    "course helper should not hardcode shared course-title-required messages"
  );
  assert.equal(
    courseHelper.includes("'新建课程默认保存为草稿'"),
    false,
    "course helper should not hardcode shared course-add-draft-only messages"
  );
  assert.equal(
    courseHelper.includes("'已发布课程不允许修改标题'"),
    false,
    "course helper should not hardcode shared course-published-title-edit-denied messages"
  );
  assert.equal(
    courseHelper.includes("'已发布课程不允许修改编码'"),
    false,
    "course helper should not hardcode shared course-published-code-edit-denied messages"
  );
  assert.equal(
    courseHelper.includes("'已发布课程不允许修改分类'"),
    false,
    "course helper should not hardcode shared course-published-category-edit-denied messages"
  );
  assert.equal(
    courseHelper.includes("'已发布课程不允许修改开始日期'"),
    false,
    "course helper should not hardcode shared course-published-start-date-edit-denied messages"
  );
  assert.equal(
    capabilityHelper.includes("PERFORMANCE_DOMAIN_ERROR_CODES"),
    true,
    "capability helper should read shared error codes from performance domain"
  );
  assert.equal(
    capabilityHelper.includes("resolvePerformanceDomainErrorMessage"),
    true,
    "capability helper should read shared error messages from performance domain"
  );
  assert.equal(
    capabilityHelper.includes("PERFORMANCE_DOMAIN_ERROR_CODES.stateMissing"),
    true,
    "capability helper should read shared state-missing semantics from performance domain"
  );
  assert.equal(
    capabilityHelper.includes("PERFORMANCE_DOMAIN_ERROR_CODES.stateTransitionTargetNotAllowed"),
    true,
    "capability helper should read shared state-transition-target-not-allowed semantics from performance domain"
  );
  assert.equal(
    capabilityHelper.includes("PERFORMANCE_DOMAIN_ERROR_CODES.capabilityModelStatusInvalid"),
    true,
    "capability helper should read shared capability-model-status-invalid semantics from performance domain"
  );
  assert.equal(
    capabilityHelper.includes("PERFORMANCE_DOMAIN_ERROR_CODES.capabilityModelAddDraftOnly"),
    true,
    "capability helper should read shared capability-model-add-draft-only semantics from performance domain"
  );
  assert.equal(
    capabilityHelper.includes("'当前状态不允许编辑'"),
    false,
    "capability helper should not hardcode shared state-edit-not-allowed messages"
  );
  assert.equal(
    capabilityHelper.includes("'当前状态缺失'"),
    false,
    "capability helper should not hardcode shared state-missing messages"
  );
  assert.equal(
    capabilityHelper.includes("'当前状态不允许流转到目标状态'"),
    false,
    "capability helper should not hardcode shared state-transition-target-not-allowed messages"
  );
  assert.equal(
    capabilityHelper.includes("'能力模型状态不合法'"),
    false,
    "capability helper should not hardcode shared capability-model-status-invalid messages"
  );
  assert.equal(
    capabilityHelper.includes("'新增能力模型状态只能为 draft'"),
    false,
    "capability helper should not hardcode shared capability-model-add-draft-only messages"
  );
  assert.equal(
    certificateHelper.includes("PERFORMANCE_DOMAIN_ERROR_CODES"),
    true,
    "certificate helper should read shared error codes from performance domain"
  );
  assert.equal(
    certificateHelper.includes("resolvePerformanceDomainErrorMessage"),
    true,
    "certificate helper should read shared error messages from performance domain"
  );
  assert.equal(
    certificateHelper.includes("PERFORMANCE_DOMAIN_ERROR_CODES.stateMissing"),
    true,
    "certificate helper should read shared state-missing semantics from performance domain"
  );
  assert.equal(
    certificateHelper.includes("PERFORMANCE_DOMAIN_ERROR_CODES.numericFieldInvalid"),
    true,
    "certificate helper should read shared numeric-field-invalid semantics from performance domain"
  );
  assert.equal(
    certificateHelper.includes("PERFORMANCE_DOMAIN_ERROR_CODES.employeeIdInvalid"),
    true,
    "certificate helper should read shared employee-id-invalid semantics from performance domain"
  );
  assert.equal(
    certificateHelper.includes("PERFORMANCE_DOMAIN_ERROR_CODES.stateTransitionTargetNotAllowed"),
    true,
    "certificate helper should read shared state-transition-target-not-allowed semantics from performance domain"
  );
  assert.equal(
    certificateHelper.includes("PERFORMANCE_DOMAIN_ERROR_CODES.certificateIdInvalid"),
    true,
    "certificate helper should read shared certificate-id-invalid semantics from performance domain"
  );
  assert.equal(
    certificateHelper.includes("PERFORMANCE_DOMAIN_ERROR_CODES.certificateStatusInvalid"),
    true,
    "certificate helper should read shared certificate-status-invalid semantics from performance domain"
  );
  assert.equal(
    certificateHelper.includes("PERFORMANCE_DOMAIN_ERROR_CODES.certificateRecordStatusInvalid"),
    true,
    "certificate helper should read shared certificate-record-status-invalid semantics from performance domain"
  );
  assert.equal(
    certificateHelper.includes("PERFORMANCE_DOMAIN_ERROR_CODES.certificateAddDraftOnly"),
    true,
    "certificate helper should read shared certificate-add-draft-only semantics from performance domain"
  );
  assert.equal(
    certificateHelper.includes("'当前状态不允许编辑'"),
    false,
    "certificate helper should not hardcode shared state-edit-not-allowed messages"
  );
  assert.equal(
    certificateHelper.includes("'当前状态缺失'"),
    false,
    "certificate helper should not hardcode shared state-missing messages"
  );
  assert.equal(
    certificateHelper.includes("'数字字段不合法'"),
    false,
    "certificate helper should not hardcode shared numeric-field-invalid messages"
  );
  assert.equal(
    certificateHelper.includes("'员工 ID 不合法'"),
    false,
    "certificate helper should not hardcode shared employee-id-invalid messages"
  );
  assert.equal(
    certificateHelper.includes("'当前状态不允许流转到目标状态'"),
    false,
    "certificate helper should not hardcode shared state-transition-target-not-allowed messages"
  );
  assert.equal(
    certificateHelper.includes("'证书 ID 不合法'"),
    false,
    "certificate helper should not hardcode shared certificate-id-invalid messages"
  );
  assert.equal(
    certificateHelper.includes("'证书状态不合法'"),
    false,
    "certificate helper should not hardcode shared certificate-status-invalid messages"
  );
  assert.equal(
    certificateHelper.includes("'证书记录状态不合法'"),
    false,
    "certificate helper should not hardcode shared certificate-record-status-invalid messages"
  );
  assert.equal(
    certificateHelper.includes("'新增证书状态只能为 draft'"),
    false,
    "certificate helper should not hardcode shared certificate-add-draft-only messages"
  );
  assert.equal(
    courseHelper.includes("'当前状态不允许执行该操作'"),
    false,
    "course helper should not hardcode shared state-action-not-allowed messages"
  );
  assert.equal(
    assessmentService.includes("PERFORMANCE_DOMAIN_ERROR_CODES"),
    true,
    "assessment service should read shared error codes from performance domain"
  );
  assert.equal(
    assessmentService.includes("resolvePerformanceDomainErrorMessage"),
    true,
    "assessment service should read shared error messages from performance domain"
  );
  assert.equal(
    assessmentService.includes("'数据不存在'"),
    false,
    "assessment service should not hardcode resource-not-found messages"
  );
  assert.equal(
    assessmentService.includes("'当前状态不允许编辑'"),
    false,
    "assessment service should not hardcode shared state-edit-not-allowed messages"
  );
  assert.equal(
    assessmentService.includes("'当前状态不允许删除'"),
    false,
    "assessment service should not hardcode shared state-delete-not-allowed messages"
  );
  assert.equal(
    certificateService.includes("PERFORMANCE_DOMAIN_ERROR_CODES"),
    true,
    "certificate service should read shared error codes from performance domain"
  );
  assert.equal(
    certificateService.includes("resolvePerformanceDomainErrorMessage"),
    true,
    "certificate service should read shared error messages from performance domain"
  );
  assert.equal(
    certificateService.includes("PERFORMANCE_DOMAIN_ERROR_CODES.certificateIdInvalid"),
    true,
    "certificate service should read shared certificate-id-invalid semantics from performance domain"
  );
  assert.equal(
    certificateService.includes("'员工不存在'"),
    false,
    "certificate service should not hardcode employee-not-found messages"
  );
  assert.equal(
    certificateService.includes("'证书 ID 不合法'"),
    false,
    "certificate service should not hardcode shared certificate-id-invalid messages"
  );
  assert.equal(
    courseService.includes("PERFORMANCE_DOMAIN_ERROR_CODES"),
    true,
    "course service should read shared error codes from performance domain"
  );
  assert.equal(
    courseService.includes("resolvePerformanceDomainErrorMessage"),
    true,
    "course service should read shared error messages from performance domain"
  );
  assert.equal(
    courseService.includes("'数据不存在'"),
    false,
    "course service should not hardcode resource-not-found messages"
  );
  assert.equal(
    courseExamService.includes("PERFORMANCE_DOMAIN_ERROR_CODES"),
    true,
    "course-exam service should read shared error codes from performance domain"
  );
  assert.equal(
    courseExamService.includes("resolvePerformanceDomainErrorMessage"),
    true,
    "course-exam service should read shared error messages from performance domain"
  );
  assert.equal(
    courseExamService.includes("'数据不存在'"),
    false,
    "course-exam service should not hardcode resource-not-found messages"
  );
  assert.equal(
    coursePracticeService.includes("PERFORMANCE_DOMAIN_ERROR_CODES"),
    true,
    "course-practice service should read shared error codes from performance domain"
  );
  assert.equal(
    coursePracticeService.includes("resolvePerformanceDomainErrorMessage"),
    true,
    "course-practice service should read shared error messages from performance domain"
  );
  assert.equal(
    coursePracticeService.includes("PERFORMANCE_DOMAIN_ERROR_CODES.courseEvaluatedTaskResubmitDenied"),
    true,
    "course-practice service should read shared course-evaluated-task-resubmit-denied semantics from performance domain"
  );
  assert.equal(
    coursePracticeService.includes("'数据不存在'"),
    false,
    "course-practice service should not hardcode resource-not-found messages"
  );
  assert.equal(
    coursePracticeService.includes("'已评估任务不可再次提交'"),
    false,
    "course-practice service should not hardcode shared course-evaluated-task-resubmit-denied messages"
  );
  assert.equal(
    courseReciteService.includes("PERFORMANCE_DOMAIN_ERROR_CODES"),
    true,
    "course-recite service should read shared error codes from performance domain"
  );
  assert.equal(
    courseReciteService.includes("resolvePerformanceDomainErrorMessage"),
    true,
    "course-recite service should read shared error messages from performance domain"
  );
  assert.equal(
    courseReciteService.includes("PERFORMANCE_DOMAIN_ERROR_CODES.courseEvaluatedTaskResubmitDenied"),
    true,
    "course-recite service should read shared course-evaluated-task-resubmit-denied semantics from performance domain"
  );
  assert.equal(
    courseReciteService.includes("'数据不存在'"),
    false,
    "course-recite service should not hardcode resource-not-found messages"
  );
  assert.equal(
    courseReciteService.includes("'已评估任务不可再次提交'"),
    false,
    "course-recite service should not hardcode shared course-evaluated-task-resubmit-denied messages"
  );
  assert.equal(
    goalService.includes("PERFORMANCE_DOMAIN_ERROR_CODES"),
    true,
    "goal service should read shared error codes from performance domain"
  );
  assert.equal(
    goalService.includes("resolvePerformanceDomainErrorMessage"),
    true,
    "goal service should read shared error messages from performance domain"
  );
  assert.equal(
    goalService.includes("'数据不存在'"),
    false,
    "goal service should not hardcode resource-not-found messages"
  );
  assert.equal(
    goalService.includes("PERFORMANCE_DOMAIN_ERROR_CODES.goalTitleRequired"),
    true,
    "goal service should read shared goal-title-required semantics from performance domain"
  );
  assert.equal(
    goalService.includes("'目标标题不能为空'"),
    false,
    "goal service should not hardcode shared goal-title-required messages"
  );
  assert.equal(
    documentCenterService.includes("PERFORMANCE_DOMAIN_ERROR_CODES"),
    true,
    "document-center service should read shared error codes from performance domain"
  );
  assert.equal(
    documentCenterService.includes("resolvePerformanceDomainErrorMessage"),
    true,
    "document-center service should read shared error messages from performance domain"
  );
  assert.equal(
    documentCenterService.includes("PERFORMANCE_DOMAIN_ERROR_CODES.ownerRequired"),
    true,
    "document-center service should read shared owner-required semantics from performance domain"
  );
  assert.equal(
    documentCenterService.includes("'负责人不能为空'"),
    false,
    "document-center service should not hardcode shared owner-required messages"
  );
  assert.equal(
    hiringService.includes("PERFORMANCE_DOMAIN_ERROR_CODES"),
    true,
    "hiring service should read shared error codes from performance domain"
  );
  assert.equal(
    hiringService.includes("resolvePerformanceDomainErrorMessage"),
    true,
    "hiring service should read shared error messages from performance domain"
  );
  assert.equal(
    hiringService.includes("PERFORMANCE_DOMAIN_ERROR_CODES.targetDepartmentRequired"),
    true,
    "hiring service should read shared target-department-required semantics from performance domain"
  );
  assert.equal(
    hiringService.includes("'数据不存在'"),
    false,
    "hiring service should not hardcode resource-not-found messages"
  );
  assert.equal(
    hiringService.includes("'目标部门不能为空'"),
    false,
    "hiring service should not hardcode shared target-department-required messages"
  );
  assert.equal(
    indicatorService.includes("PERFORMANCE_DOMAIN_ERROR_CODES"),
    true,
    "indicator service should read shared error codes from performance domain"
  );
  assert.equal(
    indicatorService.includes("resolvePerformanceDomainErrorMessage"),
    true,
    "indicator service should read shared error messages from performance domain"
  );
  assert.equal(
    indicatorService.includes("'数据不存在'"),
    false,
    "indicator service should not hardcode resource-not-found messages"
  );
  assert.equal(
    interviewService.includes("PERFORMANCE_DOMAIN_ERROR_CODES"),
    true,
    "interview service should read shared error codes from performance domain"
  );
  assert.equal(
    interviewService.includes("resolvePerformanceDomainErrorMessage"),
    true,
    "interview service should read shared error messages from performance domain"
  );
  assert.equal(
    interviewService.includes("'数据不存在'"),
    false,
    "interview service should not hardcode resource-not-found messages"
  );
  assert.equal(
    interviewService.includes("'当前状态不允许编辑'"),
    false,
    "interview service should not hardcode shared state-edit-not-allowed messages"
  );
  assert.equal(
    interviewService.includes("'当前状态不允许删除'"),
    false,
    "interview service should not hardcode shared state-delete-not-allowed messages"
  );
  assert.equal(
    interviewService.includes("PERFORMANCE_DOMAIN_ERROR_CODES.talentAssetNotFound"),
    true,
    "interview service should read shared talent-asset-not-found semantics from performance domain"
  );
  assert.equal(
    interviewService.includes("PERFORMANCE_DOMAIN_ERROR_CODES.sourceTypeInvalid"),
    true,
    "interview service should read shared source-type-invalid semantics from performance domain"
  );
  assert.equal(
    interviewService.includes("'来源类型不合法'"),
    false,
    "interview service should not hardcode shared source-type-invalid messages"
  );
  assert.equal(
    jobStandardService.includes("PERFORMANCE_DOMAIN_ERROR_CODES"),
    true,
    "job-standard service should read shared error codes from performance domain"
  );
  assert.equal(
    jobStandardService.includes("resolvePerformanceDomainErrorMessage"),
    true,
    "job-standard service should read shared error messages from performance domain"
  );
  assert.equal(
    jobStandardService.includes("PERFORMANCE_DOMAIN_ERROR_CODES.targetDepartmentRequired"),
    true,
    "job-standard service should read shared target-department-required semantics from performance domain"
  );
  assert.equal(
    jobStandardService.includes("PERFORMANCE_DOMAIN_ERROR_CODES.jobStandardInactiveEditDenied"),
    true,
    "job-standard service should read shared job-standard-inactive-edit-denied semantics from performance domain"
  );
  assert.equal(
    jobStandardService.includes("PERFORMANCE_DOMAIN_ERROR_CODES.jobStandardIdInvalid"),
    true,
    "job-standard service should read shared job-standard-id-invalid semantics from performance domain"
  );
  assert.equal(
    jobStandardService.includes("PERFORMANCE_DOMAIN_ERROR_CODES.jobStandardTransitionDenied"),
    true,
    "job-standard service should read shared job-standard-transition-denied semantics from performance domain"
  );
  assert.equal(
    jobStandardService.includes("PERFORMANCE_DOMAIN_ERROR_CODES.jobStandardPositionNameRequired"),
    true,
    "job-standard service should read shared job-standard-position-name-required semantics from performance domain"
  );
  assert.equal(
    jobStandardService.includes("PERFORMANCE_DOMAIN_ERROR_CODES.jobStandardCreateDraftOnly"),
    true,
    "job-standard service should read shared job-standard-create-draft-only semantics from performance domain"
  );
  assert.equal(
    jobStandardService.includes("PERFORMANCE_DOMAIN_ERROR_CODES.jobStandardStatusActionRequired"),
    true,
    "job-standard service should read shared job-standard-status-action-required semantics from performance domain"
  );
  assert.equal(
    jobStandardService.includes("PERFORMANCE_DOMAIN_ERROR_CODES.jobStandardStatusInvalid"),
    true,
    "job-standard service should read shared job-standard-status-invalid semantics from performance domain"
  );
  assert.equal(
    jobStandardService.includes("'数据不存在'"),
    false,
    "job-standard service should not hardcode resource-not-found messages"
  );
  assert.equal(
    jobStandardService.includes("'目标部门不存在'"),
    false,
    "job-standard service should not hardcode target-department-not-found messages"
  );
  assert.equal(
    jobStandardService.includes("'目标部门不能为空'"),
    false,
    "job-standard service should not hardcode shared target-department-required messages"
  );
  assert.equal(
    jobStandardService.includes("'停用中的职位标准不可直接编辑'"),
    false,
    "job-standard service should not hardcode shared job-standard-inactive-edit-denied messages"
  );
  assert.equal(
    jobStandardService.includes("'职位标准 ID 不合法'"),
    false,
    "job-standard service should not hardcode shared job-standard-id-invalid messages"
  );
  assert.equal(
    jobStandardService.includes("'当前状态不允许切换到目标状态'"),
    false,
    "job-standard service should not hardcode shared job-standard-transition-denied messages"
  );
  assert.equal(
    jobStandardService.includes("'岗位名称不能为空'"),
    false,
    "job-standard service should not hardcode shared job-standard-position-name-required messages"
  );
  assert.equal(
    jobStandardService.includes("'新增职位标准默认保存为草稿'"),
    false,
    "job-standard service should not hardcode shared job-standard-create-draft-only messages"
  );
  assert.equal(
    jobStandardService.includes("'请使用启停用动作更新状态'"),
    false,
    "job-standard service should not hardcode shared job-standard-status-action-required messages"
  );
  assert.equal(
    jobStandardService.includes("'职位标准状态不合法'"),
    false,
    "job-standard service should not hardcode shared job-standard-status-invalid messages"
  );
  assert.equal(
    materialDomainService.includes("PERFORMANCE_DOMAIN_ERROR_CODES"),
    true,
    "material-domain service should read shared error codes from performance domain"
  );
  assert.equal(
    materialDomainService.includes("resolvePerformanceDomainErrorMessage"),
    true,
    "material-domain service should read shared error messages from performance domain"
  );
  assert.equal(
    materialDomainService.includes("PERFORMANCE_DOMAIN_ERROR_CODES.stateDraftEditOnly"),
    true,
    "material-domain service should read shared draft-edit-only state semantics from performance domain"
  );
  assert.equal(
    materialDomainService.includes("PERFORMANCE_DOMAIN_ERROR_CODES.stateDraftSubmitOnly"),
    true,
    "material-domain service should read shared draft-submit-only state semantics from performance domain"
  );
  assert.equal(
    materialDomainService.includes("PERFORMANCE_DOMAIN_ERROR_CODES.stateCancelNotAllowed"),
    true,
    "material-domain service should read shared cancel-not-allowed state semantics from performance domain"
  );
  assert.equal(
    materialDomainService.includes("PERFORMANCE_DOMAIN_ERROR_CODES.stateSubmittedReceiveOnly"),
    true,
    "material-domain service should read shared submitted-receive-only state semantics from performance domain"
  );
  assert.equal(
    materialDomainService.includes("PERFORMANCE_DOMAIN_ERROR_CODES.materialInboundNotFound"),
    true,
    "material-domain service should read shared material-inbound-not-found semantics from performance domain"
  );
  assert.equal(
    materialDomainService.includes("PERFORMANCE_DOMAIN_ERROR_CODES.materialIssueNotFound"),
    true,
    "material-domain service should read shared material-issue-not-found semantics from performance domain"
  );
  assert.equal(
    materialDomainService.includes("PERFORMANCE_DOMAIN_ERROR_CODES.materialCatalogNotFound"),
    true,
    "material-domain service should read shared material-catalog-not-found semantics from performance domain"
  );
  assert.equal(
    materialDomainService.includes("'数据不存在'"),
    false,
    "material-domain service should not hardcode resource-not-found messages"
  );
  assert.equal(
    materialDomainService.includes("'部门不存在'"),
    false,
    "material-domain service should not hardcode department-not-found messages"
  );
  assert.equal(
    materialDomainService.includes("'仅 draft 状态允许编辑'"),
    false,
    "material-domain service should not hardcode shared draft-edit-only state messages"
  );
  assert.equal(
    materialDomainService.includes("'仅 draft 状态允许提交'"),
    false,
    "material-domain service should not hardcode shared draft-submit-only state messages"
  );
  assert.equal(
    materialDomainService.includes("'当前状态不允许取消'"),
    false,
    "material-domain service should not hardcode shared cancel-not-allowed state messages"
  );
  assert.equal(
    materialDomainService.includes("'仅 submitted 状态允许确认入库'"),
    false,
    "material-domain service should not hardcode shared submitted-receive-only state messages"
  );
  assert.equal(
    materialDomainService.includes("'物资入库单不存在'"),
    false,
    "material-domain service should not hardcode shared material-inbound-not-found messages"
  );
  assert.equal(
    materialDomainService.includes("'物资领用单不存在'"),
    false,
    "material-domain service should not hardcode shared material-issue-not-found messages"
  );
  assert.equal(
    materialDomainService.includes("'物资目录不存在'"),
    false,
    "material-domain service should not hardcode shared material-catalog-not-found messages"
  );
  assert.equal(
    knowledgeBaseService.includes("PERFORMANCE_DOMAIN_ERROR_CODES"),
    true,
    "knowledge-base service should read shared error codes from performance domain"
  );
  assert.equal(
    knowledgeBaseService.includes("resolvePerformanceDomainErrorMessage"),
    true,
    "knowledge-base service should read shared error messages from performance domain"
  );
  assert.equal(
    knowledgeBaseService.includes("PERFORMANCE_DOMAIN_ERROR_CODES.ownerRequired"),
    true,
    "knowledge-base service should read shared owner-required semantics from performance domain"
  );
  assert.equal(
    knowledgeBaseService.includes("PERFORMANCE_DOMAIN_ERROR_CODES.invalidRelatedFiles"),
    true,
    "knowledge-base service should read shared invalid-related-files semantics from performance domain"
  );
  assert.equal(
    knowledgeBaseService.includes("PERFORMANCE_DOMAIN_ERROR_CODES.invalidRelatedKnowledge"),
    true,
    "knowledge-base service should read shared invalid-related-knowledge semantics from performance domain"
  );
  assert.equal(
    knowledgeBaseService.includes("PERFORMANCE_DOMAIN_ERROR_CODES.qaQuestionRequired"),
    true,
    "knowledge-base service should read shared qa-question-required semantics from performance domain"
  );
  assert.equal(
    knowledgeBaseService.includes("PERFORMANCE_DOMAIN_ERROR_CODES.qaAnswerRequired"),
    true,
    "knowledge-base service should read shared qa-answer-required semantics from performance domain"
  );
  assert.equal(
    knowledgeBaseService.includes("PERFORMANCE_DOMAIN_ERROR_CODES.knowledgeDeleteSelectionRequired"),
    true,
    "knowledge-base service should read shared knowledge-delete-selection-required semantics from performance domain"
  );
  assert.equal(
    knowledgeBaseService.includes("PERFORMANCE_DOMAIN_ERROR_CODES.knowledgeDeletePartialMissing"),
    true,
    "knowledge-base service should read shared knowledge-delete-partial-missing semantics from performance domain"
  );
  assert.equal(
    knowledgeBaseService.includes("PERFORMANCE_DOMAIN_ERROR_CODES.knowledgeIdInvalid"),
    true,
    "knowledge-base service should read shared knowledge-id-invalid semantics from performance domain"
  );
  assert.equal(
    knowledgeBaseService.includes("PERFORMANCE_DOMAIN_ERROR_CODES.knowledgeNotFound"),
    true,
    "knowledge-base service should read shared knowledge-not-found semantics from performance domain"
  );
  assert.equal(
    knowledgeBaseService.includes("PERFORMANCE_DOMAIN_ERROR_CODES.knowledgeKbNoRequired"),
    true,
    "knowledge-base service should read shared knowledge-kb-no-required semantics from performance domain"
  );
  assert.equal(
    knowledgeBaseService.includes("PERFORMANCE_DOMAIN_ERROR_CODES.knowledgeTitleRequired"),
    true,
    "knowledge-base service should read shared knowledge-title-required semantics from performance domain"
  );
  assert.equal(
    knowledgeBaseService.includes("PERFORMANCE_DOMAIN_ERROR_CODES.knowledgeCategoryRequired"),
    true,
    "knowledge-base service should read shared knowledge-category-required semantics from performance domain"
  );
  assert.equal(
    knowledgeBaseService.includes("PERFORMANCE_DOMAIN_ERROR_CODES.knowledgeSummaryRequired"),
    true,
    "knowledge-base service should read shared knowledge-summary-required semantics from performance domain"
  );
  assert.equal(
    knowledgeBaseService.includes("PERFORMANCE_DOMAIN_ERROR_CODES.knowledgeStatusInvalid"),
    true,
    "knowledge-base service should read shared knowledge-status-invalid semantics from performance domain"
  );
  assert.equal(
    knowledgeBaseService.includes("PERFORMANCE_DOMAIN_ERROR_CODES.knowledgeKbNoDuplicate"),
    true,
    "knowledge-base service should read shared knowledge-kb-no-duplicate semantics from performance domain"
  );
  assert.equal(
    knowledgeBaseService.includes("'负责人不能为空'"),
    false,
    "knowledge-base service should not hardcode shared owner-required messages"
  );
  assert.equal(
    knowledgeBaseService.includes("'存在无效的关联文件'"),
    false,
    "knowledge-base service should not hardcode shared invalid-related-files messages"
  );
  assert.equal(
    knowledgeBaseService.includes("'存在无效的关联知识条目'"),
    false,
    "knowledge-base service should not hardcode shared invalid-related-knowledge messages"
  );
  assert.equal(
    knowledgeBaseService.includes("'问题不能为空'"),
    false,
    "knowledge-base service should not hardcode shared qa-question-required messages"
  );
  assert.equal(
    knowledgeBaseService.includes("'答案不能为空'"),
    false,
    "knowledge-base service should not hardcode shared qa-answer-required messages"
  );
  assert.equal(
    knowledgeBaseService.includes("'请选择需要删除的知识条目'"),
    false,
    "knowledge-base service should not hardcode shared knowledge-delete-selection-required messages"
  );
  assert.equal(
    knowledgeBaseService.includes("'部分知识条目不存在'"),
    false,
    "knowledge-base service should not hardcode shared knowledge-delete-partial-missing messages"
  );
  assert.equal(
    knowledgeBaseService.includes("'知识条目 ID 不合法'"),
    false,
    "knowledge-base service should not hardcode shared knowledge-id-invalid messages"
  );
  assert.equal(
    knowledgeBaseService.includes("'知识条目不存在'"),
    false,
    "knowledge-base service should not hardcode shared knowledge-not-found messages"
  );
  assert.equal(
    knowledgeBaseService.includes("'知识编号不能为空'"),
    false,
    "knowledge-base service should not hardcode shared knowledge-kb-no-required messages"
  );
  assert.equal(
    knowledgeBaseService.includes("'知识标题不能为空'"),
    false,
    "knowledge-base service should not hardcode shared knowledge-title-required messages"
  );
  assert.equal(
    knowledgeBaseService.includes("'知识分类不能为空'"),
    false,
    "knowledge-base service should not hardcode shared knowledge-category-required messages"
  );
  assert.equal(
    knowledgeBaseService.includes("'知识摘要不能为空'"),
    false,
    "knowledge-base service should not hardcode shared knowledge-summary-required messages"
  );
  assert.equal(
    knowledgeBaseService.includes("'知识状态不合法'"),
    false,
    "knowledge-base service should not hardcode shared knowledge-status-invalid messages"
  );
  assert.equal(
    knowledgeBaseService.includes("'知识编号已存在'"),
    false,
    "knowledge-base service should not hardcode shared knowledge-kb-no-duplicate messages"
  );
  assert.equal(
    intellectualPropertyService.includes("PERFORMANCE_DOMAIN_ERROR_CODES"),
    true,
    "intellectual-property service should read shared error codes from performance domain"
  );
  assert.equal(
    intellectualPropertyService.includes("resolvePerformanceDomainErrorMessage"),
    true,
    "intellectual-property service should read shared error messages from performance domain"
  );
  assert.equal(
    intellectualPropertyService.includes("PERFORMANCE_DOMAIN_ERROR_CODES.idRequired"),
    true,
    "intellectual-property service should read shared id-required semantics from performance domain"
  );
  assert.equal(
    intellectualPropertyService.includes("'ID不能为空'"),
    false,
    "intellectual-property service should not hardcode shared id-required messages"
  );
  assert.equal(
    meetingService.includes("PERFORMANCE_DOMAIN_ERROR_CODES"),
    true,
    "meeting service should read shared error codes from performance domain"
  );
  assert.equal(
    meetingService.includes("resolvePerformanceDomainErrorMessage"),
    true,
    "meeting service should read shared error messages from performance domain"
  );
  assert.equal(
    meetingService.includes("'数据不存在'"),
    false,
    "meeting service should not hardcode resource-not-found messages"
  );
  assert.equal(
    meetingService.includes("'当前状态不允许编辑'"),
    false,
    "meeting service should not hardcode shared state-edit-not-allowed messages"
  );
  assert.equal(
    meetingService.includes("'当前状态不允许删除'"),
    false,
    "meeting service should not hardcode shared state-delete-not-allowed messages"
  );
  assert.equal(
    meetingService.includes("PERFORMANCE_DOMAIN_ERROR_CODES.stateTargetUpdateNotAllowed"),
    true,
    "meeting service should read shared state-target-update-not-allowed semantics from performance domain"
  );
  assert.equal(
    meetingService.includes("PERFORMANCE_DOMAIN_ERROR_CODES.meetingStatusInvalid"),
    true,
    "meeting service should read shared meeting-status-invalid semantics from performance domain"
  );
  assert.equal(
    meetingService.includes("PERFORMANCE_DOMAIN_ERROR_CODES.meetingCancelRoleDenied"),
    true,
    "meeting service should read shared meeting-cancel-role-denied semantics from performance domain"
  );
  assert.equal(
    meetingService.includes("'当前状态不允许更新到目标状态'"),
    false,
    "meeting service should not hardcode shared state-target-update-not-allowed messages"
  );
  assert.equal(
    meetingService.includes("'会议状态不合法'"),
    false,
    "meeting service should not hardcode shared meeting-status-invalid messages"
  );
  assert.equal(
    meetingService.includes("'当前角色不允许取消进行中的会议'"),
    false,
    "meeting service should not hardcode shared meeting-cancel-role-denied messages"
  );
  assert.equal(
    pipService.includes("PERFORMANCE_DOMAIN_ERROR_CODES"),
    true,
    "pip service should read shared error codes from performance domain"
  );
  assert.equal(
    pipService.includes("resolvePerformanceDomainErrorMessage"),
    true,
    "pip service should read shared error messages from performance domain"
  );
  assert.equal(
    pipService.includes("'数据不存在'"),
    false,
    "pip service should not hardcode resource-not-found messages"
  );
  assert.equal(
    pipService.includes("'员工不存在'"),
    false,
    "pip service should not hardcode employee-not-found messages"
  );
  assert.equal(
    pipService.includes("'来源建议不存在'"),
    false,
    "pip service should not hardcode source-suggestion-not-found messages"
  );
  assert.equal(
    pipService.includes("PERFORMANCE_DOMAIN_ERROR_CODES.ownerRequired"),
    true,
    "pip service should read shared owner-required semantics from performance domain"
  );
  assert.equal(
    pipService.includes("PERFORMANCE_DOMAIN_ERROR_CODES.ownerNotFound"),
    true,
    "pip service should read shared owner-not-found semantics from performance domain"
  );
  assert.equal(
    pipService.includes("PERFORMANCE_DOMAIN_ERROR_CODES.employeeRequired"),
    true,
    "pip service should read shared employee-required semantics from performance domain"
  );
  assert.equal(
    pipService.includes("PERFORMANCE_DOMAIN_ERROR_CODES.dateRangeRequired"),
    true,
    "pip service should read shared date-range-required semantics from performance domain"
  );
  assert.equal(
    pipService.includes("PERFORMANCE_DOMAIN_ERROR_CODES.dateRangeInvalid"),
    true,
    "pip service should read shared date-range-invalid semantics from performance domain"
  );
  assert.equal(
    pipService.includes("PERFORMANCE_DOMAIN_ERROR_CODES.pipActionUnsupported"),
    true,
    "pip service should read shared pip-action-unsupported semantics from performance domain"
  );
  assert.equal(
    pipService.includes("PERFORMANCE_DOMAIN_ERROR_CODES.pipTitleRequired"),
    true,
    "pip service should read shared pip-title-required semantics from performance domain"
  );
  assert.equal(
    pipService.includes("PERFORMANCE_DOMAIN_ERROR_CODES.pipImprovementGoalRequired"),
    true,
    "pip service should read shared pip-improvement-goal-required semantics from performance domain"
  );
  assert.equal(
    pipService.includes("PERFORMANCE_DOMAIN_ERROR_CODES.pipSourceReasonRequired"),
    true,
    "pip service should read shared pip-source-reason-required semantics from performance domain"
  );
  assert.equal(
    pipService.includes("PERFORMANCE_DOMAIN_ERROR_CODES.pipStartDraftOnly"),
    true,
    "pip service should read shared pip-start-draft-only semantics from performance domain"
  );
  assert.equal(
    pipService.includes("PERFORMANCE_DOMAIN_ERROR_CODES.pipTrackActiveOnly"),
    true,
    "pip service should read shared pip-track-active-only semantics from performance domain"
  );
  assert.equal(
    pipService.includes("PERFORMANCE_DOMAIN_ERROR_CODES.pipCompleteActiveOnly"),
    true,
    "pip service should read shared pip-complete-active-only semantics from performance domain"
  );
  assert.equal(
    pipService.includes("PERFORMANCE_DOMAIN_ERROR_CODES.pipCloseActiveOnly"),
    true,
    "pip service should read shared pip-close-active-only semantics from performance domain"
  );
  assert.equal(
    pipService.includes("PERFORMANCE_DOMAIN_ERROR_CODES.pipEditNotAllowed"),
    true,
    "pip service should read shared pip-edit-not-allowed semantics from performance domain"
  );
  assert.equal(
    pipService.includes("PERFORMANCE_DOMAIN_ERROR_CODES.suggestionLinkedEntityTypeMismatch"),
    true,
    "pip service should read shared suggestion-linked-entity-type-mismatch semantics from performance domain"
  );
  assert.equal(
    pipService.includes("PERFORMANCE_DOMAIN_ERROR_CODES.suggestionAcceptedOnly"),
    true,
    "pip service should read shared suggestion-accepted-only semantics from performance domain"
  );
  assert.equal(
    pipService.includes("PERFORMANCE_DOMAIN_ERROR_CODES.suggestionEmployeeMismatch"),
    true,
    "pip service should read shared suggestion-employee-mismatch semantics from performance domain"
  );
  assert.equal(
    pipService.includes("PERFORMANCE_DOMAIN_ERROR_CODES.suggestionAssessmentMismatch"),
    true,
    "pip service should read shared suggestion-assessment-mismatch semantics from performance domain"
  );
  assert.equal(
    pipService.includes("PERFORMANCE_DOMAIN_ERROR_CODES.suggestionAlreadyLinked"),
    true,
    "pip service should read shared suggestion-already-linked semantics from performance domain"
  );
  assert.equal(
    pipService.includes("'负责人不能为空'"),
    false,
    "pip service should not hardcode shared owner-required messages"
  );
  assert.equal(
    pipService.includes("'负责人不存在'"),
    false,
    "pip service should not hardcode shared owner-not-found messages"
  );
  assert.equal(
    pipService.includes("'员工不能为空'"),
    false,
    "pip service should not hardcode shared employee-required messages"
  );
  assert.equal(
    pipService.includes("'开始日期和结束日期不能为空'"),
    false,
    "pip service should not hardcode shared date-range-required messages"
  );
  assert.equal(
    pipService.includes("'开始日期不能晚于结束日期'"),
    false,
    "pip service should not hardcode shared date-range-invalid messages"
  );
  assert.equal(
    pipService.includes("'不支持的 PIP 动作'"),
    false,
    "pip service should not hardcode shared pip-action-unsupported messages"
  );
  assert.equal(
    pipService.includes("'PIP 标题不能为空'"),
    false,
    "pip service should not hardcode shared pip-title-required messages"
  );
  assert.equal(
    pipService.includes("'改进目标不能为空'"),
    false,
    "pip service should not hardcode shared pip-improvement-goal-required messages"
  );
  assert.equal(
    pipService.includes("'独立创建必须填写来源原因'"),
    false,
    "pip service should not hardcode shared pip-source-reason-required messages"
  );
  assert.equal(
    pipService.includes("'只有草稿状态的 PIP 可以启动'"),
    false,
    "pip service should not hardcode shared pip-start-draft-only messages"
  );
  assert.equal(
    pipService.includes("'只有进行中的 PIP 可以提交跟进'"),
    false,
    "pip service should not hardcode shared pip-track-active-only messages"
  );
  assert.equal(
    pipService.includes("'只有进行中的 PIP 可以完成'"),
    false,
    "pip service should not hardcode shared pip-complete-active-only messages"
  );
  assert.equal(
    pipService.includes("'只有进行中的 PIP 可以关闭'"),
    false,
    "pip service should not hardcode shared pip-close-active-only messages"
  );
  assert.equal(
    pipService.includes("'当前状态不允许编辑 PIP'"),
    false,
    "pip service should not hardcode shared pip-edit-not-allowed messages"
  );
  assert.equal(
    pipService.includes("'建议类型与正式单据类型不一致'"),
    false,
    "pip service should not hardcode shared suggestion-linked-entity-type-mismatch messages"
  );
  assert.equal(
    pipService.includes("'仅允许关联已采用的建议'"),
    false,
    "pip service should not hardcode shared suggestion-accepted-only messages"
  );
  assert.equal(
    pipService.includes("'建议员工与正式单据员工不一致'"),
    false,
    "pip service should not hardcode shared suggestion-employee-mismatch messages"
  );
  assert.equal(
    pipService.includes("'建议来源评估单与正式单据不一致'"),
    false,
    "pip service should not hardcode shared suggestion-assessment-mismatch messages"
  );
  assert.equal(
    pipService.includes("'该建议已关联正式单据'"),
    false,
    "pip service should not hardcode shared suggestion-already-linked messages"
  );
  assert.equal(
    promotionService.includes("PERFORMANCE_DOMAIN_ERROR_CODES"),
    true,
    "promotion service should read shared error codes from performance domain"
  );
  assert.equal(
    promotionService.includes("resolvePerformanceDomainErrorMessage"),
    true,
    "promotion service should read shared error messages from performance domain"
  );
  assert.equal(
    promotionService.includes("PERFORMANCE_DOMAIN_ERROR_CODES.employeeDepartmentNotFound"),
    true,
    "promotion service should map employee-department missing semantics to shared employee-department-not-found code"
  );
  assert.equal(
    promotionService.includes("PERFORMANCE_DOMAIN_ERROR_CODES.suggestionLinkedEntityTypeMismatch"),
    true,
    "promotion service should read shared suggestion-linked-entity-type-mismatch semantics from performance domain"
  );
  assert.equal(
    promotionService.includes("PERFORMANCE_DOMAIN_ERROR_CODES.suggestionAcceptedOnly"),
    true,
    "promotion service should read shared suggestion-accepted-only semantics from performance domain"
  );
  assert.equal(
    promotionService.includes("PERFORMANCE_DOMAIN_ERROR_CODES.suggestionEmployeeMismatch"),
    true,
    "promotion service should read shared suggestion-employee-mismatch semantics from performance domain"
  );
  assert.equal(
    promotionService.includes("PERFORMANCE_DOMAIN_ERROR_CODES.suggestionAssessmentMismatch"),
    true,
    "promotion service should read shared suggestion-assessment-mismatch semantics from performance domain"
  );
  assert.equal(
    promotionService.includes("PERFORMANCE_DOMAIN_ERROR_CODES.suggestionAlreadyLinked"),
    true,
    "promotion service should read shared suggestion-already-linked semantics from performance domain"
  );
  assert.equal(
    promotionService.includes("'数据不存在'"),
    false,
    "promotion service should not hardcode resource-not-found messages"
  );
  assert.equal(
    promotionService.includes("'来源建议不存在'"),
    false,
    "promotion service should not hardcode source-suggestion-not-found messages"
  );
  assert.equal(
    promotionService.includes("'当前状态不允许编辑'"),
    false,
    "promotion service should not hardcode shared state-edit-not-allowed messages"
  );
  assert.equal(
    promotionService.includes("'建议类型与正式单据类型不一致'"),
    false,
    "promotion service should not hardcode shared suggestion-linked-entity-type-mismatch messages"
  );
  assert.equal(
    promotionService.includes("'仅允许关联已采用的建议'"),
    false,
    "promotion service should not hardcode shared suggestion-accepted-only messages"
  );
  assert.equal(
    promotionService.includes("'建议员工与正式单据员工不一致'"),
    false,
    "promotion service should not hardcode shared suggestion-employee-mismatch messages"
  );
  assert.equal(
    promotionService.includes("'建议来源评估单与正式单据不一致'"),
    false,
    "promotion service should not hardcode shared suggestion-assessment-mismatch messages"
  );
  assert.equal(
    promotionService.includes("'该建议已关联正式单据'"),
    false,
    "promotion service should not hardcode shared suggestion-already-linked messages"
  );
  assert.equal(
    feedbackService.includes("PERFORMANCE_DOMAIN_ERROR_CODES"),
    true,
    "feedback service should read shared error codes from performance domain"
  );
  assert.equal(
    feedbackService.includes("resolvePerformanceDomainErrorMessage"),
    true,
    "feedback service should read shared error messages from performance domain"
  );
  assert.equal(
    feedbackService.includes("'数据不存在'"),
    false,
    "feedback service should not hardcode resource-not-found messages"
  );
  assert.equal(
    feedbackService.includes("'员工不存在'"),
    false,
    "feedback service should not hardcode employee-not-found messages"
  );
  assert.equal(
    feedbackService.includes("'评估单不存在'"),
    false,
    "feedback service should not hardcode assessment-not-found messages"
  );
  assert.equal(
    feedbackService.includes("PERFORMANCE_DOMAIN_ERROR_CODES.feedbackTaskViewDenied"),
    true,
    "feedback service should read shared feedback-task-view-denied semantics from performance domain"
  );
  assert.equal(
    feedbackService.includes("PERFORMANCE_DOMAIN_ERROR_CODES.feedbackSummaryDraftDenied"),
    true,
    "feedback service should read shared feedback-summary-draft-denied semantics from performance domain"
  );
  assert.equal(
    feedbackService.includes("PERFORMANCE_DOMAIN_ERROR_CODES.feedbackTaskClosed"),
    true,
    "feedback service should read shared feedback-task-closed semantics from performance domain"
  );
  assert.equal(
    feedbackService.includes("'无权查看该环评任务'"),
    false,
    "feedback service should not hardcode shared feedback-task-view-denied messages"
  );
  assert.equal(
    feedbackService.includes("'草稿状态不允许查看汇总结果'"),
    false,
    "feedback service should not hardcode shared feedback-summary-draft-denied messages"
  );
  assert.equal(
    feedbackService.includes("'当前环评任务已关闭'"),
    false,
    "feedback service should not hardcode shared feedback-task-closed messages"
  );
  assert.equal(
    purchaseOrderService.includes("PERFORMANCE_DOMAIN_ERROR_CODES"),
    true,
    "purchase-order service should read shared error codes from performance domain"
  );
  assert.equal(
    purchaseOrderService.includes("resolvePerformanceDomainErrorMessage"),
    true,
    "purchase-order service should read shared error messages from performance domain"
  );
  assert.equal(
    purchaseOrderService.includes("PERFORMANCE_DOMAIN_ERROR_CODES.stateCloseNotAllowed"),
    true,
    "purchase-order service should read shared state-close-not-allowed semantics from performance domain"
  );
  assert.equal(
    purchaseOrderService.includes("PERFORMANCE_DOMAIN_ERROR_CODES.purchaseOrderSubmitInquiryStateDenied"),
    true,
    "purchase-order service should read shared purchase-order-submit-inquiry-state-denied semantics from performance domain"
  );
  assert.equal(
    purchaseOrderService.includes("PERFORMANCE_DOMAIN_ERROR_CODES.purchaseOrderSubmitApprovalStateDenied"),
    true,
    "purchase-order service should read shared purchase-order-submit-approval-state-denied semantics from performance domain"
  );
  assert.equal(
    purchaseOrderService.includes("PERFORMANCE_DOMAIN_ERROR_CODES.purchaseOrderApproveStateDenied"),
    true,
    "purchase-order service should read shared purchase-order-approve-state-denied semantics from performance domain"
  );
  assert.equal(
    purchaseOrderService.includes("PERFORMANCE_DOMAIN_ERROR_CODES.purchaseOrderRejectStateDenied"),
    true,
    "purchase-order service should read shared purchase-order-reject-state-denied semantics from performance domain"
  );
  assert.equal(
    purchaseOrderService.includes("PERFORMANCE_DOMAIN_ERROR_CODES.purchaseOrderReceiveStateDenied"),
    true,
    "purchase-order service should read shared purchase-order-receive-state-denied semantics from performance domain"
  );
  assert.equal(
    purchaseOrderService.includes("PERFORMANCE_DOMAIN_ERROR_CODES.purchaseOrderOperateDenied"),
    true,
    "purchase-order service should read shared purchase-order-operate-denied semantics from performance domain"
  );
  assert.equal(
    purchaseOrderService.includes("PERFORMANCE_DOMAIN_ERROR_CODES.purchaseOrderStatusInvalid"),
    true,
    "purchase-order service should read shared purchase-order-status-invalid semantics from performance domain"
  );
  assert.equal(
    purchaseOrderService.includes("PERFORMANCE_DOMAIN_ERROR_CODES.purchaseOrderCurrencyInvalid"),
    true,
    "purchase-order service should read shared purchase-order-currency-invalid semantics from performance domain"
  );
  assert.equal(
    purchaseOrderService.includes("PERFORMANCE_DOMAIN_ERROR_CODES.purchaseOrderTotalAmountInvalid"),
    true,
    "purchase-order service should read shared purchase-order-total-amount-invalid semantics from performance domain"
  );
  assert.equal(
    purchaseOrderService.includes("PERFORMANCE_DOMAIN_ERROR_CODES.purchaseOrderItemsInvalid"),
    true,
    "purchase-order service should read shared purchase-order-items-invalid semantics from performance domain"
  );
  assert.equal(
    purchaseOrderService.includes("PERFORMANCE_DOMAIN_ERROR_CODES.purchaseOrderOrderNoDuplicate"),
    true,
    "purchase-order service should read shared purchase-order-order-no-duplicate semantics from performance domain"
  );
  assert.equal(
    purchaseOrderService.includes("PERFORMANCE_DOMAIN_ERROR_CODES.purchaseOrderRequesterNotFound"),
    true,
    "purchase-order service should read shared purchase-order-requester-not-found semantics from performance domain"
  );
  assert.equal(
    purchaseOrderService.includes("PERFORMANCE_DOMAIN_ERROR_CODES.purchaseOrderStatusActionRequired"),
    true,
    "purchase-order service should read shared purchase-order-status-action-required semantics from performance domain"
  );
  assert.equal(
    purchaseOrderService.includes("PERFORMANCE_DOMAIN_ERROR_CODES.purchaseOrderReceiptQuantityExceeded"),
    true,
    "purchase-order service should read shared purchase-order-receipt-quantity-exceeded semantics from performance domain"
  );
  assert.equal(
    purchaseOrderService.includes("PERFORMANCE_DOMAIN_ERROR_CODES.jsonFieldInvalid"),
    true,
    "purchase-order service should read shared json-field-invalid semantics from performance domain"
  );
  assert.equal(
    purchaseOrderService.includes("'数据不存在'"),
    false,
    "purchase-order service should not hardcode resource-not-found messages"
  );
  assert.equal(
    purchaseOrderService.includes("'部门不存在'"),
    false,
    "purchase-order service should not hardcode department-not-found messages"
  );
  assert.equal(
    purchaseOrderService.includes("'供应商不存在'"),
    false,
    "purchase-order service should not hardcode supplier-not-found messages"
  );
  assert.equal(
    purchaseOrderService.includes("'当前状态不允许编辑'"),
    false,
    "purchase-order service should not hardcode shared state-edit-not-allowed messages"
  );
  assert.equal(
    purchaseOrderService.includes("'当前状态不允许删除'"),
    false,
    "purchase-order service should not hardcode shared state-delete-not-allowed messages"
  );
  assert.equal(
    purchaseOrderService.includes("'当前状态不允许关闭'"),
    false,
    "purchase-order service should not hardcode shared state-close-not-allowed messages"
  );
  assert.equal(
    purchaseOrderService.includes("'当前状态不允许提交询价'"),
    false,
    "purchase-order service should not hardcode shared purchase-order-submit-inquiry-state-denied messages"
  );
  assert.equal(
    purchaseOrderService.includes("'当前状态不允许提交采购审批'"),
    false,
    "purchase-order service should not hardcode shared purchase-order-submit-approval-state-denied messages"
  );
  assert.equal(
    purchaseOrderService.includes("'当前状态不允许审批'"),
    false,
    "purchase-order service should not hardcode shared purchase-order-approve-state-denied messages"
  );
  assert.equal(
    purchaseOrderService.includes("'当前状态不允许驳回'"),
    false,
    "purchase-order service should not hardcode shared purchase-order-reject-state-denied messages"
  );
  assert.equal(
    purchaseOrderService.includes("'当前状态不允许收货'"),
    false,
    "purchase-order service should not hardcode shared purchase-order-receive-state-denied messages"
  );
  assert.equal(
    purchaseOrderService.includes("'无权操作该采购订单'"),
    false,
    "purchase-order service should not hardcode shared purchase-order-operate-denied messages"
  );
  assert.equal(
    purchaseOrderService.includes("'采购订单状态不合法'"),
    false,
    "purchase-order service should not hardcode shared purchase-order-status-invalid messages"
  );
  assert.equal(
    purchaseOrderService.includes("'币种不合法'"),
    false,
    "purchase-order service should not hardcode shared purchase-order-currency-invalid messages"
  );
  assert.equal(
    purchaseOrderService.includes("'订单总金额不合法'"),
    false,
    "purchase-order service should not hardcode shared purchase-order-total-amount-invalid messages"
  );
  assert.equal(
    purchaseOrderService.includes("'采购明细格式不合法'"),
    false,
    "purchase-order service should not hardcode shared purchase-order-items-invalid messages"
  );
  assert.equal(
    purchaseOrderService.includes("'订单编号已存在'"),
    false,
    "purchase-order service should not hardcode shared purchase-order-order-no-duplicate messages"
  );
  assert.equal(
    purchaseOrderService.includes("'申请人不存在'"),
    false,
    "purchase-order service should not hardcode shared purchase-order-requester-not-found messages"
  );
  assert.equal(
    purchaseOrderService.includes("'请通过流程动作更新采购状态'"),
    false,
    "purchase-order service should not hardcode shared purchase-order-status-action-required messages"
  );
  assert.equal(
    purchaseOrderService.includes("'累计收货数量不能超过明细数量'"),
    false,
    "purchase-order service should not hardcode shared purchase-order-receipt-quantity-exceeded messages"
  );
  assert.equal(
    purchaseOrderService.includes("'JSON 字段格式不合法'"),
    false,
    "purchase-order service should not hardcode shared json-field-invalid messages"
  );
  assert.equal(
    recruitPlanService.includes("PERFORMANCE_DOMAIN_ERROR_CODES"),
    true,
    "recruit-plan service should read shared error codes from performance domain"
  );
  assert.equal(
    recruitPlanService.includes("resolvePerformanceDomainErrorMessage"),
    true,
    "recruit-plan service should read shared error messages from performance domain"
  );
  assert.equal(
    recruitPlanService.includes("PERFORMANCE_DOMAIN_ERROR_CODES.stateCloseNotAllowed"),
    true,
    "recruit-plan service should read shared state-close-not-allowed semantics from performance domain"
  );
  assert.equal(
    recruitPlanService.includes("PERFORMANCE_DOMAIN_ERROR_CODES.targetDepartmentRequired"),
    true,
    "recruit-plan service should read shared target-department-required semantics from performance domain"
  );
  assert.equal(
    recruitPlanService.includes("PERFORMANCE_DOMAIN_ERROR_CODES.jobStandardNotFound"),
    true,
    "recruit-plan service should read shared job-standard-not-found semantics from performance domain"
  );
  assert.equal(
    recruitPlanService.includes("PERFORMANCE_DOMAIN_ERROR_CODES.ownerNotFound"),
    true,
    "recruit-plan service should read shared owner-not-found semantics from performance domain"
  );
  assert.equal(
    recruitPlanService.includes("PERFORMANCE_DOMAIN_ERROR_CODES.importFileNotFound"),
    true,
    "recruit-plan service should read shared import-file-not-found semantics from performance domain"
  );
  assert.equal(
    recruitPlanService.includes("PERFORMANCE_DOMAIN_ERROR_CODES.importFileRequired"),
    true,
    "recruit-plan service should read shared import-file-required semantics from performance domain"
  );
  assert.equal(
    recruitPlanService.includes("'数据不存在'"),
    false,
    "recruit-plan service should not hardcode resource-not-found messages"
  );
  assert.equal(
    recruitPlanService.includes("'招聘计划不存在'"),
    false,
    "recruit-plan service should not hardcode recruit-plan-not-found messages"
  );
  assert.equal(
    recruitPlanService.includes("'职位标准不存在'"),
    false,
    "recruit-plan service should not hardcode shared job-standard-not-found messages"
  );
  assert.equal(
    recruitPlanService.includes("'导入文件不存在'"),
    false,
    "recruit-plan service should not hardcode shared import-file-not-found messages"
  );
  assert.equal(
    recruitPlanService.includes("'导入文件不能为空'"),
    false,
    "recruit-plan service should not hardcode shared import-file-required messages"
  );
  assert.equal(
    recruitPlanService.includes("'目标部门不存在'"),
    false,
    "recruit-plan service should not hardcode target-department-not-found messages"
  );
  assert.equal(
    recruitPlanService.includes("'目标部门不能为空'"),
    false,
    "recruit-plan service should not hardcode shared target-department-required messages"
  );
  assert.equal(
    recruitPlanService.includes("'当前状态不允许编辑'"),
    false,
    "recruit-plan service should not hardcode shared state-edit-not-allowed messages"
  );
  assert.equal(
    recruitPlanService.includes("'当前状态不允许删除'"),
    false,
    "recruit-plan service should not hardcode shared state-delete-not-allowed messages"
  );
  assert.equal(
    recruitPlanService.includes("'当前状态不允许关闭'"),
    false,
    "recruit-plan service should not hardcode shared state-close-not-allowed messages"
  );
  assert.equal(
    goalOperationsService.includes("PERFORMANCE_DOMAIN_ERROR_CODES"),
    true,
    "goal-operations service should read shared error codes from performance domain"
  );
  assert.equal(
    goalOperationsService.includes("resolvePerformanceDomainErrorMessage"),
    true,
    "goal-operations service should read shared error messages from performance domain"
  );
  assert.equal(
    goalOperationsService.includes("PERFORMANCE_DOMAIN_ERROR_CODES.goalOpsReportNotFound"),
    true,
    "goal-operations service should read shared goal-ops-report-not-found semantics from performance domain"
  );
  assert.equal(
    goalOperationsService.includes("PERFORMANCE_DOMAIN_ERROR_CODES.goalTitleRequired"),
    true,
    "goal-operations service should read shared goal-title-required semantics from performance domain"
  );
  assert.equal(
    goalOperationsService.includes("PERFORMANCE_DOMAIN_ERROR_CODES.targetValuePositive"),
    true,
    "goal-operations service should read shared target-value-positive semantics from performance domain"
  );
  assert.equal(
    goalOperationsService.includes("PERFORMANCE_DOMAIN_ERROR_CODES.goalOpsReportDateRequired"),
    true,
    "goal-operations service should read shared goal-ops-report-date-required semantics from performance domain"
  );
  assert.equal(
    goalOperationsService.includes("PERFORMANCE_DOMAIN_ERROR_CODES.goalOpsAutoZeroDateRequired"),
    true,
    "goal-operations service should read shared goal-ops-auto-zero-date-required semantics from performance domain"
  );
  assert.equal(
    goalOperationsService.includes("PERFORMANCE_DOMAIN_ERROR_CODES.goalOpsQueryDateRequired"),
    true,
    "goal-operations service should read shared goal-ops-query-date-required semantics from performance domain"
  );
  assert.equal(
    goalOperationsService.includes("PERFORMANCE_DOMAIN_ERROR_CODES.goalOpsResultSubmitStateDenied"),
    true,
    "goal-operations service should read shared goal-ops-result-submit-state-denied semantics from performance domain"
  );
  assert.equal(
    goalOperationsService.includes("'日报不存在'"),
    false,
    "goal-operations service should not hardcode shared goal-ops-report-not-found messages"
  );
  assert.equal(
    goalOperationsService.includes("'目标标题不能为空'"),
    false,
    "goal-operations service should not hardcode shared goal-title-required messages"
  );
  assert.equal(
    goalOperationsService.includes("'目标值必须大于 0'"),
    false,
    "goal-operations service should not hardcode shared target-value-positive messages"
  );
  assert.equal(
    goalOperationsService.includes("'日报日期不能为空'"),
    false,
    "goal-operations service should not hardcode shared goal-ops-report-date-required messages"
  );
  assert.equal(
    goalOperationsService.includes("'补零日期不能为空'"),
    false,
    "goal-operations service should not hardcode shared goal-ops-auto-zero-date-required messages"
  );
  assert.equal(
    goalOperationsService.includes("'查询日期不能为空'"),
    false,
    "goal-operations service should not hardcode shared goal-ops-query-date-required messages"
  );
  assert.equal(
    goalOperationsService.includes("'当前状态不允许填报结果'"),
    false,
    "goal-operations service should not hardcode shared goal-ops-result-submit-state-denied messages"
  );
  assert.equal(
    goalOperationsHelper.includes("PERFORMANCE_DOMAIN_ERROR_CODES"),
    true,
    "goal-operations helper should read shared error codes from performance domain"
  );
  assert.equal(
    goalOperationsHelper.includes("resolvePerformanceDomainErrorMessage"),
    true,
    "goal-operations helper should read shared error messages from performance domain"
  );
  assert.equal(
    goalOperationsHelper.includes("PERFORMANCE_DOMAIN_ERROR_CODES.goalOpsPeriodTypeInvalid"),
    true,
    "goal-operations helper should read shared goal-ops-period-type-invalid semantics from performance domain"
  );
  assert.equal(
    goalOperationsHelper.includes("PERFORMANCE_DOMAIN_ERROR_CODES.goalOpsPeriodRangeRequired"),
    true,
    "goal-operations helper should read shared goal-ops-period-range-required semantics from performance domain"
  );
  assert.equal(
    goalOperationsHelper.includes("PERFORMANCE_DOMAIN_ERROR_CODES.goalOpsPeriodRangeInvalid"),
    true,
    "goal-operations helper should read shared goal-ops-period-range-invalid semantics from performance domain"
  );
  assert.equal(
    goalOperationsHelper.includes("PERFORMANCE_DOMAIN_ERROR_CODES.goalOpsDailyPlanDateRequired"),
    true,
    "goal-operations helper should read shared goal-ops-daily-plan-date-required semantics from performance domain"
  );
  assert.equal(
    goalOperationsHelper.includes("PERFORMANCE_DOMAIN_ERROR_CODES.goalOpsPlanDateOutOfRange"),
    true,
    "goal-operations helper should read shared goal-ops-plan-date-out-of-range semantics from performance domain"
  );
  assert.equal(
    goalOperationsHelper.includes("PERFORMANCE_DOMAIN_ERROR_CODES.goalOpsSourceTypeInvalid"),
    true,
    "goal-operations helper should read shared goal-ops-source-type-invalid semantics from performance domain"
  );
  assert.equal(
    goalOperationsHelper.includes("'周期类型不合法'"),
    false,
    "goal-operations helper should not hardcode shared goal-ops-period-type-invalid messages"
  );
  assert.equal(
    goalOperationsHelper.includes("'周期开始和结束日期不能为空'"),
    false,
    "goal-operations helper should not hardcode shared goal-ops-period-range-required messages"
  );
  assert.equal(
    goalOperationsHelper.includes("'周期开始日期不能晚于结束日期'"),
    false,
    "goal-operations helper should not hardcode shared goal-ops-period-range-invalid messages"
  );
  assert.equal(
    goalOperationsHelper.includes("'日目标必须指定计划日期'"),
    false,
    "goal-operations helper should not hardcode shared goal-ops-daily-plan-date-required messages"
  );
  assert.equal(
    goalOperationsHelper.includes("'计划日期必须落在周期内'"),
    false,
    "goal-operations helper should not hardcode shared goal-ops-plan-date-out-of-range messages"
  );
  assert.equal(
    goalOperationsHelper.includes("'目标来源不合法'"),
    false,
    "goal-operations helper should not hardcode shared goal-ops-source-type-invalid messages"
  );
  assert.equal(
    suggestionService.includes("PERFORMANCE_DOMAIN_ERROR_CODES"),
    true,
    "suggestion service should read shared error codes from performance domain"
  );
  assert.equal(
    suggestionService.includes("resolvePerformanceDomainErrorMessage"),
    true,
    "suggestion service should read shared error messages from performance domain"
  );
  assert.equal(
    suggestionService.includes("'数据不存在'"),
    false,
    "suggestion service should not hardcode resource-not-found messages"
  );
  assert.equal(
    suggestionService.includes("PERFORMANCE_DOMAIN_ERROR_CODES.suggestionActionUnsupported"),
    true,
    "suggestion service should read shared suggestion-action-unsupported semantics from performance domain"
  );
  assert.equal(
    suggestionService.includes("'不支持的建议动作'"),
    false,
    "suggestion service should not hardcode shared suggestion-action-unsupported messages"
  );
  assert.equal(
    resumePoolServiceUpdated.includes("'招聘计划不存在'"),
    false,
    "resumePool service should not hardcode recruit-plan-not-found messages"
  );
  assert.equal(
    resumePoolServiceUpdated.includes("PERFORMANCE_DOMAIN_ERROR_CODES.jobStandardNotFound"),
    true,
    "resumePool service should read shared job-standard-not-found semantics from performance domain"
  );
  assert.equal(
    resumePoolServiceUpdated.includes("PERFORMANCE_DOMAIN_ERROR_CODES.importFileNotFound"),
    true,
    "resumePool service should read shared import-file-not-found semantics from performance domain"
  );
  assert.equal(
    resumePoolServiceUpdated.includes("PERFORMANCE_DOMAIN_ERROR_CODES.importFileRequired"),
    true,
    "resumePool service should read shared import-file-required semantics from performance domain"
  );
  assert.equal(
    resumePoolServiceUpdated.includes("PERFORMANCE_DOMAIN_ERROR_CODES.stateInterviewCreateNotAllowed"),
    true,
    "resumePool service should read shared state-interview-create-not-allowed semantics from performance domain"
  );
  assert.equal(
    resumePoolServiceUpdated.includes("PERFORMANCE_DOMAIN_ERROR_CODES.stateInterviewRecreateNotAllowed"),
    true,
    "resumePool service should read shared state-interview-recreate-not-allowed semantics from performance domain"
  );
  assert.equal(
    resumePoolServiceUpdated.includes("PERFORMANCE_DOMAIN_ERROR_CODES.attachmentNotFound"),
    true,
    "resumePool service should read shared attachment-not-found semantics from performance domain"
  );
  assert.equal(
    resumePoolServiceUpdated.includes("PERFORMANCE_DOMAIN_ERROR_CODES.resumeImportOverwriteStateDenied"),
    true,
    "resumePool service should read shared resume-import-overwrite-state-denied semantics from performance domain"
  );
  assert.equal(
    resumePoolServiceUpdated.includes("PERFORMANCE_DOMAIN_ERROR_CODES.resumeUploadAttachmentStateDenied"),
    true,
    "resumePool service should read shared resume-upload-attachment-state-denied semantics from performance domain"
  );
  assert.equal(
    resumePoolServiceUpdated.includes("PERFORMANCE_DOMAIN_ERROR_CODES.resumeConvertTalentAssetStateDenied"),
    true,
    "resumePool service should read shared resume-convert-talent-asset-state-denied semantics from performance domain"
  );
  assert.equal(
    resumePoolServiceUpdated.includes("PERFORMANCE_DOMAIN_ERROR_CODES.resumeAttachmentFileNotFound"),
    true,
    "resumePool service should read shared resume-attachment-file-not-found semantics from performance domain"
  );
  assert.equal(
    resumePoolServiceUpdated.includes("PERFORMANCE_DOMAIN_ERROR_CODES.resumeStatusInvalid"),
    true,
    "resumePool service should read shared resume-status-invalid semantics from performance domain"
  );
  assert.equal(
    resumePoolServiceUpdated.includes("PERFORMANCE_DOMAIN_ERROR_CODES.resumeSourceTypeInvalid"),
    true,
    "resumePool service should read shared resume-source-type-invalid semantics from performance domain"
  );
  assert.equal(
    resumePoolServiceUpdated.includes("PERFORMANCE_DOMAIN_ERROR_CODES.resumeExternalLinkExternalOnly"),
    true,
    "resumePool service should read shared resume-external-link-external-only semantics from performance domain"
  );
  assert.equal(
    resumePoolServiceUpdated.includes("PERFORMANCE_DOMAIN_ERROR_CODES.resumeCreateNewOnly"),
    true,
    "resumePool service should read shared resume-create-new-only semantics from performance domain"
  );
  assert.equal(
    resumePoolServiceUpdated.includes("PERFORMANCE_DOMAIN_ERROR_CODES.resumeInterviewTransitionActionRequired"),
    true,
    "resumePool service should read shared resume-interview-transition-action-required semantics from performance domain"
  );
  assert.equal(
    resumePoolServiceUpdated.includes("PERFORMANCE_DOMAIN_ERROR_CODES.resumeInterviewPositionRequired"),
    true,
    "resumePool service should read shared resume-interview-position-required semantics from performance domain"
  );
  assert.equal(
    resumePoolServiceUpdated.includes("PERFORMANCE_DOMAIN_ERROR_CODES.resumeRecruitPlanDepartmentMismatch"),
    true,
    "resumePool service should read shared resume-recruit-plan-department-mismatch semantics from performance domain"
  );
  assert.equal(
    resumePoolServiceUpdated.includes("PERFORMANCE_DOMAIN_ERROR_CODES.resumeJobStandardDepartmentMismatch"),
    true,
    "resumePool service should read shared resume-job-standard-department-mismatch semantics from performance domain"
  );
  assert.equal(
    resumePoolServiceUpdated.includes("PERFORMANCE_DOMAIN_ERROR_CODES.resumeOperateDenied"),
    true,
    "resumePool service should read shared resume-operate-denied semantics from performance domain"
  );
  assert.equal(
    resumePoolServiceUpdated.includes("'职位标准不存在'"),
    false,
    "resumePool service should not hardcode shared job-standard-not-found messages"
  );
  assert.equal(
    resumePoolServiceUpdated.includes("'导入文件不存在'"),
    false,
    "resumePool service should not hardcode shared import-file-not-found messages"
  );
  assert.equal(
    resumePoolServiceUpdated.includes("'导入文件不能为空'"),
    false,
    "resumePool service should not hardcode shared import-file-required messages"
  );
  assert.equal(
    resumePoolServiceUpdated.includes("'当前状态不允许发起面试'"),
    false,
    "resumePool service should not hardcode shared state-interview-create-not-allowed messages"
  );
  assert.equal(
    resumePoolServiceUpdated.includes("'当前状态不允许再次发起面试'"),
    false,
    "resumePool service should not hardcode shared state-interview-recreate-not-allowed messages"
  );
  assert.equal(
    resumePoolServiceUpdated.includes("'当前状态不允许导入覆盖'"),
    false,
    "resumePool service should not hardcode shared resume-import-overwrite-state-denied messages"
  );
  assert.equal(
    resumePoolServiceUpdated.includes("'当前状态不允许上传附件'"),
    false,
    "resumePool service should not hardcode shared resume-upload-attachment-state-denied messages"
  );
  assert.equal(
    resumePoolServiceUpdated.includes("'当前状态不允许转人才资产'"),
    false,
    "resumePool service should not hardcode shared resume-convert-talent-asset-state-denied messages"
  );
  assert.equal(
    resumePoolServiceUpdated.includes("'附件不存在'"),
    false,
    "resumePool service should not hardcode shared attachment-not-found messages"
  );
  assert.equal(
    resumePoolServiceUpdated.includes("'附件文件不存在'"),
    false,
    "resumePool service should not hardcode shared resume-attachment-file-not-found messages"
  );
  assert.equal(
    resumePoolServiceUpdated.includes("'简历状态不合法'"),
    false,
    "resumePool service should not hardcode shared resume-status-invalid messages"
  );
  assert.equal(
    resumePoolServiceUpdated.includes("'简历来源类型不合法'"),
    false,
    "resumePool service should not hardcode shared resume-source-type-invalid messages"
  );
  assert.equal(
    resumePoolServiceUpdated.includes("'仅 external 来源允许填写外部简历链接'"),
    false,
    "resumePool service should not hardcode shared resume-external-link-external-only messages"
  );
  assert.equal(
    resumePoolServiceUpdated.includes("'新增简历状态只能为 new'"),
    false,
    "resumePool service should not hardcode shared resume-create-new-only messages"
  );
  assert.equal(
    resumePoolServiceUpdated.includes("'请通过发起面试动作进入 interviewing'"),
    false,
    "resumePool service should not hardcode shared resume-interview-transition-action-required messages"
  );
  assert.equal(
    resumePoolServiceUpdated.includes("'目标岗位不能为空，无法发起面试'"),
    false,
    "resumePool service should not hardcode shared resume-interview-position-required messages"
  );
  assert.equal(
    resumePoolServiceUpdated.includes("'招聘计划所属部门与简历目标部门不一致'"),
    false,
    "resumePool service should not hardcode shared resume-recruit-plan-department-mismatch messages"
  );
  assert.equal(
    resumePoolServiceUpdated.includes("'职位标准所属部门与简历目标部门不一致'"),
    false,
    "resumePool service should not hardcode shared resume-job-standard-department-mismatch messages"
  );
  assert.equal(
    resumePoolServiceUpdated.includes("'无权操作该简历'"),
    false,
    "resumePool service should not hardcode shared resume-operate-denied messages"
  );
  assert.equal(
    hiringService.includes("'简历不存在'"),
    false,
    "hiring service should not hardcode resume-not-found messages"
  );
  assert.equal(
    hiringService.includes("'招聘计划不存在'"),
    false,
    "hiring service should not hardcode recruit-plan-not-found messages"
  );
  assert.equal(
    interviewService.includes("'简历不存在'"),
    false,
    "interview service should not hardcode resume-not-found messages"
  );
  assert.equal(
    interviewService.includes("'招聘计划不存在'"),
    false,
    "interview service should not hardcode recruit-plan-not-found messages"
  );
  assert.equal(
    interviewService.includes("'人才资产不存在'"),
    false,
    "interview service should not hardcode talent-asset-not-found messages"
  );
  assert.equal(
    supplierService.includes("PERFORMANCE_DOMAIN_ERROR_CODES"),
    true,
    "supplier service should read shared error codes from performance domain"
  );
  assert.equal(
    supplierService.includes("resolvePerformanceDomainErrorMessage"),
    true,
    "supplier service should read shared error messages from performance domain"
  );
  assert.equal(
    supplierService.includes("'数据不存在'"),
    false,
    "supplier service should not hardcode resource-not-found messages"
  );
  assert.equal(
    supplierService.includes("'当前状态不允许执行该操作'"),
    false,
    "supplier service should not hardcode shared state-action-not-allowed messages"
  );
  assert.equal(
    supplierService.includes("'当前状态不允许删除'"),
    false,
    "supplier service should not hardcode shared state-delete-not-allowed messages"
  );
  assert.equal(
    purchaseReportService.includes("'部门不存在'"),
    false,
    "purchase-report service should not hardcode department-not-found messages"
  );
  assert.equal(
    purchaseReportService.includes("'供应商不存在'"),
    false,
    "purchase-report service should not hardcode supplier-not-found messages"
  );
  assert.equal(
    assetDomainService.includes("'供应商不存在'"),
    false,
    "asset-domain service should not hardcode supplier-not-found messages"
  );
  assert.equal(
    assetDomainService.includes("'当前状态不允许编辑'"),
    false,
    "asset-domain service should not hardcode shared state-edit-not-allowed messages"
  );
  assert.equal(
    assetDomainService.includes("'目标部门不能为空'"),
    false,
    "asset-domain service should not hardcode shared target-department-required messages"
  );
  assert.equal(
    assetDomainService.includes("'资产不存在'"),
    false,
    "asset-domain service should not hardcode shared asset-not-found messages"
  );
  assert.equal(
    assetDomainService.includes("'采购订单不存在'"),
    false,
    "asset-domain service should not hardcode shared purchase-order-not-found messages"
  );
  assert.equal(
    assetDomainService.includes("'仅 draft 状态允许编辑'"),
    false,
    "asset-domain service should not hardcode shared draft-edit-only state messages"
  );
  assert.equal(
    assetDomainService.includes("'仅 draft 状态允许提交'"),
    false,
    "asset-domain service should not hardcode shared draft-submit-only state messages"
  );
  assert.equal(
    assetDomainService.includes("'当前状态不允许取消'"),
    false,
    "asset-domain service should not hardcode shared cancel-not-allowed state messages"
  );
  assert.equal(
    assetDomainService.includes("'仅 submitted 状态允许确认入库'"),
    false,
    "asset-domain service should not hardcode shared submitted-receive-only state messages"
  );
  assert.equal(
    assetDomainService.includes("'仅 submitted 状态允许审批'"),
    false,
    "asset-domain service should not hardcode shared submitted-approve-only state messages"
  );
  assert.equal(
    assetDomainService.includes("'仅 approved 状态允许执行报废'"),
    false,
    "asset-domain service should not hardcode shared approved-execute-only state messages"
  );
  assert.equal(
    assetDomainService.includes("'领用申请不存在'"),
    false,
    "asset-domain service should not hardcode shared asset-assignment-request-not-found messages"
  );
  assert.equal(
    assetDomainService.includes("'领用记录不存在'"),
    false,
    "asset-domain service should not hardcode shared asset-assignment-record-not-found messages"
  );
  assert.equal(
    assetDomainService.includes("'维护记录不存在'"),
    false,
    "asset-domain service should not hardcode shared asset-maintenance-record-not-found messages"
  );
  assert.equal(
    approvalFlowService.includes("'领用申请不存在'"),
    false,
    "approval-flow service should not hardcode shared asset-assignment-request-not-found messages"
  );
  assert.equal(
    approvalFlowService.includes("'审批实例不存在'"),
    false,
    "approval-flow service should not hardcode shared approval-instance-not-found messages"
  );
  assert.equal(
    assetDomainService.includes("'采购入库单不存在'"),
    false,
    "asset-domain service should not hardcode shared asset-procurement-not-found messages"
  );
  assert.equal(
    assetDomainService.includes("'调拨单不存在'"),
    false,
    "asset-domain service should not hardcode shared asset-transfer-not-found messages"
  );
  assert.equal(
    assetDomainService.includes("'盘点单不存在'"),
    false,
    "asset-domain service should not hardcode shared asset-inventory-not-found messages"
  );
  assert.equal(
    assetDomainService.includes("'报废单不存在'"),
    false,
    "asset-domain service should not hardcode shared asset-disposal-not-found messages"
  );
  assert.equal(
    assetDomainService.includes("'资产编号已存在'"),
    false,
    "asset-domain service should not hardcode shared asset-no-duplicate messages"
  );
  assert.equal(
    teacherChannelCoreService.includes("PERFORMANCE_DOMAIN_ERROR_CODES"),
    true,
    "teacher-channel-core service should read shared error codes from performance domain"
  );
  assert.equal(
    teacherChannelCoreService.includes("resolvePerformanceDomainErrorMessage"),
    true,
    "teacher-channel-core service should read shared error messages from performance domain"
  );
  assert.equal(
    teacherChannelCoreService.includes("'数据不存在'"),
    false,
    "teacher-channel-core service should not hardcode resource-not-found messages"
  );
  assert.equal(
    teacherChannelCoreService.includes("PERFORMANCE_DOMAIN_ERROR_CODES.readonlyWriteDenied"),
    true,
    "teacher-channel-core service should read shared readonly-write-denied semantics from performance domain"
  );
  assert.equal(
    teacherChannelCoreService.includes("PERFORMANCE_DOMAIN_ERROR_CODES.teacherClassClosedEditDenied"),
    true,
    "teacher-channel-core service should read shared teacher-class-closed-edit-denied semantics from performance domain"
  );
  assert.equal(
    teacherChannelCoreService.includes("PERFORMANCE_DOMAIN_ERROR_CODES.teacherClassCreatePartneredOnly"),
    true,
    "teacher-channel-core service should read shared teacher-class-create-partnered-only semantics from performance domain"
  );
  assert.equal(
    teacherChannelCoreService.includes("PERFORMANCE_DOMAIN_ERROR_CODES.teacherClassDeleteDraftOnly"),
    true,
    "teacher-channel-core service should read shared teacher-class-delete-draft-only semantics from performance domain"
  );
  assert.equal(
    teacherChannelCoreService.includes("PERFORMANCE_DOMAIN_ERROR_CODES.teacherClassDraftTransitionOnly"),
    true,
    "teacher-channel-core service should read shared teacher-class-draft-transition-only semantics from performance domain"
  );
  assert.equal(
    teacherChannelCoreService.includes("PERFORMANCE_DOMAIN_ERROR_CODES.teacherClassActionNotAllowed"),
    true,
    "teacher-channel-core service should read shared teacher-class-action-not-allowed semantics from performance domain"
  );
  assert.equal(
    teacherChannelCoreService.includes("PERFORMANCE_DOMAIN_ERROR_CODES.teacherNegotiatingTransitionDenied"),
    true,
    "teacher-channel-core service should read shared teacher-negotiating-transition-denied semantics from performance domain"
  );
  assert.equal(
    teacherChannelCoreService.includes("PERFORMANCE_DOMAIN_ERROR_CODES.teacherTerminateRoleDenied"),
    true,
    "teacher-channel-core service should read shared teacher-terminate-role-denied semantics from performance domain"
  );
  assert.equal(
    teacherChannelCoreService.includes("PERFORMANCE_DOMAIN_ERROR_CODES.teacherTerminatePartneredOnly"),
    true,
    "teacher-channel-core service should read shared teacher-terminate-partnered-only semantics from performance domain"
  );
  assert.equal(
    teacherChannelCoreService.includes("PERFORMANCE_DOMAIN_ERROR_CODES.teacherStatusActionUnsupported"),
    true,
    "teacher-channel-core service should read shared teacher-status-action-unsupported semantics from performance domain"
  );
  assert.equal(
    teacherChannelCoreService.includes("PERFORMANCE_DOMAIN_ERROR_CODES.teacherCooperationMarkFollowRequired"),
    true,
    "teacher-channel-core service should read shared teacher-cooperation-mark-follow-required semantics from performance domain"
  );
  assert.equal(
    teacherChannelCoreService.includes("PERFORMANCE_DOMAIN_ERROR_CODES.teacherCooperationMarkStateDenied"),
    true,
    "teacher-channel-core service should read shared teacher-cooperation-mark-state-denied semantics from performance domain"
  );
  assert.equal(
    teacherChannelCoreService.includes("PERFORMANCE_DOMAIN_ERROR_CODES.teacherClassCreateTerminatedDenied"),
    true,
    "teacher-channel-core service should read shared teacher-class-create-terminated-denied semantics from performance domain"
  );
  assert.equal(
    teacherChannelCoreService.includes("PERFORMANCE_DOMAIN_ERROR_CODES.teacherCooperationStatusInvalid"),
    true,
    "teacher-channel-core service should read shared teacher-cooperation-status-invalid semantics from performance domain"
  );
  assert.equal(
    teacherChannelCoreService.includes("PERFORMANCE_DOMAIN_ERROR_CODES.teacherClassStatusInvalid"),
    true,
    "teacher-channel-core service should read shared teacher-class-status-invalid semantics from performance domain"
  );
  assert.equal(
    teacherChannelCoreService.includes("PERFORMANCE_DOMAIN_ERROR_CODES.teacherCooperationStatusPresetDenied"),
    true,
    "teacher-channel-core service should read shared teacher-cooperation-status-preset-denied semantics from performance domain"
  );
  assert.equal(
    teacherChannelCoreService.includes("PERFORMANCE_DOMAIN_ERROR_CODES.teacherAssignDenied"),
    true,
    "teacher-channel-core service should read shared teacher-assign-denied semantics from performance domain"
  );
  assert.equal(
    teacherChannelCoreService.includes("PERFORMANCE_DOMAIN_ERROR_CODES.teacherAssignTargetDepartmentDenied"),
    true,
    "teacher-channel-core service should read shared teacher-assign-target-department-denied semantics from performance domain"
  );
  assert.equal(
    teacherChannelCoreService.includes("PERFORMANCE_DOMAIN_ERROR_CODES.teacherClassCloseRoleDenied"),
    true,
    "teacher-channel-core service should read shared teacher-class-close-role-denied semantics from performance domain"
  );
  assert.equal(
    teacherChannelCoreService.includes("PERFORMANCE_DOMAIN_ERROR_CODES.teacherAgentStatusInvalid"),
    true,
    "teacher-channel-core service should read shared teacher-agent-status-invalid semantics from performance domain"
  );
  assert.equal(
    teacherChannelCoreService.includes("PERFORMANCE_DOMAIN_ERROR_CODES.teacherAgentBlacklistStatusInvalid"),
    true,
    "teacher-channel-core service should read shared teacher-agent-blacklist-status-invalid semantics from performance domain"
  );
  assert.equal(
    teacherChannelCoreService.includes("PERFORMANCE_DOMAIN_ERROR_CODES.teacherAgentRelationStatusInvalid"),
    true,
    "teacher-channel-core service should read shared teacher-agent-relation-status-invalid semantics from performance domain"
  );
  assert.equal(
    teacherChannelCoreService.includes("PERFORMANCE_DOMAIN_ERROR_CODES.teacherAgentAuditViewDenied"),
    true,
    "teacher-channel-core service should read shared teacher-agent-audit-view-denied semantics from performance domain"
  );
  assert.equal(
    teacherChannelCoreService.includes("PERFORMANCE_DOMAIN_ERROR_CODES.teacherAgentRelationSelfLoopDenied"),
    true,
    "teacher-channel-core service should read shared teacher-agent-relation-self-loop-denied semantics from performance domain"
  );
  assert.equal(
    teacherChannelCoreService.includes("PERFORMANCE_DOMAIN_ERROR_CODES.teacherAgentRelationTargetInactive"),
    true,
    "teacher-channel-core service should read shared teacher-agent-relation-target-inactive semantics from performance domain"
  );
  assert.equal(
    teacherChannelCoreService.includes("PERFORMANCE_DOMAIN_ERROR_CODES.teacherAgentCycleDenied"),
    true,
    "teacher-channel-core service should read shared teacher-agent-cycle-denied semantics from performance domain"
  );
  assert.equal(
    teacherChannelCoreService.includes("PERFORMANCE_DOMAIN_ERROR_CODES.teacherAttributionStatusInvalid"),
    true,
    "teacher-channel-core service should read shared teacher-attribution-status-invalid semantics from performance domain"
  );
  assert.equal(
    teacherChannelCoreService.includes("PERFORMANCE_DOMAIN_ERROR_CODES.teacherAttributionConflictResolveDenied"),
    true,
    "teacher-channel-core service should read shared teacher-attribution-conflict-resolve-denied semantics from performance domain"
  );
  assert.equal(
    teacherChannelCoreService.includes("PERFORMANCE_DOMAIN_ERROR_CODES.teacherAttributionCreateTerminatedDenied"),
    true,
    "teacher-channel-core service should read shared teacher-attribution-create-terminated-denied semantics from performance domain"
  );
  assert.equal(
    teacherChannelCoreService.includes("PERFORMANCE_DOMAIN_ERROR_CODES.teacherAttributionAssignExistingDenied"),
    true,
    "teacher-channel-core service should read shared teacher-attribution-assign-existing-denied semantics from performance domain"
  );
  assert.equal(
    teacherChannelCoreService.includes("PERFORMANCE_DOMAIN_ERROR_CODES.teacherAttributionAgentInactive"),
    true,
    "teacher-channel-core service should read shared teacher-attribution-agent-inactive semantics from performance domain"
  );
  assert.equal(
    teacherChannelCoreService.includes("PERFORMANCE_DOMAIN_ERROR_CODES.teacherAttributionAgentBlacklisted"),
    true,
    "teacher-channel-core service should read shared teacher-attribution-agent-blacklisted semantics from performance domain"
  );
  assert.equal(
    teacherChannelCoreService.includes("PERFORMANCE_DOMAIN_ERROR_CODES.teacherAttributionConflictStatusInvalid"),
    true,
    "teacher-channel-core service should read shared teacher-attribution-conflict-status-invalid semantics from performance domain"
  );
  assert.equal(
    teacherChannelCoreService.includes("PERFORMANCE_DOMAIN_ERROR_CODES.teacherAttributionConflictClosed"),
    true,
    "teacher-channel-core service should read shared teacher-attribution-conflict-closed semantics from performance domain"
  );
  assert.equal(
    teacherChannelCoreService.includes("PERFORMANCE_DOMAIN_ERROR_CODES.teacherAttributionConflictResolutionInvalid"),
    true,
    "teacher-channel-core service should read shared teacher-attribution-conflict-resolution-invalid semantics from performance domain"
  );
  assert.equal(
    teacherChannelCoreService.includes("PERFORMANCE_DOMAIN_ERROR_CODES.teacherCurrentAttributionMissing"),
    true,
    "teacher-channel-core service should read shared teacher-current-attribution-missing semantics from performance domain"
  );
  assert.equal(
    teacherChannelCoreService.includes("'只读账号无写权限'"),
    false,
    "teacher-channel-core service should not hardcode shared readonly-write-denied messages"
  );
  assert.equal(
    teacherChannelCoreService.includes("'已关闭班级不可编辑'"),
    false,
    "teacher-channel-core service should not hardcode shared teacher-class-closed-edit-denied messages"
  );
  assert.equal(
    teacherChannelCoreService.includes("'仅已合作班主任可创建班级'"),
    false,
    "teacher-channel-core service should not hardcode shared teacher-class-create-partnered-only messages"
  );
  assert.equal(
    teacherChannelCoreService.includes("'仅草稿班级允许删除'"),
    false,
    "teacher-channel-core service should not hardcode shared teacher-class-delete-draft-only messages"
  );
  assert.equal(
    teacherChannelCoreService.includes("'草稿班级仅允许更新为 draft 或 active'"),
    false,
    "teacher-channel-core service should not hardcode shared teacher-class-draft-transition-only messages"
  );
  assert.equal(
    teacherChannelCoreService.includes("'当前班级状态不允许执行该操作'"),
    false,
    "teacher-channel-core service should not hardcode shared teacher-class-action-not-allowed messages"
  );
  assert.equal(
    teacherChannelCoreService.includes("'当前状态不允许推进到洽谈中'"),
    false,
    "teacher-channel-core service should not hardcode shared teacher-negotiating-transition-denied messages"
  );
  assert.equal(
    teacherChannelCoreService.includes("'仅管理层或部门负责人可终止合作'"),
    false,
    "teacher-channel-core service should not hardcode shared teacher-terminate-role-denied messages"
  );
  assert.equal(
    teacherChannelCoreService.includes("'仅已合作班主任可终止合作'"),
    false,
    "teacher-channel-core service should not hardcode shared teacher-terminate-partnered-only messages"
  );
  assert.equal(
    teacherChannelCoreService.includes("'当前接口仅支持 negotiating 或 terminated'"),
    false,
    "teacher-channel-core service should not hardcode shared teacher-status-action-unsupported messages"
  );
  assert.equal(
    teacherChannelCoreService.includes("'至少存在一条跟进记录后才允许标记合作'"),
    false,
    "teacher-channel-core service should not hardcode shared teacher-cooperation-mark-follow-required messages"
  );
  assert.equal(
    teacherChannelCoreService.includes("'当前合作状态不允许标记为已合作'"),
    false,
    "teacher-channel-core service should not hardcode shared teacher-cooperation-mark-state-denied messages"
  );
  assert.equal(
    teacherChannelCoreService.includes("'已终止合作的班主任不可新建班级'"),
    false,
    "teacher-channel-core service should not hardcode shared teacher-class-create-terminated-denied messages"
  );
  assert.equal(
    teacherChannelCoreService.includes("'班主任合作状态不合法'"),
    false,
    "teacher-channel-core service should not hardcode shared teacher-cooperation-status-invalid messages"
  );
  assert.equal(
    teacherChannelCoreService.includes("'班级状态不合法'"),
    false,
    "teacher-channel-core service should not hardcode shared teacher-class-status-invalid messages"
  );
  assert.equal(
    teacherChannelCoreService.includes("'新增或编辑班主任资源不可直接指定合作状态'"),
    false,
    "teacher-channel-core service should not hardcode shared teacher-cooperation-status-preset-denied messages"
  );
  assert.equal(
    teacherChannelCoreService.includes("'无权限分配班主任资源'"),
    false,
    "teacher-channel-core service should not hardcode shared teacher-assign-denied messages"
  );
  assert.equal(
    teacherChannelCoreService.includes("'无权分配到目标归属部门'"),
    false,
    "teacher-channel-core service should not hardcode shared teacher-assign-target-department-denied messages"
  );
  assert.equal(
    teacherChannelCoreService.includes("'仅管理层或部门负责人可关闭班级'"),
    false,
    "teacher-channel-core service should not hardcode shared teacher-class-close-role-denied messages"
  );
  assert.equal(
    teacherChannelCoreService.includes("'代理主体状态不合法'"),
    false,
    "teacher-channel-core service should not hardcode shared teacher-agent-status-invalid messages"
  );
  assert.equal(
    teacherChannelCoreService.includes("'代理主体黑名单状态不合法'"),
    false,
    "teacher-channel-core service should not hardcode shared teacher-agent-blacklist-status-invalid messages"
  );
  assert.equal(
    teacherChannelCoreService.includes("'代理关系状态不合法'"),
    false,
    "teacher-channel-core service should not hardcode shared teacher-agent-relation-status-invalid messages"
  );
  assert.equal(
    teacherChannelCoreService.includes("'无权查看该代理审计'"),
    false,
    "teacher-channel-core service should not hardcode shared teacher-agent-audit-view-denied messages"
  );
  assert.equal(
    teacherChannelCoreService.includes("'只读账号无权限新增班主任资源'"),
    false,
    "teacher-channel-core service should not keep dead readonly teacher-create branches"
  );
  assert.equal(
    teacherChannelCoreService.includes("'只读账号无权限新增班级'"),
    false,
    "teacher-channel-core service should not keep dead readonly class-create branches"
  );
  assert.equal(
    teacherChannelCoreService.includes("'只读账号无权限删除班级'"),
    false,
    "teacher-channel-core service should not keep dead readonly class-delete branches"
  );
  assert.equal(
    teacherChannelCoreService.includes("'只读账号无权限新增代理主体'"),
    false,
    "teacher-channel-core service should not keep dead readonly agent-create branches"
  );
  assert.equal(
    teacherChannelCoreService.includes("'只读账号无权限新增代理关系'"),
    false,
    "teacher-channel-core service should not keep dead readonly agent-relation-create branches"
  );
  assert.equal(
    teacherChannelCoreService.includes("'只读账号无权限建立归因'"),
    false,
    "teacher-channel-core service should not keep dead readonly attribution-assign branches"
  );
  assert.equal(
    teacherChannelCoreService.includes("'只读账号无权限调整归因'"),
    false,
    "teacher-channel-core service should not keep dead readonly attribution-change branches"
  );
  assert.equal(
    teacherChannelCoreService.includes("'只读账号无权限创建归因冲突'"),
    false,
    "teacher-channel-core service should not keep dead readonly attribution-conflict-create branches"
  );
  assert.equal(
    teacherChannelCoreService.includes("'代理关系不允许指向自身'"),
    false,
    "teacher-channel-core service should not hardcode shared teacher-agent-relation-self-loop-denied messages"
  );
  assert.equal(
    teacherChannelCoreService.includes("'停用代理不能作为新的关系目标'"),
    false,
    "teacher-channel-core service should not hardcode shared teacher-agent-relation-target-inactive messages"
  );
  assert.equal(
    teacherChannelCoreService.includes("'不允许形成循环代理树'"),
    false,
    "teacher-channel-core service should not hardcode shared teacher-agent-cycle-denied messages"
  );
  assert.equal(
    teacherChannelCoreService.includes("'归因状态不合法'"),
    false,
    "teacher-channel-core service should not hardcode shared teacher-attribution-status-invalid messages"
  );
  assert.equal(
    teacherChannelCoreService.includes("'无权限处理归因冲突'"),
    false,
    "teacher-channel-core service should not hardcode shared teacher-attribution-conflict-resolve-denied messages"
  );
  assert.equal(
    teacherChannelCoreService.includes("'已终止合作班主任不可新建代理归因'"),
    false,
    "teacher-channel-core service should not hardcode shared teacher-attribution-create-terminated-denied messages"
  );
  assert.equal(
    teacherChannelCoreService.includes("'当前班主任已存在有效归因，请使用归因调整或冲突处理'"),
    false,
    "teacher-channel-core service should not hardcode shared teacher-attribution-assign-existing-denied messages"
  );
  assert.equal(
    teacherChannelCoreService.includes("'停用代理不可新增归因'"),
    false,
    "teacher-channel-core service should not hardcode shared teacher-attribution-agent-inactive messages"
  );
  assert.equal(
    teacherChannelCoreService.includes("'黑名单代理不可新增归因'"),
    false,
    "teacher-channel-core service should not hardcode shared teacher-attribution-agent-blacklisted messages"
  );
  assert.equal(
    teacherChannelCoreService.includes("'归因冲突状态不合法'"),
    false,
    "teacher-channel-core service should not hardcode shared teacher-attribution-conflict-status-invalid messages"
  );
  assert.equal(
    teacherChannelCoreService.includes("'当前归因冲突已关闭'"),
    false,
    "teacher-channel-core service should not hardcode shared teacher-attribution-conflict-closed messages"
  );
  assert.equal(
    teacherChannelCoreService.includes("'归因冲突处理结果不合法'"),
    false,
    "teacher-channel-core service should not hardcode shared teacher-attribution-conflict-resolution-invalid messages"
  );
  assert.equal(
    teacherChannelCoreService.includes("'当前班主任不存在有效归因'"),
    false,
    "teacher-channel-core service should not hardcode shared teacher-current-attribution-missing messages"
  );
  assert.equal(
    officeCollabRecordService.includes("PERFORMANCE_DOMAIN_ERROR_CODES"),
    true,
    "office-collab-record service should read shared error codes from performance domain"
  );
  assert.equal(
    officeCollabRecordService.includes("resolvePerformanceDomainErrorMessage"),
    true,
    "office-collab-record service should read shared error messages from performance domain"
  );
  assert.equal(
    officeCollabRecordService.includes("PERFORMANCE_DOMAIN_ERROR_CODES.idRequired"),
    true,
    "office-collab-record service should read shared id-required semantics from performance domain"
  );
  assert.equal(
    officeCollabRecordService.includes("'ID不能为空'"),
    false,
    "office-collab-record service should not hardcode shared id-required messages"
  );
  assert.equal(
    vehicleService.includes("PERFORMANCE_DOMAIN_ERROR_CODES"),
    true,
    "vehicle service should read shared error codes from performance domain"
  );
  assert.equal(
    vehicleService.includes("resolvePerformanceDomainErrorMessage"),
    true,
    "vehicle service should read shared error messages from performance domain"
  );
  assert.equal(
    vehicleService.includes("PERFORMANCE_DOMAIN_ERROR_CODES.idRequired"),
    true,
    "vehicle service should read shared id-required semantics from performance domain"
  );
  assert.equal(
    vehicleService.includes("'ID不能为空'"),
    false,
    "vehicle service should not hardcode shared id-required messages"
  );
  assert.equal(
    workPlanService.includes("PERFORMANCE_DOMAIN_ERROR_CODES"),
    true,
    "work-plan service should read shared error codes from performance domain"
  );
  assert.equal(
    workPlanService.includes("resolvePerformanceDomainErrorMessage"),
    true,
    "work-plan service should read shared error messages from performance domain"
  );
  assert.equal(
    workPlanService.includes("PERFORMANCE_DOMAIN_ERROR_CODES.ownerRequired"),
    true,
    "work-plan service should read shared owner-required semantics from performance domain"
  );
  assert.equal(
    workPlanService.includes("PERFORMANCE_DOMAIN_ERROR_CODES.sourceTypeInvalid"),
    true,
    "work-plan service should read shared source-type-invalid semantics from performance domain"
  );
  assert.equal(
    workPlanService.includes("'负责人不能为空'"),
    false,
    "work-plan service should not hardcode shared owner-required messages"
  );
  assert.equal(
    workPlanService.includes("'来源类型不合法'"),
    false,
    "work-plan service should not hardcode shared source-type-invalid messages"
  );
});

test("normal: repo consistency config tracks base permission domain source files as guard inputs", () => {
  const script = readFileSync(`${scriptsRoot}/repo-consistency-config.mjs`, "utf8");
  assert.equal(
    script.includes("cool-admin-midway/src/modules/base/domain/permissions/source.json"),
    true,
    "repo consistency config should track base permission source.json"
  );
  assert.equal(
    script.includes("cool-admin-midway/src/modules/base/domain/permissions/source.mjs"),
    true,
    "repo consistency config should track base permission source.mjs"
  );
});

test("normal: state guard filters css and type-name noise from state inventory", () => {
  const fixtureRoot = mkdtempSync(join(tmpdir(), "xuedao-state-guard-"));
  const backendDir = join(fixtureRoot, "cool-admin-midway/src/modules/demo");
  const frontendDir = join(fixtureRoot, "cool-admin-vue/src/modules/demo");
  mkdirSync(backendDir, { recursive: true });
  mkdirSync(frontendDir, { recursive: true });

  writeFileSync(
    join(backendDir, "state.ts"),
    `
      const status = "draft";
      export const allowedTransitions = {
        draft: ["approved"]
      };
    `,
    "utf8"
  );
  writeFileSync(
    join(frontendDir, "state.ts"),
    `
      const currentStatus = "draft";
      const allowedTransitions = {
        draft: ["approved"]
      };
      const statusLabelMap = {
        draft: "草稿",
        approved: "已通过"
      };
      const width = "0px";
      const duration = "1s";
      const kind = "Boolean";
      export { currentStatus, allowedTransitions, statusLabelMap, width, duration, kind };
    `,
    "utf8"
  );

  const reportJson = join(fixtureRoot, "state-report.json");
  const result = spawnSync(
    "python3",
    [
      `${scriptsRoot}/state_machine_guard.py`,
      "--phase",
      "batch",
      "--cwd",
      fixtureRoot,
      "--all",
      "--fail-on",
      "none",
      "--report-json",
      reportJson,
    ],
    {
      cwd: repoRoot,
      encoding: "utf8",
    }
  );

  assert.equal(result.status, 0, result.stderr || result.stdout);
  const payload = JSON.parse(readFileSync(reportJson, "utf8"));
  assert.deepEqual(payload, []);
});

test("normal: state guard ignores generated files, guard scripts, and template noise", () => {
  const fixtureRoot = mkdtempSync(join(tmpdir(), "xuedao-state-guard-noise-"));
  const scriptDir = join(fixtureRoot, "scripts");
  const generatedDir = join(fixtureRoot, "cool-uni/generated");
  const frontendDir = join(fixtureRoot, "cool-admin-vue/src/modules/demo");
  mkdirSync(scriptDir, { recursive: true });
  mkdirSync(generatedDir, { recursive: true });
  mkdirSync(frontendDir, { recursive: true });

  writeFileSync(
    join(scriptDir, "state_machine_guard.py"),
    `
      def report(statusCode):
          return {"status": statusCode}
    `,
    "utf8"
  );
  writeFileSync(
    join(generatedDir, "performance-demo.generated.ts"),
    `
      export const generatedStates = {
        approved: "已通过"
      };
    `,
    "utf8"
  );
  writeFileSync(
    join(frontendDir, "noise.vue"),
    `
      <template>
        <el-tag disable-transitions>collapse</el-tag>
      </template>
      <script setup lang="ts">
      const activeBucket = ref<"all" | "today">("all");
      const bucketTabs = computed(() => [
        { label: "全部", value: "all" },
        { label: "今日", value: "today" }
      ]);
      const state = ref({ mode: "denied", error: "" });
      </script>
    `,
    "utf8"
  );

  const reportJson = join(fixtureRoot, "state-report.json");
  const result = spawnSync(
    "python3",
    [
      `${scriptsRoot}/state_machine_guard.py`,
      "--phase",
      "batch",
      "--cwd",
      fixtureRoot,
      "--all",
      "--fail-on",
      "none",
      "--report-json",
      reportJson,
    ],
    {
      cwd: repoRoot,
      encoding: "utf8",
    }
  );

  assert.equal(result.status, 0, result.stderr || result.stdout);
  const payload = JSON.parse(readFileSync(reportJson, "utf8"));
  assert.deepEqual(payload, []);
});

test("normal: state guard ignores governance metadata and non-state enum dictionaries", () => {
  const fixtureRoot = mkdtempSync(join(tmpdir(), "xuedao-state-guard-dict-"));
  const backendDir = join(fixtureRoot, "cool-admin-midway/src/modules/demo");
  const registryDir = join(fixtureRoot, "cool-admin-midway/src/domain-registry");
  const frontendDir = join(fixtureRoot, "cool-admin-vue/src/modules/performance");
  mkdirSync(backendDir, { recursive: true });
  mkdirSync(registryDir, { recursive: true });
  mkdirSync(frontendDir, { recursive: true });

  writeFileSync(
    join(backendDir, "status.ts"),
    `
      export const DEMO_STATUS_VALUES = ["draft", "approved"] as const;
    `,
    "utf8"
  );
  writeFileSync(
    join(registryDir, "catalog.ts"),
    `
      export const DOMAIN_REGISTRY = [
        {
          domain: "demo",
          status: "partial",
          checkpoints: [{ key: "state_machine", status: "out_of_scope" }]
        }
      ] as const;
    `,
    "utf8"
  );
  writeFileSync(
    join(frontendDir, "office-ledger.dictionary.ts"),
    `
      function createOption(value, label, type) {
        return type ? { value, label, type } : { value, label };
      }

      export const DEMO_STATUS_OPTIONS = [
        createOption("draft", "草稿"),
        createOption("approved", "已通过", "success")
      ] as const;

      export const DEMO_STATUS_VALUES = ["draft", "approved"] as const;

      export const DEMO_TYPE_OPTIONS = [
        createOption("article", "文章"),
        createOption("brochure", "画册")
      ] as const;

      export const DEMO_TYPE_VALUES = ["article", "brochure"] as const;
    `,
    "utf8"
  );

  const reportJson = join(fixtureRoot, "state-report.json");
  const result = spawnSync(
    "python3",
    [
      `${scriptsRoot}/state_machine_guard.py`,
      "--phase",
      "batch",
      "--cwd",
      fixtureRoot,
      "--all",
      "--fail-on",
      "none",
      "--report-json",
      reportJson,
    ],
    {
      cwd: repoRoot,
      encoding: "utf8",
    }
  );

  assert.equal(result.status, 0, result.stderr || result.stdout);
  const payload = JSON.parse(readFileSync(reportJson, "utf8"));
  assert.deepEqual(payload, []);
});

test("normal: state guard ignores test fixture statuses when building state inventory", () => {
  const fixtureRoot = mkdtempSync(join(tmpdir(), "xuedao-state-guard-tests-"));
  const backendDir = join(fixtureRoot, "cool-admin-midway/src/modules/demo");
  const testDir = join(fixtureRoot, "cool-admin-midway/test/demo");
  const frontendDir = join(fixtureRoot, "cool-admin-vue/src/modules/demo");
  mkdirSync(backendDir, { recursive: true });
  mkdirSync(testDir, { recursive: true });
  mkdirSync(frontendDir, { recursive: true });

  writeFileSync(
    join(backendDir, "state.ts"),
    `
      export const DEMO_STATUS_VALUES = ["draft", "approved"] as const;
    `,
    "utf8"
  );
  writeFileSync(
    join(testDir, "domain-registry.test.ts"),
    `
      export const COVERAGE = {
        status: "implemented",
        checkpoints: [{ key: "state_machine", status: "partial" }]
      };
    `,
    "utf8"
  );
  writeFileSync(
    join(frontendDir, "state.ts"),
    `
      export const DEMO_STATUS_VALUES = ["draft", "approved"] as const;
    `,
    "utf8"
  );

  const reportJson = join(fixtureRoot, "state-report.json");
  const result = spawnSync(
    "python3",
    [
      `${scriptsRoot}/state_machine_guard.py`,
      "--phase",
      "batch",
      "--cwd",
      fixtureRoot,
      "--all",
      "--fail-on",
      "none",
      "--report-json",
      reportJson,
    ],
    {
      cwd: repoRoot,
      encoding: "utf8",
    }
  );

  assert.equal(result.status, 0, result.stderr || result.stdout);
  const payload = JSON.parse(readFileSync(reportJson, "utf8"));
  assert.deepEqual(payload, []);
});

test("normal: state guard accepts explicit row status button guards as transition evidence", () => {
  const fixtureRoot = mkdtempSync(join(tmpdir(), "xuedao-state-guard-action-"));
  const frontendDir = join(fixtureRoot, "cool-admin-vue/src/modules/performance/views/demo");
  mkdirSync(frontendDir, { recursive: true });

  writeFileSync(
    join(frontendDir, "workspace.vue"),
    `
      <script setup lang="ts">
      type Row = { status?: string };
      function canShowAction(action: "approve" | "close", row: Row) {
        switch (action) {
          case "approve":
            return row.status === "pendingApproval";
          case "close":
            return ["approved", "received"].includes(String(row.status || ""));
          default:
            return false;
        }
      }
      </script>
    `,
    "utf8"
  );

  const reportJson = join(fixtureRoot, "state-report.json");
  const result = spawnSync(
    "python3",
    [
      `${scriptsRoot}/state_machine_guard.py`,
      "--phase",
      "batch",
      "--cwd",
      fixtureRoot,
      "--all",
      "--fail-on",
      "none",
      "--report-json",
      reportJson,
    ],
    {
      cwd: repoRoot,
      encoding: "utf8",
    }
  );

  assert.equal(result.status, 0, result.stderr || result.stdout);
  const payload = JSON.parse(readFileSync(reportJson, "utf8"));
  assert.deepEqual(payload, []);
});

test("normal: state guard recognizes multiline state unions and ignores action or ui tokens", () => {
  const fixtureRoot = mkdtempSync(join(tmpdir(), "xuedao-state-guard-union-"));
  const backendDir = join(fixtureRoot, "cool-admin-midway/src/modules/demo");
  const frontendDir = join(fixtureRoot, "cool-admin-vue/src/modules/demo");
  const generatedDir = join(fixtureRoot, "cool-admin-vue/src/modules/performance/generated");
  mkdirSync(backendDir, { recursive: true });
  mkdirSync(frontendDir, { recursive: true });
  mkdirSync(generatedDir, { recursive: true });

  writeFileSync(
    join(backendDir, "state.ts"),
    `
      export const GOAL_PLAN_STATUS_VALUES = [
        "assigned",
        "submitted",
        "auto_zero"
      ] as const;

      export type GoalPlanStatus =
        | "assigned"
        | "submitted"
        | "auto_zero";

      export const handlers = {
        confirm: "performance:salary:confirm",
        fallback: "performance:approval-flow:fallback"
      };
    `,
    "utf8"
  );
  writeFileSync(
    join(frontendDir, "state.ts"),
    `
      const buttonProps = {
        plain: true,
        detail: "drawer",
        select: "department",
        slide: "fade",
        transparent: true,
        receive: "action"
      };

      export { buttonProps };
    `,
    "utf8"
  );
  writeFileSync(
    join(generatedDir, "goal.generated.ts"),
    `
      export type GoalPlanStatus =
        | "assigned"
        | "submitted"
        | "auto_zero";
    `,
    "utf8"
  );

  const reportJson = join(fixtureRoot, "state-report.json");
  const result = spawnSync(
    "python3",
    [
      `${scriptsRoot}/state_machine_guard.py`,
      "--phase",
      "batch",
      "--cwd",
      fixtureRoot,
      "--all",
      "--fail-on",
      "none",
      "--report-json",
      reportJson,
    ],
    {
      cwd: repoRoot,
      encoding: "utf8",
    }
  );

  assert.equal(result.status, 0, result.stderr || result.stdout);
  const payload = JSON.parse(readFileSync(reportJson, "utf8"));
  assert.deepEqual(payload, []);
});

test("normal: state and component guards run with explicit changed files", () => {
  const stateResult = run([
    "python3",
    `${scriptsRoot}/state_machine_guard.py`,
    "--phase",
    "start",
    "--cwd",
    repoRoot,
    "--fail-on",
    "none",
    "--changed-file",
    `${repoRoot}/cool-admin-midway/src/modules/dict/service/business.ts`,
    "--task",
    "业务状态与数据字典 SSOT",
  ]);
  assert.equal(stateResult.status, 0, stateResult.stderr || stateResult.stdout);

  const componentResult = run([
    "python3",
    `${scriptsRoot}/component_reuse_guard.py`,
    "--phase",
    "start",
    "--cwd",
    repoRoot,
    "--fail-on",
    "none",
    "--changed-file",
    `${repoRoot}/cool-admin-vue/src/modules/performance/views/goals/index.vue`,
  ]);
  assert.equal(componentResult.status, 0, componentResult.stderr || componentResult.stdout);
});

test("normal: rbac guard ignores open controllers and route or menu helper utilities", () => {
  const fixtureRoot = mkdtempSync(join(tmpdir(), "xuedao-rbac-guard-noise-"));
  const backendDir = join(fixtureRoot, "cool-admin-midway/src/modules/base/controller/admin");
  const frontendHookDir = join(fixtureRoot, "cool-admin-vue/src/modules/helper/hooks");
  const frontendUtilDir = join(fixtureRoot, "cool-admin-vue/src/modules/performance/utils");
  mkdirSync(backendDir, { recursive: true });
  mkdirSync(frontendHookDir, { recursive: true });
  mkdirSync(frontendUtilDir, { recursive: true });

  writeFileSync(
    join(backendDir, "open.ts"),
    `
      @CoolTag(TagTypes.IGNORE_TOKEN)
      @Get('/captcha')
      async captcha() {
        return {};
      }
    `,
    "utf8"
  );

  writeFileSync(
    join(frontendHookDir, "menu.ts"),
    `
      export function useMenu() {
        async function del(router: string) {
          return router;
        }
        return { del };
      }
    `,
    "utf8"
  );

  writeFileSync(
    join(frontendUtilDir, "route-preset.js"),
    `
      export async function clearRoutePresetQuery(options) {
        await options.router.replace({
          path: options.route.path,
          query: {}
        });
      }
    `,
    "utf8"
  );

  const reportJson = join(fixtureRoot, "rbac-report.json");
  const result = spawnSync(
    "python3",
    [
      `${scriptsRoot}/rbac_alignment_guard.py`,
      "--phase",
      "batch",
      "--cwd",
      fixtureRoot,
      "--fail-on",
      "none",
      "--changed-file",
      `${fixtureRoot}/cool-admin-midway/src/modules/base/controller/admin/open.ts`,
      "--changed-file",
      `${fixtureRoot}/cool-admin-vue/src/modules/helper/hooks/menu.ts`,
      "--changed-file",
      `${fixtureRoot}/cool-admin-vue/src/modules/performance/utils/route-preset.js`,
      "--report-json",
      reportJson,
    ],
    {
      cwd: repoRoot,
      encoding: "utf8",
    }
  );

  assert.equal(result.status, 0, result.stderr || result.stdout);
  const payload = JSON.parse(readFileSync(reportJson, "utf8"));
  assert.deepEqual(payload, []);
});

test("normal: rbac guard recognizes generated permission registries with page and info style keys", () => {
  const fixtureRoot = mkdtempSync(join(tmpdir(), "xuedao-rbac-guard-registry-"));
  const backendDir = join(fixtureRoot, "cool-admin-midway/src/modules/base/generated");
  const frontendDir = join(fixtureRoot, "cool-admin-vue/src/modules/base/generated");
  mkdirSync(backendDir, { recursive: true });
  mkdirSync(frontendDir, { recursive: true });

  writeFileSync(
    join(backendDir, "permissions.generated.ts"),
    `
      export const backendPermissions = [
        "performance:assessment:page",
        "performance:assessment:info",
        "performance:assessment:add",
        "performance:assessment:submit",
        "performance:assessment:myPage",
        "performance:assessment:pendingPage",
        "performance:approval-flow:configInfo",
        "performance:approvalFlow:configInfo",
        "performance:workPlan:updateStatus"
      ] as const;
    `,
    "utf8"
  );
  writeFileSync(
    join(frontendDir, "permissions.generated.ts"),
    `
      export const frontendPermissions = [
        "performance:assessment:page",
        "performance:assessment:info",
        "performance:assessment:add",
        "performance:assessment:submit",
        "performance:assessment:myPage",
        "performance:assessment:pendingPage",
        "performance:approval-flow:configInfo",
        "performance:approvalFlow:configInfo",
        "performance:workPlan:updateStatus"
      ] as const;
    `,
    "utf8"
  );
  writeFileSync(
    join(frontendDir, "route-permissions.generated.ts"),
    `
      export const routePermissions = {
        "/performance/my-assessment": "performance:assessment:myPage",
        "/performance/pending": [
          "performance:assessment:pendingPage",
          "performance:assessment:info"
        ]
      } as const;
    `,
    "utf8"
  );

  const reportJson = join(fixtureRoot, "rbac-report.json");
  const result = spawnSync(
    "python3",
    [
      `${scriptsRoot}/rbac_alignment_guard.py`,
      "--phase",
      "batch",
      "--cwd",
      fixtureRoot,
      "--fail-on",
      "none",
      "--changed-file",
      `${fixtureRoot}/cool-admin-midway/src/modules/base/generated/permissions.generated.ts`,
      "--changed-file",
      `${fixtureRoot}/cool-admin-vue/src/modules/base/generated/permissions.generated.ts`,
      "--changed-file",
      `${fixtureRoot}/cool-admin-vue/src/modules/base/generated/route-permissions.generated.ts`,
      "--report-json",
      reportJson,
    ],
    {
      cwd: repoRoot,
      encoding: "utf8",
    }
  );

  assert.equal(result.status, 0, result.stderr || result.stdout);
  const payload = JSON.parse(readFileSync(reportJson, "utf8"));
  assert.deepEqual(payload, []);
});

test("normal: rbac full inventory prefers canonical generated permission registries over backend capability noise", () => {
  const fixtureRoot = mkdtempSync(join(tmpdir(), "xuedao-rbac-guard-canonical-"));
  const backendGeneratedDir = join(fixtureRoot, "cool-admin-midway/src/modules/base/generated");
  const backendDomainDir = join(fixtureRoot, "cool-admin-midway/src/modules/performance/domain");
  const frontendGeneratedDir = join(fixtureRoot, "cool-admin-vue/src/modules/base/generated");
  mkdirSync(backendGeneratedDir, { recursive: true });
  mkdirSync(backendDomainDir, { recursive: true });
  mkdirSync(frontendGeneratedDir, { recursive: true });

  writeFileSync(
    join(backendGeneratedDir, "permissions.generated.ts"),
    `
      export const backendPermissions = [
        "performance:assessment:page",
        "performance:assessment:info",
        "performance:assessment:add",
        "performance:assessment:submit"
      ] as const;
    `,
    "utf8"
  );
  writeFileSync(
    join(frontendGeneratedDir, "permissions.generated.ts"),
    `
      export const frontendPermissions = [
        "performance:assessment:page",
        "performance:assessment:info",
        "performance:assessment:add",
        "performance:assessment:submit"
      ] as const;
    `,
    "utf8"
  );
  writeFileSync(
    join(backendDomainDir, "roles.ts"),
    `
      export const capabilityCatalog = [
        "assessment.manage.read",
        "assessment.manage.create",
        "assessment.submit"
      ] as const;
    `,
    "utf8"
  );

  const reportMd = join(fixtureRoot, "rbac-report.md");
  const changedFiles = [
    `${fixtureRoot}/cool-admin-midway/src/modules/base/generated/permissions.generated.ts`,
    `${fixtureRoot}/cool-admin-vue/src/modules/base/generated/permissions.generated.ts`,
    `${fixtureRoot}/cool-admin-midway/src/modules/performance/domain/roles.ts`
  ];
  const cliArgs = [
    `${scriptsRoot}/rbac_alignment_guard.py`,
    "--phase",
    "batch",
    "--cwd",
    fixtureRoot,
    "--fail-on",
    "none",
    "--report-md",
    reportMd,
  ];

  for (let index = 0; index < 80; index += 1) {
    for (const file of changedFiles) {
      cliArgs.push("--changed-file", file);
    }
  }

  const result = spawnSync("python3", cliArgs, {
    cwd: repoRoot,
    encoding: "utf8",
  });

  assert.equal(result.status, 0, result.stderr || result.stdout);
  const report = readFileSync(reportMd, "utf8");
  assert.match(report, /canonical permissions\.generated\.ts/);
  assert.doesNotMatch(report, /后端权限键覆盖不完全/);
});

test("normal: component guard ignores service fetchPage calls and local request helpers", () => {
  const fixtureRoot = mkdtempSync(join(tmpdir(), "xuedao-component-guard-"));
  const frontendDir = join(fixtureRoot, "cool-admin-vue/src/modules/performance/views/demo");
  mkdirSync(frontendDir, { recursive: true });

  writeFileSync(
    join(frontendDir, "workspace.vue"),
    `
      <script setup lang="ts">
      async function request() {
        return Promise.resolve();
      }

      async function load(service: any) {
        await service.fetchPage({ page: 1, size: 20 });
        await request();
      }
      </script>
    `,
    "utf8"
  );

  const reportJson = join(fixtureRoot, "component-report.json");
  const result = spawnSync(
    "python3",
    [
      `${scriptsRoot}/component_reuse_guard.py`,
      "--phase",
      "batch",
      "--cwd",
      fixtureRoot,
      "--all",
      "--fail-on",
      "none",
      "--report-json",
      reportJson,
    ],
    {
      cwd: repoRoot,
      encoding: "utf8",
    }
  );

  assert.equal(result.status, 0, result.stderr || result.stdout);
  const payload = JSON.parse(readFileSync(reportJson, "utf8"));
  const highWarnings = payload.warnings.filter(item => item.severity === "high");
  assert.deepEqual(highWarnings, []);
});

test("normal: component guard does not treat login pages or drawer components as list pages", () => {
  const fixtureRoot = mkdtempSync(join(tmpdir(), "xuedao-component-guard-non-list-"));
  const loginDir = join(fixtureRoot, "cool-admin-vue/src/modules/base/pages/login");
  const homeDir = join(fixtureRoot, "cool-uni/pages/index");
  const dashboardDir = join(fixtureRoot, "cool-admin-vue/src/modules/performance/views/asset");
  const componentDir = join(fixtureRoot, "cool-admin-vue/src/modules/performance/components");
  mkdirSync(loginDir, { recursive: true });
  mkdirSync(homeDir, { recursive: true });
  mkdirSync(dashboardDir, { recursive: true });
  mkdirSync(componentDir, { recursive: true });

  writeFileSync(
    join(loginDir, "index.vue"),
    `
      <template>
        <div class="page-login">
          <el-form :disabled="loading">
            <el-input v-model="form.username" />
            <el-input v-model="form.password" />
          </el-form>
        </div>
      </template>
      <script setup lang="ts">
      import { reactive, ref } from "vue";
      const loading = ref(false);
      const form = reactive({ username: "", password: "", verifyCode: "" });
      </script>
    `,
    "utf8"
  );

  writeFileSync(
    join(homeDir, "home.vue"),
    `
      <template>
        <view>
          <view v-for="card in cards" :key="card.id">{{ card.title }}</view>
        </view>
      </template>
      <script setup lang="ts">
      const cards = [{ id: "goal", title: "目标" }];
      async function refreshSummary(service: any) {
        await service.fetchPage({ page: 1, size: 1 });
      }
      </script>
    `,
    "utf8"
  );

  writeFileSync(
    join(dashboardDir, "dashboard.vue"),
    `
      <template>
        <div>
          <el-input v-model="filters.keyword" />
          <el-table :data="activityTimeline" />
        </div>
      </template>
      <script setup lang="ts">
      import { computed, reactive } from "vue";
      const filters = reactive({ keyword: "" });
      const summary = { value: { recentActivities: [] } };
      const activityTimeline = computed(() => summary.value.recentActivities || []);
      async function loadSummary(service: any) {
        await service.fetchSummary({ keyword: filters.keyword || undefined });
      }
      </script>
    `,
    "utf8"
  );

  writeFileSync(
    join(componentDir, "summary-drawer.vue"),
    `
      <template>
        <el-drawer :model-value="modelValue">
          <el-table :data="records" />
        </el-drawer>
      </template>
      <script setup lang="ts">
      defineProps<{ modelValue: boolean }>();
      const records = [{ id: 1 }];
      </script>
    `,
    "utf8"
  );

  const reportJson = join(fixtureRoot, "component-report.json");
  const result = spawnSync(
    "python3",
    [
      `${scriptsRoot}/component_reuse_guard.py`,
      "--phase",
      "batch",
      "--cwd",
      fixtureRoot,
      "--all",
      "--fail-on",
      "none",
      "--report-json",
      reportJson,
    ],
    {
      cwd: repoRoot,
      encoding: "utf8",
    }
  );

  assert.equal(result.status, 0, result.stderr || result.stdout);
  const payload = JSON.parse(readFileSync(reportJson, "utf8"));
  const mixedListWarnings = payload.warnings.filter(item => item.code === "mixed-list-state");
  assert.deepEqual(mixedListWarnings, []);
});

test("normal: component guard only reports pagination drift when multiple aliases are present", () => {
  const fixtureRoot = mkdtempSync(join(tmpdir(), "xuedao-component-guard-pagination-"));
  const frontendDir = join(fixtureRoot, "cool-admin-vue/src/modules/performance/views/demo");
  mkdirSync(frontendDir, { recursive: true });

  writeFileSync(
    join(frontendDir, "single-alias.vue"),
    `
      <template>
        <el-pagination :total="pagination.total" />
      </template>
      <script setup lang="ts">
      const pagination = { total: 10 };
      const rows = [];
      </script>
    `,
    "utf8"
  );

  writeFileSync(
    join(frontendDir, "multi-alias.vue"),
    `
      <template>
        <el-pagination :total="pagination.total" />
      </template>
      <script setup lang="ts">
      const pagination = { total: 10 };
      const result = { list: [], rows: [] };
      const rows = result.list || result.rows || [];
      </script>
    `,
    "utf8"
  );

  const reportJson = join(fixtureRoot, "component-report.json");
  const result = spawnSync(
    "python3",
    [
      `${scriptsRoot}/component_reuse_guard.py`,
      "--phase",
      "batch",
      "--cwd",
      fixtureRoot,
      "--all",
      "--fail-on",
      "none",
      "--report-json",
      reportJson,
    ],
    {
      cwd: repoRoot,
      encoding: "utf8",
    }
  );

  assert.equal(result.status, 0, result.stderr || result.stdout);
  const payload = JSON.parse(readFileSync(reportJson, "utf8"));
  const paginationWarnings = payload.warnings.filter(item => item.code === "pagination-shape-drift");
  assert.equal(paginationWarnings.length, 1);
  assert.equal(paginationWarnings[0].file.endsWith("multi-alias.vue"), true);
  assert.equal(paginationWarnings[0].evidence.includes("list"), true);
  assert.equal(paginationWarnings[0].evidence.includes("rows"), true);
});

test("normal: unified guard aggregates local subguards and writes JSON report", () => {
  const reportDir = mkdtempSync(join(tmpdir(), "xuedao-guard-"));
  const reportJson = `${reportDir}/unified.json`;
  const result = run([
    "python3",
    `${scriptsRoot}/unified_delivery_guard.py`,
    "--phase",
    "start",
    "--cwd",
    repoRoot,
    "--fail-on",
    "none",
    "--task",
    "业务状态与数据字典 SSOT 守卫闭环",
    "--changed-file",
    `${repoRoot}/cool-admin-vue/src/modules/performance/views/goals/index.vue`,
    "--changed-file",
    `${repoRoot}/cool-admin-midway/src/modules/dict/service/business.ts`,
    "--report-json",
    reportJson,
  ]);

  assert.equal(result.status, 0, result.stderr || result.stdout);
  assert.equal(existsSync(reportJson), true, "unified guard json report should exist");

  const payload = JSON.parse(readFileSync(reportJson, "utf8"));
  assert.equal(Array.isArray(payload), true);
});

test("normal: node wrappers expose batch/all entrypoints", () => {
  const stateWrapper = run([
    "node",
    `${scriptsRoot}/check-state-machine-alignment.mjs`,
    "--phase",
    "start",
    "--all",
    "--fail-on",
    "none",
  ]);
  assert.equal(stateWrapper.status, 0, stateWrapper.stderr || stateWrapper.stdout);

  const componentWrapper = run([
    "node",
    `${scriptsRoot}/check-component-reuse.mjs`,
    "--phase",
    "start",
    "--all",
    "--fail-on",
    "none",
  ]);
  assert.equal(componentWrapper.status, 0, componentWrapper.stderr || componentWrapper.stdout);

  const unifiedWrapper = run([
    "node",
    `${scriptsRoot}/check-unified-delivery.mjs`,
    "--phase",
    "start",
    "--all",
    "--fail-on",
    "none",
  ]);
  assert.equal(unifiedWrapper.status, 0, unifiedWrapper.stderr || unifiedWrapper.stdout);
});

test("normal: worktree split audit classifies dirty files into stable batches and writes reports", () => {
  const fixtureRoot = mkdtempSync(join(tmpdir(), "xuedao-worktree-split-"));
  execFileSync("git", ["init"], { cwd: fixtureRoot, stdio: "ignore" });
  execFileSync("git", ["config", "user.name", "Codex"], { cwd: fixtureRoot, stdio: "ignore" });
  execFileSync("git", ["config", "user.email", "codex@example.com"], { cwd: fixtureRoot, stdio: "ignore" });

  for (const [relativePath, content] of [
    ["README.md", "# baseline\n"],
    ["scripts/check-demo.mjs", "console.log('baseline');\n"],
    ["cool-admin-midway/src/modules/base/service/sys/user.ts", "export const userBase = 1;\n"],
    [
      "cool-admin-midway/src/modules/performance/service/teacher-channel-core.ts",
      "export const teacherChannelCore = 1;\n",
    ],
    ["cool-admin-midway/src/modules/performance/service/teacher-info.ts", "export const teacherInfo = 1;\n"],
    ["cool-admin-vue/src/modules/performance/views/teacher-channel/index.vue", "<template />\n"],
    ["cool-admin-vue/.env", "VITE_APP_TITLE=baseline\n"],
    ["cool-uni/pages/index.vue", "<template />\n"],
    ["performance-management-system/docs/note.md", "# baseline\n"],
  ]) {
    writeTempFile(fixtureRoot, relativePath, content);
  }

  execFileSync("git", ["add", "."], { cwd: fixtureRoot, stdio: "ignore" });
  execFileSync("git", ["commit", "-m", "init"], { cwd: fixtureRoot, stdio: "ignore" });

  writeTempFile(fixtureRoot, "README.md", "# changed\n");
  writeTempFile(fixtureRoot, "scripts/check-demo.mjs", "console.log('changed');\n");
  writeTempFile(
    fixtureRoot,
    "cool-admin-midway/src/modules/base/service/sys/user.ts",
    "export const userBase = 2;\n"
  );
  writeTempFile(
    fixtureRoot,
    "cool-admin-midway/src/modules/performance/service/teacher-channel-core.ts",
    "export const teacherChannelCore = 2;\n"
  );
  writeTempFile(
    fixtureRoot,
    "cool-admin-midway/src/modules/performance/service/teacher-info.ts",
    "export const teacherInfo = 2;\n"
  );
  writeTempFile(
    fixtureRoot,
    "cool-admin-vue/src/modules/performance/views/teacher-channel/index.vue",
    "<template><div>teacher</div></template>\n"
  );
  writeTempFile(fixtureRoot, "cool-admin-vue/.env", "VITE_APP_TITLE=changed\n");
  writeTempFile(fixtureRoot, "cool-uni/pages/index.vue", "<template><view>uni</view></template>\n");
  writeTempFile(fixtureRoot, "performance-management-system/docs/note.md", "# changed\n");
  writeTempFile(fixtureRoot, ".tmp-captcha-ocr/result.txt", "temp\n");

  execFileSync("git", ["add", "README.md"], { cwd: fixtureRoot, stdio: "ignore" });

  const reportMd = join(fixtureRoot, "reports", "delivery", "worktree.md");
  const reportJson = join(fixtureRoot, "reports", "delivery", "worktree.json");
  const result = runInCwd(
    [
      "node",
      `${scriptsRoot}/audit-worktree-split.mjs`,
      "--cwd",
      fixtureRoot,
      "--report-md",
      reportMd,
      "--report-json",
      reportJson,
    ],
    repoRoot
  );

  assert.equal(result.status, 0, result.stderr || result.stdout);
  assert.equal(existsSync(reportMd), true, "worktree split markdown report should exist");
  assert.equal(existsSync(reportJson), true, "worktree split json report should exist");

  const payload = JSON.parse(readFileSync(reportJson, "utf8"));
  assert.equal(payload.verdict, "WARN");
  assert.equal(payload.totals.files >= 8, true);
  assert.equal(payload.isolation.some(item => item.kind === "staged"), true);
  assert.equal(payload.isolation.some(item => item.kind === "temporary"), true);
  assert.equal(
    payload.files.some(item => item.path === "README.md" && item.batchId === "governance-ssot"),
    true
  );
  assert.equal(
    payload.files.some(
      item =>
        item.path === "cool-admin-midway/src/modules/base/service/sys/user.ts" &&
        item.batchId === "backend-base-user-dict"
    ),
    true
  );
  assert.equal(
    payload.files.some(
      item =>
        item.path === "cool-admin-midway/src/modules/performance/service/teacher-channel-core.ts" &&
        item.batchId === "backend-performance-shared"
    ),
    true
  );
  assert.equal(
    payload.files.some(
      item =>
        item.path === "cool-admin-midway/src/modules/performance/service/teacher-info.ts" &&
        item.batchId === "backend-performance-themes"
    ),
    true
  );
  assert.equal(
    payload.files.some(
      item =>
        item.path === "cool-admin-vue/src/modules/performance/views/teacher-channel/index.vue" &&
        item.batchId === "frontend-performance-themes"
    ),
    true
  );
  assert.equal(
    payload.files.some(item => item.path === "cool-admin-vue/.env" && item.batchId === "local-runtime-env"),
    true
  );
  assert.equal(
    payload.files.some(item => item.path === "cool-uni/pages/index.vue" && item.batchId === "frontend-shell-mobile"),
    true
  );
  assert.equal(
    payload.files.some(
      item =>
        item.path === "performance-management-system/docs/note.md" && item.batchId === "docs-evidence"
    ),
    true
  );
  assert.equal(
    payload.files.some(item => item.path === ".tmp-captcha-ocr/result.txt" && item.batchId === "cleanup-temp"),
    true
  );
  assert.match(readFileSync(reportMd, "utf8"), /\[worktree-split-audit\] WARN/);
});

test("normal: worktree split audit can print paths for a single batch", () => {
  const fixtureRoot = mkdtempSync(join(tmpdir(), "xuedao-worktree-batch-paths-"));
  execFileSync("git", ["init"], { cwd: fixtureRoot, stdio: "ignore" });
  execFileSync("git", ["config", "user.name", "Codex"], { cwd: fixtureRoot, stdio: "ignore" });
  execFileSync("git", ["config", "user.email", "codex@example.com"], { cwd: fixtureRoot, stdio: "ignore" });

  writeTempFile(fixtureRoot, "README.md", "# init\n");
  writeTempFile(
    fixtureRoot,
    "cool-admin-midway/src/modules/base/service/sys/user.ts",
    "export const userBase = 1;\n"
  );
  execFileSync("git", ["add", "."], { cwd: fixtureRoot, stdio: "ignore" });
  execFileSync("git", ["commit", "-m", "init"], { cwd: fixtureRoot, stdio: "ignore" });

  writeTempFile(fixtureRoot, "README.md", "# changed\n");
  writeTempFile(
    fixtureRoot,
    "cool-admin-midway/src/modules/base/service/sys/user.ts",
    "export const userBase = 2;\n"
  );

  const result = runInCwd(
    [
      "node",
      `${scriptsRoot}/audit-worktree-split.mjs`,
      "--cwd",
      fixtureRoot,
      "--batch-id",
      "governance-ssot",
      "--output",
      "paths",
    ],
    repoRoot
  );

  assert.equal(result.status, 0, result.stderr || result.stdout);
  assert.equal(result.stdout.trim(), "README.md");
});

test("normal: mobile shared contract script fails on missing page and missing permission drift", () => {
  const fixtureRoot = mkdtempSync(join(tmpdir(), "xuedao-mobile-shared-"));
  writeTempFile(
    fixtureRoot,
    "cool-uni/types/performance-mobile.ts",
    `
      import { PERMISSIONS } from "/@/generated/permissions.generated";
      export type MobileWorkbenchPageId = "dashboard" | "teacher-dashboard";
      export const workbenchCards = {
        dashboard: {
          id: "dashboard" as const,
          path: "/pages/performance/dashboard/index",
        },
        "teacher-dashboard": {
          id: "teacher-dashboard" as const,
          path: "/pages/performance/teacher-channel/dashboard",
        },
      };
      const ROUTE_RULES = [
        {
          prefix: "/pages/performance/dashboard/index",
          requiredPerms: [PERMISSIONS.performance.dashboard.summary],
        },
        {
          prefix: "/pages/performance/teacher-channel/dashboard",
          requiredPerms: [PERMISSIONS.performance.teacherDashboard.summary],
        },
      ];
      export function resolveWorkbenchPages() {
        const next: MobileWorkbenchPageId[] = [];
        next.push("dashboard");
        return next;
      }
    `,
    "utf8"
  );
  writeTempFile(
    fixtureRoot,
    "cool-uni/generated/permissions.generated.ts",
    `
      export const ADMIN_PERMISSION_KEYS = [
        "performance:dashboard:summary"
      ] as const;
    `,
    "utf8"
  );
  writeTempFile(fixtureRoot, "cool-uni/pages/performance/dashboard/index.vue", "<template />\n", "utf8");

  const result = run([
    "node",
    `${scriptsRoot}/check-mobile-shared-contract.mjs`,
    "--cwd",
    fixtureRoot,
  ]);

  assert.equal(result.status, 1, result.stderr || result.stdout);
  assert.match(result.stderr, /移动端共享契约引用了不存在的权限键: performance:teacherDashboard:summary/);
  assert.match(result.stderr, /workbench card path 对应页面不存在: \/pages\/performance\/teacher-channel\/dashboard/);
});

test("normal: shared error semantics script fails when runtime message is not registered", () => {
  const fixtureRoot = mkdtempSync(join(tmpdir(), "xuedao-shared-errors-"));
  writeTempFile(
    fixtureRoot,
    "cool-admin-midway/src/modules/base/domain/errors/catalog.ts",
    `
      export const BASE_DOMAIN_ERRORS = [
        { code: "BASE_AUTH_EXPIRED", category: "auth", defaultMessage: "登录失效~" },
      ] as const;
      export const BASE_DOMAIN_ERROR_RUNTIME_SOURCES = [
        "src/modules/base/service/sys/login.ts",
      ] as const;
    `,
    "utf8"
  );
  writeTempFile(
    fixtureRoot,
    "cool-admin-midway/src/modules/user/domain/errors/catalog.ts",
    `
      export const USER_DOMAIN_ERRORS = [
        { code: "USER_AUTH_EXPIRED", category: "auth", defaultMessage: "登录失效~" },
      ] as const;
      export const USER_DOMAIN_ERROR_RUNTIME_SOURCES = [
        "src/modules/user/middleware/app.ts",
      ] as const;
    `,
    "utf8"
  );
  writeTempFile(
    fixtureRoot,
    "cool-admin-midway/src/modules/dict/domain/errors/catalog.ts",
    `
      export const DICT_DOMAIN_ERRORS = [
        {
          code: "DICT_PROVIDER_MISSING",
          category: "consistency",
          defaultMessage: "Registered business dict key is missing provider output: {requestedKey}",
        },
      ] as const;
      export const DICT_DOMAIN_ERROR_RUNTIME_SOURCES = [
        "src/modules/dict/domain/dicts/catalog.ts",
      ] as const;
    `,
    "utf8"
  );
  writeTempFile(
    fixtureRoot,
    "cool-admin-midway/src/modules/base/service/sys/login.ts",
    `throw new Error("未知错误");\n`,
    "utf8"
  );
  writeTempFile(
    fixtureRoot,
    "cool-admin-midway/src/modules/user/middleware/app.ts",
    `throw new CoolCommException("登录失效~");\n`,
    "utf8"
  );
  writeTempFile(
    fixtureRoot,
    "cool-admin-midway/src/modules/dict/domain/dicts/catalog.ts",
    "throw new Error(`Registered business dict key is missing provider output: ${requestedKey}`);\n",
    "utf8"
  );

  const result = run([
    "node",
    `${scriptsRoot}/check-shared-error-semantics.mjs`,
    "--cwd",
    fixtureRoot,
  ]);

  assert.equal(result.status, 1, result.stderr || result.stdout);
  assert.match(result.stderr, /base runtime message 未登记到 catalog/);
  assert.match(result.stderr, /未知错误/);
});
