# GUI Check Report

- Name: admin-office-ledgers-gui
- Description: 行政模块车辆管理与知识产权管理最小 GUI 点测
- Generated At: 2026-04-20T02:06:32.619Z
- UI Base URL: http://127.0.0.1:9007
- API Base URL: http://127.0.0.1:8006
- Chrome Debug URL: http://127.0.0.1:9222
- PASS: 4
- FAIL: 0
- Conclusion: PASSED

## Scenarios

### hr-vehicle-ledger
- Username: hr_admin
- Route: /performance/office/vehicle
- Status: PASSED
- Step 1: screenshot -> passed
  File: tasks/artifacts/admin-office-ledgers-gui/admin-office-vehicle-hr-diagnose.png
- Step 2: waitBodyText -> passed
- Step 3: assertVisibleText -> passed
- Step 4: screenshot -> passed
  File: tasks/artifacts/admin-office-ledgers-gui/admin-office-vehicle-hr-list.png
- Step 0: clickText -> passed
- Step 6: waitBodyText -> passed
- Step 7: screenshot -> passed
  File: tasks/artifacts/admin-office-ledgers-gui/admin-office-vehicle-hr-create-dialog.png

### hr-intellectual-property-ledger
- Username: hr_admin
- Route: /performance/office/intellectual-property
- Status: PASSED
- Step 1: screenshot -> passed
  File: tasks/artifacts/admin-office-ledgers-gui/admin-office-ip-hr-diagnose.png
- Step 2: waitBodyText -> passed
- Step 3: assertVisibleText -> passed
- Step 4: screenshot -> passed
  File: tasks/artifacts/admin-office-ledgers-gui/admin-office-ip-hr-list.png
- Step 0: clickText -> passed
- Step 6: waitBodyText -> passed
- Step 7: screenshot -> passed
  File: tasks/artifacts/admin-office-ledgers-gui/admin-office-ip-hr-create-dialog.png

### manager-admin-office-no-entry
- Username: manager_rd
- Route: /performance/my-assessment
- Status: PASSED
- Step 1: waitBodyText -> passed
- Step 2: assertVisibleText -> passed
- Step 3: screenshot -> passed
  File: tasks/artifacts/admin-office-ledgers-gui/admin-office-manager-no-entry.png

### employee-admin-office-no-entry
- Username: employee_platform
- Route: /performance/my-assessment
- Status: PASSED
- Step 1: waitBodyText -> passed
- Step 2: assertVisibleText -> passed
- Step 3: screenshot -> passed
  File: tasks/artifacts/admin-office-ledgers-gui/admin-office-employee-no-entry.png
