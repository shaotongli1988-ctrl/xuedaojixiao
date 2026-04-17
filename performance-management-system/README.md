# 绩效管理系统项目目录

## 目录说明

这个目录用于在 `xuedao` 仓库内单独收敛“绩效管理系统”项目资料和后续实现内容，不再把项目文档直接混放在仓库根目录。

## 当前技术边界

本项目后续实现必须基于下面两套现有框架：

- 后端：`/Users/shaotongli/Documents/xuedao/cool-admin-midway`
- 后台：`/Users/shaotongli/Documents/xuedao/cool-admin-vue`

本期不纳入：

- `cool-uni`
- 新的前端框架
- 新的后端框架
- 独立审批引擎、独立 BI 服务、独立报表服务

## 当前文档入口

- [合并升级版需求与页面文档](/Users/shaotongli/Documents/xuedao/performance-management-system/docs/01-绩效管理系统-合并升级版需求与页面文档.md)
- [项目文档入口](/Users/shaotongli/Documents/xuedao/performance-management-system/docs/README.md)
- [项目执行流程（精简版）](/Users/shaotongli/Documents/xuedao/performance-management-system/docs/17-项目执行流程（精简版）.md)

## 当前执行规则

这个项目现在按下面原则推进：

1. 唯一事实源统一放在 `performance-management-system/docs/`
2. 只保留少量对本项目直接有用的通用流程文档
3. 代码仍然落在现有基座，不复制新工程目录
4. 首期只实现 `cool-admin-midway + cool-admin-vue`
5. 阶段放行必须同时遵守 `25/26/27/28` 四份治理文档，尤其是“没有 smoke 通过记录，不算联调完成”

## 后续建议目录

后续如果正式进入开发，可以继续按下面结构补齐：

```text
performance-management-system/
  README.md
  docs/
    README.md
    01-绩效管理系统-合并升级版需求与页面文档.md
    02-技术设计.md
    03-数据库设计.md
    04-API设计.md
    05-状态机与流转规则.md
    06-权限矩阵.md
    07-字段字典与枚举.md
    08-实施计划.md
    09-测试清单.md
    25-项目最高准则.md
    26-可执行联调门禁与Smoke规则.md
    27-共享基础层变更治理规则.md
    28-阶段完成判定模板.md
```

如果后面决定把代码也收敛到独立目录，再单独创建：

- `performance-management-system/cool-admin-midway/`
- `performance-management-system/cool-admin-vue/`

但在真正复制或迁移代码前，先以当前根目录下的现有基座为唯一技术基线。
