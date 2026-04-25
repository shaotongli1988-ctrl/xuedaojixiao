<!-- 文件职责：说明通用 GUI 点测 runner 的启动前置、JSON 场景配置口径和产物结构；不负责定义具体业务场景的通过标准。 -->
# GUI Runner

本目录提供一套可复用的最小 GUI 点测入口：

- 通用执行器：`test/gui/run-cdp-gui-check.mjs`
- 场景配置：`test/gui/scenarios/*.json`
- 产物：`report.json`、`report.md`、截图

## 适用范围

适用于 `cool-admin-vue` 场景的最小页面留痕：

- 账号登录态注入
- 打开页面
- 等页面文本或选择器
- 点击按钮
- 截图
- 断言菜单、按钮、详情弹窗等显隐

不负责：

- 启动前后端服务
- 处理登录页人工验证码输入
- 替代 smoke 或后端接口测试
- 复杂拖拽、上传、下载完成校验

## 运行前置

1. 后端实例可用，例如 `8031`
2. 前端 dev 入口可用，例如 `9006 -> /dev -> 8031`
3. 本机已有 Chrome DevTools 调试端口，例如：

```bash
nohup '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome' \
  --headless=new \
  --remote-debugging-port=9222 \
  --user-data-dir=/tmp/codex-chrome-gui \
  --disable-gpu \
  about:blank >/tmp/codex-chrome-gui.log 2>&1 &
```

## 命令示例

执行主题15整套 GUI 点测：

```bash
node /Users/shaotongli/Documents/xuedao/performance-management-system/test/gui/run-cdp-gui-check.mjs \
  --config /Users/shaotongli/Documents/xuedao/performance-management-system/test/gui/scenarios/theme15-resumePool.json
```

只执行单个场景：

```bash
node /Users/shaotongli/Documents/xuedao/performance-management-system/test/gui/run-cdp-gui-check.mjs \
  --config /Users/shaotongli/Documents/xuedao/performance-management-system/test/gui/scenarios/theme15-resumePool.json \
  --scenario manager-resumePool
```

覆盖入口地址：

```bash
node /Users/shaotongli/Documents/xuedao/performance-management-system/test/gui/run-cdp-gui-check.mjs \
  --config /Users/shaotongli/Documents/xuedao/performance-management-system/test/gui/scenarios/theme15-resumePool.json \
  --ui-base-url http://127.0.0.1:9000 \
  --api-base-url http://127.0.0.1:8006
```

## JSON 配置口径

顶层字段：

- `meta.name`
- `meta.description`
- `defaults.uiBaseUrl`
- `defaults.apiBaseUrl`
- `defaults.chromeDebugUrl`
- `defaults.outputDir`
- `defaults.password`
- `defaults.viewport`
- `scenarios`

单个 `scenario` 字段：

- `name`
- `username`
- `route`
- `steps`

支持的 `step.type`：

- `navigate`
- `waitBodyText`
- `waitSelector`
- `clickText`
- `clickSelector`
- `inputByLabel`
- `screenshot`
- `assertBodyText`
- `assertVisibleText`
- `assertSelector`

## 产物结构

输出目录下会生成：

- `report.json`
- `report.md`
- 场景步骤截图

建议任务卡只引用：

- 执行命令
- `report.json`
- 关键截图

不要再把长脚本直接塞进任务卡正文。
