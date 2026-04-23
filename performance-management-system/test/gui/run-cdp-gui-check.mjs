/**
 * 文件职责：执行基于 Chrome DevTools Protocol 的最小 GUI 点测并输出截图、report.json、report.md。
 * 不负责启动前后端实例、修改业务数据、处理登录页验证码输入交互或替代 smoke。
 * 维护重点：场景配置必须保持声明式，避免不同主题继续复制粘贴一整段浏览器脚本。
 */

import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import process from "node:process";
import crypto from "node:crypto";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, "../..");
const workspaceRoot = path.resolve(projectRoot, "..");
const midwayRoot = path.join(workspaceRoot, "cool-admin-midway");
const defaultChromeDebugUrl = "http://127.0.0.1:9222";
const defaultPassword = "123456";
const successCode = 1000;

function parseArgs(argv) {
	const options = {
		configPath: "",
		outputDir: "",
		chromeDebugUrl: defaultChromeDebugUrl,
		uiBaseUrl: "",
		loginRoute: "",
		apiBaseUrl: "",
		password: defaultPassword,
		scenarioNames: []
	};

	for (let index = 0; index < argv.length; index += 1) {
		const current = argv[index];
		const next = argv[index + 1];

		if ((current === "--config" || current === "-c") && next) {
			options.configPath = next;
			index += 1;
			continue;
		}

		if ((current === "--output-dir" || current === "-o") && next) {
			options.outputDir = next;
			index += 1;
			continue;
		}

		if (current === "--chrome-debug-url" && next) {
			options.chromeDebugUrl = next;
			index += 1;
			continue;
		}

		if (current === "--ui-base-url" && next) {
			options.uiBaseUrl = next;
			index += 1;
			continue;
		}

		if (current === "--login-route" && next) {
			options.loginRoute = next;
			index += 1;
			continue;
		}

		if (current === "--api-base-url" && next) {
			options.apiBaseUrl = next;
			index += 1;
			continue;
		}

		if (current === "--password" && next) {
			options.password = next;
			index += 1;
			continue;
		}

		if (current === "--scenario" && next) {
			options.scenarioNames.push(next);
			index += 1;
			continue;
		}

		if (current === "--help" || current === "-h") {
			printHelp();
			process.exit(0);
		}
	}

	if (!options.configPath) {
		throw new Error("Missing required --config <path>");
	}

	return options;
}

function printHelp() {
	console.log(`Usage: node test/gui/run-cdp-gui-check.mjs --config <path> [options]

Options:
  --config, -c           Path to scenario JSON config
  --output-dir, -o       Override output directory
  --chrome-debug-url     Override Chrome remote debug base URL (default: ${defaultChromeDebugUrl})
  --ui-base-url          Override UI base URL
  --login-route          Override login route (default: /login)
  --api-base-url         Override API base URL
  --password             Override login password (default: ${defaultPassword})
  --scenario             Run only one named scenario; repeatable
  --help, -h             Show this help
`);
}

function readJson(filePath) {
	return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function resolveConfigPath(filePath) {
	return path.isAbsolute(filePath) ? filePath : path.resolve(process.cwd(), filePath);
}

function resolveDefaultCacheDir() {
	const candidates = [
		path.join(midwayRoot, "dist/config/config.default.js"),
		path.join(midwayRoot, "src/config/config.default.ts")
	];

	for (const candidate of candidates) {
		if (!fs.existsSync(candidate)) {
			continue;
		}

		const content = fs.readFileSync(candidate, "utf8");
		const matched = content.match(/keys:\s*['"`]([^'"`]+)['"`]/);
		if (matched?.[1]) {
			return path.join(os.homedir(), ".cool-admin", md5(matched[1]), "cache");
		}
	}

	throw new Error("Unable to resolve cool-admin cache directory from cool-admin-midway config.default");
}

function md5(value) {
	return crypto.createHash("md5").update(String(value)).digest("hex");
}

async function requestJson(url, init) {
	const response = await fetch(url, init);
	const body = await response.json();
	return { status: response.status, body };
}

async function readCaptchaValue(cacheDir, captchaId) {
	const key = `verify:img:${captchaId}`;
	for (const file of fs.readdirSync(cacheDir).filter(name => name.endsWith(".json"))) {
		const fullPath = path.join(cacheDir, file);

		try {
			const raw = JSON.parse(fs.readFileSync(fullPath, "utf8"));
			if (raw?.key !== key) {
				continue;
			}

			if (typeof raw.val === "string") {
				return raw.val;
			}

			if (typeof raw.value === "string") {
				return raw.value;
			}

			if (typeof raw.val?.value === "string") {
				return raw.val.value;
			}
		} catch {
			continue;
		}
	}

	throw new Error(`Captcha cache value not found for ${captchaId} under ${cacheDir}`);
}

async function loginWithCaptcha({ apiBaseUrl, username, password, cacheDir }) {
	const captchaResponse = await requestJson(`${apiBaseUrl}/admin/base/open/captcha`);
	if (captchaResponse.body?.code !== successCode) {
		throw new Error(`captcha failed for ${username}: ${JSON.stringify(captchaResponse.body)}`);
	}

	const captchaId = captchaResponse.body?.data?.captchaId;
	if (!captchaId) {
		throw new Error(`captchaId missing for ${username}`);
	}

	const verifyCode = await readCaptchaValue(cacheDir, captchaId);
	const loginResponse = await requestJson(`${apiBaseUrl}/admin/base/open/login`, {
		method: "POST",
		headers: {
			"Content-Type": "application/json"
		},
		body: JSON.stringify({
			username,
			password,
			captchaId,
			verifyCode
		})
	});

	if (loginResponse.body?.code !== successCode) {
		throw new Error(`login failed for ${username}: ${JSON.stringify(loginResponse.body)}`);
	}

	return loginResponse.body.data;
}

async function createTarget(chromeDebugUrl, url) {
	const response = await fetch(`${chromeDebugUrl}/json/new?${encodeURIComponent(url)}`, {
		method: "PUT"
	});

	if (!response.ok) {
		throw new Error(`createTarget failed: ${response.status} ${response.statusText}`);
	}

	return response.json();
}

function createSession(webSocketDebuggerUrl) {
	const ws = new WebSocket(webSocketDebuggerUrl);
	let currentId = 0;
	const pending = new Map();
	const events = [];

	ws.onmessage = event => {
		const message = JSON.parse(event.data);
		if (message.id) {
			const deferred = pending.get(message.id);
			if (!deferred) {
				return;
			}

			pending.delete(message.id);
			if (message.error) {
				deferred.reject(new Error(JSON.stringify(message.error)));
			} else {
				deferred.resolve(message.result);
			}
			return;
		}

		events.push(message);
	};

	return {
		events,
		ws,
		async open() {
			await new Promise(resolve => {
				ws.onopen = resolve;
			});
		},
		async send(method, params = {}) {
			const id = ++currentId;
			ws.send(JSON.stringify({ id, method, params }));
			return new Promise((resolve, reject) => {
				pending.set(id, { resolve, reject });
			});
		},
		close() {
			ws.close();
		}
	};
}

async function evaluateValue(session, expression) {
	const result = await session.send("Runtime.evaluate", {
		expression,
		returnByValue: true
	});
	return result.result?.value;
}

async function waitUntil(session, expression, timeoutMs = 10000, intervalMs = 300) {
	const startedAt = Date.now();

	while (Date.now() - startedAt < timeoutMs) {
		const value = await evaluateValue(session, expression);
		if (value) {
			return value;
		}
		await sleep(intervalMs);
	}

	throw new Error(`waitUntil timeout: ${expression}`);
}

function sleep(ms) {
	return new Promise(resolve => {
		setTimeout(resolve, ms);
	});
}

function normalizeUrl(baseUrl, route) {
	if (/^https?:\/\//.test(route)) {
		return route;
	}

	return `${String(baseUrl).replace(/\/+$/, "")}${route.startsWith("/") ? route : `/${route}`}`;
}

function buildBodyTextExpression({ includes = [], excludes = [] }) {
	return `(() => {
		const text = document.body?.innerText || "";
		return ${JSON.stringify(includes)}.every(item => text.includes(item))
			&& ${JSON.stringify(excludes)}.every(item => !text.includes(item));
	})()`;
}

function buildVisibleExactTextExpression({ includes = [], excludes = [] }) {
	return `(() => {
		const texts = Array.from(document.querySelectorAll("body *"))
			.filter(el => {
				const text = (el.innerText || "").trim();
				if (!text) return false;
				const style = window.getComputedStyle(el);
				const rect = el.getBoundingClientRect();
				return style.display !== "none" && style.visibility !== "hidden" && rect.width > 0 && rect.height > 0;
			})
			.map(el => (el.innerText || "").trim());
		return ${JSON.stringify(includes)}.every(item => texts.includes(item))
			&& ${JSON.stringify(excludes)}.every(item => !texts.includes(item));
	})()`;
}

function buildSelectorExpression({ selector, shouldExist = true }) {
	return `(() => {
		const elements = Array.from(document.querySelectorAll(${JSON.stringify(selector)})).filter(el => {
			const style = window.getComputedStyle(el);
			const rect = el.getBoundingClientRect();
			return style.display !== "none" && style.visibility !== "hidden" && rect.width > 0 && rect.height > 0;
		});
		return ${shouldExist ? "elements.length > 0" : "elements.length === 0"};
	})()`;
}

async function captureScreenshot(session, outputDir, fileName) {
	const { data } = await session.send("Page.captureScreenshot", {
		format: "png",
		fromSurface: true
	});
	const outputPath = path.join(outputDir, fileName);
	fs.mkdirSync(path.dirname(outputPath), { recursive: true });
	fs.writeFileSync(outputPath, Buffer.from(data, "base64"));
	return outputPath;
}

async function clickByText(session, { text, index = 0, rootSelector = "body" }) {
	const expression = `(() => {
		const root = document.querySelector(${JSON.stringify(rootSelector)}) || document.body;
		const matches = Array.from(root.querySelectorAll("button, a, [role='button'], .el-button, .el-menu-item, .el-dropdown-menu__item"))
			.filter(el => {
				const style = window.getComputedStyle(el);
				const rect = el.getBoundingClientRect();
				const content = (el.innerText || "").trim();
				return content === ${JSON.stringify(text)}
					&& style.display !== "none"
					&& style.visibility !== "hidden"
					&& rect.width > 0
					&& rect.height > 0;
			});
		const target = matches[${Number(index)}];
		if (!target) return false;
		target.click();
		return true;
	})()`;

	const result = await evaluateValue(session, expression);
	if (!result) {
		throw new Error(`clickByText failed: text=${text} index=${index} rootSelector=${rootSelector}`);
	}
}

async function clickBySelector(session, { selector, index = 0 }) {
	const expression = `(() => {
		const matches = Array.from(document.querySelectorAll(${JSON.stringify(selector)}))
			.filter(el => {
				const style = window.getComputedStyle(el);
				const rect = el.getBoundingClientRect();
				return style.display !== "none" && style.visibility !== "hidden" && rect.width > 0 && rect.height > 0;
			});
		const target = matches[${Number(index)}];
		if (!target) return false;
		target.click();
		return true;
	})()`;

	const result = await evaluateValue(session, expression);
	if (!result) {
		throw new Error(`clickBySelector failed: selector=${selector} index=${index}`);
	}
}

async function inputByLabel(session, { label, value, index = 0, rootSelector = "body" }) {
	const expression = `(() => {
		const root = document.querySelector(${JSON.stringify(rootSelector)}) || document.body;
		const normalize = text => String(text || "").replace(/[:：\\s]+$/g, "").trim();
		const formItems = Array.from(root.querySelectorAll(".el-form-item"));
		const matches = formItems.filter(item => {
			const labelEl = item.querySelector(".el-form-item__label");
			if (!labelEl) return false;
			return normalize(labelEl.innerText) === normalize(${JSON.stringify(label)});
		});
		const targetItem = matches[${Number(index)}];
		if (!targetItem) return false;

		const input = targetItem.querySelector("input, textarea");
		if (!input) return false;

		const nativeSetter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, "value")?.set
			|| Object.getOwnPropertyDescriptor(window.HTMLTextAreaElement.prototype, "value")?.set;
		if (nativeSetter) {
			nativeSetter.call(input, ${JSON.stringify(value)});
		} else {
			input.value = ${JSON.stringify(value)};
		}

		input.dispatchEvent(new Event("input", { bubbles: true }));
		input.dispatchEvent(new Event("change", { bubbles: true }));
		input.blur();
		return true;
	})()`;

	const result = await evaluateValue(session, expression);
	if (!result) {
		throw new Error(`inputByLabel failed: label=${label} index=${index} rootSelector=${rootSelector}`);
	}
}

async function prepareLoggedInSession(runConfig, scenario) {
	const target = await createTarget(
		runConfig.chromeDebugUrl,
		normalizeUrl(runConfig.uiBaseUrl, runConfig.loginRoute)
	);
	const session = createSession(target.webSocketDebuggerUrl);
	await session.open();
	await session.send("Page.enable");
	await session.send("Runtime.enable");
	await session.send("Log.enable");

	const viewport = runConfig.viewport || { width: 1440, height: 1100, deviceScaleFactor: 1, mobile: false };
	await session.send("Emulation.setDeviceMetricsOverride", viewport);
	await session.send("Page.navigate", {
		url: normalizeUrl(runConfig.uiBaseUrl, runConfig.loginRoute)
	});
	await sleep(1200);

	const loginData = await loginWithCaptcha({
		apiBaseUrl: runConfig.apiBaseUrl,
		username: scenario.username,
		password: runConfig.password,
		cacheDir: runConfig.cacheDir
	});

	const expireAt = Date.now() + Number(loginData.expire || 0) * 1000;
	const refreshExpireAt = Date.now() + Number(loginData.refreshExpire || 0) * 1000;

	await session.send("Runtime.evaluate", {
		expression: `localStorage.clear();
sessionStorage.clear();
localStorage.setItem('token', ${JSON.stringify(loginData.token)});
localStorage.setItem('token_deadtime', ${JSON.stringify(expireAt)});
localStorage.setItem('refreshToken', ${JSON.stringify(loginData.refreshToken)});
localStorage.setItem('refreshToken_deadtime', ${JSON.stringify(refreshExpireAt)});
localStorage.setItem('username', ${JSON.stringify(scenario.username)});
'ok';`,
		returnByValue: true
	});

	await session.send("Page.reload", { ignoreCache: true });
	await sleep(1800);

	return session;
}

async function runStep(session, runConfig, scenario, step, scenarioOutputDir) {
	switch (step.type) {
		case "navigate": {
			await session.send("Page.navigate", {
				url: normalizeUrl(runConfig.uiBaseUrl, step.route)
			});
			if (step.waitAfterMs) {
				await sleep(step.waitAfterMs);
			}
			return { type: step.type, route: step.route };
		}

		case "waitBodyText": {
			await waitUntil(
				session,
				buildBodyTextExpression({ includes: step.includes, excludes: step.excludes }),
				step.timeoutMs
			);
			return { type: step.type, includes: step.includes || [], excludes: step.excludes || [] };
		}

		case "waitSelector": {
			await waitUntil(
				session,
				buildSelectorExpression({ selector: step.selector, shouldExist: true }),
				step.timeoutMs
			);
			return { type: step.type, selector: step.selector };
		}

		case "clickText": {
			await clickByText(session, step);
			if (step.waitAfterMs) {
				await sleep(step.waitAfterMs);
			}
			return { type: step.type, text: step.text, index: step.index || 0 };
		}

		case "clickSelector": {
			await clickBySelector(session, step);
			if (step.waitAfterMs) {
				await sleep(step.waitAfterMs);
			}
			return { type: step.type, selector: step.selector, index: step.index || 0 };
		}

		case "inputByLabel": {
			await inputByLabel(session, step);
			if (step.waitAfterMs) {
				await sleep(step.waitAfterMs);
			}
			return { type: step.type, label: step.label, index: step.index || 0 };
		}

		case "screenshot": {
			const fileName = step.file || `${scenario.name}-${Date.now()}.png`;
			const savedPath = await captureScreenshot(session, scenarioOutputDir, fileName);
			return { type: step.type, file: path.relative(projectRoot, savedPath) };
		}

		case "assertBodyText": {
			const ok = await evaluateValue(
				session,
				buildBodyTextExpression({ includes: step.includes, excludes: step.excludes })
			);
			if (!ok) {
				throw new Error(`assertBodyText failed: includes=${JSON.stringify(step.includes || [])} excludes=${JSON.stringify(step.excludes || [])}`);
			}
			return { type: step.type, includes: step.includes || [], excludes: step.excludes || [] };
		}

		case "assertVisibleText": {
			const ok = await evaluateValue(
				session,
				buildVisibleExactTextExpression({ includes: step.includes, excludes: step.excludes })
			);
			if (!ok) {
				throw new Error(`assertVisibleText failed: includes=${JSON.stringify(step.includes || [])} excludes=${JSON.stringify(step.excludes || [])}`);
			}
			return { type: step.type, includes: step.includes || [], excludes: step.excludes || [] };
		}

		case "assertSelector": {
			const ok = await evaluateValue(
				session,
				buildSelectorExpression({ selector: step.selector, shouldExist: step.shouldExist !== false })
			);
			if (!ok) {
				throw new Error(`assertSelector failed: selector=${step.selector} shouldExist=${step.shouldExist !== false}`);
			}
			return { type: step.type, selector: step.selector, shouldExist: step.shouldExist !== false };
		}

		default:
			throw new Error(`Unsupported step type: ${step.type}`);
	}
}

function selectScenarios(allScenarios, scenarioNames) {
	if (!scenarioNames.length) {
		return allScenarios;
	}

	const selected = allScenarios.filter(item => scenarioNames.includes(item.name));
	if (!selected.length) {
		throw new Error(`No scenarios matched --scenario values: ${scenarioNames.join(", ")}`);
	}
	return selected;
}

function buildRunConfig(config, options) {
	const defaults = config.defaults || {};
	const outputDir = resolveConfigPath(
		options.outputDir || defaults.outputDir || path.join(projectRoot, "tasks/artifacts/gui-run")
	);

	return {
		name: config.meta?.name || path.basename(options.configPath, ".json"),
		description: config.meta?.description || "",
		uiBaseUrl: options.uiBaseUrl || defaults.uiBaseUrl,
		loginRoute: options.loginRoute || defaults.loginRoute || "/login",
		apiBaseUrl: options.apiBaseUrl || defaults.apiBaseUrl,
		chromeDebugUrl: options.chromeDebugUrl || defaults.chromeDebugUrl || defaultChromeDebugUrl,
		password: options.password || defaults.password || defaultPassword,
		cacheDir: defaults.cacheDir || resolveDefaultCacheDir(),
		outputDir,
		viewport: defaults.viewport || {
			width: 1440,
			height: 1100,
			deviceScaleFactor: 1,
			mobile: false
		}
	};
}

function ensureRequiredConfig(runConfig) {
	for (const key of ["uiBaseUrl", "loginRoute", "apiBaseUrl", "chromeDebugUrl", "password", "cacheDir"]) {
		if (!runConfig[key]) {
			throw new Error(`Missing required run config field: ${key}`);
		}
	}
}

async function writeReports(runConfig, report) {
	fs.mkdirSync(runConfig.outputDir, { recursive: true });

	const reportJsonPath = path.join(runConfig.outputDir, "report.json");
	fs.writeFileSync(reportJsonPath, JSON.stringify(report, null, 2));

	const lines = [
		`# GUI Check Report`,
		``,
		`- Name: ${report.name}`,
		`- Description: ${report.description || "-"}`,
		`- Generated At: ${report.generatedAt}`,
		`- UI Base URL: ${report.uiBaseUrl}`,
		`- API Base URL: ${report.apiBaseUrl}`,
		`- Chrome Debug URL: ${report.chromeDebugUrl}`,
		`- PASS: ${report.summary.pass}`,
		`- FAIL: ${report.summary.fail}`,
		`- Conclusion: ${report.summary.fail === 0 ? "PASSED" : "FAILED"}`,
		``,
		`## Scenarios`
	];

	for (const scenario of report.scenarios) {
		lines.push(``);
		lines.push(`### ${scenario.name}`);
		lines.push(`- Username: ${scenario.username}`);
		lines.push(`- Route: ${scenario.route}`);
		lines.push(`- Status: ${scenario.status.toUpperCase()}`);
		if (scenario.error) {
			lines.push(`- Error: ${scenario.error}`);
		}

		for (const step of scenario.steps) {
			lines.push(`- Step ${step.index}: ${step.type} -> ${step.status}`);
			if (step.file) {
				lines.push(`  File: ${step.file}`);
			}
			if (step.error) {
				lines.push(`  Error: ${step.error}`);
			}
		}
	}

	const reportMdPath = path.join(runConfig.outputDir, "report.md");
	fs.writeFileSync(reportMdPath, `${lines.join("\n")}\n`);
}

async function run() {
	const options = parseArgs(process.argv.slice(2));
	const configPath = resolveConfigPath(options.configPath);
	const config = readJson(configPath);
	const runConfig = buildRunConfig(config, options);
	ensureRequiredConfig(runConfig);

	const scenarios = selectScenarios(config.scenarios || [], options.scenarioNames);
	if (!scenarios.length) {
		throw new Error(`No scenarios found in ${configPath}`);
	}

	const report = {
		name: runConfig.name,
		description: runConfig.description,
		configPath,
		outputDir: runConfig.outputDir,
		uiBaseUrl: runConfig.uiBaseUrl,
		apiBaseUrl: runConfig.apiBaseUrl,
		chromeDebugUrl: runConfig.chromeDebugUrl,
		generatedAt: new Date().toISOString(),
		scenarios: [],
		summary: {
			pass: 0,
			fail: 0
		}
	};

	for (const scenario of scenarios) {
		const scenarioOutputDir = runConfig.outputDir;
		const scenarioResult = {
			name: scenario.name,
			username: scenario.username,
			route: scenario.route || "/",
			status: "passed",
			steps: []
		};

		let session;
		try {
			session = await prepareLoggedInSession(runConfig, scenario);
			await session.send("Page.navigate", {
				url: normalizeUrl(runConfig.uiBaseUrl, scenario.route || "/")
			});

			if (scenario.waitAfterNavigateMs) {
				await sleep(scenario.waitAfterNavigateMs);
			}

			for (let stepIndex = 0; stepIndex < (scenario.steps || []).length; stepIndex += 1) {
				const step = scenario.steps[stepIndex];
				try {
					const detail = await runStep(session, runConfig, scenario, step, scenarioOutputDir);
					scenarioResult.steps.push({
						index: stepIndex + 1,
						type: step.type,
						status: "passed",
						...detail
					});
				} catch (error) {
					scenarioResult.status = "failed";
					scenarioResult.error = error.message;
					scenarioResult.steps.push({
						index: stepIndex + 1,
						type: step.type,
						status: "failed",
						error: error.message
					});
					throw error;
				}
			}

			report.summary.pass += 1;
		} catch (error) {
			report.summary.fail += 1;
		} finally {
			report.scenarios.push(scenarioResult);
			if (session) {
				try {
					await session.send("Page.close");
				} catch {
					// ignore close errors
				}
				session.close();
			}
		}
	}

	await writeReports(runConfig, report);

	console.log(JSON.stringify({
		outputDir: runConfig.outputDir,
		summary: report.summary
	}, null, 2));

	if (report.summary.fail > 0) {
		process.exitCode = 1;
	}
}

run().catch(error => {
	console.error(error.message);
	process.exit(1);
});
