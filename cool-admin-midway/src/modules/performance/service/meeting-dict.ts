/**
 * 会议业务字典事实源。
 * 这里只负责 meeting 域状态字典导出，不负责会议签到、参与人回显或会议效能分析逻辑。
 * 维护重点是服务端合法状态集合与多端展示标签必须同源，避免列表、表单和详情抽屉各写一份。
 */
import type { BusinessDictGroup, BusinessDictItem } from './indicator-dict';

interface MeetingOption {
  value: string;
  label: string;
  orderNum: number;
  tone?: string;
}

export const MEETING_STATUS_VALUES = [
  'scheduled',
  'in_progress',
  'completed',
  'cancelled',
] as const;

export const MEETING_STATUS_DICT_KEY = 'performance.meeting.status';
export const MEETING_DICT_VERSION = 'meeting-v1';

const MEETING_STATUS_OPTIONS: ReadonlyArray<MeetingOption> = [
  {
    value: 'scheduled',
    label: '已安排',
    orderNum: 10,
    tone: 'info',
  },
  {
    value: 'in_progress',
    label: '进行中',
    orderNum: 20,
    tone: 'warning',
  },
  {
    value: 'completed',
    label: '已结束',
    orderNum: 30,
    tone: 'success',
  },
  {
    value: 'cancelled',
    label: '已取消',
    orderNum: 40,
    tone: 'info',
  },
];

function createItems(): BusinessDictItem[] {
  return MEETING_STATUS_OPTIONS.map(option => ({
    id: `${MEETING_STATUS_DICT_KEY}:${option.value}`,
    name: option.label,
    value: option.value,
    orderNum: option.orderNum,
    parentId: null,
    tone: option.tone,
  }));
}

export function getMeetingBusinessDictGroups(): BusinessDictGroup[] {
  return [
    {
      key: MEETING_STATUS_DICT_KEY,
      version: MEETING_DICT_VERSION,
      items: createItems(),
    },
  ];
}
