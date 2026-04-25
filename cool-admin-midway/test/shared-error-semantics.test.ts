/**
 * Base/User/Dict 共享错误目录回归测试。
 * 这里负责验证共享错误目录覆盖当前 runtime 抛错文案，不负责完整业务链路或 HTTP 响应封装。
 */

import * as fs from 'node:fs';
import * as path from 'node:path';

import {
  BASE_DOMAIN_ERRORS,
  BASE_DOMAIN_ERROR_RUNTIME_SOURCES,
} from '../src/modules/base/domain';
import {
  USER_DOMAIN_ERRORS,
  USER_DOMAIN_ERROR_RUNTIME_SOURCES,
} from '../src/modules/user/domain';
import {
  DICT_DOMAIN_ERRORS,
  DICT_DOMAIN_ERROR_RUNTIME_SOURCES,
} from '../src/modules/dict/domain';

function normalizeTemplatePlaceholders(message: string) {
  return message.replace(/\$\{([^}]+)\}/g, '{$1}');
}

function extractRuntimeMessages(source: string) {
  const messages: string[] = [];
  const pattern =
    /throw new (?:CoolCommException|Error)\(\s*(?:`([^`]+)`|(['"])(.*?)\2)/gs;

  for (const match of source.matchAll(pattern)) {
    const rawMessage = match[1] || match[3] || '';
    messages.push(normalizeTemplatePlaceholders(rawMessage));
  }

  return messages;
}

describe('shared error semantics', () => {
  const repoRoot = path.resolve(__dirname, '..');

  test('should keep base runtime messages aligned with base error catalog', () => {
    const catalogMessages = new Set<string>(
      BASE_DOMAIN_ERRORS.map(item => item.defaultMessage)
    );

    for (const relativePath of BASE_DOMAIN_ERROR_RUNTIME_SOURCES) {
      const source = fs.readFileSync(path.join(repoRoot, relativePath), 'utf8');
      for (const message of extractRuntimeMessages(source)) {
        expect(catalogMessages.has(message)).toBe(true);
      }
    }
  });

  test('should keep user runtime messages aligned with user error catalog', () => {
    const catalogMessages = new Set<string>(
      USER_DOMAIN_ERRORS.map(item => item.defaultMessage)
    );

    for (const relativePath of USER_DOMAIN_ERROR_RUNTIME_SOURCES) {
      const source = fs.readFileSync(path.join(repoRoot, relativePath), 'utf8');
      for (const message of extractRuntimeMessages(source)) {
        expect(catalogMessages.has(message)).toBe(true);
      }
    }
  });

  test('should keep dict runtime messages aligned with dict error catalog', () => {
    const catalogMessages = new Set<string>(
      DICT_DOMAIN_ERRORS.map(item => item.defaultMessage)
    );

    for (const relativePath of DICT_DOMAIN_ERROR_RUNTIME_SOURCES) {
      const source = fs.readFileSync(path.join(repoRoot, relativePath), 'utf8');
      for (const message of extractRuntimeMessages(source)) {
        expect(catalogMessages.has(message)).toBe(true);
      }
    }
  });
});
