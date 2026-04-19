# GUI Check Report

- Name: write-submit-result-gui
- Description: 关键写操作提交结果态最小 GUI 点测
- Generated At: 2026-04-18T17:16:50.237Z
- UI Base URL: http://127.0.0.1:9007
- API Base URL: http://127.0.0.1:8006
- Chrome Debug URL: http://127.0.0.1:9222
- PASS: 3
- FAIL: 0
- Conclusion: PASSED

## Scenarios

### hr-write-submit-success
- Username: hr_admin
- Route: /performance/initiated
- Status: PASSED
- Step 1: waitBodyText -> passed
- Step 0: clickText -> passed
- Step 3: waitBodyText -> passed
- Step 0: clickText -> passed
- Step 5: waitBodyText -> passed
- Step 0: inputByLabel -> passed
- Step 0: inputByLabel -> passed
- Step 8: screenshot -> passed
  File: tasks/artifacts/write-submit-result/write-submit-hr-promotion-form.png
- Step 0: clickText -> passed
- Step 10: waitBodyText -> passed
- Step 11: screenshot -> passed
  File: tasks/artifacts/write-submit-result/write-submit-hr-promotion-saved.png
- Step 12: navigate -> passed
- Step 13: waitBodyText -> passed
- Step 0: clickText -> passed
- Step 15: waitBodyText -> passed
- Step 0: clickText -> passed
- Step 17: waitBodyText -> passed
- Step 18: screenshot -> passed
  File: tasks/artifacts/write-submit-result/write-submit-hr-meeting-checkin-result.png

### manager-write-submit-restricted
- Username: manager_rd
- Route: /performance/pending
- Status: PASSED
- Step 1: waitBodyText -> passed
- Step 0: clickText -> passed
- Step 3: waitBodyText -> passed
- Step 4: assertVisibleText -> passed
- Step 5: screenshot -> passed
  File: tasks/artifacts/write-submit-result/write-submit-manager-restricted.png

### employee-write-submit-no-entry
- Username: employee_platform
- Route: /performance/promotion
- Status: PASSED
- Step 1: assertBodyText -> passed
- Step 2: screenshot -> passed
  File: tasks/artifacts/write-submit-result/write-submit-employee-promotion-404.png
