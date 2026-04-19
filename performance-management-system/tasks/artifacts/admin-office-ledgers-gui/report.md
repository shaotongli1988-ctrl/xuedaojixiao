# GUI Check Report

- Name: admin-office-ledgers-gui
- Description: 行政模块车辆管理与知识产权管理最小 GUI 点测
- Generated At: 2026-04-19T06:34:04.494Z
- UI Base URL: http://127.0.0.1:9007
- API Base URL: http://127.0.0.1:8006
- Chrome Debug URL: http://127.0.0.1:9222
- PASS: 2
- FAIL: 2
- Conclusion: FAILED

## Scenarios

### hr-vehicle-ledger
- Username: hr_admin
- Route: /performance/office/vehicle
- Status: FAILED
- Error: assertVisibleText failed: includes=["车辆管理","新增车辆","车辆编号 / 车牌","车辆类型","状态"] excludes=[]
- Step 1: screenshot -> passed
  File: tasks/artifacts/admin-office-ledgers-gui/admin-office-vehicle-hr-diagnose.png
- Step 2: waitBodyText -> passed
- Step 3: assertVisibleText -> failed
  Error: assertVisibleText failed: includes=["车辆管理","新增车辆","车辆编号 / 车牌","车辆类型","状态"] excludes=[]

### hr-intellectual-property-ledger
- Username: hr_admin
- Route: /performance/office/intellectual-property
- Status: FAILED
- Error: assertVisibleText failed: includes=["知识产权管理","新增知识产权","编号 / 标题","类型","状态"] excludes=[]
- Step 1: screenshot -> passed
  File: tasks/artifacts/admin-office-ledgers-gui/admin-office-ip-hr-diagnose.png
- Step 2: waitBodyText -> passed
- Step 3: assertVisibleText -> failed
  Error: assertVisibleText failed: includes=["知识产权管理","新增知识产权","编号 / 标题","类型","状态"] excludes=[]

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
