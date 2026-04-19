# GUI Check Report

- Name: theme20-asset-management-gui
- Description: Theme20 资产管理全生命周期最小 GUI 点测
- Generated At: 2026-04-19T12:42:10.282Z
- UI Base URL: http://127.0.0.1:9007
- API Base URL: http://127.0.0.1:19136
- Chrome Debug URL: http://127.0.0.1:9222
- PASS: 3
- FAIL: 0
- Conclusion: PASSED

## Scenarios

### hr-asset-full-lifecycle
- Username: hr_admin
- Route: /performance/asset/dashboard
- Status: PASSED
- Step 1: waitBodyText -> passed
- Step 2: screenshot -> passed
  File: tasks/artifacts/theme20-asset-management-gui/theme20-asset-hr-dashboard.png
- Step 3: assertBodyText -> passed
- Step 4: navigate -> passed
- Step 5: waitBodyText -> passed
- Step 6: screenshot -> passed
  File: tasks/artifacts/theme20-asset-management-gui/theme20-asset-hr-ledger.png
- Step 7: navigate -> passed
- Step 8: waitBodyText -> passed
- Step 9: screenshot -> passed
  File: tasks/artifacts/theme20-asset-management-gui/theme20-asset-hr-assignment.png
- Step 10: navigate -> passed
- Step 11: waitBodyText -> passed
- Step 12: screenshot -> passed
  File: tasks/artifacts/theme20-asset-management-gui/theme20-asset-hr-maintenance.png
- Step 13: navigate -> passed
- Step 14: waitBodyText -> passed
- Step 15: screenshot -> passed
  File: tasks/artifacts/theme20-asset-management-gui/theme20-asset-hr-report.png
- Step 16: navigate -> passed
- Step 17: waitBodyText -> passed
- Step 18: screenshot -> passed
  File: tasks/artifacts/theme20-asset-management-gui/theme20-asset-hr-procurement.png
- Step 19: navigate -> passed
- Step 20: waitBodyText -> passed
- Step 21: screenshot -> passed
  File: tasks/artifacts/theme20-asset-management-gui/theme20-asset-hr-transfer.png
- Step 22: navigate -> passed
- Step 23: waitBodyText -> passed
- Step 24: screenshot -> passed
  File: tasks/artifacts/theme20-asset-management-gui/theme20-asset-hr-inventory.png
- Step 25: navigate -> passed
- Step 26: waitBodyText -> passed
- Step 27: screenshot -> passed
  File: tasks/artifacts/theme20-asset-management-gui/theme20-asset-hr-depreciation.png
- Step 28: navigate -> passed
- Step 29: waitBodyText -> passed
- Step 30: screenshot -> passed
  File: tasks/artifacts/theme20-asset-management-gui/theme20-asset-hr-disposal.png

### manager-asset-permission-scope
- Username: manager_rd
- Route: /performance/asset/dashboard
- Status: PASSED
- Step 1: waitBodyText -> passed
- Step 2: screenshot -> passed
  File: tasks/artifacts/theme20-asset-management-gui/theme20-asset-manager-dashboard.png
- Step 3: assertBodyText -> passed
- Step 4: navigate -> passed
- Step 5: waitBodyText -> passed
- Step 6: assertVisibleText -> passed
- Step 7: screenshot -> passed
  File: tasks/artifacts/theme20-asset-management-gui/theme20-asset-manager-report.png
- Step 8: assertVisibleText -> passed

### employee-asset-no-entry
- Username: employee_platform
- Route: /performance/my-assessment
- Status: PASSED
- Step 1: waitBodyText -> passed
- Step 2: assertVisibleText -> passed
- Step 3: screenshot -> passed
  File: tasks/artifacts/theme20-asset-management-gui/theme20-asset-employee-no-entry.png
