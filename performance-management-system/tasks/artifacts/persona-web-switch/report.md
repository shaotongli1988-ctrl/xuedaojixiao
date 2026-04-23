# GUI Check Report

- Name: persona-web-switch
- Description: Web 工作台切换绩效运营视角
- Generated At: 2026-04-23T01:14:16.633Z
- UI Base URL: http://127.0.0.1:9011
- API Base URL: http://127.0.0.1:8001
- Chrome Debug URL: http://127.0.0.1:9222
- PASS: 1
- FAIL: 0
- Conclusion: PASSED

## Scenarios

### hr-admin-switch-performance-operator
- Username: hr_admin
- Route: /performance/workbench
- Status: PASSED
- Step 1: waitBodyText -> passed
- Step 2: screenshot -> passed
  File: tasks/artifacts/persona-web-switch/01-before-switch.png
- Step 0: clickSelector -> passed
- Step 1: clickSelector -> passed
- Step 5: screenshot -> passed
  File: tasks/artifacts/persona-web-switch/02-after-switch.png
- Step 6: assertVisibleText -> passed
