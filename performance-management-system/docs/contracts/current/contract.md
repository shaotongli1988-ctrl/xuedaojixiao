# Theme 13 Contract Snapshot

## 目的

- 为主题13当前增量收敛批次提供最小 API contract evidence。
- 本页只描述 `capabilityModel / capabilityItem / capabilityPortrait / certificate` 的局部契约，不承担仓库全量历史接口的汇总职责。

## 当前合同源

- Repository OpenAPI source：
  - [xuedao.openapi.json](/Users/shaotongli/Documents/xuedao/contracts/openapi/xuedao.openapi.json)
- Theme snapshot：
  - [theme13-openapi.json](/Users/shaotongli/Documents/xuedao/performance-management-system/docs/contracts/current/theme13-openapi.json)
- Producer：
  - [theme13-producer-contract-model.ts](/Users/shaotongli/Documents/xuedao/performance-management-system/docs/contracts/current/theme13-producer-contract-model.ts)
- Consumer：
  - [theme13-consumer-api-types.ts](/Users/shaotongli/Documents/xuedao/performance-management-system/docs/contracts/current/theme13-consumer-api-types.ts)

## 覆盖范围

- 资源：
  - `capabilityModel`
  - `capabilityItem`
  - `capabilityPortrait`
  - `certificate`
- 接口：
  - `capabilityModel page / info / add / update`
  - `capabilityItem info`
  - `capabilityPortrait info`
  - `certificate page / info / add / update / issue / recordPage`
- 非目标：
  - 不覆盖课程主链、面试主链、人才资产主链
  - 不承担 `build/cool/eps.json` 等仓库级历史接口快照清理

## 当前结论

- 主题13局部合同已对齐。
- 真实验证命令：

```bash
python3 /Users/shaotongli/.codex/skills/api-schema-drift-checker/scripts/schema_drift_guard.py \
  --phase batch \
  --cwd /Users/shaotongli/Documents/xuedao \
  --openapi /Users/shaotongli/Documents/xuedao/performance-management-system/docs/contracts/current/theme13-openapi.json \
  --producer /Users/shaotongli/Documents/xuedao/performance-management-system/docs/contracts/current/theme13-producer-contract-model.ts \
  --consumer /Users/shaotongli/Documents/xuedao/performance-management-system/docs/contracts/current/theme13-consumer-api-types.ts \
  --strip-prefix /admin \
  --fail-on medium
```

- 结果：`Drift issues: none`

## 使用约束

- 主题13后续若新增字段、接口路径、状态或权限键，必须先更新仓库级 OpenAPI 主源，再同步更新本地快照与证据文件。
- 若执行仓库级 schema drift 守卫，发现的非主题13历史漂移不能回写成“主题13未对齐”。
