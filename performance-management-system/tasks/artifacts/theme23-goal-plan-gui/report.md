# GUI Check Report

- Name: theme23-goal-plan-gui
- Description: Theme23 目标&计划总览最小 GUI 点测
- Generated At: 2026-04-19T12:40:25.868Z
- UI Base URL: http://127.0.0.1:9007
- API Base URL: http://127.0.0.1:19136
- Chrome Debug URL: http://127.0.0.1:9222
- PASS: 4
- FAIL: 0
- Conclusion: PASSED

## Scenarios

### manager-goal-plan-overview-mainline
- Username: manager_rd
- Route: /performance/goals
- Status: PASSED
- Step 1: waitBodyText -> passed
- Step 2: assertVisibleText -> passed
- Step 3: screenshot -> passed
  File: tasks/artifacts/theme23-goal-plan-gui/theme23-goal-plan-manager-overview.png
- Step 0: clickText -> passed
- Step 5: waitBodyText -> passed
- Step 6: screenshot -> passed
  File: tasks/artifacts/theme23-goal-plan-gui/theme23-goal-plan-manager-assign-dialog.png
- Step 7: navigate -> passed
- Step 8: waitBodyText -> passed
- Step 0: clickText -> passed
- Step 10: waitBodyText -> passed
- Step 11: screenshot -> passed
  File: tasks/artifacts/theme23-goal-plan-gui/theme23-goal-plan-manager-daily-report.png

### employee-goal-plan-reporting-mainline
- Username: employee_platform
- Route: /performance/goals
- Status: PASSED
- Step 1: waitBodyText -> passed
- Step 2: assertVisibleText -> passed
- Step 3: screenshot -> passed
  File: tasks/artifacts/theme23-goal-plan-gui/theme23-goal-plan-employee-overview.png
- Step 0: clickText -> passed
- Step 5: waitBodyText -> passed
- Step 6: screenshot -> passed
  File: tasks/artifacts/theme23-goal-plan-gui/theme23-goal-plan-employee-report-dialog.png

### manager-goal-plan-contribution-dimensions
- Username: manager_rd
- Route: /performance/goals
- Status: PASSED
- Step 1: waitBodyText -> passed
- Step 2: assertVisibleText -> passed
- Step 3: screenshot -> passed
  File: tasks/artifacts/theme23-goal-plan-gui/theme23-goal-plan-manager-contribution-split.png

### employee-goal-plan-no-manager-entry
- Username: employee_platform
- Route: /performance/goals
- Status: PASSED
- Step 1: waitBodyText -> passed
- Step 2: assertVisibleText -> passed
- Step 3: screenshot -> passed
  File: tasks/artifacts/theme23-goal-plan-gui/theme23-goal-plan-employee-no-manager-entry.png
