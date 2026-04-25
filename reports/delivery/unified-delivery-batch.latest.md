Unified delivery guard: batch
工作目录: /Users/shaotongli/Documents/xuedao
Git 根目录: /Users/shaotongli/Documents/xuedao
校验阈值: high
改动文件数: 904
  - /Users/shaotongli/Documents/xuedao/cool-admin-midway/.eslintrc.json
  - /Users/shaotongli/Documents/xuedao/cool-admin-midway/package.json
  - /Users/shaotongli/Documents/xuedao/cool-admin-midway/scripts/ensure-local-performance-schema.mjs
  - /Users/shaotongli/Documents/xuedao/cool-admin-midway/scripts/install-local-deps.mjs
  - /Users/shaotongli/Documents/xuedao/cool-admin-midway/scripts/latest-reset-and-verify.mjs
  - /Users/shaotongli/Documents/xuedao/cool-admin-midway/scripts/seed-stage2-performance.mjs
  - /Users/shaotongli/Documents/xuedao/cool-admin-midway/scripts/smoke-stage2-contract.mjs
  - /Users/shaotongli/Documents/xuedao/cool-admin-midway/scripts/smoke-stage2-goal-plan.mjs
  - /Users/shaotongli/Documents/xuedao/cool-admin-midway/scripts/smoke-stage2-hiring.mjs
  - /Users/shaotongli/Documents/xuedao/cool-admin-midway/scripts/smoke-stage2-performance.mjs
  - /Users/shaotongli/Documents/xuedao/cool-admin-midway/scripts/smoke-stage2-procurement-supplier.mjs
  - /Users/shaotongli/Documents/xuedao/cool-admin-midway/scripts/smoke-stage2-resumePool.mjs
  - /Users/shaotongli/Documents/xuedao/cool-admin-midway/src/config/config.local.ts
  - /Users/shaotongli/Documents/xuedao/cool-admin-midway/src/config/config.prod.ts
  - /Users/shaotongli/Documents/xuedao/cool-admin-midway/src/configuration.ts
  - /Users/shaotongli/Documents/xuedao/cool-admin-midway/src/entities.ts
  - /Users/shaotongli/Documents/xuedao/cool-admin-midway/src/modules/base/controller/admin/comm.ts
  - /Users/shaotongli/Documents/xuedao/cool-admin-midway/src/modules/performance/entity/interview.ts
  - /Users/shaotongli/Documents/xuedao/cool-admin-midway/src/modules/performance/service/approval-flow-helper.ts
  - /Users/shaotongli/Documents/xuedao/cool-admin-midway/src/modules/performance/service/approval-flow.ts
  - ... 其余 884 个文件
子守卫结果:
  - rbac: exit=1, issues=1
  - state-machine: exit=0, issues=0
  - component-reuse: exit=0, issues=0
问题:
  [HIGH] 1
    - [rbac] 前后端权限键无交集: 前后端都检测到权限键，但命名体系完全不一致。
      修复: 统一权限键命名规范（例如 resource:action）并做双端迁移。
