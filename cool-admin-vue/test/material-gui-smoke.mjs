/**
 * Drives a real browser against the admin frontend to verify material catalog, inbound, issue, and stock flows.
 * This file is responsible for GUI smoke coverage only and reuses the backend captcha cache to complete login.
 * Maintenance pitfall: keep selectors aligned with page labels and shared data-testid attributes when forms or row actions change.
 */
import crypto from 'node:crypto';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';
import { chromium, firefox, webkit } from 'playwright';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const frontendRoot = path.resolve(__dirname, '..');
const defaultFrontendBaseUrl = process.env.MATERIAL_FRONTEND_BASE_URL || 'http://127.0.0.1:5173';
const defaultPassword = process.env.STAGE2_SMOKE_PASSWORD || '123456';
const defaultUsername = process.env.STAGE2_SMOKE_USERNAME || 'hr_admin';
const defaultBrowserName = process.env.MATERIAL_GUI_BROWSER || 'chromium';
const launchers = { chromium, firefox, webkit };

function md5(value) {
	return crypto.createHash('md5').update(String(value)).digest('hex');
}

function resolveBackendConfigPath() {
	const explicit = process.env.MATERIAL_GUI_BACKEND_CONFIG_PATH;
	if (explicit) {
		return explicit;
	}
	return path.resolve(frontendRoot, '../cool-admin-midway/src/config/config.default.ts');
}

function resolveCacheDir() {
	if (process.env.STAGE2_SMOKE_CACHE_DIR) {
		return process.env.STAGE2_SMOKE_CACHE_DIR;
	}
	const candidate = resolveBackendConfigPath();
	const content = fs.readFileSync(candidate, 'utf8');
	const matched = content.match(/keys:\s*['"`]([^'"`]+)['"`]/);
	if (!matched?.[1]) {
		throw new Error(`Unable to resolve backend cache directory from ${candidate}`);
	}
	return path.join(os.homedir(), '.cool-admin', md5(matched[1]), 'cache');
}

function normalizeBaseUrl(url) {
	return url.replace(/\/+$/, '');
}

function cacheFilePath(cacheDir, key) {
	return path.join(cacheDir, `diskstore-${md5(key)}.json`);
}

function sleep(ms) {
	return new Promise(resolve => setTimeout(resolve, ms));
}

async function readCaptchaValue(cacheDir, captchaId) {
	const key = `verify:img:${captchaId}`;
	const targetFile = cacheFilePath(cacheDir, key);

	for (let attempt = 0; attempt < 40; attempt += 1) {
		if (fs.existsSync(targetFile)) {
			const parsed = JSON.parse(fs.readFileSync(targetFile, 'utf8'));
			if (parsed?.val) {
				return parsed.val;
			}
		}
		await sleep(100);
	}

	throw new Error(`Captcha cache not found for ${captchaId}`);
}

function expect(condition, message) {
	if (!condition) {
		throw new Error(message);
	}
}

async function waitForMessage(page, text) {
	await page.locator('.el-message').filter({ hasText: text }).first().waitFor({ timeout: 15000 });
}

async function waitForConfirmAndAccept(page) {
	const dialog = page.locator('.el-message-box').last();
	await dialog.waitFor({ timeout: 15000 });
	await dialog.getByRole('button', { name: '确定' }).click();
}

async function fillInputByTestId(page, testId, value) {
	const container = page.getByTestId(testId);
	await container.waitFor({ timeout: 15000 });
	const input = container.locator('input, textarea').first();
	await input.click();
	await input.fill('');
	await input.fill(String(value));
}

async function fillNumberByTestId(page, testId, value) {
	await fillInputByTestId(page, testId, value);
}

async function selectOptionByTestId(page, testId, optionText) {
	const trigger = page.getByTestId(testId);
	await trigger.waitFor({ timeout: 15000 });
	await trigger.click();
	const option = page.locator('.el-select-dropdown__item').filter({ hasText: optionText }).first();
	await option.waitFor({ timeout: 15000 });
	await option.click();
}

async function selectFirstOptionByTestId(page, testId) {
	const trigger = page.getByTestId(testId);
	await trigger.waitFor({ timeout: 15000 });
	await trigger.click();
	const option = page
		.locator('.el-select-dropdown__item:not(.is-disabled):not(.is-hidden)')
		.first();
	await option.waitFor({ timeout: 15000 });
	const text = (await option.textContent())?.trim() || '';
	await option.click();
	return text;
}

async function clickRowActionByKeyword(page, keyword, actionText) {
	const row = page.locator('.el-table__body tr').filter({ hasText: keyword }).first();
	await row.waitFor({ timeout: 15000 });
	await row.getByRole('button', { name: actionText }).click();
}

async function rowText(page, keyword) {
	const row = page.locator('.el-table__body tr').filter({ hasText: keyword }).first();
	await row.waitFor({ timeout: 15000 });
	return (await row.textContent()) || '';
}

async function rowCells(page, keyword) {
	const row = page.locator('.el-table__body tr').filter({ hasText: keyword }).first();
	await row.waitFor({ timeout: 15000 });
	const cells = row.locator('td');
	const count = await cells.count();
	const values = [];
	for (let index = 0; index < count; index += 1) {
		values.push(((await cells.nth(index).textContent()) || '').trim());
	}
	return values;
}

async function searchByKeyword(page, keyword) {
	await fillInputByTestId(page, 'material-filter-keyword', keyword);
	await page.getByTestId('material-search-button').click();
}

async function openCreateDialog(page) {
	await page.getByTestId('material-create-button').click();
	await page.getByTestId('material-form-save-button').waitFor({ timeout: 15000 });
}

async function saveForm(page, successText) {
	await page.getByTestId('material-form-save-button').click();
	await waitForMessage(page, successText);
}

async function waitForTabActive(page, tabLabel) {
	const tab = page.getByRole('tab', { name: tabLabel });
	await tab.waitFor({ timeout: 20000 });
	await tab.click();
	await page.waitForFunction(
		label => {
			const tabs = Array.from(document.querySelectorAll('[role="tab"]'));
			return tabs.some(
				tabEl =>
					tabEl.textContent?.trim() === label &&
					String(tabEl.getAttribute('aria-selected')) === 'true'
			);
		},
		tabLabel,
		{ timeout: 20000 }
	);
}

async function navigateToMaterialPage(page, routePath, unifiedTitle, tabLabel, targetPath) {
	await page.goto(`${normalizeBaseUrl(defaultFrontendBaseUrl)}/#${routePath}`, {
		waitUntil: 'networkidle'
	});
	if (targetPath) {
		await page.waitForURL(url => url.hash.includes(targetPath), { timeout: 20000 });
	}
	await page.getByRole('heading', { name: unifiedTitle }).waitFor({ timeout: 20000 });
	await waitForTabActive(page, tabLabel);
}

async function loginViaGui(page, cacheDir) {
	const captchaResponsePromise = page.waitForResponse(
		response => response.url().includes('/dev/admin/base/open/captcha'),
		{ timeout: 20000 }
	);

	await page.goto(`${normalizeBaseUrl(defaultFrontendBaseUrl)}/#/login`, {
		waitUntil: 'networkidle'
	});

	const captchaResponse = await captchaResponsePromise;
	const captchaBody = await captchaResponse.json();
	const captchaId = captchaBody?.data?.captchaId;
	expect(captchaBody?.code === 1000 && captchaId, `captcha failed: ${JSON.stringify(captchaBody)}`);

	const verifyCode = await readCaptchaValue(cacheDir, captchaId);

	await fillInputByTestId(page, 'login-username', defaultUsername);
	await fillInputByTestId(page, 'login-password', defaultPassword);
	await fillInputByTestId(page, 'login-verify-code', verifyCode);

	await Promise.all([
		page.waitForURL(url => !url.hash.includes('/login'), { timeout: 20000 }),
		page.getByTestId('login-submit').click()
	]);
}

async function run() {
	const browserType = launchers[defaultBrowserName];
	if (!browserType) {
		throw new Error(`Unsupported browser: ${defaultBrowserName}`);
	}

	const browser = await browserType.launch({
		headless: process.env.MATERIAL_GUI_HEADLESS !== '0'
	});
	const context = await browser.newContext({
		viewport: { width: 1440, height: 960 }
	});
	const page = await context.newPage();
	const cacheDir = resolveCacheDir();
	const uniqueKey = `${Date.now()}`;
	const materialCode = `GUI-MAT-${uniqueKey}`;
	const materialName = `GUI物资-${uniqueKey}`;
	const inboundTitle = `GUI入库-${uniqueKey}`;
	const issueTitle = `GUI领用-${uniqueKey}`;

	try {
		await loginViaGui(page, cacheDir);

		await navigateToMaterialPage(
			page,
			'/performance/material/catalog',
			'资产台账',
			'物资目录',
			'/performance/asset/ledger?assetView=materialCatalog'
		);
		await openCreateDialog(page);
		await fillInputByTestId(page, 'material-form-code', materialCode);
		await fillInputByTestId(page, 'material-form-name', materialName);
		await fillInputByTestId(page, 'material-form-category', 'GUI冒烟');
		await fillInputByTestId(page, 'material-form-specification', 'Browser');
		await fillInputByTestId(page, 'material-form-unit', '个');
		await fillNumberByTestId(page, 'material-form-safetyStock', 2);
		await fillNumberByTestId(page, 'material-form-referenceUnitCost', 12.5);
		await fillInputByTestId(page, 'material-form-remark', 'GUI smoke catalog');
		await saveForm(page, '已新增');
		await searchByKeyword(page, materialCode);
		expect((await rowText(page, materialCode)).includes(materialName), 'catalog row not found after create');

		await navigateToMaterialPage(
			page,
			'/performance/material/inbound',
			'资产作业',
			'物资入库',
			'/performance/asset/assignment?operationView=materialInbound'
		);
		await openCreateDialog(page);
		await fillInputByTestId(page, 'material-form-title', inboundTitle);
		await selectOptionByTestId(page, 'material-form-catalogId', materialCode);
		await selectFirstOptionByTestId(page, 'material-form-departmentId');
		await fillNumberByTestId(page, 'material-form-quantity', 8);
		await fillNumberByTestId(page, 'material-form-unitCost', 12.5);
		await fillNumberByTestId(page, 'material-form-totalAmount', 100);
		await fillInputByTestId(page, 'material-form-sourceType', 'guiSmoke');
		await fillInputByTestId(page, 'material-form-sourceBizId', uniqueKey);
		await fillInputByTestId(page, 'material-form-remark', 'GUI smoke inbound');
		await saveForm(page, '已新增');
		await searchByKeyword(page, inboundTitle);
		await clickRowActionByKeyword(page, inboundTitle, '提交');
		await waitForConfirmAndAccept(page);
		await waitForMessage(page, '已提交');
		await clickRowActionByKeyword(page, inboundTitle, '确认入库');
		await waitForConfirmAndAccept(page);
		await waitForMessage(page, '已确认入库');

		await navigateToMaterialPage(
			page,
			'/performance/material/stock',
			'资产台账',
			'物资库存',
			'/performance/asset/ledger?assetView=materialStock'
		);
		await searchByKeyword(page, materialCode);
		const inboundStockCells = await rowCells(page, materialCode);
		expect(inboundStockCells[5] === '8', `unexpected currentQty after inbound: ${inboundStockCells.join(' | ')}`);
		expect(inboundStockCells[6] === '8', `unexpected availableQty after inbound: ${inboundStockCells.join(' | ')}`);
		expect(inboundStockCells[8] === '0', `unexpected issuedQty after inbound: ${inboundStockCells.join(' | ')}`);

		await navigateToMaterialPage(
			page,
			'/performance/material/issue',
			'资产作业',
			'物资领用',
			'/performance/asset/assignment?operationView=materialIssue'
		);
		await openCreateDialog(page);
		await fillInputByTestId(page, 'material-form-title', issueTitle);
		await selectOptionByTestId(page, 'material-form-catalogId', materialCode);
		await selectFirstOptionByTestId(page, 'material-form-departmentId');
		await selectFirstOptionByTestId(page, 'material-form-assigneeId');
		await fillNumberByTestId(page, 'material-form-quantity', 3);
		await fillInputByTestId(page, 'material-form-issueDate', new Date().toISOString().slice(0, 10));
		await fillInputByTestId(page, 'material-form-purpose', 'GUI smoke issue');
		await fillInputByTestId(page, 'material-form-remark', 'GUI smoke remark');
		await saveForm(page, '已新增');
		await searchByKeyword(page, issueTitle);
		await clickRowActionByKeyword(page, issueTitle, '提交');
		await waitForConfirmAndAccept(page);
		await waitForMessage(page, '已提交');
		await clickRowActionByKeyword(page, issueTitle, '确认领用');
		await waitForConfirmAndAccept(page);
		await waitForMessage(page, '已确认领用');

		await navigateToMaterialPage(
			page,
			'/performance/material/stock',
			'资产台账',
			'物资库存',
			'/performance/asset/ledger?assetView=materialStock'
		);
		await searchByKeyword(page, materialCode);
		const finalStockCells = await rowCells(page, materialCode);
		expect(finalStockCells[5] === '5', `unexpected currentQty after issue: ${finalStockCells.join(' | ')}`);
		expect(finalStockCells[6] === '5', `unexpected availableQty after issue: ${finalStockCells.join(' | ')}`);
		expect(finalStockCells[8] === '3', `unexpected issuedQty after issue: ${finalStockCells.join(' | ')}`);

		console.log(`[PASS] material gui smoke - ${materialCode}`);
	} catch (error) {
		try {
			await page.screenshot({ path: '/tmp/material-gui-smoke-failure.png', fullPage: true });
			console.error('[material-gui-smoke] screenshot saved to /tmp/material-gui-smoke-failure.png');
		} catch (screenshotError) {
			console.error(`[material-gui-smoke] screenshot failed: ${screenshotError.message}`);
		}
		throw error;
	} finally {
		await context.close();
		await browser.close();
	}
}

run().catch(error => {
	console.error(`[FAIL] material gui smoke - ${error.message}`);
	process.exitCode = 1;
});
