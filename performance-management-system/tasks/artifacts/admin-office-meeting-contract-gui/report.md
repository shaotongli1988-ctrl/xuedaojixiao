# GUI Check Report

- Name: admin-office-meeting-contract-gui
- Description: 行政协同口径下会议管理与合同管理最小 GUI 点测
- Generated At: 2026-04-20T02:30:22.313Z
- UI Base URL: http://127.0.0.1:9007
- API Base URL: http://127.0.0.1:8006
- Chrome Debug URL: http://127.0.0.1:9222
- PASS: 0
- FAIL: 2
- Conclusion: FAILED

## Scenarios

### manager-office-meeting-contract-boundary
- Username: manager_rd
- Route: /performance/meeting
- Status: FAILED
- Error: waitUntil timeout: (() => {
		const text = document.body?.innerText || "";
		return ["当前账号没有该页面权限"].every(item => text.includes(item))
			&& [].every(item => !text.includes(item));
	})()
- Step 1: waitBodyText -> passed
- Step 2: assertVisibleText -> passed
- Step 3: screenshot -> passed
  File: tasks/artifacts/admin-office-meeting-contract-gui/admin-office-meeting-manager-list.png
- Step 4: navigate -> passed
- Step 5: screenshot -> passed
  File: tasks/artifacts/admin-office-meeting-contract-gui/admin-office-contract-manager-diagnose.png
- Step 6: waitBodyText -> failed
  Error: waitUntil timeout: (() => {
		const text = document.body?.innerText || "";
		return ["当前账号没有该页面权限"].every(item => text.includes(item))
			&& [].every(item => !text.includes(item));
	})()

### employee-office-meeting-contract-denied
- Username: employee_platform
- Route: /performance/meeting
- Status: FAILED
- Error: waitUntil timeout: (() => {
		const text = document.body?.innerText || "";
		return ["当前账号没有该页面权限"].every(item => text.includes(item))
			&& [].every(item => !text.includes(item));
	})()
- Step 1: screenshot -> passed
  File: tasks/artifacts/admin-office-meeting-contract-gui/admin-office-meeting-employee-diagnose.png
- Step 2: waitBodyText -> failed
  Error: waitUntil timeout: (() => {
		const text = document.body?.innerText || "";
		return ["当前账号没有该页面权限"].every(item => text.includes(item))
			&& [].every(item => !text.includes(item));
	})()
