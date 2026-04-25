# GUI Check Report

- Name: theme18-hiring-gui
- Description: Theme18 录用管理最小 GUI 点测
- Generated At: 2026-04-19T03:02:38.481Z
- UI Base URL: http://127.0.0.1:9020
- API Base URL: http://127.0.0.1:8020
- Chrome Debug URL: http://127.0.0.1:9222
- PASS: 3
- FAIL: 0
- Conclusion: PASSED

## Scenarios

### hr-hiring-mainline
- Username: hr_admin
- Route: /performance/hiring
- Status: PASSED
- Step 1: waitBodyText -> passed
- Step 2: assertVisibleText -> passed
- Step 3: screenshot -> passed
  File: tasks/artifacts/theme18-hiring-gui/theme18-hiring-hr-list.png
- Step 0: clickText -> passed
- Step 5: waitBodyText -> passed
- Step 6: screenshot -> passed
  File: tasks/artifacts/theme18-hiring-gui/theme18-hiring-hr-detail.png

### manager-hiring-scope
- Username: manager_rd
- Route: /performance/hiring
- Status: PASSED
- Step 1: waitBodyText -> passed
- Step 2: assertBodyText -> passed
- Step 3: screenshot -> passed
  File: tasks/artifacts/theme18-hiring-gui/theme18-hiring-manager-scope.png
- Step 0: clickText -> passed
- Step 5: waitBodyText -> passed
- Step 6: screenshot -> passed
  File: tasks/artifacts/theme18-hiring-gui/theme18-hiring-manager-detail.png

### employee-hiring-no-entry
- Username: employee_platform
- Route: /performance/my-assessment
- Status: PASSED
- Step 1: waitBodyText -> passed
- Step 2: assertVisibleText -> passed
- Step 3: screenshot -> passed
  File: tasks/artifacts/theme18-hiring-gui/theme18-hiring-employee-home.png
