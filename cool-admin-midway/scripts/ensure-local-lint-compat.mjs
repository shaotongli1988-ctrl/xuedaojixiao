/**
 * Ensures the local `.shared-deps` tree stays compatible with the pinned Midway lint toolchain.
 * This only repairs local offline lint/runtime compatibility shims for `mwts` + ESLint.
 * It does not install dependencies from the network or change business source files.
 * Maintenance pitfall: keep these shims minimal and scoped to local lint compatibility only.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = resolveProjectRoot(process.argv.slice(2));
const nodeModulesRoot = path.join(projectRoot, '.shared-deps', 'js', 'node_modules');

function resolveProjectRoot(args) {
  const defaultRoot = path.resolve(scriptDir, '..');
  const projectRootFlagIndex = args.indexOf('--project-root');

  if (projectRootFlagIndex === -1) {
    return defaultRoot;
  }

  const explicitRoot = args[projectRootFlagIndex + 1];
  if (!explicitRoot) {
    throw new Error('Missing value for --project-root');
  }

  return path.resolve(explicitRoot);
}

function ensureDir(targetPath) {
  fs.mkdirSync(targetPath, { recursive: true });
}

function writeFile(targetPath, content) {
  ensureDir(path.dirname(targetPath));
  if (!fs.existsSync(targetPath) || fs.readFileSync(targetPath, 'utf8') !== content) {
    fs.writeFileSync(targetPath, content);
  }
}

function replaceOnce(content, searchValue, replaceValue, filePath) {
  if (!content.includes(searchValue)) {
    throw new Error(`Cannot patch expected content in ${filePath}`);
  }
  return content.replace(searchValue, replaceValue);
}

function patchFile(targetPath, transform) {
  if (!fs.existsSync(targetPath)) {
    return false;
  }
  const original = fs.readFileSync(targetPath, 'utf8');
  const patched = transform(original);
  if (patched !== original) {
    fs.writeFileSync(targetPath, patched);
  }
  return true;
}

const draft04Schema = `{
  "id": "http://json-schema.org/draft-04/schema#",
  "$schema": "http://json-schema.org/draft-04/schema#",
  "description": "Core schema meta-schema",
  "definitions": {
    "schemaArray": {
      "type": "array",
      "minItems": 1,
      "items": {
        "$ref": "#"
      }
    },
    "positiveInteger": {
      "type": "integer",
      "minimum": 0
    },
    "positiveIntegerDefault0": {
      "allOf": [
        {
          "$ref": "#/definitions/positiveInteger"
        },
        {
          "default": 0
        }
      ]
    },
    "simpleTypes": {
      "enum": [
        "array",
        "boolean",
        "integer",
        "null",
        "number",
        "object",
        "string"
      ]
    },
    "stringArray": {
      "type": "array",
      "items": {
        "type": "string"
      },
      "minItems": 1,
      "uniqueItems": true
    }
  },
  "type": "object",
  "properties": {
    "id": {
      "type": "string"
    },
    "$schema": {
      "type": "string"
    },
    "title": {
      "type": "string"
    },
    "description": {
      "type": "string"
    },
    "default": {},
    "multipleOf": {
      "type": "number",
      "minimum": 0,
      "exclusiveMinimum": true
    },
    "maximum": {
      "type": "number"
    },
    "exclusiveMaximum": {
      "type": "boolean",
      "default": false
    },
    "minimum": {
      "type": "number"
    },
    "exclusiveMinimum": {
      "type": "boolean",
      "default": false
    },
    "maxLength": {
      "$ref": "#/definitions/positiveInteger"
    },
    "minLength": {
      "$ref": "#/definitions/positiveIntegerDefault0"
    },
    "pattern": {
      "type": "string",
      "format": "regex"
    },
    "additionalItems": {
      "anyOf": [
        {
          "type": "boolean"
        },
        {
          "$ref": "#"
        }
      ],
      "default": {}
    },
    "items": {
      "anyOf": [
        {
          "$ref": "#"
        },
        {
          "$ref": "#/definitions/schemaArray"
        }
      ],
      "default": {}
    },
    "maxItems": {
      "$ref": "#/definitions/positiveInteger"
    },
    "minItems": {
      "$ref": "#/definitions/positiveIntegerDefault0"
    },
    "uniqueItems": {
      "type": "boolean",
      "default": false
    },
    "maxProperties": {
      "$ref": "#/definitions/positiveInteger"
    },
    "minProperties": {
      "$ref": "#/definitions/positiveIntegerDefault0"
    },
    "required": {
      "$ref": "#/definitions/stringArray"
    },
    "additionalProperties": {
      "anyOf": [
        {
          "type": "boolean"
        },
        {
          "$ref": "#"
        }
      ],
      "default": {}
    },
    "definitions": {
      "type": "object",
      "additionalProperties": {
        "$ref": "#"
      },
      "default": {}
    },
    "properties": {
      "type": "object",
      "additionalProperties": {
        "$ref": "#"
      },
      "default": {}
    },
    "patternProperties": {
      "type": "object",
      "additionalProperties": {
        "$ref": "#"
      },
      "default": {}
    },
    "dependencies": {
      "type": "object",
      "additionalProperties": {
        "anyOf": [
          {
            "$ref": "#"
          },
          {
            "$ref": "#/definitions/stringArray"
          }
        ]
      }
    },
    "enum": {
      "type": "array",
      "minItems": 1,
      "uniqueItems": true
    },
    "type": {
      "anyOf": [
        {
          "$ref": "#/definitions/simpleTypes"
        },
        {
          "type": "array",
          "items": {
            "$ref": "#/definitions/simpleTypes"
          },
          "minItems": 1,
          "uniqueItems": true
        }
      ]
    },
    "format": {
      "type": "string"
    },
    "allOf": {
      "$ref": "#/definitions/schemaArray"
    },
    "anyOf": {
      "$ref": "#/definitions/schemaArray"
    },
    "oneOf": {
      "$ref": "#/definitions/schemaArray"
    },
    "not": {
      "$ref": "#"
    }
  },
  "dependencies": {
    "exclusiveMaximum": [
      "maximum"
    ],
    "exclusiveMinimum": [
      "minimum"
    ]
  },
  "default": {}
}
`;

const ajvCompatSource = `/**
 * @fileoverview The instance of Ajv validator.
 * @author Evgeny Poberezkin
 */
"use strict";

const Ajv = require("ajv"),
    metaSchema = require("ajv/lib/refs/json-schema-draft-04.json");

module.exports = (additionalOptions = {}) => {
    const normalizedAdditionalOptions = { ...additionalOptions };

    delete normalizedAdditionalOptions.missingRefs;

    if (Object.prototype.hasOwnProperty.call(normalizedAdditionalOptions, "strictDefaults")) {
        if (normalizedAdditionalOptions.strictDefaults === false) {
            normalizedAdditionalOptions.strict = false;
        }
        delete normalizedAdditionalOptions.strictDefaults;
    }

    const ajv = new Ajv({
        meta: false,
        useDefaults: true,
        validateSchema: false,
        verbose: true,
        schemaId: "auto",
        strict: false,
        ...normalizedAdditionalOptions
    });

    ajv.addMetaSchema(metaSchema);
    const defaultMeta = metaSchema.$id || metaSchema.id;

    if (ajv._opts) {
        ajv._opts.defaultMeta = defaultMeta;
    } else if (ajv.opts) {
        ajv.opts.defaultMeta = defaultMeta;
    }

    return ajv;
};
`;

const prettierShimPackage = `{
  "name": "prettier",
  "version": "2.8.8",
  "main": "index.js"
}
`;

const prettierShimSource = `/**
 * Local Prettier compatibility shim for Midway lint.
 * This only exists to provide the synchronous API surface expected by the
 * pinned ESLint plugin/tooling in the shared offline deps tree.
 * It is not responsible for real formatting and intentionally returns source unchanged.
 */
'use strict';

const path = require('path');

const inferParser = filepath => {
  const ext = path.extname(filepath || '').toLowerCase();

  switch (ext) {
    case '.ts': return 'typescript';
    case '.tsx': return 'babel-ts';
    case '.json': return 'json';
    case '.md': return 'markdown';
    case '.vue': return 'vue';
    case '.scss':
    case '.css': return 'css';
    case '.html': return 'html';
    default: return 'babel';
  }
};

const resolveConfig = async () => null;
resolveConfig.sync = () => null;

const getFileInfo = async filepath => ({ ignored: false, inferredParser: inferParser(filepath) });
getFileInfo.sync = filepath => ({ ignored: false, inferredParser: inferParser(filepath) });

module.exports = {
  version: '2.8.8',
  resolveConfig,
  getFileInfo,
  getSupportInfo() {
    return {
      languages: [
        { parsers: ['babel'] },
        { parsers: ['typescript'] },
        { parsers: ['babel-ts'] },
        { parsers: ['json'] },
        { parsers: ['markdown'] },
        { parsers: ['vue'] },
        { parsers: ['css'] },
        { parsers: ['html'] }
      ]
    };
  },
  clearConfigCache() {},
  format(source) {
    return source;
  }
};
`;

const simplePackages = new Map([
  ['trim-newlines', {
    packageJson: '{\n  "name": "trim-newlines",\n  "version": "3.0.1",\n  "main": "index.js"\n}\n',
    source: `'use strict';\n\nfunction trimNewlines(value) {\n\tif (typeof value !== 'string') {\n\t\treturn value;\n\t}\n\treturn value.replace(/^[\\r\\n]+|[\\r\\n]+$/g, '');\n}\n\nmodule.exports = trimNewlines;\nmodule.exports.default = trimNewlines;\n`,
  }],
  ['redent', {
    packageJson: '{\n  "name": "redent",\n  "version": "3.0.0",\n  "main": "index.js"\n}\n',
    source: `'use strict';\n\nfunction indentString(value, count, options = {}) {\n\tconst indent = (options.indent || ' ').repeat(count);\n\tconst includeEmptyLines = options.includeEmptyLines === true;\n\treturn String(value)\n\t\t.split('\\n')\n\t\t.map(line => {\n\t\t\tif (!line.length && !includeEmptyLines) {\n\t\t\t\treturn line;\n\t\t\t}\n\t\t\treturn \`\${indent}\${line}\`;\n\t\t})\n\t\t.join('\\n');\n}\n\nfunction stripIndent(value) {\n\tconst lines = String(value).replace(/^\\n+|\\n+$/g, '').split('\\n');\n\tconst indents = lines\n\t\t.filter(line => line.trim())\n\t\t.map(line => {\n\t\t\tconst matched = line.match(/^[ \\t]*/);\n\t\t\treturn matched ? matched[0].length : 0;\n\t\t});\n\tconst minimumIndent = indents.length ? Math.min(...indents) : 0;\n\treturn lines.map(line => line.slice(minimumIndent)).join('\\n');\n}\n\nmodule.exports = function redent(value, count = 0, options = {}) {\n\treturn indentString(stripIndent(value), count, options);\n};\n`,
  }],
  ['read-pkg-up', {
    packageJson: '{\n  "name": "read-pkg-up",\n  "version": "7.0.1",\n  "main": "index.js"\n}\n',
    source: `'use strict';\n\nconst fs = require('fs');\nconst path = require('path');\n\nfunction readPkgSync(targetPath, normalize) {\n\tconst packageJson = JSON.parse(fs.readFileSync(targetPath, 'utf8'));\n\tif (normalize) {\n\t\treturn packageJson;\n\t}\n\treturn packageJson;\n}\n\nfunction findPackageJson(startDir) {\n\tlet currentDir = path.resolve(startDir || process.cwd());\n\twhile (true) {\n\t\tconst packageJsonPath = path.join(currentDir, 'package.json');\n\t\tif (fs.existsSync(packageJsonPath)) {\n\t\t\treturn packageJsonPath;\n\t\t}\n\t\tconst parentDir = path.dirname(currentDir);\n\t\tif (parentDir === currentDir) {\n\t\t\treturn null;\n\t\t}\n\t\tcurrentDir = parentDir;\n\t}\n}\n\nfunction sync(options = {}) {\n\tconst packageJsonPath = findPackageJson(options.cwd);\n\tif (!packageJsonPath) {\n\t\treturn undefined;\n\t}\n\treturn {\n\t\tpath: packageJsonPath,\n\t\tpackageJson: readPkgSync(packageJsonPath, options.normalize !== false)\n\t};\n}\n\nmodule.exports = { sync };\n`,
  }],
  ['validate-npm-package-license', {
    packageJson: '{\n  "name": "validate-npm-package-license",\n  "version": "3.0.4",\n  "main": "index.js"\n}\n',
    source: `'use strict';\n\nmodule.exports = function validateNpmPackageLicense(value) {\n\tconst valid = typeof value === 'string' && value.trim().length > 0;\n\treturn {\n\t\tvalidForNewPackages: valid,\n\t\tvalidForOldPackages: valid,\n\t\tspdx: valid ? value.trim() : null,\n\t\twarnings: valid ? [] : ['license is empty'],\n\t\terrors: valid ? [] : ['license is empty']\n\t};\n};\n`,
  }],
  ['ncp', {
    packageJson: '{\n  "name": "ncp",\n  "version": "2.0.0",\n  "main": "index.js"\n}\n',
    source: `'use strict';\n\nconst fs = require('fs');\nconst path = require('path');\n\nfunction copyRecursive(source, target, callback) {\n\tfs.stat(source, (statError, stats) => {\n\t\tif (statError) {\n\t\t\tcallback(statError);\n\t\t\treturn;\n\t\t}\n\n\t\tif (stats.isDirectory()) {\n\t\t\tfs.mkdir(target, { recursive: true }, mkdirError => {\n\t\t\t\tif (mkdirError) {\n\t\t\t\t\tcallback(mkdirError);\n\t\t\t\t\treturn;\n\t\t\t\t}\n\t\t\t\tfs.readdir(source, (readError, entries) => {\n\t\t\t\t\tif (readError) {\n\t\t\t\t\t\tcallback(readError);\n\t\t\t\t\t\treturn;\n\t\t\t\t\t}\n\t\t\t\t\tlet index = 0;\n\t\t\t\t\tconst next = error => {\n\t\t\t\t\t\tif (error) {\n\t\t\t\t\t\t\tcallback(error);\n\t\t\t\t\t\t\treturn;\n\t\t\t\t\t\t}\n\t\t\t\t\t\tif (index >= entries.length) {\n\t\t\t\t\t\t\tcallback(null);\n\t\t\t\t\t\t\treturn;\n\t\t\t\t\t\t}\n\t\t\t\t\t\tconst entry = entries[index++];\n\t\t\t\t\t\tcopyRecursive(path.join(source, entry), path.join(target, entry), next);\n\t\t\t\t\t};\n\t\t\t\t\tnext(null);\n\t\t\t\t});\n\t\t\t});\n\t\t\treturn;\n\t\t}\n\n\t\tfs.mkdir(path.dirname(target), { recursive: true }, mkdirError => {\n\t\t\tif (mkdirError) {\n\t\t\t\tcallback(mkdirError);\n\t\t\t\treturn;\n\t\t\t}\n\t\t\tfs.copyFile(source, target, callback);\n\t\t});\n\t});\n}\n\nmodule.exports.ncp = copyRecursive;\n`,
  }],
]);

ensureDir(nodeModulesRoot);
writeFile(path.join(nodeModulesRoot, 'ajv', 'lib', 'refs', 'json-schema-draft-04.json'), draft04Schema);
writeFile(path.join(nodeModulesRoot, 'prettier', 'package.json'), prettierShimPackage);
writeFile(path.join(nodeModulesRoot, 'prettier', 'index.js'), prettierShimSource);

for (const [packageName, files] of simplePackages) {
  writeFile(path.join(nodeModulesRoot, packageName, 'package.json'), files.packageJson);
  writeFile(path.join(nodeModulesRoot, packageName, 'index.js'), files.source);
}

writeFile(path.join(nodeModulesRoot, '@eslint', 'eslintrc', 'lib', 'shared', 'ajv.js'), ajvCompatSource);
writeFile(path.join(nodeModulesRoot, 'eslint', 'lib', 'shared', 'ajv.js'), ajvCompatSource);

patchFile(path.join(nodeModulesRoot, 'eslint-plugin-prettier', 'eslint-plugin-prettier.js'), content => {
  if (content.includes('Prettier 3 removed the sync config/file-info APIs')) {
    return content;
  }

  return replaceOnce(
    content,
    "            const eslintPrettierOptions = context.options[0] || {};\n",
    "            // Prettier 3 removed the sync config/file-info APIs that this plugin version expects.\n            // Degrade gracefully so ESLint can continue running the non-Prettier rule set locally.\n            if (\n              !prettier ||\n              !prettier.resolveConfig ||\n              typeof prettier.resolveConfig.sync !== 'function' ||\n              !prettier.getFileInfo ||\n              typeof prettier.getFileInfo.sync !== 'function'\n            ) {\n              return;\n            }\n\n            const eslintPrettierOptions = context.options[0] || {};\n",
    'eslint-plugin-prettier.js'
  );
});

patchFile(path.join(nodeModulesRoot, 'mwts', 'dist', 'src', 'cli.js'), content => {
  let next = content;

  if (!next.includes('let updateNotifier = () => ({ notify() { } });')) {
    next = replaceOnce(
      next,
      'const execa = require("execa");\nconst updateNotifier = require("update-notifier");\n',
      'const execa = require("execa");\nlet updateNotifier = () => ({ notify() { } });\ntry {\n    updateNotifier = require("update-notifier");\n}\ncatch (_error) {\n    updateNotifier = () => ({ notify() { } });\n}\n',
      'mwts/dist/src/cli.js'
    );
  }

  if (!next.includes("return 'unavailable';")) {
    next = replaceOnce(
      next,
      "function getPrettierVersion() {\n    const packageJson = (0, util_1.readJSON)(require.resolve('prettier/package.json'));\n    return packageJson.version;\n}\n",
      "function getPrettierVersion() {\n    try {\n        const packageJson = (0, util_1.readJSON)(require.resolve('prettier/package.json'));\n        return packageJson.version;\n    }\n    catch (_error) {\n        return 'unavailable';\n    }\n}\n",
      'mwts/dist/src/cli.js'
    );
  }

  return next;
});

console.log('[ensure-local-lint-compat] OK');
