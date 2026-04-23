#!/usr/bin/env node

/**
 * Rebuilds missing performance OpenAPI contracts from the current controller, service and shared type source.
 * It only owns repository-level SSOT completion for performance APIs and does not replace business docs or runtime Swagger export.
 * Key dependencies are the current performance controllers, Vue service wrappers and shared TS type declarations.
 * Maintenance invariant: once a performance API is implemented, its contract must exist in contracts/openapi/xuedao.openapi.json.
 */

import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import ts from 'typescript';
import { fileURLToPath } from 'node:url';
import {
	loadPerformanceContractSourceConfig,
	PERFORMANCE_WEB_SERVICE_ROOT,
} from '../cool-admin-midway/src/modules/performance/domain/registry/contract-source.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, '..');
const openapiPath = path.join(repoRoot, 'contracts/openapi/xuedao.openapi.json');
const vueServiceRoot = path.join(repoRoot, 'cool-admin-vue/src/modules/performance/service');
const midwayControllerRoot = path.join(
	repoRoot,
	'cool-admin-midway/src/modules/performance/controller/admin'
);

const MANUAL_OPERATION_PRESETS = {
	approvalFlow: {
		baseRoute: '/admin/performance/approval-flow',
		operations: [
			{ method: 'get', routeSuffix: '/config/info', requestSchemaName: 'ApprovalFlowConfigInfoQuery', responseSchemaName: 'ApprovalFlowConfigRecord' },
			{ method: 'post', routeSuffix: '/config/save', requestSchemaName: 'ApprovalFlowConfigSaveRequest', responseSchemaName: 'ApprovalFlowConfigRecord' },
			{ method: 'get', routeSuffix: '/info', requestSchemaName: 'ApprovalFlowInfoQuery', responseSchemaName: 'ApprovalFlowInstanceRecord' },
			{ method: 'post', routeSuffix: '/approve', requestSchemaName: 'ApprovalFlowActionRequest', responseSchemaName: 'ApprovalFlowInstanceRecord' },
			{ method: 'post', routeSuffix: '/reject', requestSchemaName: 'ApprovalFlowActionRequest', responseSchemaName: 'ApprovalFlowInstanceRecord' },
			{ method: 'post', routeSuffix: '/transfer', requestSchemaName: 'ApprovalFlowTransferRequest', responseSchemaName: 'ApprovalFlowInstanceRecord' },
			{ method: 'post', routeSuffix: '/withdraw', requestSchemaName: 'ApprovalFlowActionRequest', responseSchemaName: 'ApprovalFlowInstanceRecord' },
			{ method: 'post', routeSuffix: '/remind', requestSchemaName: 'ApprovalFlowActionRequest', responseSchemaName: 'ApprovalFlowInstanceRecord' },
			{ method: 'post', routeSuffix: '/resolve', requestSchemaName: 'ApprovalFlowResolveRequest', responseSchemaName: 'ApprovalFlowInstanceRecord' },
			{ method: 'post', routeSuffix: '/fallback', requestSchemaName: 'ApprovalFlowActionRequest', responseSchemaName: 'ApprovalFlowInstanceRecord' },
			{ method: 'post', routeSuffix: '/terminate', requestSchemaName: 'ApprovalFlowActionRequest', responseSchemaName: 'ApprovalFlowInstanceRecord' },
		],
	},
	materialStockLog: {
		baseRoute: '/admin/performance/materialStockLog',
		operations: [
			{ method: 'post', routeSuffix: '/page', requestSchemaName: 'MaterialStockLogPageQuery', responseSchemaName: 'MaterialStockLogPageResult' },
		],
	},
};

const MANUAL_SCHEMAS = {
	ApprovalFlowConfigInfoQuery: {
		type: 'object',
		required: ['objectType'],
		properties: {
			objectType: { type: 'string', description: '审批对象类型' },
		},
	},
	ApprovalFlowInfoQuery: {
		type: 'object',
		required: ['id'],
		properties: {
			id: { type: 'integer', description: '审批实例 ID' },
		},
	},
	ApprovalFlowConfigNode: {
		type: 'object',
		required: ['nodeOrder', 'roleId', 'roleName'],
		properties: {
			nodeOrder: { type: 'integer' },
			roleId: { type: 'integer' },
			roleName: { type: 'string' },
			allowTransfer: { type: 'boolean', nullable: true },
			allowFallback: { type: 'boolean', nullable: true },
			remark: { type: 'string', nullable: true },
		},
	},
	ApprovalFlowConfigRecord: {
		type: 'object',
		required: ['objectType', 'enabled', 'version', 'notifyMode', 'nodes'],
		properties: {
			objectType: { type: 'string' },
			enabled: { type: 'boolean' },
			version: { type: 'string' },
			notifyMode: { type: 'string' },
			nodes: {
				type: 'array',
				items: { $ref: '#/components/schemas/ApprovalFlowConfigNode' },
			},
		},
	},
	ApprovalFlowConfigSaveRequest: {
		type: 'object',
		required: ['objectType', 'version', 'nodes'],
		properties: {
			objectType: { type: 'string' },
			version: { type: 'string' },
			enabled: { type: 'boolean', nullable: true },
			nodes: {
				type: 'array',
				items: { $ref: '#/components/schemas/ApprovalFlowConfigNode' },
			},
		},
	},
	ApprovalFlowInstanceNode: {
		type: 'object',
		properties: {
			id: { type: 'integer', nullable: true },
			nodeOrder: { type: 'integer', nullable: true },
			roleId: { type: 'integer', nullable: true },
			roleName: { type: 'string', nullable: true },
			status: { type: 'string', nullable: true },
			approverId: { type: 'integer', nullable: true },
			approverName: { type: 'string', nullable: true },
			remark: { type: 'string', nullable: true },
			operateTime: { type: 'string', nullable: true },
		},
	},
	ApprovalFlowActionLog: {
		type: 'object',
		properties: {
			id: { type: 'integer', nullable: true },
			action: { type: 'string', nullable: true },
			operatorId: { type: 'integer', nullable: true },
			operatorName: { type: 'string', nullable: true },
			remark: { type: 'string', nullable: true },
			createTime: { type: 'string', nullable: true },
		},
	},
	ApprovalFlowInstanceRecord: {
		type: 'object',
		properties: {
			id: { type: 'integer', nullable: true },
			objectType: { type: 'string', nullable: true },
			objectId: { type: 'integer', nullable: true },
			status: { type: 'string', nullable: true },
			applicantId: { type: 'integer', nullable: true },
			applicantName: { type: 'string', nullable: true },
			departmentId: { type: 'integer', nullable: true },
			departmentName: { type: 'string', nullable: true },
			currentNodeOrder: { type: 'integer', nullable: true },
			nodes: {
				type: 'array',
				items: { $ref: '#/components/schemas/ApprovalFlowInstanceNode' },
			},
			actionLogs: {
				type: 'array',
				items: { $ref: '#/components/schemas/ApprovalFlowActionLog' },
			},
			createTime: { type: 'string', nullable: true },
			updateTime: { type: 'string', nullable: true },
		},
	},
	ApprovalFlowActionRequest: {
		type: 'object',
		required: ['id'],
		properties: {
			id: { type: 'integer' },
			remark: { type: 'string', nullable: true },
		},
	},
	ApprovalFlowTransferRequest: {
		type: 'object',
		required: ['id', 'targetApproverId'],
		properties: {
			id: { type: 'integer' },
			targetApproverId: { type: 'integer' },
			remark: { type: 'string', nullable: true },
		},
	},
	ApprovalFlowResolveRequest: {
		type: 'object',
		required: ['id'],
		properties: {
			id: { type: 'integer' },
			targetApproverId: { type: 'integer', nullable: true },
			remark: { type: 'string', nullable: true },
		},
	},
	OfficeCollabPageQuery: {
		type: 'object',
		required: ['page', 'size'],
		properties: {
			page: { type: 'integer' },
			size: { type: 'integer' },
			keyword: { type: 'string', nullable: true },
			status: { type: 'string', nullable: true },
			category: { type: 'string', nullable: true },
			ownerName: { type: 'string', nullable: true },
		},
	},
	OfficeCollabRecord: {
		type: 'object',
		properties: {
			id: { type: 'integer', nullable: true },
			recordNo: { type: 'string', nullable: true },
			title: { type: 'string' },
			status: { type: 'string', nullable: true },
			department: { type: 'string', nullable: true },
			ownerName: { type: 'string', nullable: true },
			assigneeName: { type: 'string', nullable: true },
			category: { type: 'string', nullable: true },
			priority: { type: 'string', nullable: true },
			version: { type: 'string', nullable: true },
			dueDate: { type: 'string', nullable: true },
			eventDate: { type: 'string', nullable: true },
			progressValue: { type: 'integer', nullable: true },
			scoreValue: { type: 'integer', nullable: true },
			relatedDocumentId: { type: 'integer', nullable: true },
			notes: { type: 'string', nullable: true },
			extJson: {
				type: 'object',
				nullable: true,
				additionalProperties: true,
			},
			createTime: { type: 'string', nullable: true },
			updateTime: { type: 'string', nullable: true },
		},
	},
	OfficeCollabPageResult: {
		type: 'object',
		required: ['list', 'pagination'],
		properties: {
			list: {
				type: 'array',
				items: { $ref: '#/components/schemas/OfficeCollabRecord' },
			},
			pagination: { $ref: '#/components/schemas/PagePagination' },
		},
	},
	OfficeCollabStats: {
		type: 'object',
		additionalProperties: true,
		properties: {
			total: { type: 'integer', nullable: true },
			draftCount: { type: 'integer', nullable: true },
			activeCount: { type: 'integer', nullable: true },
			archivedCount: { type: 'integer', nullable: true },
		},
	},
	MaterialStockLogPageQuery: {
		type: 'object',
		required: ['page', 'size'],
		properties: {
			page: { type: 'integer' },
			size: { type: 'integer' },
			catalogId: { type: 'integer', nullable: true },
			departmentId: { type: 'integer', nullable: true },
			stockId: { type: 'integer', nullable: true },
			bizType: { type: 'string', nullable: true },
			changeType: { type: 'string', nullable: true },
		},
	},
	MaterialStockLogRecord: {
		type: 'object',
		properties: {
			id: { type: 'integer', nullable: true },
			catalogId: { type: 'integer' },
			departmentId: { type: 'integer' },
			stockId: { type: 'integer' },
			bizType: { type: 'string' },
			bizId: { type: 'integer' },
			bizNo: { type: 'string', nullable: true },
			changeType: { type: 'string' },
			quantity: { type: 'integer' },
			beforeQuantity: { type: 'integer' },
			afterQuantity: { type: 'integer' },
			unitCost: { type: 'number' },
			operatedAt: { type: 'string' },
			operatorId: { type: 'integer', nullable: true },
			operatorName: { type: 'string', nullable: true },
			remark: { type: 'string', nullable: true },
		},
	},
	MaterialStockLogPageResult: {
		type: 'object',
		required: ['list', 'pagination'],
		properties: {
			list: {
				type: 'array',
				items: { $ref: '#/components/schemas/MaterialStockLogRecord' },
			},
			pagination: { $ref: '#/components/schemas/PagePagination' },
		},
	},
};

function readJson(filePath) {
	return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function writeJson(filePath, value) {
	fs.mkdirSync(path.dirname(filePath), { recursive: true });
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

function listFiles(dirPath, predicate) {
	return fs
		.readdirSync(dirPath)
		.filter(name => predicate(name))
		.map(name => path.join(dirPath, name))
		.sort();
}

function pascalCase(value) {
	return String(value)
		.replace(/(^|[-_/])([a-zA-Z0-9])/g, (_, __, ch) => ch.toUpperCase())
		.replace(/[^a-zA-Z0-9]/g, '');
}

function camelCase(value) {
	const text = pascalCase(value);
	return text ? `${text[0].toLowerCase()}${text.slice(1)}` : '';
}

function moduleRootFromBaseRoute(baseRoute) {
	return String(baseRoute).split('/').filter(Boolean).pop();
}

function resolvePerformanceRouteRoot(moduleRoot) {
	return moduleRoot === 'approvalFlow' ? 'approval-flow' : moduleRoot;
}

function resolvePerformanceBaseRoute(moduleRoot) {
	return `/admin/performance/${resolvePerformanceRouteRoot(moduleRoot)}`;
}

function resolveOperationModuleRouteRoot(route) {
	const segments = String(route).split('/').filter(Boolean);
	return segments[0] === 'admin' && segments[1] === 'performance' ? segments[2] || '' : '';
}

function normalizeAbsoluteOperationRouteSuffix(route, moduleRoot) {
	const baseRoute = resolvePerformanceBaseRoute(moduleRoot);
	if (!String(route).startsWith(baseRoute)) {
		return '';
	}
	const suffix = String(route).slice(baseRoute.length);
	return suffix ? (suffix.startsWith('/') ? suffix : `/${suffix}`) : '/';
}

function normalizeMethod(value) {
	return String(value).toLowerCase();
}

function unwrapPromise(type, checker) {
	const typeText = checker.typeToString(type);
	if (!typeText.startsWith('Promise<')) {
		return type;
	}

	const typeArgs = checker.getTypeArguments(type);
	return typeArgs[0] || type;
}

function collectProgramFiles(serviceFilePaths) {
	const files = [
		path.join(repoRoot, 'cool-admin-vue/src/modules/performance/types.ts'),
		path.join(repoRoot, 'cool-admin-vue/src/modules/performance/course-learning.types.ts'),
		path.join(repoRoot, 'cool-admin-vue/src/modules/performance/workbench/types.ts'),
		...serviceFilePaths,
	];

	return files;
}

function cleanupGeneratedAreas(spec, removableModuleRoots) {
	const removablePrefixes = new Set(
		removableModuleRoots.map(root => pascalCase(root)).concat(['ApprovalFlow', 'OfficeCollab'])
	);

	for (const route of Object.keys(spec.paths)) {
		const moduleRoot = route.split('/').filter(Boolean)[2];
		if (removableModuleRoots.includes(moduleRoot)) {
			delete spec.paths[route];
		}
	}

	for (const schemaName of Object.keys(spec.components.schemas || {})) {
		for (const prefix of removablePrefixes) {
			if (schemaName.startsWith(prefix) || schemaName.startsWith(`ApiResponse_${prefix}`)) {
				delete spec.components.schemas[schemaName];
				break;
			}
		}
	}

	delete spec.components.schemas.Array;
	delete spec.components.schemas.Record;
}

function createProgram(serviceFilePaths) {
	return ts.createProgram(collectProgramFiles([...new Set(serviceFilePaths)]), {
		target: ts.ScriptTarget.ES2022,
		module: ts.ModuleKind.ESNext,
		moduleResolution: ts.ModuleResolutionKind.Bundler,
		esModuleInterop: true,
		allowSyntheticDefaultImports: true,
		skipLibCheck: true,
		strict: false,
		noEmit: true,
	});
}

function parseControllerSummaries() {
	const summaries = new Map();

	for (const filePath of listFiles(midwayControllerRoot, name => name.endsWith('.ts'))) {
		const text = fs.readFileSync(filePath, 'utf8');
		const controllerBaseMatch = text.match(/@CoolController\(\s*'([^']+)'\s*\)/);
		const fileBase = path.basename(filePath, '.ts');
		const serviceFallbackRoute = `/admin/performance/${camelCase(fileBase)}`;
		const controllerBaseRoute = controllerBaseMatch?.[1] || serviceFallbackRoute;
		const operationRegex =
			/@(Get|Post)\(\s*'([^']+)'\s*,\s*\{\s*summary:\s*'([^']+)'\s*\}\s*\)/g;

		for (const match of text.matchAll(operationRegex)) {
			const method = normalizeMethod(match[1]);
			const route = `${controllerBaseRoute}${match[2]}`;
			summaries.set(`${method} ${route}`, match[3]);
		}
	}

	return summaries;
}

function getExpressionText(node) {
	return node?.getText?.() || '';
}

function getClassMethodOperation(methodNode) {
	const bodyText = methodNode.body?.getText?.() || '';
	if (!bodyText) {
		return null;
	}

	const requestMatch = bodyText.match(/url:\s*'([^']+)'\s*,\s*method:\s*'([A-Z]+)'/);
	if (requestMatch) {
		return {
			method: normalizeMethod(requestMatch[2]),
			routeSuffix: requestMatch[1],
			requestKey: bodyText.includes('params') ? 'params' : 'data',
		};
	}

	if (/super\.page\(/.test(bodyText)) {
		return { method: 'post', routeSuffix: '/page', requestKey: 'data' };
	}
	if (/super\.info\(/.test(bodyText)) {
		return { method: 'get', routeSuffix: '/info', requestKey: 'params' };
	}
	if (/super\.add\(/.test(bodyText)) {
		return { method: 'post', routeSuffix: '/add', requestKey: 'data' };
	}
	if (/super\.update\(/.test(bodyText)) {
		return { method: 'post', routeSuffix: '/update', requestKey: 'data' };
	}
	if (/super\.delete\(/.test(bodyText)) {
		return { method: 'post', routeSuffix: '/delete', requestKey: 'data' };
	}

	return null;
}

function discoverVueServices(program, checker, serviceModules) {
	const services = new Map();
	const parsedServices = new Map();

	for (const serviceModule of serviceModules) {
		const filePath = path.join(
			repoRoot,
			PERFORMANCE_WEB_SERVICE_ROOT,
			serviceModule.serviceFile
		);
		if (!parsedServices.has(filePath)) {
			const sourceFile = program.getSourceFile(filePath);
			if (!sourceFile) {
				parsedServices.set(filePath, null);
				continue;
			}

			let classNode = null;
			for (const statement of sourceFile.statements) {
				if (ts.isClassDeclaration(statement) && statement.name) {
					classNode = statement;
					break;
				}
			}

			if (!classNode) {
				parsedServices.set(filePath, null);
				continue;
			}

			let baseRoute = '';
			let moduleRoot = '';
			const firstHeritageClause = classNode.heritageClauses?.[0];
			const isOfficeWrapper =
				Boolean(firstHeritageClause) &&
				ts.isHeritageClause(firstHeritageClause) &&
				firstHeritageClause.types.some(
					item => getExpressionText(item.expression) === 'PerformanceOfficeLedgerService'
				);

			for (const member of classNode.members) {
				if (!ts.isConstructorDeclaration(member)) {
					continue;
				}

				for (const statement of member.body?.statements || []) {
					if (!ts.isExpressionStatement(statement)) {
						continue;
					}
					if (
						!ts.isCallExpression(statement.expression) ||
						statement.expression.expression.kind !== ts.SyntaxKind.SuperKeyword
					) {
						continue;
					}

					const firstArg = statement.expression.arguments[0];
					if (!firstArg || !ts.isStringLiteral(firstArg)) {
						continue;
					}

					if (isOfficeWrapper) {
						moduleRoot = firstArg.text;
						baseRoute = `/admin/performance/${firstArg.text}`;
					} else {
						baseRoute = firstArg.text.startsWith('/')
							? firstArg.text
							: `/${firstArg.text}`;
						moduleRoot = moduleRootFromBaseRoute(baseRoute);
					}
				}
			}

			if (!baseRoute || !moduleRoot) {
				parsedServices.set(filePath, null);
				continue;
			}

			const operations = [];
			for (const member of classNode.members) {
				if (!ts.isMethodDeclaration(member) || !member.name) {
					continue;
				}

				const operation = getClassMethodOperation(member);
				if (!operation) {
					continue;
				}

				const signature = checker.getSignatureFromDeclaration(member);
				const returnType = signature
					? unwrapPromise(checker.getReturnTypeOfSignature(signature), checker)
					: null;
				const firstParam = member.parameters[0];
				const requestType = firstParam ? checker.getTypeAtLocation(firstParam) : null;

				operations.push({
					methodName: member.name.getText(sourceFile),
					method: operation.method,
					routeSuffix: operation.routeSuffix,
					requestKey: operation.requestKey,
					requestType,
					requestNode: firstParam,
					responseType: returnType,
					filePath,
				});
			}

			parsedServices.set(
				filePath,
				operations.length
					? {
							moduleRoot,
							baseRoute,
							fileBase: path.basename(filePath, '.ts'),
							filePath,
							operations,
					  }
					: null
			);
		}

		const parsedService = parsedServices.get(filePath);
		if (!parsedService) {
			continue;
		}

		const normalizedOperations = [];
		for (const operation of parsedService.operations) {
			if (operation.routeSuffix.startsWith('/admin/performance/')) {
				if (
					resolveOperationModuleRouteRoot(operation.routeSuffix) !==
					resolvePerformanceRouteRoot(serviceModule.moduleRoot)
				) {
					continue;
				}
				const normalizedRouteSuffix = normalizeAbsoluteOperationRouteSuffix(
					operation.routeSuffix,
					serviceModule.moduleRoot
				);
				if (!normalizedRouteSuffix) {
					continue;
				}
				normalizedOperations.push({
					...operation,
					routeSuffix: normalizedRouteSuffix,
				});
				continue;
			}

			if (parsedService.moduleRoot !== resolvePerformanceRouteRoot(serviceModule.moduleRoot)) {
				continue;
			}
			normalizedOperations.push(operation);
		}

		if (!normalizedOperations.length) {
			continue;
		}

		services.set(serviceModule.moduleRoot, {
			moduleRoot: serviceModule.moduleRoot,
			baseRoute: resolvePerformanceBaseRoute(serviceModule.moduleRoot),
			fileBase: parsedService.fileBase,
			filePath,
			operations: normalizedOperations,
		});
	}

	return services;
}

function isNullOrUndefinedType(type) {
	return Boolean(
		type.flags & ts.TypeFlags.Null || type.flags & ts.TypeFlags.Undefined || type.flags & ts.TypeFlags.Void
	);
}

function isPrimitiveType(type) {
	return Boolean(
		type.flags &
			(ts.TypeFlags.StringLike |
				ts.TypeFlags.NumberLike |
				ts.TypeFlags.BooleanLike |
				ts.TypeFlags.BigIntLike)
	);
}

function getSchemaNameForType(type) {
	const symbol = type.aliasSymbol || type.getSymbol();
	if (!symbol) {
		return '';
	}
	const name = symbol.getName();
	if (!name || name === '__type' || name === '__object') {
		return '';
	}
	if (
		[
			'Array',
			'ReadonlyArray',
			'Record',
			'Partial',
			'Required',
			'Pick',
			'Omit',
			'Promise',
		].includes(name)
	) {
		return '';
	}
	return name;
}

function buildSchemaConverter(checker, spec, collectedSchemas) {
	const resolving = new Set();

	function ensureNamedSchema(type, preferredName) {
		const schemaName = preferredName || getSchemaNameForType(type);
		if (!schemaName || spec.components.schemas[schemaName] || collectedSchemas[schemaName]) {
			return schemaName;
		}
		if (resolving.has(schemaName)) {
			return schemaName;
		}

		resolving.add(schemaName);
		const nextSchema = toSchema(type, schemaName);
		collectedSchemas[schemaName] = nextSchema;
		spec.components.schemas[schemaName] = spec.components.schemas[schemaName] || nextSchema;
		resolving.delete(schemaName);
		return schemaName;
	}

	function toSchema(type, currentName = '') {
		if (!type) {
			return { type: 'object', additionalProperties: true };
		}

		if (checker.isArrayType(type) || checker.isTupleType(type)) {
			const itemType = checker.getTypeArguments(type)[0];
			return {
				type: 'array',
				items: toSchema(itemType),
			};
		}

		const typeName = getSchemaNameForType(type);
		if (typeName === 'Array') {
			const [itemType] = checker.getTypeArguments(type);
			return {
				type: 'array',
				items: itemType ? toSchema(itemType) : { type: 'object', additionalProperties: true },
			};
		}
		if (typeName === 'Record') {
			const [, valueType] = checker.getTypeArguments(type);
			return {
				type: 'object',
				additionalProperties: valueType ? toSchema(valueType) : true,
			};
		}
		if (typeName && currentName && typeName === currentName) {
			// fall through and materialize the current schema.
		} else if (typeName && (spec.components.schemas[typeName] || collectedSchemas[typeName])) {
			return { $ref: `#/components/schemas/${typeName}` };
		} else if (typeName && currentName !== typeName) {
			ensureNamedSchema(type, typeName);
			return { $ref: `#/components/schemas/${typeName}` };
		}

		if (type.flags & ts.TypeFlags.Any || type.flags & ts.TypeFlags.Unknown) {
			return { type: 'object', additionalProperties: true };
		}

		if (type.flags & ts.TypeFlags.StringLike) {
			return { type: 'string' };
		}
		if (type.flags & ts.TypeFlags.NumberLike) {
			return { type: 'number' };
		}
		if (type.flags & ts.TypeFlags.BooleanLike) {
			return { type: 'boolean' };
		}

		if (type.isUnion()) {
			const members = type.types.filter(item => !isNullOrUndefinedType(item));
			const nullable = members.length !== type.types.length;
			if (members.length === 0) {
				return { type: 'string', nullable: true };
			}

			const literalValues = [];
			let allLiteral = true;
			for (const member of members) {
				if (
					member.flags & ts.TypeFlags.StringLiteral ||
					member.flags & ts.TypeFlags.NumberLiteral
				) {
					literalValues.push(member.value);
				} else {
					allLiteral = false;
					break;
				}
			}

			if (allLiteral) {
				const first = members[0];
				const baseType =
					first.flags & ts.TypeFlags.NumberLiteral ? 'number' : 'string';
				return {
					type: baseType,
					enum: literalValues,
					...(nullable ? { nullable: true } : {}),
				};
			}

			if (members.length === 1) {
				const schema = toSchema(members[0], currentName);
				if (nullable) {
					schema.nullable = true;
				}
				return schema;
			}

			return {
				oneOf: members.map(member => toSchema(member)),
				...(nullable ? { nullable: true } : {}),
			};
		}

		if (type.isIntersection()) {
			return {
				allOf: type.types.map(member => toSchema(member)),
			};
		}

		const typeString = checker.typeToString(type);
		if (typeString === 'Date') {
			return { type: 'string', format: 'date-time' };
		}
		if (typeString === 'Record<string, unknown>' || typeString.startsWith('Record<string,')) {
			return { type: 'object', additionalProperties: true };
		}

		const properties = type.getProperties();
		const indexType = checker.getIndexTypeOfType(type, ts.IndexKind.String);
		if (properties.length === 0) {
			if (indexType) {
				return {
					type: 'object',
					additionalProperties: toSchema(indexType),
				};
			}
			return { type: 'object', additionalProperties: true };
		}

		const required = [];
		const propertySchemas = {};
		for (const property of properties) {
			const declaration = property.valueDeclaration || property.declarations?.[0];
			if (!declaration) {
				continue;
			}

			const propertyType = checker.getTypeOfSymbolAtLocation(property, declaration);
			const propertySchema = toSchema(propertyType);
			if (
				(property.flags & ts.SymbolFlags.Optional) ||
				propertyType.isUnion() && propertyType.types.some(isNullOrUndefinedType)
			) {
				if (propertySchema.$ref) {
					propertySchemas[property.getName()] = propertySchema;
				} else {
					propertySchemas[property.getName()] = {
						...propertySchema,
						nullable: propertySchema.nullable || propertyType.isUnion() && propertyType.types.some(item => item.flags & ts.TypeFlags.Null),
					};
				}
			} else {
				required.push(property.getName());
				propertySchemas[property.getName()] = propertySchema;
			}
		}

		const schema = {
			type: 'object',
			properties: propertySchemas,
		};

		if (required.length > 0) {
			schema.required = required;
		}
		if (indexType) {
			schema.additionalProperties = toSchema(indexType);
		}
		return schema;
	}

	return {
		toSchema,
		ensureNamedSchema,
	};
}

function ensureApiResponseSchema(spec, responseSchemaName, responseSchema) {
	const wrapperName = responseSchemaName
		? `ApiResponse_${responseSchemaName}`
		: 'ApiResponse_void';
	spec.components.schemas[wrapperName] = {
		type: 'object',
		required: ['code', 'message', 'data'],
		properties: {
			code: { type: 'integer' },
			message: { type: 'string' },
			data: responseSchema || { type: 'object', nullable: true },
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

function buildOperationId(moduleRoot, routeSuffix) {
	const suffix = routeSuffix
		.split('/')
		.filter(Boolean)
		.map(part => pascalCase(part))
		.join('');
	return `performance${pascalCase(moduleRoot)}${suffix}`;
}

function ensureModuleOperations(spec, moduleInfo, controllerSummaries, converter) {
	const moduleRoot = moduleInfo.moduleRoot;
	const baseRoute = moduleInfo.baseRoute;

	for (const operation of moduleInfo.operations) {
		const fullRoute = `${baseRoute}${operation.routeSuffix}`;
		spec.paths[fullRoute] = spec.paths[fullRoute] || {};

		const operationSchema = {
			tags: [`performance.${moduleRoot}`],
			summary:
				controllerSummaries.get(`${operation.method} ${fullRoute}`) ||
				`${moduleRoot} ${operation.methodName || operation.routeSuffix}`,
			operationId: buildOperationId(moduleRoot, operation.routeSuffix),
			responses: {},
		};

		if (operation.requestType) {
			const requestSchemaName =
				operation.requestSchemaName ||
				`${pascalCase(moduleRoot)}${pascalCase(operation.methodName || operation.routeSuffix.replace(/^\//, ''))}${operation.method === 'get' ? 'Query' : 'Request'}`;
			const requestSchema = converter.toSchema(operation.requestType, requestSchemaName);
			const requestSchemaRefName = requestSchema.$ref
				? requestSchema.$ref.split('/').pop()
				: requestSchemaName;
			if (!requestSchema.$ref) {
				spec.components.schemas[requestSchemaName] = requestSchema;
			}

			if (operation.method === 'get') {
				const querySchema =
					requestSchema.$ref
						? spec.components.schemas[requestSchemaRefName]
						: requestSchema;
				operationSchema.parameters = buildQueryParameters(querySchema);
				operationSchema['x-querySchemaRef'] = `#/components/schemas/${requestSchemaRefName}`;
			} else {
				operationSchema.requestBody = {
					required: true,
					content: {
						'application/json': {
							schema: {
								$ref: `#/components/schemas/${requestSchemaRefName}`,
							},
						},
					},
				};
			}
		}

		let responseWrapperName = 'ApiResponse_void';
		if (operation.responseType) {
			const responseSchemaName =
				operation.responseSchemaName ||
				(() => {
					const named = getSchemaNameForType(operation.responseType);
					if (named) {
						return named;
					}
					return `${pascalCase(moduleRoot)}${pascalCase(
						operation.methodName || operation.routeSuffix.replace(/^\//, '')
					)}Result`;
				})();
			const responseSchema = converter.toSchema(operation.responseType, responseSchemaName);
			if (!responseSchema.$ref) {
				spec.components.schemas[responseSchemaName] = responseSchema;
			}
			responseWrapperName = ensureApiResponseSchema(
				spec,
				responseSchema.$ref ? responseSchema.$ref.split('/').pop() : responseSchemaName,
				responseSchema.$ref ? responseSchema : responseSchema
			);
		} else if (!spec.components.schemas.ApiResponse_void) {
			ensureApiResponseSchema(spec, '', { type: 'object', nullable: true });
		}

		operationSchema.responses['200'] = {
			description: `${operationSchema.summary}结果`,
			content: {
				'application/json': {
					schema: {
						$ref: `#/components/schemas/${responseWrapperName}`,
					},
				},
			},
		};

		spec.paths[fullRoute][operation.method] = operationSchema;
	}
}

function createSharedOfficeModule(moduleRoot) {
	return {
		moduleRoot,
		baseRoute: `/admin/performance/${moduleRoot}`,
		operations: [
			{ method: 'post', routeSuffix: '/page', requestSchemaName: 'OfficeCollabPageQuery', responseSchemaName: 'OfficeCollabPageResult' },
			{ method: 'get', routeSuffix: '/info', requestSchemaName: 'ApprovalFlowInfoQuery', responseSchemaName: 'OfficeCollabRecord' },
			{ method: 'get', routeSuffix: '/stats', requestSchemaName: 'OfficeCollabPageQuery', responseSchemaName: 'OfficeCollabStats' },
			{ method: 'post', routeSuffix: '/add', requestSchemaName: 'OfficeCollabRecord', responseSchemaName: 'OfficeCollabRecord' },
			{ method: 'post', routeSuffix: '/update', requestSchemaName: 'OfficeCollabRecord', responseSchemaName: 'OfficeCollabRecord' },
			{ method: 'post', routeSuffix: '/delete', requestSchemaName: 'DeleteIdsRequest', responseSchemaName: '' },
		],
	};
}

function deepClone(value) {
	return JSON.parse(JSON.stringify(value));
}

function stripRequired(schema) {
	if (!schema || typeof schema !== 'object') {
		return schema;
	}
	const next = deepClone(schema);
	delete next.required;
	return next;
}

function backfillMissingSchemas(spec) {
	const referenced = new Set();
	const visit = value => {
		if (!value || typeof value !== 'object') {
			return;
		}
		if (Array.isArray(value)) {
			value.forEach(visit);
			return;
		}
		if (value.$ref) {
			referenced.add(value.$ref.split('/').pop());
			return;
		}
		Object.values(value).forEach(visit);
	};

	visit(spec.paths);
	visit(spec.components.schemas);

	const inferFallbackSchema = schemaName => {
		const candidates = [
			schemaName.replace(/Create[A-Z][A-Za-z0-9]*Request$/, 'Record'),
			schemaName.replace(/Update[A-Z][A-Za-z0-9]*Request$/, 'Record'),
			schemaName.replace(/SyncDingtalkApprovalRequest$/, 'Record'),
			schemaName.replace(/SubmitTaskRequest$/, 'SubmitPayload'),
			schemaName.replace(/Request$/, 'Record'),
			schemaName.replace(/Query$/, 'PageQuery'),
		];

		for (const candidate of candidates) {
			if (spec.components.schemas[candidate]) {
				return /Request$/.test(schemaName)
					? stripRequired(spec.components.schemas[candidate])
					: deepClone(spec.components.schemas[candidate]);
			}
		}

		return {
			type: 'object',
			additionalProperties: true,
		};
	};

	for (const schemaName of referenced) {
		if (spec.components.schemas[schemaName]) {
			continue;
		}
		spec.components.schemas[schemaName] = inferFallbackSchema(schemaName);
	}
}

function main() {
	const write = process.argv.includes('--write');
	const contractSource = loadPerformanceContractSourceConfig(repoRoot);
	const spec = readJson(openapiPath);
	spec.components = spec.components || {};
	spec.components.schemas = spec.components.schemas || {};
	spec.paths = spec.paths || {};
	const removableModuleRoots = [
		...contractSource.producer.manualModules.map(item => item.moduleRoot),
		...contractSource.producer.serviceModules.map(item => item.moduleRoot),
	];
	cleanupGeneratedAreas(spec, removableModuleRoots);

	for (const [name, schema] of Object.entries(MANUAL_SCHEMAS)) {
		spec.components.schemas[name] = spec.components.schemas[name] || schema;
	}
	if (!spec.components.schemas.ApiResponse_void) {
		ensureApiResponseSchema(spec, '', { type: 'object', nullable: true });
	}

	const program = createProgram(
		contractSource.producer.serviceModules.map(item =>
			path.join(repoRoot, PERFORMANCE_WEB_SERVICE_ROOT, item.serviceFile)
		)
	);
	const checker = program.getTypeChecker();
	const controllerSummaries = parseControllerSummaries();
	const discoveredServices = discoverVueServices(
		program,
		checker,
		contractSource.producer.serviceModules
	);
	const collectedSchemas = {};
	const converter = buildSchemaConverter(checker, spec, collectedSchemas);

	for (const manualModule of contractSource.producer.manualModules) {
		if (manualModule.strategy === 'shared_office_collab') {
			const sharedModule = createSharedOfficeModule(manualModule.moduleRoot);
			ensureModuleOperations(spec, sharedModule, controllerSummaries, converter);
			continue;
		}

		const manualPreset = MANUAL_OPERATION_PRESETS[manualModule.operationPreset];
		if (manualPreset?.operations) {
			ensureModuleOperations(
				spec,
				{
					moduleRoot: manualModule.moduleRoot,
					baseRoute: manualPreset.baseRoute,
					operations: manualPreset.operations,
				},
				controllerSummaries,
				converter
			);
		}
	}

	for (const serviceModule of contractSource.producer.serviceModules) {
		const discovered = discoveredServices.get(serviceModule.moduleRoot);
		if (!discovered) {
			continue;
		}
		ensureModuleOperations(spec, discovered, controllerSummaries, converter);
	}

	for (const [schemaName, schema] of Object.entries(collectedSchemas)) {
		if (!spec.components.schemas[schemaName]) {
			spec.components.schemas[schemaName] = schema;
		}
	}
	backfillMissingSchemas(spec);
	sortOpenapiSpec(spec);

	if (write) {
		writeJson(openapiPath, spec);
		console.log('[sync-performance-openapi-ssot] write completed.');
		return;
	}

	const next = `${JSON.stringify(spec, null, 2)}\n`;
	const current = fs.readFileSync(openapiPath, 'utf8');
	if (current !== next) {
		throw new Error('contracts/openapi/xuedao.openapi.json is out of date.');
	}
	console.log('[sync-performance-openapi-ssot] check passed.');
}

main();
