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
3. 命中菜单、权限、页面目录、自动化脚本或测试资产变更时，先跑仓库一致性守卫：
   - `scripts/check-directory-naming-conflicts.mjs`
   - `scripts/check-menu-route-viewpath-drift.mjs`
   - `scripts/check-permission-key-alignment.mjs`
   - `scripts/check-doc-contract-writeback.mjs`
   - 聚合入口：`scripts/run-repo-consistency-guards.mjs`
4. 按变更路径触发最小验证：
   - `cool-admin-midway` 命中主题 1-9 / 跨模块驾驶舱后端实现时，跑定向回归测试和阶段 2 smoke。
   - `cool-admin-vue` 命中后台前端实现时，跑 `corepack pnpm run type-check` 和 `corepack pnpm run build`。
   - `cool-uni` 命中移动端实现时，跑 `corepack pnpm exec tsc --noEmit -p tsconfig.json`。

维护要求：

- 主题冻结范围或验证矩阵变化后，必须同步更新 `scripts/git-pre-push-gate.mjs` 中的阻断路径和命令映射。
- 仓库一致性守卫的路径范围、文档映射或命名空间变化后，必须同步更新 `scripts/repo-consistency-config.mjs`。
- 这套门禁只负责本地 push 前阻断，不替代远端分支保护或代码评审。
