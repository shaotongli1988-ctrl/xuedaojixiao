#!/usr/bin/env node

/**
 * Builds and verifies generated contract TypeScript types from the repository OpenAPI source.
 * It only owns the migrated performance contract sample and does not replace broader build/test gates.
 * The main maintenance invariant is that generated files must be reproducible from the OpenAPI source.
 */

import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';
import { loadPerformanceContractSourceConfig } from '../cool-admin-midway/src/modules/performance/domain/registry/contract-source.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, '..');
const openapiPath = path.join(repoRoot, 'contracts/openapi/xuedao.openapi.json');

const extraSchemaNamesByModule = new Map([
  ['goal', ['GoalOpsDepartmentScopeQuery', 'GoalOpsReportQuery']],
]);

function toKebabCase(value) {
  return String(value)
    .replace(/([a-z0-9])([A-Z])/g, '$1-$2')
    .replace(/_/g, '-')
    .toLowerCase();
}

function parseStringLiteral(text, regex) {
  const match = text.match(regex);
  return match?.[1] || '';
}

function discoverModuleTargets() {
  const spec = readOpenapiSpec();
  const contractSource = loadPerformanceContractSourceConfig(repoRoot);
  const targets = [];
  const moduleOperationsCache = new Map();

  const collectModuleOperations = moduleRoots => {
    const operations = [];

    for (const moduleRoot of moduleRoots) {
      if (!moduleOperationsCache.has(moduleRoot)) {
        moduleOperationsCache.set(
          moduleRoot,
          Object.entries(spec.paths || {})
            .filter(([route]) => route.startsWith(`/admin/performance/${moduleRoot}`))
            .flatMap(([route, methods]) => Object.keys(methods).map(method => [method, route]))
        );
      }

      operations.push(...moduleOperationsCache.get(moduleRoot));
    }

    return Array.from(
      new Map(operations.map(item => [`${item[0]} ${item[1]}`, item])).values()
    );
  };

  for (const target of contractSource.consumers.webTargets) {
    targets.push({
      moduleRoots: target.moduleRoots,
      requiredOperations: collectModuleOperations(target.moduleRoots),
      outputs: [
        {
          path: path.join(repoRoot, target.generatedPath),
          moduleLabel: `cool-admin-vue performance ${target.targetKey}`,
        },
      ],
    });
  }

  for (const target of contractSource.consumers.uniTargets) {
    targets.push({
      moduleRoots: target.moduleRoots,
      requiredOperations: collectModuleOperations(target.moduleRoots),
      outputs: [
        {
          path: path.join(repoRoot, target.generatedPath),
          moduleLabel: `cool-uni performance ${target.targetKey}`,
        },
      ],
    });
  }

  return targets;
}

function parseArgs(argv) {
  return {
    write: argv.includes('--write'),
  };
}

function readOpenapiSpec() {
  return JSON.parse(fs.readFileSync(openapiPath, 'utf8'));
}

function assertSpecCoverage(spec) {
  for (const target of discoverModuleTargets()) {
    for (const [method, route] of target.requiredOperations) {
      if (!spec.paths?.[route]?.[method]) {
        throw new Error(`missing operation: ${method.toUpperCase()} ${route}`);
      }
    }
  }
}

function renderComment(description, indent = '') {
  if (!description) {
    return '';
  }

  const lines = description.split('\n').map(line => `${indent} * ${line}`.trimEnd());
  return `${indent}/**\n${lines.join('\n')}\n${indent} */\n`;
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
  }

  for (const rootSchema of rootSchemaNames) {
    visited.add(rootSchema);
    walkSchema(spec.components.schemas[rootSchema]);
  }

  return Array.from(visited);
}

function collectOperationSchemaDependencies(spec, requiredOperations) {
  const refs = new Set();

  function walk(value) {
    if (!value || typeof value !== 'object') {
      return;
    }

    if (value.$ref) {
      refs.add(value.$ref.split('/').pop());
      return;
    }

    if (Array.isArray(value)) {
      for (const item of value) {
        walk(item);
      }
      return;
    }

    for (const nested of Object.values(value)) {
      walk(nested);
    }
  }

  for (const [method, route] of requiredOperations) {
    const operation = spec.paths?.[route]?.[method];
    if (!operation) {
      continue;
    }
    walk(operation.requestBody);
    walk(operation.responses);
    walk(operation.parameters);
    if (operation['x-querySchemaRef']) {
      refs.add(String(operation['x-querySchemaRef']).split('/').pop());
    }
  }

  return collectSchemaDependencies(spec, Array.from(refs));
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

function withNullable(typeText, schema) {
  if (!schema?.nullable) {
    return typeText;
  }

  return typeText.includes('null') ? typeText : `${typeText} | null`;
}

function renderSchema(name, schema) {
  const comment = renderComment(schema.description);

  if (schema.enum) {
    return `${comment}export type ${name} = ${schemaTypeToTs(schema)};\n`;
  }

  if (schema.type === 'object') {
    const required = new Set(schema.required || []);
    const fields = Object.entries(schema.properties || {}).map(([propertyName, propertySchema]) => {
      const propertyComment = renderComment(propertySchema.description, '\t');
      const optional = required.has(propertyName) ? '' : '?';
      const propertyType = withNullable(schemaTypeToTs(propertySchema), propertySchema);
      return `${propertyComment}\t${propertyName}${optional}: ${propertyType};`;
    });

    return `${comment}export interface ${name} {\n${fields.join('\n')}\n}\n`;
  }

  return `${comment}export type ${name} = ${withNullable(schemaTypeToTs(schema), schema)};\n`;
}

function buildGeneratedContent(spec, moduleLabel, rootSchemaNames) {
  const schemaNames = collectSchemaDependencies(spec, rootSchemaNames);
  const schemaBlocks = schemaNames.map(name => renderSchema(name, spec.components.schemas[name]).trimEnd());

  return `/**
 * Generated from contracts/openapi/xuedao.openapi.json for ${moduleLabel}.
 * Do not hand edit this file; update the OpenAPI source and rerun scripts/openapi-contract-sync.mjs.
 */

${schemaBlocks.join('\n\n')}
`;
}

function syncTarget(spec, target, write, schemaNames) {
  const nextContent = buildGeneratedContent(spec, target.moduleLabel, schemaNames);
  const currentContent = fs.existsSync(target.path) ? fs.readFileSync(target.path, 'utf8') : null;

  if (currentContent === nextContent) {
    return { changed: false };
  }

  if (!write) {
    throw new Error(`generated contract types are out of date: ${path.relative(repoRoot, target.path)}`);
  }

  fs.mkdirSync(path.dirname(target.path), { recursive: true });
  fs.writeFileSync(target.path, nextContent);
  return { changed: true };
}

function main() {
  const args = parseArgs(process.argv.slice(2));
  const spec = readOpenapiSpec();
  const generationTargets = discoverModuleTargets();
  assertSpecCoverage(spec);

  const results = generationTargets.flatMap(group =>
    group.outputs.map(target => ({
      target,
      ...syncTarget(
        spec,
        target,
        args.write,
        Array.from(
          new Set([
            ...collectOperationSchemaDependencies(spec, group.requiredOperations),
            ...group.moduleRoots.flatMap(
              moduleRoot => extraSchemaNamesByModule.get(moduleRoot) || []
            ),
          ])
        )
      ),
    }))
  );

  const changedCount = results.filter(result => result.changed).length;
  const modeText = args.write ? 'write' : 'check';
  console.log(`[openapi-contract-sync] ${modeText} passed, ${changedCount} target(s) updated.`);
}

main();
