/**
 * Theme-4 stage-1 readiness smoke for the suggestion module.
 * This file verifies repository-level prerequisites for real validation and prints a readable pass/fail conclusion.
 * It does not start services, mutate business data, or replace real API smoke once suggestion endpoints exist.
 * Maintenance pitfall: keep the required artifacts aligned with the frozen resource model `suggestion` and permission key `performance:suggestion:*`.
 */
import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, '..');

const artifactChecks = [
  {
    kind: 'implementation',
    label: 'Entity',
    relativePath: 'src/modules/performance/entity/suggestion.ts',
  },
  {
    kind: 'implementation',
    label: 'Service',
    relativePath: 'src/modules/performance/service/suggestion.ts',
  },
  {
    kind: 'implementation',
    label: 'Controller',
    relativePath: 'src/modules/performance/controller/admin/suggestion.ts',
  },
  {
    kind: 'registration',
    label: 'Entity registry',
    relativePath: 'src/entities.ts',
    pattern: /suggestion/i,
  },
  {
    kind: 'permission',
    label: 'Permission registration',
    relativePath: 'src/modules/base/menu.json',
    pattern: /performance:suggestion:/,
  },
  {
    kind: 'test',
    label: 'Backend test',
    relativePath: 'test/performance/suggestion.service.test.ts',
  },
];

function readFile(relativePath) {
  const absolutePath = path.join(projectRoot, relativePath);
  if (!fs.existsSync(absolutePath)) {
    return { exists: false, absolutePath, content: '' };
  }
  return {
    exists: true,
    absolutePath,
    content: fs.readFileSync(absolutePath, 'utf8'),
  };
}

function runCheck(check) {
  const file = readFile(check.relativePath);
  if (!file.exists) {
    return {
      ...check,
      ok: false,
      detail: `missing file ${check.relativePath}`,
    };
  }

  if (check.pattern && !check.pattern.test(file.content)) {
    return {
      ...check,
      ok: false,
      detail: `missing pattern ${String(check.pattern)} in ${check.relativePath}`,
    };
  }

  return {
    ...check,
    ok: true,
    detail: check.pattern
      ? `found ${String(check.pattern)} in ${check.relativePath}`
      : `found ${check.relativePath}`,
  };
}

function printSection(title, items) {
  console.log(`\n${title}`);
  for (const item of items) {
    const marker = item.ok ? 'PASS' : 'FAIL';
    console.log(`- [${marker}] ${item.label}: ${item.detail}`);
  }
}

const results = artifactChecks.map(runCheck);
const failed = results.filter(item => !item.ok);
const grouped = {
  implementation: results.filter(item => item.kind === 'implementation'),
  registration: results.filter(item => item.kind === 'registration'),
  permission: results.filter(item => item.kind === 'permission'),
  test: results.filter(item => item.kind === 'test'),
};

console.log('Theme 4 suggestion readiness smoke');
console.log(`Project root: ${projectRoot}`);
printSection('Implementation artifacts', grouped.implementation);
printSection('Registration artifacts', grouped.registration);
printSection('Permission artifacts', grouped.permission);
printSection('Test artifacts', grouped.test);

if (failed.length > 0) {
  console.log('\nConclusion: FAIL');
  console.log(
    'Unique blocker: suggestion 主实现与可执行接口/权限链路尚未完整落地，无法完成真实后端测试与最小联调'
  );
  process.exit(1);
}

console.log('\nConclusion: PASS');
console.log('Suggestion 静态就绪性已满足进入真实后端测试与最小联调的前置条件');
