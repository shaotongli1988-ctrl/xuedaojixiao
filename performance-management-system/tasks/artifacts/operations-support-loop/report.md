# GUI Check Report

- Name: operations-support-loop-gui
- Description: 会议/合同/采购闭环最小 GUI 点测
- Generated At: 2026-04-20T02:32:02.472Z
- UI Base URL: http://127.0.0.1:9007
- API Base URL: http://127.0.0.1:8006
- Chrome Debug URL: http://127.0.0.1:9222
- PASS: 0
- FAIL: 3
- Conclusion: FAILED

## Scenarios

### hr-operations-support-loop
- Username: hr_admin
- Route: /performance/meeting
- Status: FAILED
- Error: waitUntil timeout: (() => {
		const text = document.body?.innerText || "";
		return ["采购订单管理","新增采购订单"].every(item => text.includes(item))
			&& [].every(item => !text.includes(item));
	})()
- Step 1: waitBodyText -> passed
- Step 2: screenshot -> passed
  File: tasks/artifacts/operations-support-loop/operations-loop-hr-meeting.png
- Step 3: navigate -> passed
- Step 4: waitBodyText -> passed
- Step 5: screenshot -> passed
  File: tasks/artifacts/operations-support-loop/operations-loop-hr-contract.png
- Step 6: navigate -> passed
- Step 7: waitBodyText -> failed
  Error: waitUntil timeout: (() => {
		const text = document.body?.innerText || "";
		return ["采购订单管理","新增采购订单"].every(item => text.includes(item))
			&& [].every(item => !text.includes(item));
	})()

### manager-operations-support-loop
- Username: manager_rd
- Route: /performance/meeting
- Status: FAILED
- Error: waitUntil timeout: (() => {
		const text = document.body?.innerText || "";
		return ["采购订单管理","经理范围维护"].every(item => text.includes(item))
			&& [].every(item => !text.includes(item));
	})()
- Step 1: waitBodyText -> passed
- Step 2: screenshot -> passed
  File: tasks/artifacts/operations-support-loop/operations-loop-manager-meeting.png
- Step 3: navigate -> passed
- Step 4: waitBodyText -> failed
  Error: waitUntil timeout: (() => {
		const text = document.body?.innerText || "";
		return ["采购订单管理","经理范围维护"].every(item => text.includes(item))
			&& [].every(item => !text.includes(item));
	})()

### employee-operations-no-entry
- Username: employee_platform
- Route: /
- Status: FAILED
- Error: assertVisibleText failed: includes=["我的考核"] excludes=["会议管理","合同管理","采购订单管理","供应商管理"]
- Step 1: waitBodyText -> passed
- Step 2: assertVisibleText -> failed
  Error: assertVisibleText failed: includes=["我的考核"] excludes=["会议管理","合同管理","采购订单管理","供应商管理"]
