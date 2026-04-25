# GUI Check Report

- Name: theme19-teacher-channel-gui
- Description: 主题19班主任渠道合作管理最小 GUI 点测
- Generated At: 2026-04-19T07:10:37.835Z
- UI Base URL: http://127.0.0.1:9023
- API Base URL: http://127.0.0.1:9023/dev
- Chrome Debug URL: http://127.0.0.1:9222
- PASS: 4
- FAIL: 0
- Conclusion: PASSED

## Scenarios

### hr-theme19-dashboard
- Username: hr_admin
- Route: /performance/teacher-channel/dashboard
- Status: PASSED
- Step 1: waitBodyText -> passed
- Step 2: screenshot -> passed
  File: Users/shaotongli/Documents/xuedao/performance-management-system/tasks/artifacts/theme19-gui-check/theme19-hr-dashboard.png

### readonly-theme19-teacher-list
- Username: readonly_teacher
- Route: /performance/teacher-channel/teacher
- Status: PASSED
- Step 1: waitBodyText -> passed
- Step 2: assertVisibleText -> passed
- Step 3: screenshot -> passed
  File: Users/shaotongli/Documents/xuedao/performance-management-system/tasks/artifacts/theme19-gui-check/theme19-readonly-teacher-list.png

### hr-theme19-todo-list
- Username: hr_admin
- Route: /performance/teacher-channel/todo
- Status: PASSED
- Step 1: waitBodyText -> passed
- Step 2: screenshot -> passed
  File: Users/shaotongli/Documents/xuedao/performance-management-system/tasks/artifacts/theme19-gui-check/theme19-hr-todo-list.png

### hr-theme19-class-list
- Username: hr_admin
- Route: /performance/teacher-channel/class
- Status: PASSED
- Step 1: waitBodyText -> passed
- Step 2: screenshot -> passed
  File: Users/shaotongli/Documents/xuedao/performance-management-system/tasks/artifacts/theme19-gui-check/theme19-hr-class-list.png
