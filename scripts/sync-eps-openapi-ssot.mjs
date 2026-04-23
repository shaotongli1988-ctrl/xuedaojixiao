#!/usr/bin/env node

/**
 * Builds a TypeScript-only SSOT view for cool-admin-vue dynamic EPS services from the repository OpenAPI source.
 * It only owns admin-side EPS type tightening and does not replace runtime EPS generation or performance's static service wrappers.
 * Key dependencies are the checked-in EPS declaration, EPS route snapshot and contracts/openapi/xuedao.openapi.json.
 * Maintenance invariant: non-performance admin EPS consumers must converge on repository OpenAPI types through eps.ssot.d.ts.
 */

import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, '..');
const openapiPath = path.join(repoRoot, 'contracts/openapi/xuedao.openapi.json');
const epsJsonPath = path.join(repoRoot, 'cool-admin-vue/build/cool/eps.json');
const epsBaseDtsPath = path.join(repoRoot, 'cool-admin-vue/build/cool/eps.d.ts');
const epsSsotDtsPath = path.join(repoRoot, 'cool-admin-vue/build/cool/eps.ssot.d.ts');

const EXCLUDED_MODULES = new Set(['performance', 'swagger']);
const RESPONSE_TYPE_OVERRIDES = {
	['get /admin/base/open/eps']: 'EpsData',
	['get /admin/base/comm/permmenu']: '{ menus: Menu.List; perms: string[] }',
	['post /admin/base/open/login']:
		'{ token: string; expire: number; refreshToken: string; refreshExpire: number; permissionMask?: string | null }',
	['get /admin/base/open/refreshToken']:
		'{ token: string; expire: number; refreshToken: string; refreshExpire: number; permissionMask?: string | null }',
};

function readJson(filePath) {
	return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function parseArgs(argv) {
	return {
		write: argv.includes('--write'),
	};
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

function formatName(value) {
	return String(value || '').replace(/[:,\s/\-]/g, '');
}

function resourceInterfaceName(prefix) {
	return pascalCase(prefix.replace(/^\/admin\//, '').replace(/\//g, ' '));
}

function methodName(api) {
	const raw = api.name || api.path.split('/').filter(Boolean).pop() || api.method;
	return camelCase(formatName(raw));
}

function loadExistingTypeNames(baseContent) {
	const names = new Set();
	for (const match of baseContent.matchAll(/\b(?:interface|type)\s+([A-Za-z0-9_]+)\b/g)) {
		names.add(match[1]);
	}
	return names;
}

function renderComment(description, indent = '') {
	if (!description) {
		return '';
	}
	const lines = description.split('\n').map(line => `${indent} * ${line}`.trimEnd());
	return `${indent}/**\n${lines.join('\n')}\n${indent} */\n`;
}

function withNullable(typeText, schema) {
	if (!schema?.nullable) {
		return typeText;
	}
	return typeText.includes('null') ? typeText : `${typeText} | null`;
}

function schemaTypeToTs(schema) {
	if (!schema) {
		return 'unknown';
	}

	if (schema.$ref) {
		return schema.$ref.split('/').pop();
	}

	if (schema.enum) {
		return schema.enum.map(value => JSON.stringify(value)).join(' | ');
	}

	if (schema.oneOf?.length) {
		return schema.oneOf.map(item => schemaTypeToTs(item)).join(' | ');
	}

	if (schema.anyOf?.length) {
		return schema.anyOf.map(item => schemaTypeToTs(item)).join(' | ');
	}

	if (schema.allOf?.length) {
		return schema.allOf.map(item => schemaTypeToTs(item)).join(' & ');
	}

	if (schema.type === 'array') {
		return `Array<${schemaTypeToTs(schema.items)}>`;
	}

	if (schema.type === 'integer' || schema.type === 'number') {
		return 'number';
	}

	if (schema.type === 'string') {
		return 'string';
	}

	if (schema.type === 'boolean') {
		return 'boolean';
	}

	if (schema.type === 'object') {
		if (!schema.properties) {
			return 'Record<string, unknown>';
		}
		const required = new Set(schema.required || []);
		const fields = Object.entries(schema.properties).map(([name, propertySchema]) => {
			const optional = required.has(name) ? '' : '?';
			const valueType = withNullable(schemaTypeToTs(propertySchema), propertySchema);
			return `${name}${optional}: ${valueType};`;
		});
		return `{\n${fields.map(field => `  ${field}`).join('\n')}\n}`;
	}

	if (schema.nullable) {
		return 'null';
	}

	return 'unknown';
}

function renderSchema(name, schema) {
	const comment = renderComment(schema.description, '\t');

	if (schema.enum) {
		return `${comment}\ttype ${name} = ${schemaTypeToTs(schema)};\n`;
	}

	if (schema.type === 'object') {
		const required = new Set(schema.required || []);
		const fields = Object.entries(schema.properties || {}).map(([propertyName, propertySchema]) => {
			const propertyComment = renderComment(propertySchema.description, '\t\t');
			const optional = required.has(propertyName) ? '' : '?';
			const propertyType = withNullable(schemaTypeToTs(propertySchema), propertySchema);
			return `${propertyComment}\t\t${propertyName}${optional}: ${propertyType};`;
		});

		if (schema.additionalProperties && !schema.properties) {
			return `${comment}\tinterface ${name} {\n\t\t[key: string]: ${schema.additionalProperties === true ? 'unknown' : schemaTypeToTs(schema.additionalProperties)};\n\t}\n`;
		}

		return `${comment}\tinterface ${name} {\n${fields.join('\n')}\n${schema.additionalProperties ? `\t\t[key: string]: ${schema.additionalProperties === true ? 'unknown' : schemaTypeToTs(schema.additionalProperties)};\n` : ''}\t}\n`;
	}

	return `${comment}\ttype ${name} = ${withNullable(schemaTypeToTs(schema), schema)};\n`;
}

function collectSchemaDependencies(spec, rootSchemaNames) {
	const visited = new Set();

	function walkSchema(schema) {
		if (!schema || typeof schema !== 'object') {
			return;
		}

		if (schema.$ref) {
			const refName = schema.$ref.split('/').pop();
			if (refName && !visited.has(refName)) {
				visited.add(refName);
				walkSchema(spec.components.schemas[refName]);
			}
		}

		if (schema.items) {
			walkSchema(schema.items);
		}

		for (const nested of schema.oneOf || []) {
			walkSchema(nested);
		}

		for (const nested of schema.anyOf || []) {
			walkSchema(nested);
		}

		for (const nested of schema.allOf || []) {
			walkSchema(nested);
		}

		for (const propertySchema of Object.values(schema.properties || {})) {
			walkSchema(propertySchema);
		}

		if (schema.additionalProperties && schema.additionalProperties !== true) {
			walkSchema(schema.additionalProperties);
		}
	}

	for (const rootSchema of rootSchemaNames) {
		visited.add(rootSchema);
		walkSchema(spec.components.schemas[rootSchema]);
	}

	return Array.from(visited).sort();
}

function unwrapResponseDataSchema(spec, operation) {
	const schema =
		operation?.responses?.['200']?.content?.['application/json']?.schema;
	if (!schema) {
		return null;
	}

	if (schema.$ref) {
		const wrapperName = schema.$ref.split('/').pop();
		const wrapperSchema = spec.components.schemas?.[wrapperName];
		return wrapperSchema?.properties?.data || null;
	}

	return schema.properties?.data || null;
}

function getOperationTypeNames(spec, operation) {
	const requestBodySchema =
		operation?.requestBody?.content?.['application/json']?.schema || null;
	const querySchemaRef = operation?.['x-querySchemaRef'] || '';
	const dataSchema = unwrapResponseDataSchema(spec, operation);

	const requestSchemaName = requestBodySchema?.$ref
		? requestBodySchema.$ref.split('/').pop()
		: querySchemaRef
			? String(querySchemaRef).split('/').pop()
			: '';
	const responseSchemaName = dataSchema?.$ref ? dataSchema.$ref.split('/').pop() : '';
	const responseType =
		responseSchemaName ||
		(!dataSchema || dataSchema.nullable || dataSchema.type === 'null'
			? 'void'
			: withNullable(schemaTypeToTs(dataSchema), dataSchema));

	return {
		requestSchemaName,
		responseSchemaName,
		responseType,
	};
}

function collectResources() {
	return readJson(epsJsonPath)
		.filter(item => item?.prefix?.startsWith('/admin/'))
		.filter(item => !EXCLUDED_MODULES.has(item.prefix.split('/')[2]))
		.sort((left, right) => left.prefix.localeCompare(right.prefix));
}

function buildAugmentation(spec, resources, existingTypeNames) {
	const rootSchemaNames = new Set();
	const blocks = [];

	for (const resource of resources) {
		const interfaceName = resourceInterfaceName(resource.prefix);
		const entityTypeName =
			resource.name && existingTypeNames.has(resource.name) ? resource.name : '';
		const pageResponseTypeName = existingTypeNames.has(`${interfaceName}PageResponse`)
			? `${interfaceName}PageResponse`
			: '';
		const methodLines = [];

		for (const api of resource.api || []) {
			const route = `${resource.prefix}${api.path}`;
			const method = String(api.method || 'get').toLowerCase();
			const operation = spec.paths?.[route]?.[method];
			if (!operation) {
				continue;
			}

			const nextMethodName = methodName(api);
			const { requestSchemaName, responseSchemaName, responseType } = getOperationTypeNames(spec, operation);
			if (requestSchemaName) {
				rootSchemaNames.add(requestSchemaName);
			}
			if (responseSchemaName) {
				rootSchemaNames.add(responseSchemaName);
			}
			const responseTypeOverride =
				RESPONSE_TYPE_OVERRIDES[`${method} ${route}`] ||
				(api.path === '/page' && pageResponseTypeName
					? pageResponseTypeName
					: api.path === '/list' && entityTypeName
						? `Array<${entityTypeName}>`
						: api.path === '/info' && entityTypeName
							? entityTypeName
							: '');
			const finalResponseType = responseTypeOverride || responseType;

			const signature = requestSchemaName
				? `${nextMethodName}(data: ${requestSchemaName}): Promise<${finalResponseType}>;`
				: `${nextMethodName}(data?: never): Promise<${finalResponseType}>;`;
			methodLines.push(
				`${renderComment(operation.summary || nextMethodName, '\t\t')}\t\t${signature}`
			);
		}

		if (methodLines.length > 0) {
			blocks.push(`\tinterface ${interfaceName} {\n${methodLines.join('\n')}\n\t}\n`);
		}
	}

	const schemaBlocks = collectSchemaDependencies(spec, Array.from(rootSchemaNames))
		.filter(name => !existingTypeNames.has(name))
		.map(name => renderSchema(name, spec.components.schemas[name]).trimEnd());

	return `declare namespace Eps {\n${schemaBlocks.join('\n\n')}${schemaBlocks.length ? '\n\n' : ''}${blocks.join('\n')}\n}\n`;
}

function main() {
	const args = parseArgs(process.argv.slice(2));
	const spec = readJson(openapiPath);
	const baseContent = fs.readFileSync(epsBaseDtsPath, 'utf8').trimEnd();
	const resources = collectResources();
	const augmentation = buildAugmentation(spec, resources, loadExistingTypeNames(baseContent));
	const nextContent = `${baseContent}\n\n/**\n * Repository OpenAPI SSOT augmentation for dynamic EPS admin consumers.\n * Do not hand edit this file; rerun scripts/sync-eps-openapi-ssot.mjs.\n */\n\n${augmentation}`;
	const currentContent = fs.existsSync(epsSsotDtsPath) ? fs.readFileSync(epsSsotDtsPath, 'utf8') : null;

	if (currentContent === nextContent) {
		console.log('[sync-eps-openapi-ssot] check passed.');
		return;
	}

	if (!args.write) {
		throw new Error('cool-admin-vue/build/cool/eps.ssot.d.ts is out of date.');
	}

	fs.writeFileSync(epsSsotDtsPath, nextContent);
	console.log('[sync-eps-openapi-ssot] write completed.');
}

main();
