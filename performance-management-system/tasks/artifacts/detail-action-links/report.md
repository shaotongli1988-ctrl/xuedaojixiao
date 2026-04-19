# GUI Check Report

- Name: detail-action-links-gui
- Description: 详情内动作入口最小 GUI 点测
- Generated At: 2026-04-18T17:08:43.676Z
- UI Base URL: http://127.0.0.1:9007
- API Base URL: http://127.0.0.1:8006
- Chrome Debug URL: http://127.0.0.1:9222
- PASS: 3
- FAIL: 0
- Conclusion: PASSED

## Scenarios

### hr-detail-actions
- Username: hr_admin
- Route: /performance/initiated
- Status: PASSED
- Step 1: waitBodyText -> passed
- Step 0: clickText -> passed
- Step 3: waitBodyText -> passed
- Step 4: screenshot -> passed
  File: tasks/artifacts/detail-action-links/detail-action-hr-assessment-actions.png
- Step 0: clickText -> passed
- Step 6: waitBodyText -> passed
- Step 7: screenshot -> passed
  File: tasks/artifacts/detail-action-links/detail-action-hr-feedback-create.png
- Step 8: navigate -> passed
- Step 9: waitBodyText -> passed
- Step 0: clickText -> passed
- Step 11: waitBodyText -> passed
- Step 0: clickText -> passed
- Step 13: waitBodyText -> passed
- Step 14: screenshot -> passed
  File: tasks/artifacts/detail-action-links/detail-action-hr-pip-create.png
- Step 15: navigate -> passed
- Step 16: waitBodyText -> passed
- Step 0: clickText -> passed
- Step 18: waitBodyText -> passed
- Step 0: clickText -> passed
- Step 20: waitBodyText -> passed
- Step 21: screenshot -> passed
  File: tasks/artifacts/detail-action-links/detail-action-hr-promotion-create.png
- Step 22: navigate -> passed
- Step 23: waitBodyText -> passed
- Step 0: clickText -> passed
- Step 25: waitBodyText -> passed
- Step 26: screenshot -> passed
  File: tasks/artifacts/detail-action-links/detail-action-hr-meeting-checkin-confirm.png

### manager-detail-actions-restricted
- Username: manager_rd
- Route: /performance/pending
- Status: PASSED
- Step 1: waitBodyText -> passed
- Step 0: clickText -> passed
- Step 3: waitBodyText -> passed
- Step 4: assertVisibleText -> passed
- Step 5: screenshot -> passed
  File: tasks/artifacts/detail-action-links/detail-action-manager-assessment-restricted.png

### employee-detail-actions-no-entry
- Username: employee_platform
- Route: /performance/my-assessment
- Status: PASSED
- Step 1: waitBodyText -> passed
- Step 0: clickText -> passed
- Step 3: waitBodyText -> passed
- Step 4: assertVisibleText -> passed
- Step 5: screenshot -> passed
  File: tasks/artifacts/detail-action-links/detail-action-employee-assessment-restricted.png
- Step 6: navigate -> passed
- Step 7: assertBodyText -> passed
- Step 8: screenshot -> passed
  File: tasks/artifacts/detail-action-links/detail-action-employee-pip-404.png
