# GUI Check Report

- Name: recruit-mainline-loop-gui
- Description: 招聘闭环最小 GUI 点测
- Generated At: 2026-04-18T16:42:39.560Z
- UI Base URL: http://127.0.0.1:9007
- API Base URL: http://127.0.0.1:8006
- Chrome Debug URL: http://127.0.0.1:9222
- PASS: 3
- FAIL: 0
- Conclusion: PASSED

## Scenarios

### hr-recruit-loop
- Username: hr_admin
- Route: /performance/talentAsset
- Status: PASSED
- Step 1: waitBodyText -> passed
- Step 2: screenshot -> passed
  File: tasks/artifacts/recruit-mainline-loop/recruit-loop-hr-talent.png
- Step 3: navigate -> passed
- Step 4: waitBodyText -> passed
- Step 5: screenshot -> passed
  File: tasks/artifacts/recruit-mainline-loop/recruit-loop-hr-resume.png
- Step 6: navigate -> passed
- Step 7: waitBodyText -> passed
- Step 8: screenshot -> passed
  File: tasks/artifacts/recruit-mainline-loop/recruit-loop-hr-interview.png

### manager-recruit-loop
- Username: manager_rd
- Route: /performance/resumePool
- Status: PASSED
- Step 1: waitBodyText -> passed
- Step 2: assertVisibleText -> passed
- Step 3: screenshot -> passed
  File: tasks/artifacts/recruit-mainline-loop/recruit-loop-manager-resume.png
- Step 4: navigate -> passed
- Step 5: waitBodyText -> passed
- Step 6: screenshot -> passed
  File: tasks/artifacts/recruit-mainline-loop/recruit-loop-manager-interview.png

### employee-recruit-no-entry
- Username: employee_platform
- Route: /
- Status: PASSED
- Step 1: waitBodyText -> passed
- Step 2: assertVisibleText -> passed
- Step 3: screenshot -> passed
  File: tasks/artifacts/recruit-mainline-loop/recruit-loop-employee-no-entry.png
