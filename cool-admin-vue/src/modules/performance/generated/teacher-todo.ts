/**
 * Generated from contracts/openapi/xuedao.openapi.json for cool-admin-vue performance teacher-todo.
 * Do not hand edit this file; update the OpenAPI source and rerun scripts/openapi-contract-sync.mjs.
 */

export type TeacherTodoPageQuery = TeacherTodoFetchPageRequest & {
  page: number;
  size: number;
  keyword?: string;
  todoBucket?: string;
};

export interface TeacherTodoFetchPageRequest {

}

export interface ApiResponse_TeacherTodoPageResult {
	code: number;
	message: string;
	data: {
  pagination: {
  page: number;
  size: number;
  total: number;
};
  bucketSummary?: {
  today?: number;
  overdue?: number;
};
} & {
  list: Array<TeacherTodoRecord>;
};
}

export type TeacherTodoRecord = {
  id?: number;
  cooperationStatus?: TeacherCooperationStatus;
  todoBucket?: TeacherTodoBucket;
} & {
  teacherId?: number;
  teacherName?: string;
  phone?: string;
  wechat?: string;
  schoolName?: string;
  schoolRegion?: string;
  subject?: string;
  ownerEmployeeName?: string;
  lastFollowTime?: string;
  nextFollowTime?: string;
};

export type TeacherCooperationStatus = "terminated" | "uncontacted" | "contacted" | "negotiating" | "partnered";

export type TeacherTodoBucket = "today" | "overdue";
