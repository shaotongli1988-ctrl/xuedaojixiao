# GUI Check Report

- Name: theme22-office-collab-gui
- Description: Theme22 行政协同记录管理最小 GUI 点测
- Generated At: 2026-04-20T02:04:38.764Z
- UI Base URL: http://127.0.0.1:9007
- API Base URL: http://127.0.0.1:8006
- Chrome Debug URL: http://127.0.0.1:9222
- PASS: 7
- FAIL: 0
- Conclusion: PASSED

## Scenarios

### hr-annual-inspection-mainline
- Username: hr_admin
- Route: /performance/office/annual-inspection
- Status: PASSED
- Step 1: waitBodyText -> passed
- Step 2: assertVisibleText -> passed
- Step 3: screenshot -> passed
  File: tasks/artifacts/theme22-office-collab-gui/theme22-annual-inspection-hr-list.png
- Step 0: clickText -> passed
- Step 5: waitBodyText -> passed
- Step 6: screenshot -> passed
  File: tasks/artifacts/theme22-office-collab-gui/theme22-annual-inspection-hr-detail.png

### hr-honor-mainline
- Username: hr_admin
- Route: /performance/office/honor
- Status: PASSED
- Step 1: waitBodyText -> passed
- Step 2: assertVisibleText -> passed
- Step 3: screenshot -> passed
  File: tasks/artifacts/theme22-office-collab-gui/theme22-honor-hr-list.png
- Step 0: clickText -> passed
- Step 5: waitBodyText -> passed
- Step 6: screenshot -> passed
  File: tasks/artifacts/theme22-office-collab-gui/theme22-honor-hr-create-dialog.png

### hr-publicity-material-mainline
- Username: hr_admin
- Route: /performance/office/publicity-material
- Status: PASSED
- Step 1: waitBodyText -> passed
- Step 2: assertVisibleText -> passed
- Step 3: screenshot -> passed
  File: tasks/artifacts/theme22-office-collab-gui/theme22-publicity-material-hr-list.png
- Step 0: clickText -> passed
- Step 5: waitBodyText -> passed
- Step 6: screenshot -> passed
  File: tasks/artifacts/theme22-office-collab-gui/theme22-publicity-material-hr-create-dialog.png

### hr-design-collab-mainline
- Username: hr_admin
- Route: /performance/office/design-collab
- Status: PASSED
- Step 1: waitBodyText -> passed
- Step 2: assertVisibleText -> passed
- Step 3: screenshot -> passed
  File: tasks/artifacts/theme22-office-collab-gui/theme22-design-collab-hr-list.png
- Step 0: clickText -> passed
- Step 5: waitBodyText -> passed
- Step 6: screenshot -> passed
  File: tasks/artifacts/theme22-office-collab-gui/theme22-design-collab-hr-create-dialog.png

### hr-express-collab-mainline
- Username: hr_admin
- Route: /performance/office/express-collab
- Status: PASSED
- Step 1: waitBodyText -> passed
- Step 2: assertVisibleText -> passed
- Step 3: screenshot -> passed
  File: tasks/artifacts/theme22-office-collab-gui/theme22-express-collab-hr-list.png
- Step 0: clickText -> passed
- Step 5: waitBodyText -> passed
- Step 6: screenshot -> passed
  File: tasks/artifacts/theme22-office-collab-gui/theme22-express-collab-hr-create-dialog.png

### manager-theme22-no-entry
- Username: manager_rd
- Route: /performance/my-assessment
- Status: PASSED
- Step 1: waitBodyText -> passed
- Step 2: assertVisibleText -> passed
- Step 3: screenshot -> passed
  File: tasks/artifacts/theme22-office-collab-gui/theme22-office-manager-no-entry.png

### employee-theme22-no-entry
- Username: employee_platform
- Route: /performance/my-assessment
- Status: PASSED
- Step 1: waitBodyText -> passed
- Step 2: assertVisibleText -> passed
- Step 3: screenshot -> passed
  File: tasks/artifacts/theme22-office-collab-gui/theme22-office-employee-no-entry.png
