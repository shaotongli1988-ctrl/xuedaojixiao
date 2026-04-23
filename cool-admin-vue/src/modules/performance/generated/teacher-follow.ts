/**
 * Generated from contracts/openapi/xuedao.openapi.json for cool-admin-vue performance teacher-follow.
 * Do not hand edit this file; update the OpenAPI source and rerun scripts/openapi-contract-sync.mjs.
 */

export interface TeacherFollowCreateTeacherFollowRequest {
	id?: number;
	teacherId?: number;
	followTime?: string;
	followMethod?: string;
	content?: string;
	followContent?: string;
	remark?: string;
	nextFollowTime?: string;
	createTime?: string;
	operatorName?: string;
	creatorEmployeeName?: string;
	creatorName?: string;
}

export interface ApiResponse_TeacherFollowRecord {
	code: number;
	message: string;
	data: {
  id?: number;
} & {
  teacherId?: number;
  followTime?: string;
  followMethod?: string;
  content?: string;
  followContent?: string;
  remark?: string;
  nextFollowTime?: string;
  createTime?: string;
  operatorName?: string;
  creatorEmployeeName?: string;
  creatorName?: string;
};
}

export type TeacherFollowPageQuery = TeacherFollowFetchPageRequest & {
  page: number;
  size: number;
  teacherId: number;
};

export interface TeacherFollowFetchPageRequest {

}

export interface ApiResponse_TeacherFollowPageResult {
	code: number;
	message: string;
	data: {
  pagination: {
  page: number;
  size: number;
  total: number;
};
} & {
  list: Array<TeacherFollowRecord>;
};
}

export type TeacherFollowRecord = {
  id?: number;
} & {
  teacherId?: number;
  followTime?: string;
  followMethod?: string;
  content?: string;
  followContent?: string;
  remark?: string;
  nextFollowTime?: string;
  createTime?: string;
  operatorName?: string;
  creatorEmployeeName?: string;
  creatorName?: string;
};
