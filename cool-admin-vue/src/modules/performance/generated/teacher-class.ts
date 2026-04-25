/**
 * Generated from contracts/openapi/xuedao.openapi.json for cool-admin-vue performance teacher-class.
 * Do not hand edit this file; update the OpenAPI source and rerun scripts/openapi-contract-sync.mjs.
 */

export interface TeacherClassCreateTeacherClassRequest {
	id?: number;
	status?: TeacherClassStatus;
	classId?: number;
	className?: string;
	teacherId?: number;
	teacherName?: string;
	schoolName?: string;
	grade?: string;
	projectTag?: string;
	studentCount?: number;
	ownerEmployeeId?: number;
	ownerDepartmentId?: number;
	createTime?: string;
	updateTime?: string;
}

export type TeacherClassStatus = "draft" | "closed" | "active";

export interface ApiResponse_TeacherClassRecord {
	code: number;
	message: string;
	data: {
  id?: number;
  status?: TeacherClassStatus;
  classId?: number;
  className: string;
} & {
  teacherId: number;
  teacherName?: string;
  schoolName?: string;
  grade?: string;
  projectTag?: string;
  studentCount?: number;
  ownerEmployeeId?: number;
  ownerDepartmentId?: number;
  createTime?: string;
  updateTime?: string;
};
}

export interface TeacherClassRemoveTeacherClassRequest {
	ids: Array<number>;
}

export interface ApiResponse_TeacherClassRemoveTeacherClassResult {
	code: number;
	message: string;
	data: Record<string, unknown>;
}

export interface TeacherClassFetchInfoQuery {
	id: number;
}

export type TeacherClassPageQuery = TeacherClassFetchPageRequest & {
  page: number;
  size: number;
  keyword?: string;
  status?: string;
};

export interface TeacherClassFetchPageRequest {

}

export interface ApiResponse_TeacherClassPageResult {
	code: number;
	message: string;
	data: {
  pagination: {
  page: number;
  size: number;
  total: number;
};
} & {
  list: Array<TeacherClassRecord>;
};
}

export type TeacherClassRecord = {
  id?: number;
  status?: TeacherClassStatus;
  classId?: number;
  className: string;
} & {
  teacherId: number;
  teacherName?: string;
  schoolName?: string;
  grade?: string;
  projectTag?: string;
  studentCount?: number;
  ownerEmployeeId?: number;
  ownerDepartmentId?: number;
  createTime?: string;
  updateTime?: string;
};

export type TeacherClassUpdatePayload = {
  id?: number;
  status?: TeacherClassStatus;
  classId?: number;
  className?: string;
  teacherId?: number;
  teacherName?: string;
  schoolName?: string;
  grade?: string;
  projectTag?: string;
  studentCount?: number;
  ownerEmployeeId?: number;
  ownerDepartmentId?: number;
  createTime?: string;
  updateTime?: string;
} & {
  id: number;
};
