# GUI Check Report

- Name: theme20-asset-management-gui
- Description: Theme20 资产管理全生命周期最小 GUI 点测
- Generated At: 2026-04-19T04:11:16.715Z
- UI Base URL: http://127.0.0.1:9012
- API Base URL: http://127.0.0.1:8064
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
  File: tasks/artifacts/theme20-asset-management-gui-9012/theme20-asset-hr-dashboard.png
- Step 3: navigate -> passed
- Step 4: waitBodyText -> passed
- Step 5: screenshot -> passed
  File: tasks/artifacts/theme20-asset-management-gui-9012/theme20-asset-hr-ledger.png
- Step 6: navigate -> passed
- Step 7: waitBodyText -> passed
- Step 8: screenshot -> passed
  File: tasks/artifacts/theme20-asset-management-gui-9012/theme20-asset-hr-assignment.png
- Step 9: navigate -> passed
- Step 10: waitBodyText -> passed
- Step 11: screenshot -> passed
  File: tasks/artifacts/theme20-asset-management-gui-9012/theme20-asset-hr-maintenance.png
- Step 12: navigate -> passed
- Step 13: waitBodyText -> passed
- Step 14: screenshot -> passed
  File: tasks/artifacts/theme20-asset-management-gui-9012/theme20-asset-hr-report.png
- Step 15: navigate -> passed
- Step 16: waitBodyText -> passed
- Step 17: screenshot -> passed
  File: tasks/artifacts/theme20-asset-management-gui-9012/theme20-asset-hr-procurement.png
- Step 18: navigate -> passed
- Step 19: waitBodyText -> passed
- Step 20: screenshot -> passed
  File: tasks/artifacts/theme20-asset-management-gui-9012/theme20-asset-hr-transfer.png
- Step 21: navigate -> passed
- Step 22: waitBodyText -> passed
- Step 23: screenshot -> passed
  File: tasks/artifacts/theme20-asset-management-gui-9012/theme20-asset-hr-inventory.png
- Step 24: navigate -> passed
- Step 25: waitBodyText -> passed
- Step 26: screenshot -> passed
  File: tasks/artifacts/theme20-asset-management-gui-9012/theme20-asset-hr-depreciation.png
- Step 27: navigate -> passed
- Step 28: waitBodyText -> passed
- Step 29: screenshot -> passed
  File: tasks/artifacts/theme20-asset-management-gui-9012/theme20-asset-hr-disposal.png

### manager-asset-permission-scope
- Username: manager_rd
- Route: /performance/asset/dashboard
- Status: PASSED
- Step 1: waitBodyText -> passed
- Step 2: screenshot -> passed
  File: tasks/artifacts/theme20-asset-management-gui-9012/theme20-asset-manager-dashboard.png
- Step 3: navigate -> passed
- Step 4: waitBodyText -> passed
- Step 5: assertVisibleText -> passed
- Step 6: screenshot -> passed
  File: tasks/artifacts/theme20-asset-management-gui-9012/theme20-asset-manager-report.png
- Step 7: assertVisibleText -> passed

### employee-asset-no-entry
- Username: employee_platform
- Route: /performance/my-assessment
- Status: PASSED
- Step 1: waitBodyText -> passed
- Step 2: assertVisibleText -> passed
- Step 3: screenshot -> passed
  File: tasks/artifacts/theme20-asset-management-gui-9012/theme20-asset-employee-no-entry.png
