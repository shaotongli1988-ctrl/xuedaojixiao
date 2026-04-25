# xuedao 仓库说明

这个仓库当前对绩效系统只保留两类内容：

1. 现有代码基座
2. 最小可执行流程资产

## 代码基座

- `cool-admin-midway/`
  后端基座
- `cool-admin-vue/`
  后台基座
- `cool-uni/`
  移动端基座，当前绩效系统首期不开发

## 流程资产

- `通用项目流程/项目开发全流程-实践优化版.md`
- `通用项目流程/项目开发流程-踩坑补充清单.md`
- `docs/06-阶段化开发怎么协作.md`
- `docs/07-任务执行卡模板.md`
- `docs/checklists/01-开发前检查.md`
- `docs/checklists/核心模块修改前检查.md`
- `docs/checklists/02-提交前检查.md`
- `docs/checklists/03-交付前检查.md`

## 绩效系统入口

绩效系统的唯一项目文档入口在：

- [performance-management-system/docs/README.md](/Users/shaotongli/Documents/xuedao/performance-management-system/docs/README.md)

项目执行时，默认顺序是：

1. 先看项目入口
2. 再看 [17-项目执行流程（精简版）](/Users/shaotongli/Documents/xuedao/performance-management-system/docs/17-项目执行流程（精简版）.md)
3. 再按现有基座把代码落到 `cool-admin-midway` 和 `cool-admin-vue`

## API 契约主源

仓库级 API 契约正在统一收敛到：

- [contracts/openapi/xuedao.openapi.json](/Users/shaotongli/Documents/xuedao/contracts/openapi/xuedao.openapi.json)

当前规则：

1. 已迁移资源必须先更新仓库级 OpenAPI，再修改前后端实现。
2. 运行时 Swagger 只作为调试视图，不再作为 API 事实源。
3. `node ./scripts/sync-repo-openapi-ssot.mjs --write` 负责把当前非 `performance` admin EPS 资源回写到仓库级 OpenAPI 主源。
4. `node ./scripts/sync-performance-openapi-ssot.mjs --write` 负责根据 `performance` backend registry source + controller/service/types 回写仓库级 OpenAPI 主源。
5. `node ./scripts/openapi-contract-sync.mjs --write` 负责根据主源和 `performance` backend registry source 刷新 web / uni generated contract types。
6. `node ./scripts/sync-eps-openapi-ssot.mjs --write` 负责把仓库级 OpenAPI 主源叠加到 `cool-admin-vue/build/cool/eps.ssot.d.ts`，收紧非 `performance` 动态 EPS 的消费类型。
7. `node ./scripts/check-performance-contract-closure.mjs` 负责校验 `performance` registry source 是否完整闭合 producer 覆盖、generated targets、shared support adapter 与 uni wrapper 引用链。
8. 当前仓库级 OpenAPI 已覆盖现有 `base`、`demo`、`dict`、`performance`、`plugin`、`recycle`、`space`、`task`、`user` 后台 API；其中 `performance` 现已进入“backend registry source + OpenAPI publish + web/uni generated consumers”三段式主链，其他模块当前保持动态 EPS 调用方式，但其 TypeScript 消费类型已通过 `eps.ssot.d.ts` 收口到主源。

## 仓库级 SSOT 落点

仓库级 SSOT 映射已开始落到：

- [contracts/ssot/README.md](/Users/shaotongli/Documents/xuedao/contracts/ssot/README.md)
- [contracts/ssot/xuedao-ssot-bootstrap.yaml](/Users/shaotongli/Documents/xuedao/contracts/ssot/xuedao-ssot-bootstrap.yaml)
- [contracts/ssot/xuedao-ssot-manifest.yaml](/Users/shaotongli/Documents/xuedao/contracts/ssot/xuedao-ssot-manifest.yaml)
- [contracts/ssot/xuedao-ssot-inventory.md](/Users/shaotongli/Documents/xuedao/contracts/ssot/xuedao-ssot-inventory.md)

当前 manifest 除仓库级 OpenAPI 外，也显式登记：

1. 权限主源：`cool-admin-midway/src/modules/base/domain/permissions/source.{json,mjs}`
2. 用户鉴权语义主源：`cool-admin-midway/src/modules/user/domain/auth/catalog.ts`
3. 运行时配置主源：`cool-admin-midway/src/modules/{base,user,dict}/config.ts`
4. 环境变量主源：`contracts/ssot/environment-config.catalog.json`
5. schema / migration ownership 主源：`contracts/ssot/database-schema.catalog.json`
6. 菜单 / 路由 / view topology 主源：`contracts/ssot/menu-route-topology.catalog.json`
7. 移动端共享契约主源：`cool-uni/types/performance-mobile.ts`
8. `performance` 状态机主源：`cool-admin-midway/src/modules/performance/domain/states/*`
9. `performance` 业务字典主源：`cool-admin-midway/src/modules/performance/domain/dicts/catalog.ts`
10. `dict` 业务字典聚合主源：`cool-admin-midway/src/modules/dict/domain/dicts/catalog.ts`
11. `base/user/dict` 共享错误语义主源：`cool-admin-midway/src/modules/{base,user,dict}/domain/errors/catalog.ts`
12. `performance` 错误目录主源：`cool-admin-midway/src/modules/performance/domain/errors/catalog.ts`
13. `performance` API 契约覆盖主源：`cool-admin-midway/src/modules/performance/domain/registry/contract-source.{json,mjs}`

其中第 13 项已作为独立 machine source 显式登记在 `contracts/ssot/xuedao-ssot-manifest.yaml` 的 `sourceOfTruth.performanceContractSource`，不再只是附着在 `apiContract` 说明里的隐含约定。

仓库级交付报告默认收敛到：

- [reports/delivery/README.md](/Users/shaotongli/Documents/xuedao/reports/delivery/README.md)

## Git Push 门禁

仓库内已提供版本化 `pre-push` 门禁：

- hook 入口：`.githooks/pre-push`
- 实际规则：`scripts/git-pre-push-gate.mjs`

启用方式：

```bash
git config core.hooksPath .githooks
```

当前门禁策略：

1. 同时检查 `HEAD` 相对上游分支的待推送变更，以及当前工作区未提交/未跟踪变更。
2. 命中临时产物或测试运行产物时，直接阻断 push。
3. 命中菜单、权限、页面目录、自动化脚本或测试资产变更时，先做仓库级 SSOT 基线检查，再跑仓库一致性守卫：
   - `scripts/check-xuedao-ssot-manifest.mjs`
   - `scripts/check-xuedao-ssot-conformance.mjs`
   - `scripts/sync-repo-openapi-ssot.mjs`
   - `scripts/sync-performance-openapi-ssot.mjs`
   - `scripts/openapi-contract-sync.mjs`
   - `scripts/check-performance-contract-closure.mjs`
   - `scripts/sync-eps-openapi-ssot.mjs`
   - `scripts/check-directory-naming-conflicts.mjs`
   - `scripts/check-menu-route-viewpath-drift.mjs`
   - `scripts/check-permission-key-alignment.mjs`
   - `scripts/check-doc-contract-writeback.mjs`
   - `scripts/check-rbac-alignment.mjs`
   - `scripts/check-state-machine-alignment.mjs`
   - `scripts/check-component-reuse.mjs`
   - 聚合入口：`scripts/run-repo-consistency-guards.mjs`
4. 按变更路径触发最小验证：
   - `cool-admin-midway` 命中后端实现或脚本时，本地先跑 `npm run lint`、`npm run build`、定向回归测试和阶段 2 smoke；`lint` 会先通过 `cool-admin-midway/scripts/ensure-local-lint-compat.mjs` 自动补齐本地 `.shared-deps` 兼容层，`npm run deps:local:install` 完成离线依赖安装后也会自动执行同一兼容收口。若只需修复本地 `.shared-deps` 兼容层，可直接执行 `npm run deps:local:repair`。仓库回归测试已覆盖临时工作区 + 本地 mock registry 的完整安装链路，用于降低 clean-environment 风险。
   - `cool-admin-vue` 命中后台前端实现时，跑 `node ./scripts/check-changed-workspace-quality.mjs --workspace cool-admin-vue --tool prettier`、`node ./scripts/check-changed-workspace-quality.mjs --workspace cool-admin-vue --tool eslint`、`corepack pnpm run type-check` 和 `corepack pnpm run build`。
   - `cool-uni` 命中移动端实现时，跑 `node ./scripts/check-changed-workspace-quality.mjs --workspace cool-uni --tool prettier`、`node ./scripts/check-changed-workspace-quality.mjs --workspace cool-uni --tool eslint` 和 `corepack pnpm run type-check`。

维护要求：

- 主题冻结范围或验证矩阵变化后，必须同步更新 `scripts/git-pre-push-gate.mjs` 中的阻断路径和命令映射。
- 仓库一致性守卫的路径范围、文档映射或命名空间变化后，必须同步更新 `scripts/repo-consistency-config.mjs`。
- 这套门禁只负责本地 push 前阻断，不替代远端分支保护或代码评审。

## Repository Guard CI 与发布门禁

仓库内仓库级交付守卫已经版本化，入口如下：

- Python 守卫：`scripts/rbac_alignment_guard.py`
- Python 守卫：`scripts/state_machine_guard.py`
- Python 守卫：`scripts/component_reuse_guard.py`
- Python 守卫：`scripts/unified_delivery_guard.py`
- Node 包装器：`scripts/check-rbac-alignment.mjs`
- Node 包装器：`scripts/check-state-machine-alignment.mjs`
- Node 包装器：`scripts/check-component-reuse.mjs`
- Node 包装器：`scripts/check-unified-delivery.mjs`
- CI 工作流：`.github/workflows/rbac-governance.yml`

默认策略：

1. 本地 `pre-push` 命中敏感路径时，会通过 `scripts/run-repo-consistency-guards.mjs` 先做 `manifest + conformance` 基线检查，再串行触发 RBAC、状态机和实现层收敛守卫。
   命中 `repo-consistency-guards` 时，pre-push 会把本次命中的仓库相对路径逐条透传给聚合入口，避免历史脏工作区把 changed-aware 守卫范围放大。
2. PR / 手工触发时，CI 会执行 `batch` 级统一交付门禁；未显式传入报告路径时，默认把报告写到 `reports/delivery/unified-delivery-batch.latest.{md,json}`。
3. CI 在 batch / final 两条作业里，都会先执行 `cool-admin-midway` 的 `lint/build`，以及基于 `scripts/check-changed-workspace-quality.mjs` 的 Vue / Uni 变更文件 `prettier + eslint` 检查，再进入前端 `type-check/build` 和仓库守卫。
4. 推送到 `main/master` 时，CI 会执行 `final` 级统一交付门禁；未显式传入报告路径时，默认把报告写到 `reports/delivery/unified-delivery-final.latest.{md,json}`，作为发布前最后一道仓库级交付阻断。

仓库级 SSOT 手工总校验入口：

- `node ./scripts/check-xuedao-ssot-conformance.mjs`
- `node ./scripts/audit-worktree-split.mjs`
- 默认报告：
  - `reports/delivery/xuedao-ssot-conformance.latest.md`
  - `reports/delivery/xuedao-ssot-conformance.latest.json`
  - `reports/delivery/worktree-split-audit.latest.md`
  - `reports/delivery/worktree-split-audit.latest.json`

它会从四个维度判定当前仓库是否符合 SSOT 标准：

1. 主源与 manifest 绑定是否完整
2. 运行时 guard 是否真的接入 manifest
3. README / contracts / 自动化策略文档是否同步
4. 变更记录、验证记录和报告产物是否具备最小留痕

CI 也会执行这条检查，并把结果上传到 `reports/delivery/`。

`audit-worktree-split.mjs` 用于在大工作区或多主题并行开发时，把当前 dirty worktree 按“治理 / 基础层 / 业务主题 / 视觉移动 / 文档证据”分批，并显式提示 staged、临时文件和未归类项，便于按 SSOT 规范拆提交。需要拿某一批次的文件列表时，可执行 `node ./scripts/audit-worktree-split.mjs --batch-id governance-ssot --output paths`。

手工执行示例：

```bash
node ./scripts/run-repo-consistency-guards.mjs --file scripts/run-repo-consistency-guards.mjs --file scripts/git-pre-push-gate.mjs
node ./scripts/audit-worktree-split.mjs --batch-id governance-ssot --output paths
node ./scripts/run-repo-consistency-guards.mjs --files-from reports/delivery/worktree-split-audit.governance-ssot.latest.paths
node ./scripts/check-rbac-alignment.mjs --phase batch --force
node ./scripts/check-rbac-alignment.mjs --phase final --force
node ./scripts/check-state-machine-alignment.mjs --phase batch --force
node ./scripts/check-component-reuse.mjs --phase batch --force
node ./scripts/check-unified-delivery.mjs --phase final --all
```

## 本地交付守卫

仓库内已补齐本地统一交付守卫与两个同级子守卫：

- `scripts/unified_delivery_guard.py`
- `scripts/state_machine_guard.py`
- `scripts/component_reuse_guard.py`

默认用途：

1. `unified_delivery_guard.py` 作为开发中统一入口，聚合本地交付闭环检查、RBAC 守卫、状态机守卫和实现层收敛守卫。
2. `state_machine_guard.py` 用于检查状态集合、流转边和状态敏感改动是否缺少显式守卫。
3. `component_reuse_guard.py` 用于检查页面越层请求、分页/查询/弹窗职责混写和共享层收敛缺口。

手工执行示例：

```bash
python3 ./scripts/unified_delivery_guard.py --phase start --task "业务状态与数据字典 SSOT"
python3 ./scripts/unified_delivery_guard.py --phase final --task "业务状态与数据字典 SSOT"
python3 ./scripts/state_machine_guard.py --phase final --fail-on medium
python3 ./scripts/component_reuse_guard.py --phase final --fail-on medium
```
