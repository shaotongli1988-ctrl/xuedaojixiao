# GUI Check Report

- Name: business-mainline-core-gui
- Description: 核心业务主链最小 GUI 点测
- Generated At: 2026-04-18T16:29:07.610Z
- UI Base URL: http://127.0.0.1:9007
- API Base URL: http://127.0.0.1:8006
- Chrome Debug URL: http://127.0.0.1:9222
- PASS: 3
- FAIL: 0
- Conclusion: PASSED

## Scenarios

### hr-business-mainline
- Username: hr_admin
- Route: /performance/indicator-library
- Status: PASSED
- Step 1: waitBodyText -> passed
- Step 2: screenshot -> passed
  File: tasks/artifacts/business-mainline-core/business-mainline-hr-indicator.png
- Step 3: navigate -> passed
- Step 4: waitBodyText -> passed
- Step 5: screenshot -> passed
  File: tasks/artifacts/business-mainline-core/business-mainline-hr-feedback.png
- Step 6: navigate -> passed
- Step 7: waitBodyText -> passed
- Step 8: screenshot -> passed
  File: tasks/artifacts/business-mainline-core/business-mainline-hr-pip.png
- Step 9: navigate -> passed
- Step 10: waitBodyText -> passed
- Step 11: screenshot -> passed
  File: tasks/artifacts/business-mainline-core/business-mainline-hr-promotion.png
- Step 12: navigate -> passed
- Step 13: waitBodyText -> passed
- Step 14: screenshot -> passed
  File: tasks/artifacts/business-mainline-core/business-mainline-hr-salary.png

### manager-business-mainline
- Username: manager_rd
- Route: /performance/pending
- Status: PASSED
- Step 1: waitBodyText -> passed
- Step 2: screenshot -> passed
  File: tasks/artifacts/business-mainline-core/business-mainline-manager-pending.png
- Step 3: navigate -> passed
- Step 4: waitBodyText -> passed
- Step 5: screenshot -> passed
  File: tasks/artifacts/business-mainline-core/business-mainline-manager-course.png
- Step 6: navigate -> passed
- Step 7: waitBodyText -> passed
- Step 8: screenshot -> passed
  File: tasks/artifacts/business-mainline-core/business-mainline-manager-supplier.png
- Step 9: navigate -> passed
- Step 10: assertBodyText -> passed
- Step 11: screenshot -> passed
  File: tasks/artifacts/business-mainline-core/business-mainline-manager-salary-404.png

### employee-business-mainline
- Username: employee_platform
- Route: /performance/my-assessment
- Status: PASSED
- Step 1: waitBodyText -> passed
- Step 2: screenshot -> passed
  File: tasks/artifacts/business-mainline-core/business-mainline-employee-assessment.png
- Step 3: navigate -> passed
- Step 4: waitBodyText -> passed
- Step 5: screenshot -> passed
  File: tasks/artifacts/business-mainline-core/business-mainline-employee-goals.png
- Step 6: navigate -> passed
- Step 7: waitBodyText -> passed
- Step 8: screenshot -> passed
  File: tasks/artifacts/business-mainline-core/business-mainline-employee-learning.png
- Step 9: navigate -> passed
- Step 10: assertBodyText -> passed
- Step 11: screenshot -> passed
  File: tasks/artifacts/business-mainline-core/business-mainline-employee-promotion-404.png
