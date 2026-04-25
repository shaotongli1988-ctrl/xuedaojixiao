#!/usr/bin/env node

/**
 * Rebuilds non-performance admin API contracts into the repository OpenAPI source from the current EPS snapshot.
 * It only owns repository-level SSOT completion for non-performance admin resources and does not replace performance's richer TS-driven contract sync.
 * Key dependencies are the checked-in EPS snapshot and current backend admin controllers for summary metadata.
 * Maintenance invariant: existing non-performance admin routes must stay mirrored into contracts/openapi/xuedao.openapi.json.
 */

import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, '..');
const openapiPath = path.join(repoRoot, 'contracts/openapi/xuedao.openapi.json');
const epsJsonPath = path.join(repoRoot, 'cool-admin-vue/build/cool/eps.json');
const midwayModulesRoot = path.join(repoRoot, 'cool-admin-midway/src/modules');

const EXCLUDED_MODULES = new Set(['performance', 'swagger']);
const GENERATED_SCHEMA_PREFIX = 'EpsAdmin';
const ANY_VALUE_SCHEMA = `${GENERATED_SCHEMA_PREFIX}AnyValue`;
const MUTATION_RESULT_SCHEMA = `${GENERATED_SCHEMA_PREFIX}MutationResult`;
const DELETE_REQUEST_SCHEMA = `${GENERATED_SCHEMA_PREFIX}DeleteRequest`;
const MANUAL_SCHEMAS = {
	[`EpsAdminBaseOpenLoginRequest`]: {
		type: 'object',
		required: ['username', 'password', 'captchaId', 'verifyCode'],
		properties: {
			username: { type: 'string' },
			password: { type: 'string' },
			captchaId: { type: 'string' },
			verifyCode: { type: 'number' },
		},
	},
	[`EpsAdminBaseOpenTokenResult`]: {
		type: 'object',
		required: ['token', 'expire', 'refreshToken', 'refreshExpire'],
		properties: {
			token: { type: 'string' },
			expire: { type: 'number' },
			refreshToken: { type: 'string' },
			refreshExpire: { type: 'number' },
			permissionMask: { type: 'string', nullable: true },
		},
	},
	[`EpsAdminBaseOpenRefreshTokenQuery`]: {
		type: 'object',
		required: ['refreshToken'],
		properties: {
			refreshToken: { type: 'string' },
		},
	},
	[`EpsAdminBaseOpenCaptchaQuery`]: {
		type: 'object',
		properties: {
			width: { type: 'number', nullable: true },
			height: { type: 'number', nullable: true },
			color: { type: 'string', nullable: true },
		},
	},
	[`EpsAdminBaseOpenCaptchaResult`]: {
		type: 'object',
		required: ['captchaId', 'data'],
		properties: {
			captchaId: { type: 'string' },
			data: { type: 'string' },
		},
	},
	[`EpsAdminBaseOpenHtmlQuery`]: {
		type: 'object',
		required: ['key'],
		properties: {
			key: { type: 'string' },
		},
	},
	[`EpsAdminBaseOpenHtmlResult`]: {
		type: 'string',
	},
	[`EpsAdminBaseOpenRuntimeMetaResult`]: {
		type: 'object',
		required: ['runtimeId', 'gitHash', 'sourceHash', 'startedAt', 'env'],
		properties: {
			runtimeId: { type: 'string' },
			gitHash: { type: 'string' },
			sourceHash: { type: 'string' },
			startedAt: { type: 'string' },
			env: { type: 'string' },
			port: { type: 'number', nullable: true },
			seedMeta: { type: 'object', nullable: true, additionalProperties: true },
		},
	},
	[`EpsAdminBaseOpenEpsApi`]: {
		type: 'object',
		required: ['path'],
		properties: {
			path: { type: 'string' },
			summary: { type: 'string', nullable: true },
			method: { type: 'string', nullable: true },
			prefix: { type: 'string', nullable: true },
			tag: { type: 'string', nullable: true },
			dts: { type: 'object', nullable: true, additionalProperties: true },
		},
		additionalProperties: true,
	},
	[`EpsAdminBaseOpenEpsColumn`]: {
		type: 'object',
		required: ['propertyName'],
		properties: {
			comment: { type: 'string', nullable: true },
			length: { type: 'number', nullable: true },
			nullable: { type: 'boolean', nullable: true },
			propertyName: { type: 'string' },
			type: { type: 'string', nullable: true },
			component: { type: 'string', nullable: true },
			defaultValue: { nullable: true },
			dict: {
				oneOf: [
					{ type: 'array', items: { type: 'string' } },
					{ type: 'string' },
				],
				nullable: true,
			},
		},
		additionalProperties: true,
	},
	[`EpsAdminBaseOpenEpsModule`]: {
		type: 'object',
		required: ['api', 'columns', 'prefix'],
		properties: {
			api: {
				type: 'array',
				items: { $ref: '#/components/schemas/EpsAdminBaseOpenEpsApi' },
			},
			columns: {
				type: 'array',
				items: { $ref: '#/components/schemas/EpsAdminBaseOpenEpsColumn' },
			},
			prefix: { type: 'string' },
			router: { type: 'string', nullable: true },
			module: { type: 'string', nullable: true },
			fieldEq: { type: 'array', items: { type: 'string' }, nullable: true },
			keyWordLikeFields: { type: 'array', items: { type: 'string' }, nullable: true },
		},
		additionalProperties: true,
	},
	[`EpsAdminBaseOpenEpsResult`]: {
		type: 'object',
		additionalProperties: {
			type: 'array',
			items: { $ref: '#/components/schemas/EpsAdminBaseOpenEpsModule' },
		},
	},
	[`EpsAdminBaseCommPermMenuItem`]: {
		type: 'object',
		required: ['id', 'parentId', 'type', 'name', 'icon', 'orderNum', 'isShow'],
		properties: {
			id: { type: 'number' },
			parentId: { type: 'number' },
			path: { type: 'string', nullable: true },
			router: { type: 'string', nullable: true },
			viewPath: { type: 'string', nullable: true },
			type: { type: 'number' },
			name: { type: 'string' },
			icon: { type: 'string' },
			badge: { type: 'number', nullable: true },
			badgeColor: { type: 'string', nullable: true },
			orderNum: { type: 'number' },
			isShow: {
				oneOf: [{ type: 'number' }, { type: 'boolean' }],
			},
			keepAlive: { type: 'number', nullable: true },
			meta: { type: 'object', nullable: true, additionalProperties: true },
			children: {
				type: 'array',
				items: { $ref: '#/components/schemas/EpsAdminBaseCommPermMenuItem' },
				nullable: true,
			},
			component: { nullable: true },
			redirect: { type: 'string', nullable: true },
		},
		additionalProperties: true,
	},
	[`EpsAdminBaseCommPermMenuResult`]: {
		type: 'object',
		required: ['menus', 'perms'],
		properties: {
			menus: {
				type: 'array',
				items: { $ref: '#/components/schemas/EpsAdminBaseCommPermMenuItem' },
			},
			perms: {
				type: 'array',
				items: { type: 'string' },
			},
		},
	},
	[`EpsAdminBaseCommUploadModeResult`]: {
		type: 'object',
		required: ['mode', 'type'],
		properties: {
			mode: { type: 'string' },
			type: { type: 'string' },
		},
	},
	[`EpsAdminBaseCommUploadRequest`]: {
		type: 'object',
		properties: {
			key: { type: 'string', nullable: true },
		},
		additionalProperties: false,
	},
	[`EpsAdminBaseCommUploadPrepareResult`]: {
		type: 'object',
		properties: {
			url: { type: 'string' },
			host: { type: 'string' },
			previewUrl: { type: 'string' },
			publicDomain: { type: 'string' },
			uploadUrl: { type: 'string' },
			token: { type: 'string' },
			policy: { type: 'string' },
			signature: { type: 'string' },
			OSSAccessKeyId: { type: 'string' },
			fields: { type: 'object', nullable: true, additionalProperties: true },
			credentials: { type: 'object', nullable: true, additionalProperties: true },
		},
		additionalProperties: true,
	},
	[`EpsAdminTaskInfoLogQuery`]: {
		type: 'object',
		required: ['id'],
		properties: {
			id: { type: 'number' },
			status: { type: 'number', nullable: true },
			page: { type: 'number', nullable: true },
			size: { type: 'number', nullable: true },
		},
	},
	[`EpsAdminTaskInfoLogRecord`]: {
		type: 'object',
		properties: {
			id: { type: 'number', nullable: true },
			taskId: { type: 'number', nullable: true },
			detail: { type: 'string', nullable: true },
			status: { type: 'number', nullable: true },
			createTime: { type: 'string', nullable: true },
			updateTime: { type: 'string', nullable: true },
		},
		additionalProperties: true,
	},
	[`EpsAdminTaskInfoLogPageResult`]: {
		type: 'object',
		required: ['pagination', 'list'],
		properties: {
			pagination: { $ref: '#/components/schemas/PagePagination' },
			list: {
				type: 'array',
				items: { $ref: '#/components/schemas/EpsAdminTaskInfoLogRecord' },
			},
		},
		additionalProperties: true,
	},
};
const MANUAL_OPERATION_OVERRIDES = {
	['post /admin/base/open/login']: {
		requestSchemaName: 'EpsAdminBaseOpenLoginRequest',
		responseSchemaName: 'EpsAdminBaseOpenTokenResult',
	},
	['get /admin/base/open/refreshToken']: {
		querySchemaName: 'EpsAdminBaseOpenRefreshTokenQuery',
		responseSchemaName: 'EpsAdminBaseOpenTokenResult',
	},
	['get /admin/base/open/runtimeMeta']: {
		responseSchemaName: 'EpsAdminBaseOpenRuntimeMetaResult',
	},
	['get /admin/base/open/captcha']: {
		querySchemaName: 'EpsAdminBaseOpenCaptchaQuery',
		responseSchemaName: 'EpsAdminBaseOpenCaptchaResult',
	},
	['get /admin/base/open/html']: {
		querySchemaName: 'EpsAdminBaseOpenHtmlQuery',
		responseSchemaName: 'EpsAdminBaseOpenHtmlResult',
	},
	['get /admin/base/open/eps']: {
		responseSchemaName: 'EpsAdminBaseOpenEpsResult',
	},
	['get /admin/base/comm/permmenu']: {
		responseSchemaName: 'EpsAdminBaseCommPermMenuResult',
	},
	['get /admin/base/comm/uploadMode']: {
		responseSchemaName: 'EpsAdminBaseCommUploadModeResult',
	},
	['post /admin/base/comm/upload']: {
		requestSchemaName: 'EpsAdminBaseCommUploadRequest',
		responseSchemaName: 'EpsAdminBaseCommUploadPrepareResult',
	},
	['get /admin/task/info/log']: {
		querySchemaName: 'EpsAdminTaskInfoLogQuery',
		responseSchemaName: 'EpsAdminTaskInfoLogPageResult',
	},
};

function readJson(filePath) {
	return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function writeJson(filePath, value) {
	fs.writeFileSync(filePath, `${JSON.stringify(value, null, 2)}\n`);
}

function sortObjectByKey(value) {
	return Object.fromEntries(Object.entries(value || {}).sort(([left], [right]) => left.localeCompare(right)));
}

function sortOpenapiSpec(spec) {
	spec.tags = [...(spec.tags || [])].sort((left, right) => left.name.localeCompare(right.name));
	spec.paths = Object.fromEntries(
		Object.entries(spec.paths || {})
			.sort(([left], [right]) => left.localeCompare(right))
			.map(([route, methods]) => [route, sortObjectByKey(methods)])
	);
	spec.components = spec.components || {};
	spec.components.schemas = sortObjectByKey(spec.components.schemas || {});
	return spec;
}

function listAdminControllerFiles() {
	const files = [];

	for (const moduleName of fs.readdirSync(midwayModulesRoot).sort()) {
		if (EXCLUDED_MODULES.has(moduleName)) {
			continue;
		}

		const controllerRoot = path.join(midwayModulesRoot, moduleName, 'controller/admin');
		if (!fs.existsSync(controllerRoot)) {
			continue;
		}

		const walk = currentPath => {
			for (const name of fs.readdirSync(currentPath).sort()) {
				const nextPath = path.join(currentPath, name);
				const stat = fs.statSync(nextPath);
				if (stat.isDirectory()) {
					walk(nextPath);
					continue;
				}
				if (name.endsWith('.ts')) {
					files.push(nextPath);
				}
			}
		};

		walk(controllerRoot);
	}

	return files;
}

function normalizeMethod(rawMethod) {
	return rawMethod.toLowerCase();
}

function parseControllerSummaries() {
	const summaries = new Map();

	for (const filePath of listAdminControllerFiles()) {
		const text = fs.readFileSync(filePath, 'utf8');
		const controllerBaseMatch =
			text.match(/@CoolController\(\s*'([^']+)'\s*\)/) ||
			text.match(/@CoolController\(\s*"([^"]+)"\s*\)/);
		if (!controllerBaseMatch) {
			continue;
		}

		const controllerBaseRoute = controllerBaseMatch[1];
		const operationRegex =
			/@(Get|Post)\(\s*['"]([^'"]+)['"]\s*,\s*\{\s*summary:\s*['"]([^'"]+)['"]\s*\}\s*\)/g;

		for (const match of text.matchAll(operationRegex)) {
			const method = normalizeMethod(match[1]);
			const route = `${controllerBaseRoute}${match[2]}`;
			summaries.set(`${method} ${route}`, match[3]);
		}
	}

	return summaries;
}

function pascalCase(value) {
	return String(value)
		.split(/[^A-Za-z0-9]+/)
		.filter(Boolean)
		.map(part => part.charAt(0).toUpperCase() + part.slice(1))
		.join('');
}

function camelCase(value) {
	const normalized = pascalCase(value);
	return normalized ? normalized.charAt(0).toLowerCase() + normalized.slice(1) : '';
}

function buildResourceBaseName(prefix) {
	return `${GENERATED_SCHEMA_PREFIX}${pascalCase(
		prefix.replace(/^\/admin\//, '').replace(/^\/+/, '').replace(/\//g, ' ')
	)}`;
}

function ensureTag(spec, name, description) {
	spec.tags = spec.tags || [];
	if (spec.tags.some(tag => tag.name === name)) {
		return;
	}
	spec.tags.push({ name, description });
}

function buildOperationId(prefix, suffix) {
	const prefixId = camelCase(
		prefix.replace(/^\/admin\//, '').replace(/^\/+/, '').replace(/\//g, ' ')
	);
	return `${prefixId}${pascalCase(suffix)}`;
}

function mapFieldType(field) {
	const rawType = String(field?.type || '').toLowerCase();
	if (rawType === 'number' || rawType === 'bigint' || rawType === 'int') {
		return { type: 'number' };
	}
	if (rawType === 'datetime' || rawType === 'date' || rawType === 'timestamp') {
		return { type: 'string', format: rawType === 'date' ? 'date' : 'date-time' };
	}
	if (rawType === 'boolean') {
		return { type: 'boolean' };
	}
	return { type: 'string' };
}

function buildSearchQuerySchema(resource, includePagination) {
	const properties = {};
	const required = [];
	const fields = [
		...(resource.search?.fieldEq || []),
		...(resource.search?.fieldLike || []),
	];

	for (const field of fields) {
		if (!field?.propertyName || properties[field.propertyName]) {
			continue;
		}
		const propertySchema = {
			...mapFieldType(field),
		};
		if (field.comment) {
			propertySchema.description = field.comment;
		}
		if (Array.isArray(field.dict) && field.dict.length > 0) {
			propertySchema.enum = field.dict;
		}
		if (field.nullable) {
			propertySchema.nullable = true;
		}
		properties[field.propertyName] = propertySchema;
	}

	if ((resource.search?.keyWordLikeFields || []).length > 0) {
		properties.keyword = {
			type: 'string',
			description: `关键字检索: ${(resource.search.keyWordLikeFields || [])
				.map(field => field.propertyName)
				.filter(Boolean)
				.join(', ')}`,
			nullable: true,
		};
	}

	if (includePagination) {
		properties.page = {
			type: 'number',
			description: '页码',
		};
		properties.size = {
			type: 'number',
			description: '分页大小',
		};
		required.push('page', 'size');
	}

	return {
		type: 'object',
		...(Object.keys(properties).length ? { properties } : {}),
		...(required.length ? { required } : {}),
		additionalProperties: false,
	};
}

function ensureSchema(spec, name, schema) {
	spec.components.schemas[name] = spec.components.schemas[name] || schema;
}

function ensureApiResponseSchema(spec, responseSchemaName, responseSchema) {
	const wrapperName = responseSchemaName ? `ApiResponse_${responseSchemaName}` : 'ApiResponse_void';
	spec.components.schemas[wrapperName] = {
		type: 'object',
		required: ['code', 'message', 'data'],
		properties: {
			code: { type: 'integer' },
			message: { type: 'string' },
			data: responseSchema || { nullable: true },
		},
	};
	return wrapperName;
}

function buildQueryParameters(schema) {
	if (!schema || typeof schema !== 'object') {
		return [];
	}
	return Object.entries(schema.properties || {}).map(([name, propertySchema]) => ({
		name,
		in: 'query',
		required: (schema.required || []).includes(name),
		schema: propertySchema,
	}));
}

function buildRequestBody(schemaRef) {
	return {
		required: true,
		content: {
			'application/json': {
				schema: {
					$ref: `#/components/schemas/${schemaRef}`,
				},
			},
		},
	};
}

function buildResponseRef(wrapperName, summary) {
	return {
		'200': {
			description: summary,
			content: {
				'application/json': {
					schema: {
						$ref: `#/components/schemas/${wrapperName}`,
					},
				},
			},
		},
	};
}

function deriveSummary(prefix, apiPath, method) {
	const resourceName = prefix
		.replace(/^\/admin\//, '')
		.split('/')
		.join('.');
	const action = apiPath.replace(/^\//, '') || method;
	return `${resourceName} ${action}`;
}

function cleanupGeneratedAreas(spec, resources) {
	const managedPrefixes = new Set(resources.map(resource => resource.prefix));

	for (const route of Object.keys(spec.paths || {})) {
		for (const prefix of managedPrefixes) {
			if (route === prefix || route.startsWith(`${prefix}/`)) {
				delete spec.paths[route];
				break;
			}
		}
	}

	for (const schemaName of Object.keys(spec.components.schemas || {})) {
		if (
			schemaName.startsWith(GENERATED_SCHEMA_PREFIX) ||
			schemaName.startsWith(`ApiResponse_${GENERATED_SCHEMA_PREFIX}`)
		) {
			delete spec.components.schemas[schemaName];
		}
	}
}

function collectResources() {
	const resources = readJson(epsJsonPath)
		.filter(item => item?.prefix?.startsWith('/admin/'))
		.filter(item => !EXCLUDED_MODULES.has(item.prefix.split('/')[2]))
		.sort((left, right) => left.prefix.localeCompare(right.prefix));

	return resources;
}

function ensureCommonSchemas(spec) {
	ensureSchema(spec, ANY_VALUE_SCHEMA, {
		description: 'Non-performance EPS-derived fallback result. Unknown data shape is kept intentionally loose.',
	});
	ensureSchema(spec, MUTATION_RESULT_SCHEMA, {
		type: 'object',
		required: ['id'],
		properties: {
			id: {
				type: 'number',
			},
		},
		additionalProperties: true,
	});
	ensureSchema(spec, DELETE_REQUEST_SCHEMA, {
		type: 'object',
		required: ['ids'],
		properties: {
			ids: {
				type: 'array',
				items: {
					type: 'number',
				},
			},
		},
	});
	for (const [name, schema] of Object.entries(MANUAL_SCHEMAS)) {
		ensureSchema(spec, name, schema);
	}
}

function ensureResourceContract(spec, resource, controllerSummaries) {
	const resourceBaseName = buildResourceBaseName(resource.prefix);
	const entitySchemaName = `${resourceBaseName}Entity`;
	const pageQuerySchemaName = `${resourceBaseName}PageQuery`;
	const listQuerySchemaName = `${resourceBaseName}ListQuery`;
	const infoQuerySchemaName = `${resourceBaseName}InfoQuery`;
	const listResponseSchemaName = `${resourceBaseName}ListResponse`;
	const pageResponseSchemaName = `${resourceBaseName}PageResponse`;
	const tagName = resource.prefix.replace(/^\/admin\//, '').replace(/\//g, '.');

	ensureTag(spec, tagName, `EPS-derived admin resource snapshot for ${resource.prefix}.`);
	ensureSchema(spec, entitySchemaName, {
		type: 'object',
		description: `EPS-derived loose entity schema for ${resource.prefix}.`,
		additionalProperties: true,
	});
	ensureSchema(spec, pageQuerySchemaName, buildSearchQuerySchema(resource, true));
	ensureSchema(spec, listQuerySchemaName, buildSearchQuerySchema(resource, false));
	ensureSchema(spec, infoQuerySchemaName, {
		type: 'object',
		required: ['id'],
		properties: {
			id: {
				type: 'number',
				description: '主键 ID',
			},
		},
		additionalProperties: false,
	});
	ensureSchema(spec, listResponseSchemaName, {
		type: 'array',
		items: {
			$ref: `#/components/schemas/${entitySchemaName}`,
		},
	});
	ensureSchema(spec, pageResponseSchemaName, {
		type: 'object',
		required: ['pagination', 'list'],
		properties: {
			pagination: {
				$ref: '#/components/schemas/PagePagination',
			},
			list: {
				type: 'array',
				items: {
					$ref: `#/components/schemas/${entitySchemaName}`,
				},
			},
		},
		additionalProperties: true,
	});

	for (const api of resource.api || []) {
		const method = normalizeMethod(api.method || 'get');
		const fullRoute = `${resource.prefix}${api.path}`;
		const summary =
			controllerSummaries.get(`${method} ${fullRoute}`) ||
			deriveSummary(resource.prefix, api.path, method);
		const operationSchema = {
			tags: [tagName],
			summary,
			operationId: buildOperationId(resource.prefix, api.path),
			'x-ssotSource': 'eps-derived',
			responses: {},
		};

		let responseSchemaName = ANY_VALUE_SCHEMA;
		const manualOverride = MANUAL_OPERATION_OVERRIDES[`${method} ${fullRoute}`];

		if (manualOverride?.querySchemaName) {
			const querySchema = spec.components.schemas[manualOverride.querySchemaName];
			operationSchema.parameters = buildQueryParameters(querySchema);
			operationSchema['x-querySchemaRef'] = `#/components/schemas/${manualOverride.querySchemaName}`;
		}
		if (manualOverride?.requestSchemaName) {
			operationSchema.requestBody = buildRequestBody(manualOverride.requestSchemaName);
		}
		if (manualOverride?.responseSchemaName) {
			responseSchemaName = manualOverride.responseSchemaName;
		}

		if (manualOverride) {
			// manual override already owns request/response shape.
		} else if (api.path === '/page' && method === 'post') {
			operationSchema.requestBody = buildRequestBody(pageQuerySchemaName);
			responseSchemaName = pageResponseSchemaName;
		} else if (api.path === '/list' && method === 'post') {
			operationSchema.requestBody = buildRequestBody(listQuerySchemaName);
			responseSchemaName = listResponseSchemaName;
		} else if (api.path === '/info' && method === 'get') {
			operationSchema.parameters = [
				{
					name: 'id',
					in: 'query',
					required: true,
					schema: {
						type: 'number',
					},
				},
			];
			operationSchema['x-querySchemaRef'] = `#/components/schemas/${infoQuerySchemaName}`;
			responseSchemaName = entitySchemaName;
		} else if (api.path === '/add' && method === 'post') {
			operationSchema.requestBody = buildRequestBody(entitySchemaName);
			responseSchemaName = MUTATION_RESULT_SCHEMA;
		} else if (api.path === '/update' && method === 'post') {
			operationSchema.requestBody = buildRequestBody(entitySchemaName);
			responseSchemaName = MUTATION_RESULT_SCHEMA;
		} else if (api.path === '/delete' && method === 'post') {
			operationSchema.requestBody = buildRequestBody(DELETE_REQUEST_SCHEMA);
			responseSchemaName = '';
		} else if (method === 'post') {
			const requestSchemaName = `${resourceBaseName}${pascalCase(api.path)}Request`;
			ensureSchema(spec, requestSchemaName, {
				type: 'object',
				description: `Loose EPS-derived request placeholder for ${fullRoute}.`,
				additionalProperties: true,
			});
			operationSchema.requestBody = buildRequestBody(requestSchemaName);
		}

		const responseWrapperName = ensureApiResponseSchema(
			spec,
			responseSchemaName,
			responseSchemaName
				? { $ref: `#/components/schemas/${responseSchemaName}` }
				: { nullable: true }
		);
		operationSchema.responses = buildResponseRef(responseWrapperName, `${summary}结果`);

		spec.paths[fullRoute] = spec.paths[fullRoute] || {};
		spec.paths[fullRoute][method] = operationSchema;
	}
}

function main() {
	const write = process.argv.includes('--write');
	const spec = readJson(openapiPath);
	const resources = collectResources();
	const controllerSummaries = parseControllerSummaries();

	spec.components = spec.components || {};
	spec.components.schemas = spec.components.schemas || {};
	spec.paths = spec.paths || {};
	spec.tags = spec.tags || [];

	cleanupGeneratedAreas(spec, resources);
	ensureCommonSchemas(spec);

	for (const resource of resources) {
		ensureResourceContract(spec, resource, controllerSummaries);
	}

	sortOpenapiSpec(spec);

	if (write) {
		writeJson(openapiPath, spec);
		console.log('[sync-repo-openapi-ssot] write completed.');
		return;
	}

	const next = `${JSON.stringify(spec, null, 2)}\n`;
	const current = fs.readFileSync(openapiPath, 'utf8');
	if (current !== next) {
		throw new Error('contracts/openapi/xuedao.openapi.json is out of date.');
	}
	console.log('[sync-repo-openapi-ssot] check passed.');
}

main();
