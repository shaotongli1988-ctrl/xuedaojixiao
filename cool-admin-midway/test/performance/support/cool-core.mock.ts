/**
 * Jest 用的 @cool-midway/core 最小桩。
 * 这里只提供当前单测依赖的最小导出，不模拟真实框架行为。
 */
export class CoolCommException extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'CoolCommException';
  }
}

export class BaseService {}

export class CoolBaseEntity {}

export class CoolUrlTagData {
  byKey() {
    return [];
  }
}

export const TagTypes = {
  IGNORE_TOKEN: 'ignoreToken',
};
