# reports/delivery

本目录用于沉淀 `xuedao` 仓库级交付守卫、契约同步和治理检查的报告产物。

建议放入：

1. OpenAPI 同步报告
2. 一致性守卫报告
3. 交付门禁报告
4. 仓库级 change / verification 记录的派生产物

当前已约定的稳定文件名：

1. `unified-delivery-batch.latest.md`
2. `unified-delivery-batch.latest.json`
3. `xuedao-ssot-conformance.latest.md`
4. `xuedao-ssot-conformance.latest.json`
5. `worktree-split-audit.latest.md`
6. `worktree-split-audit.latest.json`

CI 批次化文件名：

1. `xuedao-ssot-conformance-batch.md`
2. `xuedao-ssot-conformance-batch.json`
3. `xuedao-ssot-conformance-final.md`
4. `xuedao-ssot-conformance-final.json`

当前目录只作为治理报告收口目录，不承载业务导出文件。

约束补充：

1. `xuedao-ssot-conformance.latest.{md,json}` 对应的 change / verification record 必须达到 strict-change 级结构，不能只保留最小占位字段。
2. `worktree-split-audit.latest.{md,json}` 只用于拆分 dirty worktree 与提交顺序建议，不替代代码评审或发布门禁。
