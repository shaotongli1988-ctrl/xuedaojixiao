# GUI Check Report

- Name: theme21-office-knowledge-gui
- Description: Theme21 文件管理与知识库最小 GUI 点测
- Generated At: 2026-04-20T02:05:54.102Z
- UI Base URL: http://127.0.0.1:9007
- API Base URL: http://127.0.0.1:8006
- Chrome Debug URL: http://127.0.0.1:9222
- PASS: 4
- FAIL: 0
- Conclusion: PASSED

## Scenarios

### hr-document-center-mainline
- Username: hr_admin
- Route: /performance/office/document-center
- Status: PASSED
- Step 1: screenshot -> passed
  File: tasks/artifacts/theme21-office-knowledge-gui/theme21-document-center-hr-diagnose.png
- Step 2: waitBodyText -> passed
- Step 3: assertVisibleText -> passed
- Step 4: screenshot -> passed
  File: tasks/artifacts/theme21-office-knowledge-gui/theme21-document-center-hr-list.png
- Step 0: clickText -> passed
- Step 6: waitBodyText -> passed
- Step 7: screenshot -> passed
  File: tasks/artifacts/theme21-office-knowledge-gui/theme21-document-center-hr-detail.png

### hr-knowledge-base-mainline
- Username: hr_admin
- Route: /performance/office/knowledge-base
- Status: PASSED
- Step 1: screenshot -> passed
  File: tasks/artifacts/theme21-office-knowledge-gui/theme21-knowledge-base-hr-diagnose.png
- Step 2: waitBodyText -> passed
- Step 3: assertVisibleText -> passed
- Step 4: screenshot -> passed
  File: tasks/artifacts/theme21-office-knowledge-gui/theme21-knowledge-base-hr-list.png
- Step 1: clickSelector -> passed
- Step 6: waitBodyText -> passed
- Step 7: screenshot -> passed
  File: tasks/artifacts/theme21-office-knowledge-gui/theme21-knowledge-base-hr-graph.png
- Step 2: clickSelector -> passed
- Step 9: waitBodyText -> passed
- Step 0: clickText -> passed
- Step 11: waitBodyText -> passed
- Step 12: screenshot -> passed
  File: tasks/artifacts/theme21-office-knowledge-gui/theme21-knowledge-base-hr-search-qa.png

### manager-office-no-entry
- Username: manager_rd
- Route: /performance/my-assessment
- Status: PASSED
- Step 1: waitBodyText -> passed
- Step 2: assertVisibleText -> passed
- Step 3: screenshot -> passed
  File: tasks/artifacts/theme21-office-knowledge-gui/theme21-office-manager-no-entry.png

### employee-office-no-entry
- Username: employee_platform
- Route: /performance/my-assessment
- Status: PASSED
- Step 1: waitBodyText -> passed
- Step 2: assertVisibleText -> passed
- Step 3: screenshot -> passed
  File: tasks/artifacts/theme21-office-knowledge-gui/theme21-office-employee-no-entry.png
