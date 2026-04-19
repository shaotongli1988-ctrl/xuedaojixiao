# GUI Check Report

- Name: performance-mainline-loop-gui
- Description: 绩效闭环最小 GUI 点测
- Generated At: 2026-04-19T02:33:40.963Z
- UI Base URL: http://127.0.0.1:9007
- API Base URL: http://127.0.0.1:8006
- Chrome Debug URL: http://127.0.0.1:9222
- PASS: 2
- FAIL: 1
- Conclusion: FAILED

## Scenarios

### hr-performance-loop
- Username: hr_admin
- Route: /performance/initiated
- Status: PASSED
- Step 1: waitBodyText -> passed
- Step 2: screenshot -> passed
  File: tasks/artifacts/performance-mainline-loop/performance-loop-hr-initiated.png
- Step 3: navigate -> passed
- Step 4: waitBodyText -> passed
- Step 5: screenshot -> passed
  File: tasks/artifacts/performance-mainline-loop/performance-loop-hr-goals.png
- Step 6: navigate -> passed
- Step 7: waitBodyText -> passed
- Step 8: screenshot -> passed
  File: tasks/artifacts/performance-mainline-loop/performance-loop-hr-feedback.png

### manager-performance-loop
- Username: manager_rd
- Route: /performance/pending
- Status: PASSED
- Step 1: waitBodyText -> passed
- Step 2: assertVisibleText -> passed
- Step 3: screenshot -> passed
  File: tasks/artifacts/performance-mainline-loop/performance-loop-manager-pending.png
- Step 4: navigate -> passed
- Step 5: waitBodyText -> passed
- Step 6: screenshot -> passed
  File: tasks/artifacts/performance-mainline-loop/performance-loop-manager-goals.png

### employee-performance-loop
- Username: employee_platform
- Route: /performance/my-assessment
- Status: FAILED
- Error: assertBodyText failed: includes=["404","找不到您要查找的页面"] excludes=["待我审批"]
- Step 1: waitBodyText -> passed
- Step 2: screenshot -> passed
  File: tasks/artifacts/performance-mainline-loop/performance-loop-employee-assessment.png
- Step 3: navigate -> passed
- Step 4: waitBodyText -> passed
- Step 5: screenshot -> passed
  File: tasks/artifacts/performance-mainline-loop/performance-loop-employee-goals.png
- Step 6: navigate -> passed
- Step 7: assertBodyText -> failed
  Error: assertBodyText failed: includes=["404","找不到您要查找的页面"] excludes=["待我审批"]
