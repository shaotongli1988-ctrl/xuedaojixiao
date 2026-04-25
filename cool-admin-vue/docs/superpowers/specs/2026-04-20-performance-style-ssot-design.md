# cool-admin-vue 样式系统 SSOT 重构设计

## 1. 背景

当前 `cool-admin-vue` 的视觉体系分成两套来源：

- 系统基座主要依赖 `Element Plus` 变量、少量基础 reset 和局部组件 token。
- `performance` 业务模块维护了自己的页面级主题系统，包含颜色、渐变、阴影、圆角、图表色、表格皮肤、弹窗响应式规则和深色模式切换。

结果是：

- 视觉事实源不唯一，基座和业务模块之间存在风格割裂。
- `performance` 大量页面在组件作用域内直接覆盖 `--el-*`，破坏全局主题边界。
- 页面壳层和 CRUD 结构重复实现，维护成本高。
- 深色模式、主色切换、图表配色无法做到仓库级一致。

本设计用于建立全局视觉唯一事实源（SSOT），并将 `performance` 从“并行主题系统”回收为“全局主题消费者”。

## 2. 范围

### 2.1 本次要做

- 建立仓库级样式 SSOT 分层模型。
- 定义全局 token、Element 适配层、共享页面 pattern 的职责边界。
- 明确 `performance` 的迁移策略、批次和禁用规则。
- 明确验收标准、验证路径和风险控制。

### 2.2 本次不做

- 不重做品牌视觉方向。
- 不改业务接口、权限、状态流或页面信息架构。
- 不在本阶段重写所有页面，只定义首批迁移优先级和实施顺序。
- 不引入新的 UI 框架或 CSS-in-JS 方案。

## 3. 目标

### 3.1 目标

- 让 `light/dark/主色切换` 都由全局 token 驱动，而不是由业务模块私有主题驱动。
- 让系统基座和 `performance` 共用同一套语义 token。
- 让 `Element Plus` 变量映射统一在系统层完成，业务组件不再直接赋值 `--el-*`。
- 让重复页面壳层收敛为可复用 pattern，而不是页面各自维护一套局部 token。
- 让图表、卡片、表格、抽屉、分页、toolbar 的视觉语言在全仓统一。

### 3.2 成功标准

- 样式事实源只有一处，全局 token 为唯一真源。
- `performance` 不再定义原始颜色事实。
- `performance` 不再直接覆盖 `--el-*`。
- 基座和业务模块在主色切换、深色模式下表现一致。

## 4. 现状审计摘要

基于 `src/modules/performance` 静态扫描：

- 97 个样式相关文件。
- 90 个文件使用 `@include performanceTheme.page-theme`。
- 95 个文件使用 `scoped style`。
- 106 处命中原始颜色 / 渐变 / `rgba()` 写法。

关键问题：

- `src/modules/performance/styles/theme.scss` 同时承载 token、Element 变量映射、组件皮肤、移动端布局规则和 dark 切换，职责过重。
- `asset-crud-page`、`material-crud-page`、`supplier-page`、`assessment-page`、`office-ledger-page`、`pip`、`promotion` 等页面重复维护壳层样式。
- `teacher-channel` 又叠加了一层模块内子主题，说明当前 token 体系仍在继续分叉。
- 图表组件保留本地 hex fallback，绕开主题统一。

## 5. 唯一事实源定义

### 5.1 SSOT 原则

样式层必须严格分层：

1. Foundation tokens：仅定义原始视觉事实。
2. Semantic tokens：定义跨模块的业务无关语义。
3. Adapter layer：把语义 token 映射到 `Element Plus` 和少量基础设施组件。
4. Pattern layer：定义页壳、数据面板、toolbar、弹窗、图表容器等共享结构。
5. Business layer：只消费语义 token 和 pattern，不再定义颜色事实。

### 5.2 允许出现原始颜色的位置

仅允许出现在全局 token 文件：

- hex
- `rgba()`
- `linear-gradient()`
- `radial-gradient()`
- 原始阴影值

业务模块页面、组件、局部 theme 文件禁止新增以上原始值。

## 6. 目标架构

建议新增目录：

```text
src/styles/
  tokens.foundation.scss
  tokens.semantic.scss
  adapters.element-plus.scss
  patterns.page-shell.scss
  patterns.data-panel.scss
  patterns.overlay-responsive.scss
  patterns.chart-surface.scss
  index.scss
```

### 6.1 Foundation tokens

职责：

- 定义品牌主色基线、灰阶、暖色、成功/警告/危险色、阴影、圆角、间距、字体栈。
- 定义 light/dark 两套原始视觉事实。

命名示例：

- `--foundation-color-brand-500`
- `--foundation-color-neutral-0`
- `--foundation-color-neutral-900`
- `--foundation-shadow-surface-lg`
- `--foundation-radius-lg`
- `--foundation-space-4`

### 6.2 Semantic tokens

职责：

- 提供页面和组件消费的统一语义变量。
- 不带业务模块前缀。

命名示例：

- `--app-surface-page`
- `--app-surface-card`
- `--app-surface-muted`
- `--app-surface-hero`
- `--app-border-strong`
- `--app-border-soft`
- `--app-text-primary`
- `--app-text-secondary`
- `--app-text-tertiary`
- `--app-accent-brand`
- `--app-accent-success`
- `--app-accent-warning`
- `--app-accent-danger`
- `--app-chart-grid`
- `--app-chart-label`
- `--app-shadow-surface`
- `--app-shadow-hover`

### 6.3 Element adapter

职责：

- 在全局统一把 `--app-*` 映射到 `--el-*`。
- 只允许系统层维护 `Element Plus` 皮肤映射。

示例：

- `--el-fill-color-light <- --app-surface-muted`
- `--el-border-color-light <- --app-border-strong`
- `--el-text-color-primary <- --app-text-primary`
- `--el-table-header-bg-color <- --app-surface-muted`

### 6.4 Pattern layer

职责：

- 承接页面壳层与常用业务结构，不定义颜色事实，只消费语义 token。

首批 pattern：

- `page-shell`
- `data-panel`
- `toolbar-layout`
- `table-surface`
- `overlay-responsive`
- `chart-surface`

## 7. 运行时主题策略

当前主题运行时只写 `--el-color-primary` 及其派生色。目标改为：

- 运行时主色切换先写入 `--app-accent-brand` 或 foundation 对应主色。
- dark 切换只负责切换 `html.dark` 或根节点 token 分支。
- `Element Plus` 辅助色仍可保留，但来源必须是全局语义 token，而不是业务页面局部设置。

运行时不再允许业务模块自行在局部作用域切换 dark token。

## 8. performance 模块迁移策略

### 8.1 总原则

- `performance` 只消费 `--app-*` 和共享 pattern。
- `performance/styles/theme.scss` 不再作为事实源。
- 若过渡期需要兼容，可暂时把它降级为映射层：
  - 只允许 `--module-performance-* -> --app-*`
  - 禁止继续定义原始颜色
  - 禁止继续映射 `--el-*`

### 8.2 首批迁移对象

优先迁移高曝光、高重复、能验证统一效果的页面族：

1. 系统基座：`slider`、`topbar`、`process`
2. `performance` 门户：首页工作台、dashboard、teacher-channel
3. CRUD 页族：`asset-crud-page`、`material-crud-page`、`supplier-page`
4. 抽屉 / 表单页族：`assessment-page`、`promotion`、`pip`、`office-ledger-page`

### 8.3 页面族重构方向

#### CRUD 页族

抽象为统一 pattern：

- 页头 hero
- toolbar
- 卡片容器
- 表格皮肤
- descriptions label 背景
- 分页区

删除每页私有别名：

- `--asset-crud-page-*`
- `--material-crud-page-*`
- `--supplier-page-*`

统一改为消费：

- `--app-surface-card`
- `--app-surface-hero`
- `--app-surface-muted`
- `--app-border-strong`
- `--app-text-primary`
- `--app-text-secondary`

#### 门户 / 看板页族

保留布局差异，但禁止自带颜色事实：

- `workbench`
- `dashboard`
- `teacher-channel`

这些页面仍可保留局部结构变量，但只能引用全局语义 token。

#### 图表页族

- 图表组件不再本地 hardcode fallback 色值。
- 图表默认 palette 从全局 chart token 提供。
- 若缺失 token，回退到全局默认语义，而不是组件私有常量。

## 9. 基座同步改造要求

本次不能只改 `performance`，必须同步改基座，否则视觉割裂不会消失。

基座组件至少同步改造：

- `src/modules/base/pages/main/components/slider.vue`
- `src/modules/base/pages/main/components/topbar.vue`
- `src/modules/base/pages/main/components/process.vue`

目标：

- `slider` 改为消费导航语义 token，如 `--app-nav-surface`、`--app-nav-text`、`--app-nav-hover`。
- `topbar` 和 `process` 改为消费页面壳层 / 辅助操作区语义 token。
- 删除基座组件内与全局 token 重复的原始色值。

## 10. 代码约束

### 10.1 禁止事项

- 禁止在业务组件中新增 `--el-*:` 赋值。
- 禁止在业务组件中新增 hex / `rgba()` / 渐变 / 原始阴影值。
- 禁止新增类似 `performanceTheme.page-theme` 的大一统业务 mixin。
- 禁止在业务模块维护自己的 dark token 切换分支。

### 10.2 允许事项

- 允许业务组件使用局部结构变量，但变量值必须来自 `--app-*`。
- 允许为特殊视觉组件定义局部 alias，但 alias 只能做语义转发。
- 允许在 pattern 层定义统一响应式规则。

## 11. 验证计划

### 11.1 静态验证

- 检查 `src/modules/performance` 下 `--el-*:` 赋值收敛为 0。
- 检查 `src/modules/performance` 下原始颜色值新增为 0。
- 检查新页面是否只依赖 `src/styles` 的 token 和 pattern。

### 11.2 构建验证

- `pnpm lint`
- `pnpm typecheck` 或项目现有等价检查
- `pnpm build`

### 11.3 视觉验证

light / dark 各检查以下页面：

- 基座主框架页
- `performance/workbench`
- `performance/dashboard`
- `teacher-channel/dashboard`
- `asset-crud-page`
- `material-crud-page`
- `supplier-page`

重点观察：

- 页面背景是否连续
- 卡片层级是否一致
- 表格表头/行背景是否统一
- 弹窗、抽屉、分页是否继承统一皮肤
- 主色切换后是否整体一致

## 12. 验收标准

- 全局 token 成为唯一视觉事实源。
- 基座与 `performance` 使用同一套语义 token。
- `performance` 不再直接覆盖 `--el-*`。
- `performance/styles/theme.scss` 不再承担事实源职责，最终应删除或清空。
- CRUD 页族完成共享 pattern 收敛。
- 图表色来自全局 chart token。
- light/dark/主色切换在基座和 `performance` 中表现一致。

## 13. 风险与缓解

### 风险 1：迁移期视觉抖动

缓解：

- 先建全局 token，再逐批迁移页面。
- 过渡期允许兼容映射层，但限制新增范围。

### 风险 2：页面 scoped style 过多，迁移成本高

缓解：

- 先抽高重复 pattern，再批量替换页面壳层。
- 优先处理页面族，而不是单页散改。

### 风险 3：基座未先接入，业务回收后更突兀

缓解：

- 基座组件必须作为第一批迁移对象。

### 风险 4：dark 模式回归不完整

缓解：

- dark token 必须在全局层定义。
- 首批页面必须做 light/dark 双模式人工回归。

## 14. 分阶段实施计划

### Phase 1：建立全局样式骨架

- 新增 `src/styles` 分层文件。
- 建立 foundation / semantic / adapter / pattern 基础结构。
- 把主题运行时接到全局 token。

### Phase 2：基座接入 SSOT

- 改造 `slider`、`topbar`、`process`。
- 验证主框架 light/dark/主色切换。

### Phase 3：门户与看板接入

- 改造 `workbench`
- 改造 `dashboard`
- 改造 `teacher-channel`

### Phase 4：CRUD 页族收敛

- 抽 `page-shell` / `data-panel` / `table-surface`
- 迁 `asset-crud-page`
- 迁 `material-crud-page`
- 迁 `supplier-page`

### Phase 5：抽屉与表单页族收敛

- 迁 `assessment-page`
- 迁 `pip`
- 迁 `promotion`
- 迁 `office-ledger-page`

### Phase 6：清理遗留

- 删除 `performance/styles/theme.scss` 事实源能力
- 清理业务模块内残余 `--el-*`
- 清理图表本地 fallback 色值

## 15. 本设计的实施门槛

在进入代码改造前，必须满足：

- 全局 token 命名表冻结。
- Element adapter 的映射边界冻结。
- 首批迁移页面清单冻结。
- 静态扫描规则明确。
- light/dark/主色切换的视觉回归页清单明确。

## 16. 结论

本次重构不是简单的“统一颜色”，而是把仓库从“基座主题 + 业务私有主题并存”改为“全局主题唯一真源，业务模块按语义消费”。只要继续让 `performance` 在页面作用域里定义颜色事实或覆盖 `--el-*`，样式割裂就会持续复发。

推荐按本设计分阶段实施，先建 SSOT，再迁基座，再迁 `performance` 门户和 CRUD 页面族，最后清理遗留主题文件。
