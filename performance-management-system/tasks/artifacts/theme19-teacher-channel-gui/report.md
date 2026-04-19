# GUI Check Report

- Name: theme19-teacher-channel-gui
- Description: Theme19 班主任渠道合作管理最小 GUI 点测
- Generated At: 2026-04-19T02:58:53.005Z
- UI Base URL: http://127.0.0.1:9013
- API Base URL: http://127.0.0.1:8057
- Chrome Debug URL: http://127.0.0.1:9222
- PASS: 5
- FAIL: 0
- Conclusion: PASSED

## Scenarios

### hr-dashboard-summary
- Username: hr_admin
- Route: /performance/teacher-channel/dashboard
- Status: PASSED
- Step 1: waitBodyText -> passed
- Step 2: screenshot -> passed
  File: tasks/artifacts/theme19-teacher-channel-gui/theme19-dashboard-hr.png

### hr-teacher-mainline
- Username: hr_admin
- Route: /performance/teacher-channel/teacher
- Status: PASSED
- Step 1: waitBodyText -> passed
- Step 2: assertVisibleText -> passed
- Step 3: screenshot -> passed
  File: tasks/artifacts/theme19-teacher-channel-gui/theme19-teacher-hr-list.png
- Step 0: clickText -> passed
- Step 5: waitBodyText -> passed
- Step 6: screenshot -> passed
  File: tasks/artifacts/theme19-teacher-channel-gui/theme19-teacher-hr-detail.png

### manager-teacher-scope
- Username: manager_rd
- Route: /performance/teacher-channel/teacher
- Status: PASSED
- Step 1: waitBodyText -> passed
- Step 2: assertBodyText -> passed
- Step 3: screenshot -> passed
  File: tasks/artifacts/theme19-teacher-channel-gui/theme19-teacher-manager-scope.png

### readonly-teacher-masked
- Username: readonly_teacher
- Route: /performance/teacher-channel/teacher
- Status: PASSED
- Step 1: waitBodyText -> passed
- Step 2: assertVisibleText -> passed
- Step 3: screenshot -> passed
  File: tasks/artifacts/theme19-teacher-channel-gui/theme19-teacher-readonly-list.png
- Step 0: clickText -> passed
- Step 5: waitBodyText -> passed
- Step 6: screenshot -> passed
  File: tasks/artifacts/theme19-teacher-channel-gui/theme19-teacher-readonly-detail.png

### hr-class-list
- Username: hr_admin
- Route: /performance/teacher-channel/class
- Status: PASSED
- Step 1: waitBodyText -> passed
- Step 2: screenshot -> passed
  File: tasks/artifacts/theme19-teacher-channel-gui/theme19-class-hr-list.png
