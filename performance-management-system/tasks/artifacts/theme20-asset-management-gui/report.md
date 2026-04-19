# GUI Check Report

- Name: theme20-asset-management-gui
- Description: Theme20 资产管理全生命周期最小 GUI 点测
- Generated At: 2026-04-19T04:07:54.083Z
- UI Base URL: http://127.0.0.1:9011
- API Base URL: http://127.0.0.1:8064
- Chrome Debug URL: http://127.0.0.1:9222
- PASS: 1
- FAIL: 2
- Conclusion: FAILED

## Scenarios

### hr-asset-full-lifecycle
- Username: hr_admin
- Route: /performance/asset/dashboard
- Status: FAILED
- Error: waitUntil timeout: (() => {
		const text = document.body?.innerText || "";
		return ["资产台账","新建资产"].every(item => text.includes(item))
			&& [].every(item => !text.includes(item));
	})()
- Step 1: waitBodyText -> passed
- Step 2: screenshot -> passed
  File: tasks/artifacts/theme20-asset-management-gui/theme20-asset-hr-dashboard.png
- Step 3: navigate -> passed
- Step 4: waitBodyText -> failed
  Error: waitUntil timeout: (() => {
		const text = document.body?.innerText || "";
		return ["资产台账","新建资产"].every(item => text.includes(item))
			&& [].every(item => !text.includes(item));
	})()

### manager-asset-permission-scope
- Username: manager_rd
- Route: /performance/asset/dashboard
- Status: FAILED
- Error: waitUntil timeout: (() => {
		const text = document.body?.innerText || "";
		return ["资产报表","报表汇总"].every(item => text.includes(item))
			&& [].every(item => !text.includes(item));
	})()
- Step 1: waitBodyText -> passed
- Step 2: screenshot -> passed
  File: tasks/artifacts/theme20-asset-management-gui/theme20-asset-manager-dashboard.png
- Step 3: navigate -> passed
- Step 4: waitBodyText -> failed
  Error: waitUntil timeout: (() => {
		const text = document.body?.innerText || "";
		return ["资产报表","报表汇总"].every(item => text.includes(item))
			&& [].every(item => !text.includes(item));
	})()

### employee-asset-no-entry
- Username: employee_platform
- Route: /performance/my-assessment
- Status: PASSED
- Step 1: waitBodyText -> passed
- Step 2: assertVisibleText -> passed
- Step 3: screenshot -> passed
  File: tasks/artifacts/theme20-asset-management-gui/theme20-asset-employee-no-entry.png
