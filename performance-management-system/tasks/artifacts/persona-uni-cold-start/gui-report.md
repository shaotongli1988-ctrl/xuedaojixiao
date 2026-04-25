# GUI Check Report

- Name: cool-uni-persona-gui
- Description: cool-uni H5 同账号读取数据库 persona 的最小 GUI 留痕
- Generated At: 2026-04-23T02:44:10.939Z
- UI Base URL: http://127.0.0.1:9943/#
- API Base URL: http://127.0.0.1:8001
- Chrome Debug URL: http://127.0.0.1:9222
- PASS: 1
- FAIL: 0
- Conclusion: PASSED

## Scenarios

### hr-admin-uni-home-performance-operator
- Username: hr_admin
- Route: /pages/index/home
- Status: PASSED
- Step 1: waitBodyText -> passed
- Step 2: assertBodyText -> passed
- Step 3: assertVisibleText -> passed
- Step 4: screenshot -> passed
  File: tasks/artifacts/persona-uni-cold-start/cool-uni-hr-home-performance-operator.png
