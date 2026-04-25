/**
 * 校验 cool-uni 移动端角色展示事实源。
 * 覆盖 persona 优先级和首页不再本地 switch roleKind 的约束。
 */
import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import ts from "typescript";

const roleFactPath = new URL("../cool/utils/performance-role-fact.ts", import.meta.url);
const userStorePath = new URL("../cool/store/user.ts", import.meta.url);
const homePagePath = new URL("../pages/index/home.vue", import.meta.url);

let roleFactModulePromise;

function transpileSource(source) {
	return ts.transpileModule(source, {
		compilerOptions: {
			module: ts.ModuleKind.ES2022,
			target: ts.ScriptTarget.ES2022,
		},
	}).outputText;
}

async function loadRoleFactModule() {
	if (!roleFactModulePromise) {
		roleFactModulePromise = readFile(roleFactPath, "utf8").then(
			(source) =>
				import(
					`data:text/javascript;base64,${Buffer.from(transpileSource(source)).toString(
						"base64",
					)}`
				),
		);
	}

	return roleFactModulePromise;
}

test("persona fact prefers activePersonaKey over fallback roleKind", async () => {
	const { resolveMobilePerformanceRoleFact } = await loadRoleFactModule();

	assert.equal(
		resolveMobilePerformanceRoleFact({
			activePersonaKey: "org.hrbp",
			roleKind: "manager",
		}).roleLabel,
		"HRBP 视角",
	);
	assert.equal(
		resolveMobilePerformanceRoleFact({
			activePersonaKey: "fn.analysis_viewer",
			roleKind: "readonly",
		}).scopeLabel,
		"分析只读视角",
	);
	assert.equal(
		resolveMobilePerformanceRoleFact({
			roleKind: "manager",
		}).roleLabel,
		"主管 / 负责人视角",
	);
	assert.equal(
		resolveMobilePerformanceRoleFact({
			roleKind: "readonly",
		}).roleLabel,
		"只读视角",
	);
	assert.equal(resolveMobilePerformanceRoleFact({}).roleLabel, "未开放视角");
});

test("cool-uni home page consumes store roleLabel instead of local roleKind switch", async () => {
	const [userStoreSource, homePageSource] = await Promise.all([
		readFile(userStorePath, "utf8"),
		readFile(homePagePath, "utf8"),
	]);

	assert.equal(userStoreSource.includes("resolveMobilePerformanceRoleFact"), true);
	assert.equal(homePageSource.includes("{{ user.roleLabel }}"), true);
	assert.equal(homePageSource.includes("switch (user.roleKind)"), false);
});
