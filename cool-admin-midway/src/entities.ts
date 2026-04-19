// 自动生成的文件，请勿手动修改
import * as entity0 from './modules/base/entity/base';
import * as entity1 from './modules/base/entity/sys/conf';
import * as entity2 from './modules/base/entity/sys/department';
import * as entity3 from './modules/base/entity/sys/log';
import * as entity4 from './modules/base/entity/sys/menu';
import * as entity5 from './modules/base/entity/sys/param';
import * as entity6 from './modules/base/entity/sys/role_department';
import * as entity7 from './modules/base/entity/sys/role_menu';
import * as entity8 from './modules/base/entity/sys/role';
import * as entity9 from './modules/base/entity/sys/user_role';
import * as entity10 from './modules/base/entity/sys/user';
import * as entity11 from './modules/demo/entity/goods';
import * as entity12 from './modules/dict/entity/info';
import * as entity13 from './modules/dict/entity/type';
import * as entity14 from './modules/performance/entity/approval-action-log';
import * as entity15 from './modules/performance/entity/approval-config-node';
import * as entity16 from './modules/performance/entity/approval-config';
import * as entity17 from './modules/performance/entity/approval-instance-node';
import * as entity18 from './modules/performance/entity/approval-instance';
import * as entity19 from './modules/performance/entity/assessment-score';
import * as entity20 from './modules/performance/entity/assessment';
import * as entity21 from './modules/performance/entity/assetAssignment';
import * as entity22 from './modules/performance/entity/assetDepreciation';
import * as entity23 from './modules/performance/entity/assetDisposal';
import * as entity24 from './modules/performance/entity/assetInfo';
import * as entity25 from './modules/performance/entity/assetInventory';
import * as entity26 from './modules/performance/entity/assetMaintenance';
import * as entity27 from './modules/performance/entity/assetProcurement';
import * as entity28 from './modules/performance/entity/assetTransfer';
import * as entity29 from './modules/performance/entity/capability-item';
import * as entity30 from './modules/performance/entity/capability-model';
import * as entity31 from './modules/performance/entity/capability-portrait';
import * as entity32 from './modules/performance/entity/certificate-record';
import * as entity33 from './modules/performance/entity/certificate';
import * as entity34 from './modules/performance/entity/contract';
import * as entity35 from './modules/performance/entity/course-enrollment';
import * as entity36 from './modules/performance/entity/course-exam-result';
import * as entity37 from './modules/performance/entity/course-practice';
import * as entity38 from './modules/performance/entity/course-recite';
import * as entity39 from './modules/performance/entity/course';
import * as entity40 from './modules/performance/entity/documentCenter';
import * as entity41 from './modules/performance/entity/feedback-record';
import * as entity42 from './modules/performance/entity/feedback-task';
import * as entity43 from './modules/performance/entity/goal-progress';
import * as entity44 from './modules/performance/entity/goal';
import * as entity45 from './modules/performance/entity/hiring';
import * as entity46 from './modules/performance/entity/indicator';
import * as entity47 from './modules/performance/entity/intellectualProperty';
import * as entity48 from './modules/performance/entity/interview';
import * as entity49 from './modules/performance/entity/job-standard';
import * as entity50 from './modules/performance/entity/knowledgeBase';
import * as entity51 from './modules/performance/entity/knowledgeQa';
import * as entity52 from './modules/performance/entity/meeting';
import * as entity53 from './modules/performance/entity/officeCollab';
import * as entity54 from './modules/performance/entity/pip-record';
import * as entity55 from './modules/performance/entity/pip';
import * as entity56 from './modules/performance/entity/promotion-record';
import * as entity57 from './modules/performance/entity/promotion';
import * as entity58 from './modules/performance/entity/purchase-order';
import * as entity59 from './modules/performance/entity/recruit-plan';
import * as entity60 from './modules/performance/entity/resumePool';
import * as entity61 from './modules/performance/entity/salary-change';
import * as entity62 from './modules/performance/entity/salary';
import * as entity63 from './modules/performance/entity/suggestion';
import * as entity64 from './modules/performance/entity/supplier';
import * as entity65 from './modules/performance/entity/talentAsset';
import * as entity66 from './modules/performance/entity/teacher-agent-audit';
import * as entity67 from './modules/performance/entity/teacher-agent-relation';
import * as entity68 from './modules/performance/entity/teacher-agent';
import * as entity69 from './modules/performance/entity/teacher-attribution-conflict';
import * as entity70 from './modules/performance/entity/teacher-attribution';
import * as entity71 from './modules/performance/entity/teacher-class';
import * as entity72 from './modules/performance/entity/teacher-follow';
import * as entity73 from './modules/performance/entity/teacher-info';
import * as entity74 from './modules/performance/entity/vehicle';
import * as entity75 from './modules/plugin/entity/info';
import * as entity76 from './modules/recycle/entity/data';
import * as entity77 from './modules/space/entity/info';
import * as entity78 from './modules/space/entity/type';
import * as entity79 from './modules/task/entity/info';
import * as entity80 from './modules/task/entity/log';
import * as entity81 from './modules/user/entity/address';
import * as entity82 from './modules/user/entity/info';
import * as entity83 from './modules/user/entity/wx';
export const entities = [
  ...Object.values(entity0),
  ...Object.values(entity1),
  ...Object.values(entity2),
  ...Object.values(entity3),
  ...Object.values(entity4),
  ...Object.values(entity5),
  ...Object.values(entity6),
  ...Object.values(entity7),
  ...Object.values(entity8),
  ...Object.values(entity9),
  ...Object.values(entity10),
  ...Object.values(entity11),
  ...Object.values(entity12),
  ...Object.values(entity13),
  ...Object.values(entity14),
  ...Object.values(entity15),
  ...Object.values(entity16),
  ...Object.values(entity17),
  ...Object.values(entity18),
  ...Object.values(entity19),
  ...Object.values(entity20),
  ...Object.values(entity21),
  ...Object.values(entity22),
  ...Object.values(entity23),
  ...Object.values(entity24),
  ...Object.values(entity25),
  ...Object.values(entity26),
  ...Object.values(entity27),
  ...Object.values(entity28),
  ...Object.values(entity29),
  ...Object.values(entity30),
  ...Object.values(entity31),
  ...Object.values(entity32),
  ...Object.values(entity33),
  ...Object.values(entity34),
  ...Object.values(entity35),
  ...Object.values(entity36),
  ...Object.values(entity37),
  ...Object.values(entity38),
  ...Object.values(entity39),
  ...Object.values(entity40),
  ...Object.values(entity41),
  ...Object.values(entity42),
  ...Object.values(entity43),
  ...Object.values(entity44),
  ...Object.values(entity45),
  ...Object.values(entity46),
  ...Object.values(entity47),
  ...Object.values(entity48),
  ...Object.values(entity49),
  ...Object.values(entity50),
  ...Object.values(entity51),
  ...Object.values(entity52),
  ...Object.values(entity53),
  ...Object.values(entity54),
  ...Object.values(entity55),
  ...Object.values(entity56),
  ...Object.values(entity57),
  ...Object.values(entity58),
  ...Object.values(entity59),
  ...Object.values(entity60),
  ...Object.values(entity61),
  ...Object.values(entity62),
  ...Object.values(entity63),
  ...Object.values(entity64),
  ...Object.values(entity65),
  ...Object.values(entity66),
  ...Object.values(entity67),
  ...Object.values(entity68),
  ...Object.values(entity69),
  ...Object.values(entity70),
  ...Object.values(entity71),
  ...Object.values(entity72),
  ...Object.values(entity73),
  ...Object.values(entity74),
  ...Object.values(entity75),
  ...Object.values(entity76),
  ...Object.values(entity77),
  ...Object.values(entity78),
  ...Object.values(entity79),
  ...Object.values(entity80),
  ...Object.values(entity81),
  ...Object.values(entity82),
  ...Object.values(entity83),
];
