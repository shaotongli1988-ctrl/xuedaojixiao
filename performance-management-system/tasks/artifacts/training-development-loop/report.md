# GUI Check Report

- Name: training-development-loop-gui
- Description: 培训与发展闭环最小 GUI 点测
- Generated At: 2026-04-18T16:46:45.998Z
- UI Base URL: http://127.0.0.1:9007
- API Base URL: http://127.0.0.1:8006
- Chrome Debug URL: http://127.0.0.1:9222
- PASS: 3
- FAIL: 0
- Conclusion: PASSED

## Scenarios

### hr-training-development-loop
- Username: hr_admin
- Route: /performance/course
- Status: PASSED
- Step 1: waitBodyText -> passed
- Step 2: screenshot -> passed
  File: tasks/artifacts/training-development-loop/training-loop-hr-course.png
- Step 3: navigate -> passed
- Step 4: waitBodyText -> passed
- Step 5: screenshot -> passed
  File: tasks/artifacts/training-development-loop/training-loop-hr-capability.png
- Step 6: navigate -> passed
- Step 7: waitBodyText -> passed
- Step 8: screenshot -> passed
  File: tasks/artifacts/training-development-loop/training-loop-hr-certificate.png

### manager-training-development-loop
- Username: manager_rd
- Route: /performance/course
- Status: PASSED
- Step 1: waitBodyText -> passed
- Step 2: assertVisibleText -> passed
- Step 3: screenshot -> passed
  File: tasks/artifacts/training-development-loop/training-loop-manager-course.png
- Step 4: navigate -> passed
- Step 5: waitBodyText -> passed
- Step 6: assertVisibleText -> passed
- Step 7: screenshot -> passed
  File: tasks/artifacts/training-development-loop/training-loop-manager-capability.png

### employee-training-learning-loop
- Username: employee_platform
- Route: /
- Status: PASSED
- Step 1: waitBodyText -> passed
- Step 2: assertVisibleText -> passed
- Step 3: screenshot -> passed
  File: tasks/artifacts/training-development-loop/training-loop-employee-no-admin-entry.png
- Step 4: navigate -> passed
- Step 5: waitBodyText -> passed
- Step 6: screenshot -> passed
  File: tasks/artifacts/training-development-loop/training-loop-employee-learning.png
