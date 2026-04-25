/**
 * Generated from contracts/openapi/xuedao.openapi.json for cool-admin-vue performance teacher-cooperation.
 * Do not hand edit this file; update the OpenAPI source and rerun scripts/openapi-contract-sync.mjs.
 */

export interface TeacherCooperationMarkRequest {
	id: number;
}

export interface ApiResponse_TeacherInfoRecord {
	code: number;
	message: string;
	data: {
  id?: number;
  cooperationStatus?: TeacherCooperationStatus;
  teacherName: string;
} & {
  phone?: string;
  wechat?: string;
  schoolName?: string;
  schoolRegion?: string;
  schoolType?: string;
  grade?: string;
  className?: string;
  subject?: string;
  projectTags?: string | Array<string>;
  intentionLevel?: string;
  communicationStyle?: string;
  ownerEmployeeId?: number;
  ownerEmployeeName?: string;
  ownerDepartmentId?: number;
  ownerDepartmentName?: string;
  lastFollowTime?: string;
  nextFollowTime?: string;
  cooperationTime?: string;
  classCount?: number;
  createTime?: string;
  updateTime?: string;
};
}

export type TeacherCooperationStatus = "terminated" | "uncontacted" | "contacted" | "negotiating" | "partnered";
