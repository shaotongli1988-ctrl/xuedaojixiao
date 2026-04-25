# GUI Check Report

- Name: detail-dialog-coverage-gui
- Description: 详情弹窗与抽屉最小 GUI 点测
- Generated At: 2026-04-18T16:59:38.032Z
- UI Base URL: http://127.0.0.1:9007
- API Base URL: http://127.0.0.1:8006
- Chrome Debug URL: http://127.0.0.1:9222
- PASS: 3
- FAIL: 0
- Conclusion: PASSED

## Scenarios

### hr-detail-dialogs
- Username: hr_admin
- Route: /performance/initiated
- Status: PASSED
- Step 1: waitBodyText -> passed
- Step 0: clickText -> passed
- Step 3: waitBodyText -> passed
- Step 4: screenshot -> passed
  File: tasks/artifacts/detail-dialog-coverage/detail-dialog-hr-assessment.png
- Step 5: navigate -> passed
- Step 6: waitBodyText -> passed
- Step 0: clickText -> passed
- Step 8: waitBodyText -> passed
- Step 9: screenshot -> passed
  File: tasks/artifacts/detail-dialog-coverage/detail-dialog-hr-talentAsset.png
- Step 10: navigate -> passed
- Step 11: waitBodyText -> passed
- Step 0: clickText -> passed
- Step 13: waitBodyText -> passed
- Step 14: screenshot -> passed
  File: tasks/artifacts/detail-dialog-coverage/detail-dialog-hr-course.png
- Step 15: navigate -> passed
- Step 16: waitBodyText -> passed
- Step 0: clickText -> passed
- Step 18: waitBodyText -> passed
- Step 19: screenshot -> passed
  File: tasks/artifacts/detail-dialog-coverage/detail-dialog-hr-meeting.png

### manager-detail-dialogs
- Username: manager_rd
- Route: /performance/resumePool
- Status: PASSED
- Step 1: waitBodyText -> passed
- Step 0: clickText -> passed
- Step 3: waitBodyText -> passed
- Step 4: screenshot -> passed
  File: tasks/artifacts/detail-dialog-coverage/detail-dialog-manager-resume.png
- Step 5: navigate -> passed
- Step 6: waitBodyText -> passed
- Step 0: clickText -> passed
- Step 8: waitBodyText -> passed
- Step 9: screenshot -> passed
  File: tasks/artifacts/detail-dialog-coverage/detail-dialog-manager-capability.png
- Step 10: navigate -> passed
- Step 11: waitBodyText -> passed
- Step 0: clickText -> passed
- Step 13: waitBodyText -> passed
- Step 14: screenshot -> passed
  File: tasks/artifacts/detail-dialog-coverage/detail-dialog-manager-supplier.png

### employee-detail-dialogs
- Username: employee_platform
- Route: /performance/my-assessment
- Status: PASSED
- Step 1: waitBodyText -> passed
- Step 0: clickText -> passed
- Step 3: waitBodyText -> passed
- Step 4: screenshot -> passed
  File: tasks/artifacts/detail-dialog-coverage/detail-dialog-employee-assessment.png
- Step 5: navigate -> passed
- Step 6: assertBodyText -> passed
- Step 7: screenshot -> passed
  File: tasks/artifacts/detail-dialog-coverage/detail-dialog-employee-salary-404.png
