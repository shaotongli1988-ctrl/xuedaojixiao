# GUI Check Report

- Name: theme15-resumePool-gui
- Description: Theme15 招聘简历池最小 GUI 点测
- Generated At: 2026-04-18T15:21:12.931Z
- UI Base URL: http://127.0.0.1:9006
- API Base URL: http://127.0.0.1:8031
- Chrome Debug URL: http://127.0.0.1:9222
- PASS: 3
- FAIL: 0
- Conclusion: PASSED

## Scenarios

### hr-resumePool
- Username: hr_admin
- Route: /performance/resumePool
- Status: PASSED
- Step 1: waitBodyText -> passed
- Step 2: assertVisibleText -> passed
- Step 3: screenshot -> passed
  File: tasks/artifacts/theme15-gui/theme15-hr-list.png
- Step 0: clickText -> passed
- Step 5: waitBodyText -> passed
- Step 6: assertBodyText -> passed
- Step 7: screenshot -> passed
  File: tasks/artifacts/theme15-gui/theme15-hr-detail.png

### manager-resumePool
- Username: manager_rd
- Route: /performance/resumePool
- Status: PASSED
- Step 1: waitBodyText -> passed
- Step 2: assertVisibleText -> passed
- Step 3: screenshot -> passed
  File: tasks/artifacts/theme15-gui/theme15-manager-list.png
- Step 0: clickText -> passed
- Step 5: waitBodyText -> passed
- Step 6: assertVisibleText -> passed
- Step 7: screenshot -> passed
  File: tasks/artifacts/theme15-gui/theme15-manager-detail.png

### employee-resumePool
- Username: employee_platform
- Route: /
- Status: PASSED
- Step 1: waitBodyText -> passed
- Step 2: assertVisibleText -> passed
- Step 3: screenshot -> passed
  File: tasks/artifacts/theme15-gui/theme15-employee-home.png
- Step 4: navigate -> passed
- Step 5: assertBodyText -> passed
- Step 6: screenshot -> passed
  File: tasks/artifacts/theme15-gui/theme15-employee-route.png
