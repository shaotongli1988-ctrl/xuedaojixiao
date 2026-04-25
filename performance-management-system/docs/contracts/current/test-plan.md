# Theme 13 Current Batch Test Plan

## 批次目标

- 收敛主题13列表页重复查询/分页状态实现。
- 补齐主题13局部 contract evidence，避免仓库全量历史接口噪音覆盖当前批次判断。

## 覆盖类别

- `normal`
- `boundary`
- `permission`
- `api`
- `frontend`

## 已执行验证

```bash
cd /Users/shaotongli/Documents/xuedao/performance-management-system && node --test test/theme13-contract.test.mjs
cd /Users/shaotongli/Documents/xuedao/cool-admin-vue && node --test test/use-list-page.test.mjs test/route-preset.test.mjs
cd /Users/shaotongli/Documents/xuedao/cool-admin-vue && corepack pnpm run type-check
cd /Users/shaotongli/Documents/xuedao/cool-admin-vue && corepack pnpm run build
git -C /Users/shaotongli/Documents/xuedao diff --check
python3 /Users/shaotongli/.codex/skills/api-schema-drift-checker/scripts/schema_drift_guard.py \
  --phase batch \
  --cwd /Users/shaotongli/Documents/xuedao \
  --openapi /Users/shaotongli/Documents/xuedao/performance-management-system/docs/contracts/current/theme13-openapi.json \
  --producer /Users/shaotongli/Documents/xuedao/performance-management-system/docs/contracts/current/theme13-producer-contract-model.ts \
  --consumer /Users/shaotongli/Documents/xuedao/performance-management-system/docs/contracts/current/theme13-consumer-api-types.ts \
  --strip-prefix /admin \
  --fail-on medium
```

## 当前结果

- `theme13-contract.test.mjs`：通过
- `use-list-page.test.mjs`：通过
- `route-preset.test.mjs`：通过
- 前端 `type-check`：通过
- 前端 `build`：通过
- 局部 schema drift：`Drift issues: none`

## 当前未覆盖项

- 不新增后端行为变更，因此本批次不新增 backend `jest`
- 不新增真实联调 smoke，沿用主题13既有阶段1收口证据
