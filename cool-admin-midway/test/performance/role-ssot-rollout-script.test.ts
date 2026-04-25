/**
 * 验证 performance 角色 SSOT 批量收口脚本的守卫结果。
 * 这里只负责确认遗留 service 没有回退到本地解析 auth context/perms，
 * 不负责覆盖各业务模块的 capability/scope 语义测试。
 */
import { execFileSync } from 'node:child_process';
import * as path from 'node:path';

describe('performance role ssot rollout script', () => {
  test('should keep performance services on shared auth context helpers', () => {
    const repoRoot = path.resolve(__dirname, '..', '..', '..');
    const output = execFileSync(
      'node',
      ['scripts/rollout-performance-role-ssot.mjs', '--check'],
      {
        cwd: repoRoot,
        encoding: 'utf8',
      }
    );

    expect(output).toContain('SSOT rollout check passed.');
  });

  test('should keep performance frontend role drift checks clean', () => {
    const repoRoot = path.resolve(__dirname, '..', '..', '..');
    const output = execFileSync(
      'node',
      ['scripts/rollout-performance-role-ssot.mjs', '--frontend-check'],
      {
        cwd: repoRoot,
        encoding: 'utf8',
      }
    );

    expect(output).toContain('Frontend SSOT check passed.');
  });
});
