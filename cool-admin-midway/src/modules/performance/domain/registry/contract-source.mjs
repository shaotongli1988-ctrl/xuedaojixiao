/**
 * Performance API contract module coverage source loader.
 * It only owns machine-readable producer/consumer target metadata and does not generate OpenAPI or frontend files itself.
 * Key dependencies are registry JSON, OpenAPI sync scripts, and contract closure guards.
 * Maintenance invariant: module coverage and generated target ownership must be edited here first, then consumed by scripts.
 */

import fs from 'node:fs';
import path from 'node:path';

export const PERFORMANCE_CONTRACT_SOURCE_CONFIG_RELATIVE_PATH =
  'cool-admin-midway/src/modules/performance/domain/registry/contract-source.json';

export const PERFORMANCE_CONTROLLER_ROOT =
  'cool-admin-midway/src/modules/performance/controller/admin';
export const PERFORMANCE_WEB_SERVICE_ROOT =
  'cool-admin-vue/src/modules/performance/service';
export const PERFORMANCE_WEB_GENERATED_ROOT =
  'cool-admin-vue/src/modules/performance/generated';
export const PERFORMANCE_UNI_SERVICE_ROOT = 'cool-uni/service/performance';
export const PERFORMANCE_UNI_GENERATED_ROOT = 'cool-uni/generated';
export const PERFORMANCE_UNI_TYPE_ROOT = 'cool-uni/types';

export function toKebabCase(value) {
  return String(value)
    .replace(/([a-z0-9])([A-Z])/g, '$1-$2')
    .replace(/_/g, '-')
    .toLowerCase();
}

function normalizeStringList(value) {
  return Array.isArray(value)
    ? value.map(item => String(item || '').trim()).filter(Boolean)
    : [];
}

function normalizeProducerManualModule(item) {
  return {
    moduleRoot: String(item?.moduleRoot || '').trim(),
    controllerFile: String(item?.controllerFile || '').trim(),
    strategy: String(item?.strategy || '').trim(),
    operationPreset: String(item?.operationPreset || '').trim(),
  };
}

function normalizeProducerServiceModule(item) {
  return {
    moduleRoot: String(item?.moduleRoot || '').trim(),
    controllerFile: String(item?.controllerFile || '').trim(),
    serviceFile: String(item?.serviceFile || '').trim(),
  };
}

function normalizeConsumerTarget(item) {
  return {
    targetKey: String(item?.targetKey || '').trim(),
    moduleRoots: normalizeStringList(item?.moduleRoots),
    serviceFiles: normalizeStringList(item?.serviceFiles),
    contractAdapterFiles: normalizeStringList(item?.contractAdapterFiles),
  };
}

function withResolvedPaths(target, serviceRoot, generatedPath, extra = {}) {
  return {
    ...target,
    servicePaths: target.serviceFiles.map(file => `${serviceRoot}/${file}`),
    generatedPath,
    ...extra,
  };
}

export function loadPerformanceContractSourceConfig(repoRoot) {
  const sourceConfigPath = path.join(
    repoRoot,
    PERFORMANCE_CONTRACT_SOURCE_CONFIG_RELATIVE_PATH
  );
  const sourceConfig = JSON.parse(fs.readFileSync(sourceConfigPath, 'utf8'));

  const webTargets = normalizeStringList([])
    .concat()
    .slice(0, 0);

  return {
    sourceConfigPath,
    version: String(sourceConfig.version || '').trim(),
    ownedSourceFiles: normalizeStringList(sourceConfig.ownedSourceFiles),
    producer: {
      publishOnlyModules: normalizeStringList(
        sourceConfig.producer?.publishOnlyModules
      ),
      manualModules: Array.isArray(sourceConfig.producer?.manualModules)
        ? sourceConfig.producer.manualModules.map(normalizeProducerManualModule)
        : [],
      serviceModules: Array.isArray(sourceConfig.producer?.serviceModules)
        ? sourceConfig.producer.serviceModules.map(normalizeProducerServiceModule)
        : [],
    },
    consumers: {
      webSupportFiles: normalizeStringList(
        sourceConfig.consumers?.webSupportFiles
      ).map(file => `${PERFORMANCE_WEB_SERVICE_ROOT}/${file}`),
      webTargets: Array.isArray(sourceConfig.consumers?.webTargets)
        ? sourceConfig.consumers.webTargets.map(item =>
            withResolvedPaths(
              normalizeConsumerTarget(item),
              PERFORMANCE_WEB_SERVICE_ROOT,
              `${PERFORMANCE_WEB_GENERATED_ROOT}/${String(item?.targetKey || '').trim()}.ts`,
              {
                contractAdapterPaths: normalizeStringList(
                  item?.contractAdapterFiles
                ).map(
                  file => `${PERFORMANCE_WEB_SERVICE_ROOT}/${file}`
                ),
              }
            )
          )
        : webTargets,
      uniTargets: Array.isArray(sourceConfig.consumers?.uniTargets)
        ? sourceConfig.consumers.uniTargets.map(item =>
            withResolvedPaths(
              normalizeConsumerTarget(item),
              PERFORMANCE_UNI_SERVICE_ROOT,
              `${PERFORMANCE_UNI_GENERATED_ROOT}/performance-${String(
                item?.targetKey || ''
              ).trim()}.generated.ts`,
              {
                typeWrapperPath: `${PERFORMANCE_UNI_TYPE_ROOT}/performance-${String(
                  item?.targetKey || ''
                ).trim()}.ts`,
              }
            )
          )
        : [],
    },
  };
}

export function resolvePerformanceContractOwnedSourceFiles(repoRoot) {
  const sourceConfig = loadPerformanceContractSourceConfig(repoRoot);
  return sourceConfig.ownedSourceFiles.length
    ? sourceConfig.ownedSourceFiles
    : [PERFORMANCE_CONTRACT_SOURCE_CONFIG_RELATIVE_PATH];
}
