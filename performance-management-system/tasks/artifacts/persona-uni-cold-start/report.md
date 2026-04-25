# Uni Cold Start Report

- Name: persona-uni-cold-start
- Description: `cool-uni` 同账号冷启动读取数据库 persona，并补齐页面级 GUI 留痕
- Generated At: 2026-04-23T10:44:10+08:00
- Runtime Mode: `uni --platform h5 --host 127.0.0.1 --port 9943`
- Status: PASSED

## Evidence

1. `Web` 先已将 `hr_admin` 当前 persona 切换为 `fn.performance_operator`，对应中文展示为“绩效运营视角”。
2. 2026-04-23 同时重新读取后端 `GET /admin/base/comm/performanceAccessContext`，返回仍为：
   - `activePersonaKey=fn.performance_operator`
   - `roleKind=hr`
   - `workbenchPages=["initiated","feedback","dashboard","salary","indicator-library","recruit-plan"]`
3. `cool-uni` H5 真实运行链已恢复：
   - `curl http://127.0.0.1:9943/main.ts` 返回已包含 `import "/pages-json-js"`、`@dcloudio/uni-h5` 与 `createApp().app.use(__plugin).mount("#app")`
   - `pages-json-js` 在 Vite 5 dev 运行时已改写为静态 locale import，不再因 `import.meta.globEager / glob` 导致白屏
4. 已补真实浏览器 GUI 留痕：
   - 执行 `node /Users/shaotongli/Documents/xuedao/performance-management-system/test/gui/run-cdp-gui-check.mjs --config /Users/shaotongli/Documents/xuedao/performance-management-system/test/gui/scenarios/cool-uni-persona.json --ui-base-url http://127.0.0.1:9943/#`
   - 结果 `PASS 1 / FAIL 0 / Conclusion: PASSED`
   - 首页已断言并截图：
     - `当前账号 · 绩效运营视角`
     - `移动工作台`
     - `已发起考核`
     - `薪资管理`
     - `指标库`
     - `招聘计划`
   - 截图文件：`tasks/artifacts/persona-uni-cold-start/cool-uni-hr-home-performance-operator.png`
   - 原始 GUI runner 报告：`gui-report.md`、`gui-report.json`
5. 已补构建链验证：
   - `cd /Users/shaotongli/Documents/xuedao/cool-uni && corepack pnpm exec vite build`
   - `cd /Users/shaotongli/Documents/xuedao/cool-uni && corepack pnpm exec uni build -p h5`
   - 均通过；期间仅有现存 Sass `@import` 与 uni 插件 deprecation warning

## Conclusion

1. `Web` 与 `cool-uni` 已完成“共用同一个数据库 persona 值”的真实人工联调闭环。
2. 当前唯一事实源仍是 `base_sys_user.activePerformancePersonaKey`；`cool-uni` 只消费后端 `performanceAccessContext`，未新增本地分叉事实源。
3. 之前的 `P1` 已关闭：不仅 H5 挂载链恢复，且已拿到真实页面级 GUI 截图证据。
