<!-- 文件职责：沉淀绩效管理系统首期在 GitHub 的交付摘要、范围、验证和风险；不替代需求、测试清单、交付说明和问题台账主文档；依赖 09、13、14、15、23、28 文档；维护重点是仓库地址、交付范围、验证口径和残余风险必须与当前事实源一致。 -->
# 首期 GitHub 交付摘要

## 文档职责

这份文档是“首期代码已经推送到 GitHub 后，对外说明交付范围和验证结论”的唯一事实源。

它只负责定义：

1. GitHub 仓库地址
2. 首期已交付范围
3. 当前验证结论
4. 当前残余风险
5. 外部查看仓库时优先阅读的文档入口

## GitHub 仓库信息

1. 仓库地址：
   - `https://github.com/shaotongli1988-ctrl/xuedaojixiao.git`
2. 当前首期推送分支：
   - `main`
3. 首期功能主提交：
   - `be995ed`
4. 推送结论：
   - 2026-04-17 已完成 `main -> xuedaojixiao/main` 推送

## 首期已交付范围

1. 后端：
   - [cool-admin-midway/src/modules/performance/](/Users/shaotongli/Documents/xuedao/cool-admin-midway/src/modules/performance/)
   - 共享登录、鉴权、菜单、权限主链所需的基座修正
   - 阶段 2 seed / smoke 脚本
2. 前端：
   - [cool-admin-vue/src/modules/performance/](/Users/shaotongli/Documents/xuedao/cool-admin-vue/src/modules/performance/)
   - `/dev -> 8006` 联调代理口径
   - 为 latest GUI 联调收口所补的公共组件防御性修正
3. 文档：
   - [performance-management-system/docs/README.md](/Users/shaotongli/Documents/xuedao/performance-management-system/docs/README.md)
   - [performance-management-system/tasks/](/Users/shaotongli/Documents/xuedao/performance-management-system/tasks/)
   - 首期模块任务卡、问题台账、交付说明、回滚说明、测试清单、阶段门禁
4. 根目录治理：
   - 根 README 与流程文档入口已收敛到绩效项目当前真正使用的范围
   - 保留最小流程资产，避免继续把旧模板文档误当当前项目事实源

## 当前交付模块

1. 模块 0：模块骨架与基础配置
2. 模块 1：评估单主链
3. 模块 2：目标地图
4. 模块 3：驾驶舱基础聚合
5. 模块 4：指标库
6. 模块 5：360 环评
7. 模块 6：PIP
8. 模块 7：晋升管理
9. 模块 8：薪资管理
10. 模块 9：驾驶舱最终聚合与交付收口

当前模块状态以 [2026-04-17-问题台账与最终回归收口.md](/Users/shaotongli/Documents/xuedao/performance-management-system/tasks/2026-04-17-问题台账与最终回归收口.md) 为准，当前全部为 `done`。

## 当前验证结论

1. 后端测试：
   - `npm run test -- test/base/base-jwt-config.test.ts test/base/base-role-admin-resolution.test.ts test/base/base-department-list-fallback.test.ts test/base/base-user-page-fallback.test.ts test/performance/assessment.service.test.ts test/performance/goal.service.test.ts test/performance/dashboard.service.test.ts test/performance/indicator.service.test.ts test/performance/feedback.service.test.ts test/performance/pip.service.test.ts test/performance/promotion.service.test.ts test/performance/salary.service.test.ts`
   - 结果：`12 passed / 46 passed`
2. 前端校验：
   - `corepack pnpm run type-check`
   - 结果：通过
3. 前端构建：
   - `corepack pnpm run build`
   - 结果：通过
4. latest 集成 smoke：
   - `STAGE2_SMOKE_BASE_URL=http://127.0.0.1:8006 npm run smoke:stage2:performance`
   - 结果：`PASS 41 / FAIL 0 / SKIP 0 / Conclusion: PASSED`
5. latest GUI 最低人工点测：
   - `http://127.0.0.1:9000 -> /dev -> http://127.0.0.1:8006`
   - 结果：已完成 HR / 经理 / 员工最低权限矩阵点测

## 当前阶段结论

1. 当前未发现未关闭 `P0`
2. 当前未发现未关闭 `P1`
3. 当前已满足：
   - 可进入阶段 3 提测前收口
   - 可进入阶段 4 业务验收
4. 当前不直接把 GitHub 推送视为“上线完成”，上线前仍应以 [14-交付说明.md](/Users/shaotongli/Documents/xuedao/performance-management-system/docs/14-交付说明.md) 和 [15-回滚说明.md](/Users/shaotongli/Documents/xuedao/performance-management-system/docs/15-回滚说明.md) 执行最终交付门禁

## 当前残余风险

当前仅保留 `P2` 治理项，详细见 [2026-04-17-问题台账与最终回归收口.md](/Users/shaotongli/Documents/xuedao/performance-management-system/tasks/2026-04-17-问题台账与最终回归收口.md)：

1. 默认 `8001` 旧实例口径仍需统一治理
2. 个别事实源路由说明仍需持续复核
3. 守卫脚本与仓库现状仍需单独治理

## 外部阅读顺序

外部查看 GitHub 仓库时，建议按下面顺序恢复上下文：

1. [performance-management-system/docs/README.md](/Users/shaotongli/Documents/xuedao/performance-management-system/docs/README.md)
2. [performance-management-system/docs/00-唯一事实源总索引.md](/Users/shaotongli/Documents/xuedao/performance-management-system/docs/00-唯一事实源总索引.md)
3. [performance-management-system/docs/14-交付说明.md](/Users/shaotongli/Documents/xuedao/performance-management-system/docs/14-交付说明.md)
4. [performance-management-system/docs/15-回滚说明.md](/Users/shaotongli/Documents/xuedao/performance-management-system/docs/15-回滚说明.md)
5. [performance-management-system/tasks/2026-04-17-问题台账与最终回归收口.md](/Users/shaotongli/Documents/xuedao/performance-management-system/tasks/2026-04-17-问题台账与最终回归收口.md)
