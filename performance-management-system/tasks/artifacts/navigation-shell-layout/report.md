# GUI Check Report

- Name: navigation-shell-layout-gui
- Description: 导航栏与侧栏改造最小 GUI 点测
- Generated At: 2026-04-19T12:46:08.882Z
- UI Base URL: http://127.0.0.1:9007
- API Base URL: http://127.0.0.1:19136
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
- Step 9: navigate -> passed
- Step 10: waitBodyText -> passed
- Step 11: assertVisibleText -> passed
- Step 0: clickText -> passed
- Step 13: waitBodyText -> passed
- Step 14: screenshot -> passed
  File: tasks/artifacts/navigation-shell-layout/nav-shell-hr-training.png
- Step 15: navigate -> passed
- Step 16: waitBodyText -> passed
- Step 17: assertVisibleText -> passed
- Step 18: screenshot -> passed
  File: tasks/artifacts/navigation-shell-layout/nav-shell-hr-goal-plan-overview.png
- Step 19: navigate -> passed
- Step 20: waitBodyText -> passed
- Step 21: assertVisibleText -> passed
- Step 22: screenshot -> passed
  File: tasks/artifacts/navigation-shell-layout/nav-shell-hr-goal-plan-teacher-dashboard.png
- Step 23: navigate -> passed
- Step 24: waitBodyText -> passed
- Step 25: assertVisibleText -> passed
- Step 26: screenshot -> passed
  File: tasks/artifacts/navigation-shell-layout/nav-shell-hr-office-meeting.png
- Step 27: navigate -> passed
- Step 28: waitBodyText -> passed
- Step 29: assertVisibleText -> passed
- Step 30: screenshot -> passed
  File: tasks/artifacts/navigation-shell-layout/nav-shell-hr-procurement.png
- Step 0: clickText -> passed
- Step 32: waitBodyText -> passed
- Step 33: screenshot -> passed
  File: tasks/artifacts/navigation-shell-layout/nav-shell-hr-procurement-supplier.png
- Step 34: navigate -> passed
- Step 35: waitBodyText -> passed
- Step 36: assertVisibleText -> passed
- Step 37: screenshot -> passed
  File: tasks/artifacts/navigation-shell-layout/nav-shell-hr-procurement-asset-dashboard.png

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
- Step 10: waitBodyText -> passed
- Step 11: assertVisibleText -> passed
- Step 12: screenshot -> passed
  File: tasks/artifacts/navigation-shell-layout/nav-shell-manager-goal-plan.png
- Step 13: navigate -> passed
- Step 14: assertBodyText -> passed
- Step 15: screenshot -> passed
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
- Step 5: navigate -> passed
- Step 6: waitBodyText -> passed
- Step 7: assertVisibleText -> passed
- Step 8: screenshot -> passed
  File: tasks/artifacts/navigation-shell-layout/nav-shell-employee-goals.png
- Step 9: navigate -> passed
- Step 10: waitBodyText -> passed
- Step 11: assertVisibleText -> passed
- Step 12: screenshot -> passed
  File: tasks/artifacts/navigation-shell-layout/nav-shell-employee-learning.png
- Step 13: navigate -> passed
- Step 14: assertBodyText -> passed
- Step 15: screenshot -> passed
  File: tasks/artifacts/navigation-shell-layout/nav-shell-employee-dashboard-404.png
