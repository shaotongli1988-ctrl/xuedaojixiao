/**
 * 负责在 git push 前做变更感知的严格门禁，阻断临时产物、未冻结范围和缺少最小验证的推送。
 * 不负责替代远端分支保护、修复业务代码，或自动清理工作区。
 * 依赖 git 状态、上游分支、以及 cool-admin-midway / cool-admin-vue / cool-uni 的现有命令。
 * 维护重点：冻结范围和阻断路径会随主题推进变化，进入下一主题前必须同步更新本文件。
 */
import { execFileSync, spawnSync } from 'node:child_process';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';
import {
  resolveProjectGitHash,
  resolveProjectSourceHash,
} from '../cool-admin-midway/scripts/stage2-runtime-meta.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, '..');

const alwaysBlockedExactPaths = [
  'cool-admin-midway/approved',
  'cool-admin-midway/in_review',
  'cool-admin-midway/manual_pending',
  'cool-admin-midway/rejected',
  'cool-admin-midway/src/index.ts',
  'cool-admin-midway/terminated',
  'cool-admin-midway/withdrawn',
];

const alwaysBlockedPrefixes = [
  'cool-uni/test-results/',
];

const repoContractModuleRoots = [
  'cool-admin-midway/src/modules/base/',
  'cool-admin-midway/src/modules/demo/',
  'cool-admin-midway/src/modules/dict/',
  'cool-admin-midway/src/modules/plugin/',
  'cool-admin-midway/src/modules/recycle/',
  'cool-admin-midway/src/modules/space/',
  'cool-admin-midway/src/modules/task/',
  'cool-admin-midway/src/modules/user/',
];
const automationGovernanceDocPath = 'performance-management-system/docs/24-自动化测试策略与脚本规划.md';

const commandGroups = [
  {
    id: 'repo-consistency-guards',
    description: '仓库一致性守卫（OpenAPI/EPS 类型、目录命名、菜单路由、权限键、文档回写、状态流、实现层收敛）',
    cwd: '.',
    command: ['node', './scripts/run-repo-consistency-guards.mjs'],
    scopeMatchedFiles: true,
    matches(filePath) {
      return (
        filePath.startsWith('contracts/') ||
        filePath === 'cool-admin-midway/src/modules/base/menu.json' ||
        filePath === 'cool-admin-vue/src/modules/base/store/menu.ts' ||
        filePath.startsWith('.github/workflows/') ||
        repoContractModuleRoots.some(root => filePath.startsWith(root)) ||
        filePath.startsWith('cool-admin-vue/src/modules/performance/') ||
        filePath.startsWith('cool-admin-midway/src/modules/performance/') ||
        filePath.startsWith('scripts/') ||
        filePath === automationGovernanceDocPath ||
        filePath.startsWith('performance-management-system/test/') ||
        filePath.startsWith('cool-admin-midway/test/') ||
        filePath.startsWith('cool-admin-vue/test/')
      );
    },
  },
  {
    id: 'repo-guard-tests',
    description: '仓库守卫脚本与 CI 门禁回归测试',
    cwd: '.',
    command: ['node', '--test', './performance-management-system/test/repo-guard-scripts.test.mjs'],
    matches(filePath) {
      return (
        filePath.startsWith('.github/workflows/') ||
        filePath.startsWith('scripts/') ||
        filePath === automationGovernanceDocPath ||
        filePath.startsWith('performance-management-system/test/')
      );
    },
  },
  {
    id: 'midway-build',
    description: '后端构建校验',
    cwd: 'cool-admin-midway',
    command: ['npm', 'run', 'build'],
    matches(filePath) {
      return (
        filePath === 'cool-admin-midway/package.json' ||
        filePath === 'cool-admin-midway/src/entities.ts' ||
        filePath.startsWith('cool-admin-midway/src/modules/base/') ||
        filePath.startsWith('cool-admin-midway/src/modules/performance/') ||
        filePath.startsWith('cool-admin-midway/test/') ||
        filePath.startsWith('cool-admin-midway/scripts/')
      );
    },
  },
  {
    id: 'midway-tests',
    description: '后端 performance 模块定向回归测试',
    cwd: 'cool-admin-midway',
    command: [
      'npm',
      'run',
      'test',
      '--',
      'test/performance',
    ],
    matches(filePath) {
      return (
        filePath === 'cool-admin-midway/package.json' ||
        filePath === 'cool-admin-midway/src/entities.ts' ||
        filePath.startsWith('cool-admin-midway/src/modules/base/') ||
        filePath.startsWith('cool-admin-midway/src/modules/performance/') ||
        filePath.startsWith('cool-admin-midway/test/') ||
        filePath === 'cool-admin-midway/scripts/seed-stage2-performance.mjs' ||
        filePath === 'cool-admin-midway/scripts/smoke-stage2-performance.mjs'
      );
    },
  },
  {
    id: 'midway-smoke',
    description: '后端阶段 2 真实 smoke',
    cwd: 'cool-admin-midway',
    command: ['node', './scripts/smoke-stage2-performance.mjs'],
    matches(filePath) {
      return (
        filePath.startsWith('cool-admin-midway/src/modules/base/') ||
        filePath.startsWith('cool-admin-midway/src/modules/performance/') ||
        filePath === 'cool-admin-midway/src/entities.ts' ||
        filePath === 'cool-admin-midway/src/modules/base/menu.json' ||
        filePath === 'cool-admin-midway/scripts/seed-stage2-performance.mjs' ||
        filePath === 'cool-admin-midway/scripts/smoke-stage2-performance.mjs'
      );
    },
  },
  {
    id: 'vue-format-check',
    description: '后台前端变更文件格式检查',
    cwd: '.',
    command: ['node', './scripts/check-changed-workspace-quality.mjs', '--workspace', 'cool-admin-vue', '--tool', 'prettier'],
    matches(filePath) {
      return filePath.startsWith('cool-admin-vue/') && !filePath.startsWith('cool-admin-vue/build/');
    },
  },
  {
    id: 'vue-lint-check',
    description: '后台前端变更文件静态检查',
    cwd: '.',
    command: ['node', './scripts/check-changed-workspace-quality.mjs', '--workspace', 'cool-admin-vue', '--tool', 'eslint'],
    matches(filePath) {
      return filePath.startsWith('cool-admin-vue/') && !filePath.startsWith('cool-admin-vue/build/');
    },
  },
  {
    id: 'vue-typecheck',
    description: '后台前端类型检查',
    cwd: 'cool-admin-vue',
    command: ['corepack', 'pnpm', 'run', 'type-check'],
    matches(filePath) {
      return filePath.startsWith('cool-admin-vue/') && !filePath.startsWith('cool-admin-vue/build/');
    },
  },
  {
    id: 'vue-build',
    description: '后台前端构建',
    cwd: 'cool-admin-vue',
    command: ['corepack', 'pnpm', 'run', 'build'],
    matches(filePath) {
      return filePath.startsWith('cool-admin-vue/') && !filePath.startsWith('cool-admin-vue/build/');
    },
  },
  {
    id: 'uni-format-check',
    description: 'cool-uni 变更文件格式检查',
    cwd: '.',
    command: ['node', './scripts/check-changed-workspace-quality.mjs', '--workspace', 'cool-uni', '--tool', 'prettier'],
    matches(filePath) {
      return (
        filePath.startsWith('cool-uni/') &&
        !filePath.startsWith('cool-uni/build/') &&
        !filePath.startsWith('cool-uni/test-results/')
      );
    },
  },
  {
    id: 'uni-lint-check',
    description: 'cool-uni 变更文件静态检查',
    cwd: '.',
    command: ['node', './scripts/check-changed-workspace-quality.mjs', '--workspace', 'cool-uni', '--tool', 'eslint'],
    matches(filePath) {
      return (
        filePath.startsWith('cool-uni/') &&
        !filePath.startsWith('cool-uni/build/') &&
        !filePath.startsWith('cool-uni/test-results/')
      );
    },
  },
  {
    id: 'uni-typecheck',
    description: 'cool-uni 最小 TypeScript 校验',
    cwd: 'cool-uni',
    command: ['corepack', 'pnpm', 'run', 'type-check'],
    matches(filePath) {
      return (
        filePath.startsWith('cool-uni/') &&
        !filePath.startsWith('cool-uni/build/') &&
        !filePath.startsWith('cool-uni/test-results/')
      );
    },
  },
];

function parseArgs(argv) {
  const args = {
    dryRun: false,
    files: [],
  };

  for (let index = 0; index < argv.length; index += 1) {
    const current = argv[index];
    if (current === '--dry-run') {
      args.dryRun = true;
      continue;
    }
    if (current === '--file') {
      const next = argv[index + 1];
      if (!next) {
        fail('`--file` 需要跟一个仓库相对路径。');
      }
      args.files.push(normalizePath(next));
      index += 1;
      continue;
    }
    fail(`不支持的参数: ${current}`);
  }

  return args;
}

function normalizePath(value) {
  return value.replaceAll('\\', '/');
}

function fail(message) {
  console.error(`\n[pre-push gate] FAIL: ${message}`);
  process.exit(1);
}

function info(message) {
  console.log(`[pre-push gate] ${message}`);
}

function runGit(args) {
  try {
    return execFileSync('git', ['-C', repoRoot, '-c', 'core.quotePath=false', ...args], {
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'pipe'],
    }).trimEnd();
  } catch (error) {
    const stderr = error.stderr?.toString().trim() || error.message;
    fail(`git ${args.join(' ')} 执行失败: ${stderr}`);
  }
}

function tryRunGit(args) {
  try {
    return execFileSync('git', ['-C', repoRoot, '-c', 'core.quotePath=false', ...args], {
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore'],
    }).trimEnd();
  } catch (error) {
    return '';
  }
}

function getUpstreamRef() {
  return tryRunGit(['rev-parse', '--abbrev-ref', '--symbolic-full-name', '@{u}']).trim();
}

function getCurrentBranchName() {
  return tryRunGit(['rev-parse', '--abbrev-ref', 'HEAD']).trim();
}

function getPreferredRemoteName() {
  const currentBranch = getCurrentBranchName();
  const candidates = [
    currentBranch
      ? tryRunGit(['config', '--get', `branch.${currentBranch}.pushRemote`]).trim()
      : '',
    currentBranch ? tryRunGit(['config', '--get', `branch.${currentBranch}.remote`]).trim() : '',
    tryRunGit(['config', '--get', 'remote.pushDefault']).trim(),
  ].filter(Boolean);

  if (candidates.length > 0) {
    return candidates[0];
  }

  const remotes = tryRunGit(['remote']).split('\n').map(item => item.trim()).filter(Boolean);
  if (remotes.length === 1) {
    return remotes[0];
  }
  if (remotes.includes('origin')) {
    return 'origin';
  }
  if (remotes.includes('xuedaojixiao')) {
    return 'xuedaojixiao';
  }

  return remotes[0] || '';
}

function getDefaultRemoteHeadRef() {
  const preferredRemote = getPreferredRemoteName();
  if (preferredRemote) {
    const preferredHead = tryRunGit([
      'symbolic-ref',
      '--quiet',
      '--short',
      `refs/remotes/${preferredRemote}/HEAD`,
    ]).trim();
    if (preferredHead) {
      return preferredHead;
    }
  }

  const remoteHeadRefs = tryRunGit([
    'for-each-ref',
    '--format=%(refname:short)',
    'refs/remotes/*/HEAD',
  ])
    .split('\n')
    .map(item => item.trim())
    .filter(Boolean);

  return remoteHeadRefs[0] || '';
}

function resolveDiffBase(upstreamRef) {
  if (upstreamRef) {
    return upstreamRef;
  }

  const remoteHeadRef = getDefaultRemoteHeadRef();
  if (remoteHeadRef) {
    const mergeBase = tryRunGit(['merge-base', 'HEAD', remoteHeadRef]).trim();
    if (mergeBase) {
      return mergeBase;
    }
  }

  const headParent = tryRunGit(['rev-parse', 'HEAD^']).trim();
  if (headParent) {
    return headParent;
  }

  return '';
}

function getPendingCommitFiles(diffBaseRef) {
  if (!diffBaseRef) {
    const output = tryRunGit(['diff-tree', '--no-commit-id', '--name-only', '-r', '--diff-filter=ACMR', 'HEAD']);
    return output ? output.split('\n').map(normalizePath).filter(Boolean) : [];
  }

  const output = runGit(['diff', '--name-only', '--diff-filter=ACMR', `${diffBaseRef}..HEAD`]);
  return output ? output.split('\n').map(normalizePath).filter(Boolean) : [];
}

function parsePorcelainEntry(entry) {
  const status = entry.slice(0, 2);
  const payload = entry.slice(3);
  if (status[0] === 'R' || status[1] === 'R' || status[0] === 'C' || status[1] === 'C') {
    const segments = payload.split('\0').filter(Boolean);
    return segments.length > 1 ? normalizePath(segments[1]) : normalizePath(segments[0] || '');
  }
  return normalizePath(payload);
}

function getWorktreeFiles() {
  const output = execFileSync('git', ['-C', repoRoot, 'status', '--porcelain=v1', '-z', '--untracked-files=all'], {
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
  });

  if (!output) {
    return [];
  }

  const rawEntries = output.split('\0').filter(Boolean);
  const files = [];

  for (let index = 0; index < rawEntries.length; index += 1) {
    const entry = rawEntries[index];
    const status = entry.slice(0, 2);
    if (status[0] === 'R' || status[1] === 'R' || status[0] === 'C' || status[1] === 'C') {
      const next = rawEntries[index + 1];
      const renamed = next ? normalizePath(next) : parsePorcelainEntry(entry);
      files.push(renamed);
      index += 1;
      continue;
    }
    files.push(parsePorcelainEntry(entry));
  }

  return files.filter(Boolean);
}

function collectChangedFiles(fileOverrides) {
  if (fileOverrides.length > 0) {
    return {
      pendingCommitFiles: [],
      worktreeFiles: [],
      changedFiles: [...new Set(fileOverrides)],
    };
  }

  const upstreamRef = getUpstreamRef();
  const diffBaseRef = resolveDiffBase(upstreamRef);
  const pendingCommitFiles = getPendingCommitFiles(diffBaseRef);
  const worktreeFiles = getWorktreeFiles();
  const changedFiles = [...new Set([...pendingCommitFiles, ...worktreeFiles])];

  return {
    upstreamRef,
    diffBaseRef,
    pendingCommitFiles,
    worktreeFiles,
    changedFiles,
  };
}

function getBlockedMatches(files) {
  const exactMatches = files
    .filter(filePath => alwaysBlockedExactPaths.includes(filePath))
    .map(filePath => ({
      filePath,
      reason: '命中当前仓库已明确排除的临时产物、未冻结事实源或未收口任务卡。',
    }));

  const prefixMatches = files.flatMap(filePath =>
    alwaysBlockedPrefixes
      .filter(prefix => filePath.startsWith(prefix))
      .map(prefix => ({
        filePath,
        reason: `命中当前仓库已冻结或生成物阻断范围: ${prefix}`,
      }))
  );

  return [...exactMatches, ...prefixMatches];
}

function getTriggeredCommands(files) {
  return commandGroups.flatMap(group => {
    const matchedFiles = files.filter(filePath => group.matches(filePath));
    if (matchedFiles.length === 0) {
      return [];
    }
    return [{ ...group, matchedFiles: [...new Set(matchedFiles)] }];
  });
}

function buildGroupCommand(group) {
  if (!group.scopeMatchedFiles || !group.matchedFiles?.length) {
    return [...group.command];
  }

  return [
    ...group.command,
    ...group.matchedFiles.flatMap(filePath => ['--file', filePath]),
  ];
}

function tryExec(command, args, options = {}) {
  try {
    return execFileSync(command, args, {
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore'],
      ...options,
    }).trim();
  } catch (error) {
    return '';
  }
}

function parsePortFromBaseUrl(baseUrl) {
  if (!baseUrl) {
    return null;
  }
  try {
    const port = Number(new URL(baseUrl).port);
    return Number.isInteger(port) && port > 0 ? port : null;
  } catch (error) {
    return null;
  }
}

function getListeningPorts() {
  const output = tryExec('lsof', ['-nP', '-iTCP', '-sTCP:LISTEN']);
  if (!output) {
    return [];
  }

  const ports = new Set();
  const lines = output.split('\n').slice(1);
  for (const line of lines) {
    const matched = line.match(/:(\d+)\s+\(LISTEN\)$/);
    if (!matched) {
      continue;
    }
    const port = Number(matched[1]);
    if (Number.isInteger(port) && port > 0) {
      ports.add(port);
    }
  }
  return [...ports];
}

function isReachableStage2Runtime(baseUrl, expectedRuntime = null) {
  const output = tryExec('curl', [
    '-fsS',
    '--max-time',
    '2',
    `${baseUrl}/admin/base/open/runtimeMeta`,
  ]);

  if (!output) {
    return false;
  }

  try {
    const parsed = JSON.parse(output);
    const runtimeMeta = parsed?.data || parsed;
    if (!runtimeMeta?.seedMeta?.version) {
      return false;
    }
    if (!expectedRuntime) {
      return true;
    }
    return (
      runtimeMeta.gitHash === expectedRuntime.gitHash &&
      runtimeMeta.sourceHash === expectedRuntime.sourceHash
    );
  } catch (error) {
    return false;
  }
}

function resolveStage2SmokeBaseUrl(options = {}) {
  const { allowRuntimeMismatch = false } = options;
  if (process.env.STAGE2_SMOKE_BASE_URL) {
    return process.env.STAGE2_SMOKE_BASE_URL.replace(/\/+$/, '');
  }

  const candidatePorts = [];
  const candidateSet = new Set();
  const pushPort = port => {
    if (Number.isInteger(port) && port > 0 && !candidateSet.has(port)) {
      candidateSet.add(port);
      candidatePorts.push(port);
    }
  };

  for (const port of [8065, 8063, 8006, parsePortFromBaseUrl(process.env.THEME19_SMOKE_BASE_URL)]) {
    pushPort(port);
  }
  for (const port of getListeningPorts()) {
    pushPort(port);
  }

  const expectedRuntime = {
    gitHash: resolveProjectGitHash(path.join(repoRoot, 'cool-admin-midway')),
    sourceHash: resolveProjectSourceHash(path.join(repoRoot, 'cool-admin-midway')),
  };

  for (const port of candidatePorts) {
    const baseUrl = `http://127.0.0.1:${port}`;
    if (isReachableStage2Runtime(baseUrl, allowRuntimeMismatch ? null : expectedRuntime)) {
      return baseUrl;
    }
  }

  fail(
    allowRuntimeMismatch
      ? 'midway-smoke 未找到可访问的本地 stage2 后端实例。请先启动后端，或显式设置 STAGE2_SMOKE_BASE_URL。'
      : 'midway-smoke 未找到与当前代码哈希一致的本地 stage2 后端实例。请先启动/重启当前版本后端，或显式设置 STAGE2_SMOKE_BASE_URL。'
  );
}

function runCommandGroup(group, dryRun) {
  const command = buildGroupCommand(group);
  const commandPreview = `${command.join(' ')} (cwd=${group.cwd})`;
  if (dryRun) {
    info(`DRY RUN ${group.id}: ${commandPreview}`);
    return;
  }

  info(`RUN ${group.id}: ${group.description}`);
  const allowRuntimeMismatch =
    group.id === 'midway-smoke' && process.env.STAGE2_SMOKE_ALLOW_RUNTIME_MISMATCH === '1';
  const env =
    group.id === 'midway-smoke'
      ? {
          ...process.env,
          STAGE2_SMOKE_BASE_URL: resolveStage2SmokeBaseUrl({ allowRuntimeMismatch }),
          ...(allowRuntimeMismatch ? { STAGE2_SMOKE_ALLOW_RUNTIME_MISMATCH: '1' } : {}),
        }
      : process.env;
  const scopedResult = spawnSync(command[0], command.slice(1), {
    cwd: path.join(repoRoot, group.cwd),
    stdio: 'inherit',
    env,
  });

  if (scopedResult.status !== 0) {
    fail(`${group.id} 执行失败，请先修复再推送。`);
  }
}

function main() {
  const args = parseArgs(process.argv.slice(2));
  const { upstreamRef, diffBaseRef, pendingCommitFiles, worktreeFiles, changedFiles } =
    collectChangedFiles(args.files);

  if (changedFiles.length === 0) {
    info('未检测到待推送或工作区变更，跳过门禁。');
    return;
  }

  info(`待检查文件数: ${changedFiles.length}`);
  if (pendingCommitFiles.length > 0) {
    info(`待推送 commit 变更数: ${pendingCommitFiles.length}`);
  }
  if (worktreeFiles.length > 0) {
    info(`工作区未提交变更数: ${worktreeFiles.length}`);
  }
  if (!args.files.length && !upstreamRef) {
    info(
      diffBaseRef
        ? `当前分支未配置 upstream，已退化为基于 ${diffBaseRef.slice(0, 12)}..HEAD 与工作区计算门禁范围。`
        : '当前分支未配置 upstream，已退化为仅基于 HEAD 最近一次提交与工作区计算门禁范围。'
    );
  }

  const blockedMatches = getBlockedMatches(changedFiles);
  if (blockedMatches.length > 0) {
    console.error('\n[pre-push gate] 以下路径当前不允许随 push 混入:');
    for (const match of blockedMatches) {
      console.error(`- ${match.filePath}`);
      console.error(`  原因: ${match.reason}`);
    }
    fail('请先清理临时产物、移出未冻结范围，或等待事实源更新后再推送。');
  }

  const triggeredCommands = getTriggeredCommands(changedFiles);
  if (triggeredCommands.length === 0) {
    info('本次变更只命中文档/门禁脚本范围，无需额外业务构建。');
    return;
  }

  info(`命中门禁组: ${triggeredCommands.map(group => group.id).join(', ')}`);
  for (const group of triggeredCommands) {
    runCommandGroup(group, args.dryRun);
  }

  info('门禁通过，可以继续 push。');
}

main();
