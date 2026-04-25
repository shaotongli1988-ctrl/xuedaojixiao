# GUI Check Report

- Name: performance-mainline-loop-gui
- Description: 绩效闭环最小 GUI 点测
- Generated At: 2026-04-20T03:40:21.118Z
- UI Base URL: http://127.0.0.1:9001
- API Base URL: http://127.0.0.1:8006
- Chrome Debug URL: http://127.0.0.1:9222
- PASS: 3
- FAIL: 0
- Conclusion: PASSED

## Scenarios

### hr-performance-loop
- Username: hr_admin
- Route: /performance/initiated
- Status: PASSED
- Step 1: waitBodyText -> passed
- Step 2: screenshot -> passed
  File: tasks/artifacts/performance-mainline-loop-9001/performance-loop-hr-initiated.png
- Step 3: navigate -> passed
- Step 4: waitBodyText -> passed
- Step 5: screenshot -> passed
  File: tasks/artifacts/performance-mainline-loop-9001/performance-loop-hr-goals.png
- Step 6: navigate -> passed
- Step 7: waitBodyText -> passed
- Step 8: screenshot -> passed
  File: tasks/artifacts/performance-mainline-loop-9001/performance-loop-hr-feedback.png

### manager-performance-loop
- Username: manager_rd
- Route: /performance/pending
- Status: PASSED
- Step 1: waitBodyText -> passed
- Step 2: assertVisibleText -> passed
- Step 3: screenshot -> passed
  File: tasks/artifacts/performance-mainline-loop-9001/performance-loop-manager-pending.png
- Step 4: navigate -> passed
- Step 5: waitBodyText -> passed
- Step 6: screenshot -> passed
  File: tasks/artifacts/performance-mainline-loop-9001/performance-loop-manager-goals.png

### employee-performance-loop
- Username: employee_platform
- Route: /performance/my-assessment
- Status: PASSED
- Step 1: waitBodyText -> passed
- Step 2: screenshot -> passed
  File: tasks/artifacts/performance-mainline-loop-9001/performance-loop-employee-assessment.png
- Step 3: navigate -> passed
- Step 4: waitBodyText -> passed
- Step 5: screenshot -> passed
  File: tasks/artifacts/performance-mainline-loop-9001/performance-loop-employee-goals.png
- Step 6: navigate -> passed
- Step 7: assertBodyText -> passed
- Step 8: screenshot -> passed
  File: tasks/artifacts/performance-mainline-loop-9001/performance-loop-employee-pending-404.png
