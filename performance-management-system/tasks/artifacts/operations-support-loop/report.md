# GUI Check Report

- Name: operations-support-loop-gui
- Description: 会议/合同/采购闭环最小 GUI 点测
- Generated At: 2026-04-18T16:50:34.852Z
- UI Base URL: http://127.0.0.1:9007
- API Base URL: http://127.0.0.1:8006
- Chrome Debug URL: http://127.0.0.1:9222
- PASS: 3
- FAIL: 0
- Conclusion: PASSED

## Scenarios

### hr-operations-support-loop
- Username: hr_admin
- Route: /performance/meeting
- Status: PASSED
- Step 1: waitBodyText -> passed
- Step 2: screenshot -> passed
  File: tasks/artifacts/operations-support-loop/operations-loop-hr-meeting.png
- Step 3: navigate -> passed
- Step 4: waitBodyText -> passed
- Step 5: screenshot -> passed
  File: tasks/artifacts/operations-support-loop/operations-loop-hr-contract.png
- Step 6: navigate -> passed
- Step 7: waitBodyText -> passed
- Step 8: screenshot -> passed
  File: tasks/artifacts/operations-support-loop/operations-loop-hr-purchase-order.png
- Step 9: navigate -> passed
- Step 10: waitBodyText -> passed
- Step 11: screenshot -> passed
  File: tasks/artifacts/operations-support-loop/operations-loop-hr-supplier.png

### manager-operations-support-loop
- Username: manager_rd
- Route: /performance/meeting
- Status: PASSED
- Step 1: waitBodyText -> passed
- Step 2: screenshot -> passed
  File: tasks/artifacts/operations-support-loop/operations-loop-manager-meeting.png
- Step 3: navigate -> passed
- Step 4: waitBodyText -> passed
- Step 5: screenshot -> passed
  File: tasks/artifacts/operations-support-loop/operations-loop-manager-purchase-order.png
- Step 6: navigate -> passed
- Step 7: waitBodyText -> passed
- Step 8: assertVisibleText -> passed
- Step 9: screenshot -> passed
  File: tasks/artifacts/operations-support-loop/operations-loop-manager-supplier.png

### employee-operations-no-entry
- Username: employee_platform
- Route: /
- Status: PASSED
- Step 1: waitBodyText -> passed
- Step 2: assertVisibleText -> passed
- Step 3: screenshot -> passed
  File: tasks/artifacts/operations-support-loop/operations-loop-employee-no-entry.png
