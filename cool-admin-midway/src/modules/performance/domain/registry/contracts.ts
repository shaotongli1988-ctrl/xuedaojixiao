/**
 * Performance API contract module coverage registry.
 * It only exposes producer and consumer ownership metadata for scripts and governance consumers.
 * Key dependencies are the machine-readable contract-source JSON and backend domain registry aggregation.
 * Maintenance invariant: module coverage is additive-first and must not silently drift away from checked-in generated targets.
 */

import performanceContractSource = require('./contract-source.json');

export type PerformanceContractProducerStrategy =
  | 'manual_operations'
  | 'service_discovery'
  | 'shared_office_collab';

export interface PerformanceContractManualModule {
  moduleRoot: string;
  controllerFile: string;
  strategy: PerformanceContractProducerStrategy;
  operationPreset: string;
  controllerPath: string;
}

export interface PerformanceContractServiceModule {
  moduleRoot: string;
  controllerFile: string;
  controllerPath: string;
  serviceFile: string;
  servicePath: string;
}

export interface PerformanceContractConsumerTarget {
  targetKey: string;
  moduleRoots: readonly string[];
  serviceFiles: readonly string[];
  servicePaths: readonly string[];
  generatedPath: string;
  contractAdapterFiles?: readonly string[];
  contractAdapterPaths?: readonly string[];
  typeWrapperPath?: string;
}

interface RawPerformanceContractManualModule {
  moduleRoot: string;
  controllerFile: string;
  strategy: PerformanceContractProducerStrategy;
  operationPreset: string;
}

interface RawPerformanceContractServiceModule {
  moduleRoot: string;
  controllerFile: string;
  serviceFile: string;
}

interface RawPerformanceContractConsumerTarget {
  targetKey: string;
  moduleRoots: readonly string[];
  serviceFiles: readonly string[];
  contractAdapterFiles?: readonly string[];
}

interface RawPerformanceContractSourceRegistry {
  version: string;
  ownedSourceFiles: readonly string[];
  producer: {
    publishOnlyModules: readonly string[];
    manualModules: readonly RawPerformanceContractManualModule[];
    serviceModules: readonly RawPerformanceContractServiceModule[];
  };
  consumers: {
    webSupportFiles: readonly string[];
    webTargets: readonly RawPerformanceContractConsumerTarget[];
    uniTargets: readonly RawPerformanceContractConsumerTarget[];
  };
}

export interface PerformanceContractSourceRegistry {
  version: string;
  ownedSourceFiles: readonly string[];
  producer: {
    publishOnlyModules: readonly string[];
    manualModules: readonly PerformanceContractManualModule[];
    serviceModules: readonly PerformanceContractServiceModule[];
  };
  consumers: {
    webSupportFiles: readonly string[];
    webTargets: readonly PerformanceContractConsumerTarget[];
    uniTargets: readonly PerformanceContractConsumerTarget[];
  };
}

const CONTROLLER_ROOT =
  'cool-admin-midway/src/modules/performance/controller/admin';
const WEB_SERVICE_ROOT = 'cool-admin-vue/src/modules/performance/service';
const WEB_GENERATED_ROOT = 'cool-admin-vue/src/modules/performance/generated';
const UNI_SERVICE_ROOT = 'cool-uni/service/performance';
const UNI_GENERATED_ROOT = 'cool-uni/generated';
const UNI_TYPES_ROOT = 'cool-uni/types';

const PERFORMANCE_CONTRACT_SOURCE =
  performanceContractSource as RawPerformanceContractSourceRegistry;

function resolveControllerPath(file: string) {
  return `${CONTROLLER_ROOT}/${file}`;
}

function resolveWebServicePath(file: string) {
  return `${WEB_SERVICE_ROOT}/${file}`;
}

function resolveWebGeneratedPath(targetKey: string) {
  return `${WEB_GENERATED_ROOT}/${targetKey}.ts`;
}

function resolveUniServicePath(file: string) {
  return `${UNI_SERVICE_ROOT}/${file}`;
}

function resolveUniGeneratedPath(targetKey: string) {
  return `${UNI_GENERATED_ROOT}/performance-${targetKey}.generated.ts`;
}

function resolveUniTypeWrapperPath(targetKey: string) {
  return `${UNI_TYPES_ROOT}/performance-${targetKey}.ts`;
}

export const PERFORMANCE_CONTRACT_SOURCE_VERSION =
  PERFORMANCE_CONTRACT_SOURCE.version;

export const PERFORMANCE_CONTRACT_REGISTRY: PerformanceContractSourceRegistry =
  Object.freeze({
    version: PERFORMANCE_CONTRACT_SOURCE.version,
    ownedSourceFiles: PERFORMANCE_CONTRACT_SOURCE.ownedSourceFiles,
    producer: {
      publishOnlyModules:
        PERFORMANCE_CONTRACT_SOURCE.producer.publishOnlyModules,
      manualModules: PERFORMANCE_CONTRACT_SOURCE.producer.manualModules.map(
        item =>
          Object.freeze({
            ...item,
            controllerPath: resolveControllerPath(item.controllerFile),
          })
      ),
      serviceModules: PERFORMANCE_CONTRACT_SOURCE.producer.serviceModules.map(
        item =>
          Object.freeze({
            ...item,
            controllerPath: resolveControllerPath(item.controllerFile),
            servicePath: resolveWebServicePath(item.serviceFile),
          })
      ),
    },
    consumers: {
      webSupportFiles:
        PERFORMANCE_CONTRACT_SOURCE.consumers.webSupportFiles.map(file =>
          resolveWebServicePath(file)
        ),
      webTargets: PERFORMANCE_CONTRACT_SOURCE.consumers.webTargets.map(item =>
        Object.freeze({
          ...item,
          servicePaths: item.serviceFiles.map(resolveWebServicePath),
          generatedPath: resolveWebGeneratedPath(item.targetKey),
          contractAdapterPaths: (item.contractAdapterFiles || []).map(
            resolveWebServicePath
          ),
        })
      ),
      uniTargets: PERFORMANCE_CONTRACT_SOURCE.consumers.uniTargets.map(item =>
        Object.freeze({
          ...item,
          servicePaths: item.serviceFiles.map(resolveUniServicePath),
          generatedPath: resolveUniGeneratedPath(item.targetKey),
          typeWrapperPath: resolveUniTypeWrapperPath(item.targetKey),
        })
      ),
    },
  });
