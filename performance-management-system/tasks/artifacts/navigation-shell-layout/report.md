# GUI Check Report

- Name: navigation-shell-layout-gui
- Description: 导航栏与侧栏改造最小 GUI 点测
- Generated At: 2026-04-18T16:21:47.203Z
- UI Base URL: http://127.0.0.1:9007
- API Base URL: http://127.0.0.1:8006
- Chrome Debug URL: http://127.0.0.1:9222
- PASS: 3
- FAIL: 0
- Conclusion: PASSED

## Scenarios

### hr-navigation-shell
- Username: hr_admin
- Route: /data-center/dashboard
- Status: PASSED
- Step 1: screenshot -> passed
  File: tasks/artifacts/navigation-shell-layout/nav-shell-hr-initial.png
- Step 2: waitBodyText -> passed
- Step 3: assertVisibleText -> passed
- Step 4: screenshot -> passed
  File: tasks/artifacts/navigation-shell-layout/nav-shell-hr-dashboard.png
- Step 5: navigate -> passed
- Step 6: waitBodyText -> passed
- Step 7: assertVisibleText -> passed
- Step 8: screenshot -> passed
  File: tasks/artifacts/navigation-shell-layout/nav-shell-hr-recruit-talent.png
- Step 0: clickText -> passed
- Step 10: waitBodyText -> passed
- Step 11: assertVisibleText -> passed
- Step 12: screenshot -> passed
  File: tasks/artifacts/navigation-shell-layout/nav-shell-hr-recruit-resume.png
- Step 0: clickText -> passed
- Step 14: waitBodyText -> passed
- Step 15: screenshot -> passed
  File: tasks/artifacts/navigation-shell-layout/nav-shell-hr-recruit-interview.png
- Step 16: navigate -> passed
- Step 17: waitBodyText -> passed
- Step 18: assertVisibleText -> passed
- Step 0: clickText -> passed
- Step 20: waitBodyText -> passed
- Step 21: screenshot -> passed
  File: tasks/artifacts/navigation-shell-layout/nav-shell-hr-training.png
- Step 22: navigate -> passed
- Step 23: waitBodyText -> passed
- Step 24: assertVisibleText -> passed
- Step 25: screenshot -> passed
  File: tasks/artifacts/navigation-shell-layout/nav-shell-hr-meeting.png
- Step 26: navigate -> passed
- Step 27: waitBodyText -> passed
- Step 28: assertVisibleText -> passed
- Step 29: screenshot -> passed
  File: tasks/artifacts/navigation-shell-layout/nav-shell-hr-contract.png
- Step 30: navigate -> passed
- Step 31: waitBodyText -> passed
- Step 32: assertVisibleText -> passed
- Step 33: screenshot -> passed
  File: tasks/artifacts/navigation-shell-layout/nav-shell-hr-procurement.png
- Step 0: clickText -> passed
- Step 35: waitBodyText -> passed
- Step 36: screenshot -> passed
  File: tasks/artifacts/navigation-shell-layout/nav-shell-hr-procurement-supplier.png

### manager-navigation-shell
- Username: manager_rd
- Route: /performance/course
- Status: PASSED
- Step 1: screenshot -> passed
  File: tasks/artifacts/navigation-shell-layout/nav-shell-manager-initial.png
- Step 2: waitBodyText -> passed
- Step 3: assertVisibleText -> passed
- Step 4: screenshot -> passed
  File: tasks/artifacts/navigation-shell-layout/nav-shell-manager-course.png
- Step 0: clickText -> passed
- Step 6: waitBodyText -> passed
- Step 7: assertVisibleText -> passed
- Step 8: screenshot -> passed
  File: tasks/artifacts/navigation-shell-layout/nav-shell-manager-capability.png
- Step 9: navigate -> passed
- Step 10: assertBodyText -> passed
- Step 11: screenshot -> passed
  File: tasks/artifacts/navigation-shell-layout/nav-shell-manager-salary-404.png

### employee-navigation-shell
- Username: employee_platform
- Route: /performance/my-assessment
- Status: PASSED
- Step 1: screenshot -> passed
  File: tasks/artifacts/navigation-shell-layout/nav-shell-employee-initial.png
- Step 2: waitBodyText -> passed
- Step 3: assertVisibleText -> passed
- Step 4: screenshot -> passed
  File: tasks/artifacts/navigation-shell-layout/nav-shell-employee-assessment.png
- Step 0: clickText -> passed
- Step 6: waitBodyText -> passed
- Step 7: screenshot -> passed
  File: tasks/artifacts/navigation-shell-layout/nav-shell-employee-goals.png
- Step 8: navigate -> passed
- Step 9: waitBodyText -> passed
- Step 10: assertVisibleText -> passed
- Step 11: screenshot -> passed
  File: tasks/artifacts/navigation-shell-layout/nav-shell-employee-learning.png
- Step 12: navigate -> passed
- Step 13: assertBodyText -> passed
- Step 14: screenshot -> passed
  File: tasks/artifacts/navigation-shell-layout/nav-shell-employee-dashboard-404.png
