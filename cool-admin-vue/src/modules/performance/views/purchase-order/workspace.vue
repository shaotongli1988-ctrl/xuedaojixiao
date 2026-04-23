<!-- 文件职责：承接主题11采购增强的共享前端工作台，统一复用采购管理、询价、审批、执行和收货五个视图；不负责付款、对账、库存总账或菜单注册；依赖 purchaseOrder / supplier / purchaseReport 契约、基础部门用户选项与权限工具；维护重点是状态流转按钮显隐、经理范围口径和 purchaseOrder 单主资源边界不能漂移。 -->
<template>
	<div v-if="canAccess" class="purchase-workspace">
		<el-card shadow="never">
			<div class="purchase-workspace__toolbar">
				<div class="purchase-workspace__toolbar-left">
					<el-input
						v-model="filters.keyword"
						placeholder="订单编号 / 采购标题"
						clearable
						style="width: 240px"
						@keyup.enter="handleSearch"
					/>
					<el-select
						v-model="filterSupplierIdModel"
						placeholder="供应商"
						clearable
						filterable
						style="width: 220px"
					>
						<el-option
							v-for="item in supplierOptions"
							:key="item.id"
							:label="item.name"
							:value="item.id"
						/>
					</el-select>
					<el-select
						v-model="filterDepartmentIdModel"
						placeholder="部门"
						clearable
						filterable
						style="width: 180px"
					>
						<el-option
							v-for="item in departmentOptions"
							:key="item.id"
							:label="item.label"
							:value="item.id"
						/>
					</el-select>
					<el-select
						v-model="filters.status"
						placeholder="状态"
						clearable
						style="width: 180px"
					>
						<el-option
							v-for="item in currentStatusOptions"
							:key="item.value"
							:label="item.label"
							:value="item.value"
						/>
					</el-select>
					<el-date-picker
						v-model="filters.startDate"
						type="date"
						value-format="YYYY-MM-DD"
						placeholder="采购开始日期"
						style="width: 170px"
					/>
					<el-date-picker
						v-model="filters.endDate"
						type="date"
						value-format="YYYY-MM-DD"
						placeholder="采购结束日期"
						style="width: 170px"
					/>
				</div>

				<div class="purchase-workspace__toolbar-right">
					<el-button @click="handleSearch">查询</el-button>
					<el-button @click="handleReset">重置</el-button>
					<el-button v-if="showAddButton" type="primary" @click="openCreate">
						创建采购单
					</el-button>
				</div>
			</div>
		</el-card>

		<el-card shadow="never">
			<template #header>
				<div class="purchase-workspace__header">
					<div class="purchase-workspace__header-main">
						<h2>{{ workspaceConfig.title }}</h2>
						<el-tag effect="plain">主题 11</el-tag>
						<el-tag effect="plain" type="info">
							{{ roleFact.scopeLabel }}
						</el-tag>
						<el-tag effect="plain" type="success">
							{{ workspaceConfig.statusSummary }}
						</el-tag>
					</div>
					<el-alert
						:title="workspaceConfig.notice"
						type="info"
						:closable="false"
						show-icon
					/>
				</div>
			</template>

			<div class="purchase-workspace__metrics">
				<el-tag effect="plain">当前页 {{ rows.length }} 单</el-tag>
				<el-tag effect="plain">金额 {{ formatAmount(summaryMetrics.totalAmount) }}</el-tag>
				<el-tag effect="plain" type="warning">
					待审批 {{ summaryMetrics.pendingApprovalCount }}
				</el-tag>
				<el-tag effect="plain" type="success">
					累计收货 {{ summaryMetrics.receivedQuantity.toFixed(2) }}
				</el-tag>
				<el-tag effect="plain" type="info">
					已关闭 {{ summaryMetrics.closedCount }}
				</el-tag>
			</div>

			<el-table :data="rows" border v-loading="tableLoading">
				<el-table-column prop="orderNo" label="订单编号" min-width="150">
					<template #default="{ row }">
						{{ row.orderNo || '-' }}
					</template>
				</el-table-column>
				<el-table-column prop="title" label="采购标题" min-width="180" />
				<el-table-column label="供应商" min-width="170">
					<template #default="{ row }">
						{{ row.supplierName || supplierLabel(row.supplierId) }}
					</template>
				</el-table-column>
				<el-table-column label="申请部门" min-width="150">
					<template #default="{ row }">
						{{ row.departmentName || departmentLabel(row.departmentId) }}
					</template>
				</el-table-column>
				<el-table-column label="申请人" min-width="140">
					<template #default="{ row }">
						{{ row.requesterName || requesterLabel(row.requesterId) }}
					</template>
				</el-table-column>
				<el-table-column prop="orderDate" label="采购日期" min-width="120" />
				<el-table-column prop="expectedDeliveryDate" label="预计到货" min-width="120">
					<template #default="{ row }">
						{{ row.expectedDeliveryDate || '-' }}
					</template>
				</el-table-column>
				<el-table-column label="总金额" min-width="130">
					<template #default="{ row }">
						{{ formatAmount(row.totalAmount, row.currency) }}
					</template>
				</el-table-column>
				<el-table-column label="累计收货" min-width="110">
					<template #default="{ row }">
						{{ Number(row.receivedQuantity || 0).toFixed(2) }}
					</template>
				</el-table-column>
				<el-table-column prop="status" label="状态" width="120">
					<template #default="{ row }">
						<el-tag :type="statusTagType(row.status)">{{
							statusLabel(row.status)
						}}</el-tag>
					</template>
				</el-table-column>
				<el-table-column prop="updateTime" label="更新时间" min-width="170" />
				<el-table-column label="操作" fixed="right" min-width="360">
					<template #default="{ row }">
						<el-button
							v-if="canShowAction('detail', row)"
							text
							@click="openDetail(row)"
						>
							详情
						</el-button>
						<el-button
							v-if="canShowAction('edit', row)"
							text
							type="primary"
							@click="openEdit(row)"
						>
							编辑
						</el-button>
						<el-button
							v-if="canShowAction('submitInquiry', row)"
							text
							type="primary"
							:loading="isActionLoading(row, 'submitInquiry')"
							@click="handleSubmitInquiry(row)"
						>
							提交询价
						</el-button>
						<el-button
							v-if="canShowAction('submitApproval', row)"
							text
							type="warning"
							:loading="isActionLoading(row, 'submitApproval')"
							@click="handleSubmitApproval(row)"
						>
							提交审批
						</el-button>
						<el-button
							v-if="canShowAction('approve', row)"
							text
							type="primary"
							:loading="isActionLoading(row, 'approve')"
							@click="handleApprove(row)"
						>
							通过
						</el-button>
						<el-button
							v-if="canShowAction('reject', row)"
							text
							type="danger"
							:loading="isActionLoading(row, 'reject')"
							@click="handleReject(row)"
						>
							驳回
						</el-button>
						<el-button
							v-if="canShowAction('receive', row)"
							text
							type="success"
							:loading="isActionLoading(row, 'receive')"
							@click="handleReceive(row)"
						>
							收货
						</el-button>
						<el-button
							v-if="canShowAction('close', row)"
							text
							type="warning"
							:loading="isActionLoading(row, 'close')"
							@click="handleClose(row)"
						>
							关闭
						</el-button>
						<el-button
							v-if="canShowAction('delete', row)"
							text
							type="danger"
							:loading="isActionLoading(row, 'delete')"
							@click="handleDelete(row)"
						>
							删除
						</el-button>
					</template>
				</el-table-column>
			</el-table>

			<div class="purchase-workspace__pagination">
				<el-pagination
					background
					layout="total, prev, pager, next"
					:current-page="pagination.page"
					:page-size="pagination.size"
					:total="pagination.total"
					@current-change="changePage"
				/>
			</div>
		</el-card>

		<el-dialog v-model="detailVisible" title="采购单详情" width="1180px" destroy-on-close>
			<div v-if="detailOrder" class="purchase-workspace__detail">
				<el-alert
					:title="detailNotice(detailOrder)"
					:type="detailOrder.status === 'cancelled' ? 'warning' : 'info'"
					:closable="false"
					show-icon
				/>
				<el-descriptions :column="2" border>
					<el-descriptions-item label="订单编号">
						{{ detailOrder.orderNo || '-' }}
					</el-descriptions-item>
					<el-descriptions-item label="状态">
						<el-tag :type="statusTagType(detailOrder.status)">
							{{ statusLabel(detailOrder.status) }}
						</el-tag>
					</el-descriptions-item>
					<el-descriptions-item label="采购标题">
						{{ detailOrder.title }}
					</el-descriptions-item>
					<el-descriptions-item label="采购日期">
						{{ detailOrder.orderDate }}
					</el-descriptions-item>
					<el-descriptions-item label="预计到货">
						{{ detailOrder.expectedDeliveryDate || '-' }}
					</el-descriptions-item>
					<el-descriptions-item label="申请部门">
						{{
							detailOrder.departmentName || departmentLabel(detailOrder.departmentId)
						}}
					</el-descriptions-item>
					<el-descriptions-item label="申请人">
						{{ detailOrder.requesterName || requesterLabel(detailOrder.requesterId) }}
					</el-descriptions-item>
					<el-descriptions-item label="供应商">
						{{ detailOrder.supplierName || supplierLabel(detailOrder.supplierId) }}
					</el-descriptions-item>
					<el-descriptions-item label="总金额">
						{{ formatAmount(detailOrder.totalAmount, detailOrder.currency) }}
					</el-descriptions-item>
					<el-descriptions-item label="累计收货">
						{{ Number(detailOrder.receivedQuantity || 0).toFixed(2) }}
					</el-descriptions-item>
					<el-descriptions-item label="最近收货时间">
						{{ detailOrder.receivedAt || '-' }}
					</el-descriptions-item>
					<el-descriptions-item label="审批人">
						{{ detailOrder.approvedBy || '-' }}
					</el-descriptions-item>
					<el-descriptions-item label="审批时间">
						{{ detailOrder.approvedAt || '-' }}
					</el-descriptions-item>
					<el-descriptions-item label="审批备注" :span="2">
						{{ detailOrder.approvalRemark || '-' }}
					</el-descriptions-item>
					<el-descriptions-item label="关闭原因" :span="2">
						{{ detailOrder.closedReason || '-' }}
					</el-descriptions-item>
					<el-descriptions-item label="备注" :span="2">
						{{ detailOrder.remark || '-' }}
					</el-descriptions-item>
				</el-descriptions>

				<el-card shadow="never">
					<template #header>采购明细快照</template>
					<el-table
						v-if="detailOrder.items && detailOrder.items.length"
						:data="detailOrder.items"
						border
					>
						<el-table-column prop="itemName" label="物料" min-width="180" />
						<el-table-column prop="specification" label="规格" min-width="140" />
						<el-table-column prop="unit" label="单位" width="90" />
						<el-table-column prop="quantity" label="数量" width="110" />
						<el-table-column label="单价" width="120">
							<template #default="{ row }">
								{{ formatAmount(row.unitPrice || 0, detailOrder.currency) }}
							</template>
						</el-table-column>
						<el-table-column label="金额" width="130">
							<template #default="{ row }">
								{{ formatAmount(row.amount || 0, detailOrder.currency) }}
							</template>
						</el-table-column>
						<el-table-column prop="remark" label="备注" min-width="180" />
					</el-table>
					<el-empty v-else description="暂无采购明细快照" />
				</el-card>

				<div class="purchase-workspace__detail-grid">
					<el-card shadow="never">
						<template #header>询价记录</template>
						<el-table
							v-if="detailOrder.inquiryRecords && detailOrder.inquiryRecords.length"
							:data="detailOrder.inquiryRecords"
							border
						>
							<el-table-column prop="supplierName" label="供应商" min-width="140" />
							<el-table-column label="报价" width="130">
								<template #default="{ row }">
									{{ formatAmount(row.quotedAmount || 0, detailOrder.currency) }}
								</template>
							</el-table-column>
							<el-table-column prop="inquiryRemark" label="说明" min-width="160" />
							<el-table-column prop="createdBy" label="操作人" min-width="120" />
							<el-table-column prop="createdAt" label="时间" min-width="160" />
						</el-table>
						<el-empty v-else description="暂无询价记录" />
					</el-card>

					<el-card shadow="never">
						<template #header>审批记录</template>
						<el-table
							v-if="detailOrder.approvalLogs && detailOrder.approvalLogs.length"
							:data="detailOrder.approvalLogs"
							border
						>
							<el-table-column prop="action" label="动作" min-width="120">
								<template #default="{ row }">
									{{ approvalActionLabel(row.action) }}
								</template>
							</el-table-column>
							<el-table-column prop="approverName" label="处理人" min-width="120" />
							<el-table-column prop="remark" label="备注" min-width="160" />
							<el-table-column prop="createdAt" label="时间" min-width="160" />
						</el-table>
						<el-empty v-else description="暂无审批记录" />
					</el-card>

					<el-card shadow="never">
						<template #header>收货记录</template>
						<el-table
							v-if="detailOrder.receiptRecords && detailOrder.receiptRecords.length"
							:data="detailOrder.receiptRecords"
							border
						>
							<el-table-column prop="receivedQuantity" label="数量" width="110" />
							<el-table-column prop="receivedAt" label="收货时间" min-width="140" />
							<el-table-column prop="receiverName" label="处理人" min-width="120" />
							<el-table-column prop="remark" label="备注" min-width="160" />
						</el-table>
						<el-empty v-else description="暂无收货记录" />
					</el-card>
				</div>
			</div>
		</el-dialog>

		<el-dialog
			v-model="formVisible"
			:title="editingOrder?.id ? '编辑采购单' : '创建采购单'"
			width="1100px"
			destroy-on-close
		>
			<el-form ref="formRef" :model="form" :rules="rules" label-width="110px">
				<el-alert
					:title="
						editingOrder?.id
							? '仅 draft 采购单允许编辑；状态流转必须通过询价/审批/收货/关闭动作推进。'
							: '新建采购单默认保存为 draft，purchaseOrder 是唯一主资源。'
					"
					:type="editingOrder?.id ? 'warning' : 'info'"
					:closable="false"
					show-icon
				/>
				<el-row :gutter="16">
					<el-col :span="12">
						<el-form-item label="订单编号">
							<el-input v-model="form.orderNo" placeholder="可选，如填写需唯一" />
						</el-form-item>
					</el-col>
					<el-col :span="12">
						<el-form-item label="采购标题" prop="title">
							<el-input v-model="form.title" placeholder="请输入采购标题" />
						</el-form-item>
					</el-col>
					<el-col :span="12">
						<el-form-item label="供应商" prop="supplierId">
							<el-select
								v-model="formSupplierIdModel"
								placeholder="请选择供应商"
								filterable
								style="width: 100%"
							>
								<el-option
									v-for="item in supplierOptions"
									:key="item.id"
									:label="item.name"
									:value="item.id"
								/>
							</el-select>
						</el-form-item>
					</el-col>
					<el-col :span="12">
						<el-form-item label="申请人" prop="requesterId">
							<el-select
								v-model="formRequesterIdModel"
								placeholder="请选择申请人"
								filterable
								style="width: 100%"
								@change="syncDepartmentByRequester"
							>
								<el-option
									v-for="item in userOptions"
									:key="item.id"
									:label="item.name"
									:value="item.id"
								/>
							</el-select>
						</el-form-item>
					</el-col>
					<el-col :span="12">
						<el-form-item label="申请部门" prop="departmentId">
							<el-select
								v-model="formDepartmentIdModel"
								placeholder="请选择部门"
								filterable
								style="width: 100%"
							>
								<el-option
									v-for="item in departmentOptions"
									:key="item.id"
									:label="item.label"
									:value="item.id"
								/>
							</el-select>
						</el-form-item>
					</el-col>
					<el-col :span="12">
						<el-form-item label="采购日期" prop="orderDate">
							<el-date-picker
								v-model="form.orderDate"
								type="date"
								value-format="YYYY-MM-DD"
								placeholder="请选择采购日期"
								style="width: 100%"
							/>
						</el-form-item>
					</el-col>
					<el-col :span="12">
						<el-form-item label="预计到货">
							<el-date-picker
								v-model="expectedDeliveryDateModel"
								type="date"
								value-format="YYYY-MM-DD"
								placeholder="可选"
								style="width: 100%"
							/>
						</el-form-item>
					</el-col>
					<el-col :span="12">
						<el-form-item label="总金额" prop="totalAmount">
							<el-input-number
								v-model="totalAmountModel"
								:min="0"
								:controls="false"
								:precision="2"
								:step="100"
								style="width: 100%"
								placeholder="请输入总金额"
							/>
						</el-form-item>
					</el-col>
					<el-col :span="12">
						<el-form-item label="币种">
							<el-input v-model="form.currency" placeholder="默认 CNY" />
						</el-form-item>
					</el-col>
				</el-row>

				<el-card shadow="never" class="purchase-workspace__items-card">
					<template #header>
						<div class="purchase-workspace__items-header">
							<span>采购明细快照</span>
							<el-button text type="primary" @click="addItem">新增明细</el-button>
						</div>
					</template>
					<div
						v-for="(item, index) in form.items"
						:key="`item-${index}`"
						class="purchase-workspace__item-row"
					>
						<el-row :gutter="12">
							<el-col :span="7">
								<el-form-item :label="`物料${index + 1}`" label-width="68px">
									<el-input v-model="item.itemName" placeholder="物料名称" />
								</el-form-item>
							</el-col>
							<el-col :span="5">
								<el-form-item label="规格" label-width="52px">
									<el-input v-model="item.specification" placeholder="可选" />
								</el-form-item>
							</el-col>
							<el-col :span="4">
								<el-form-item label="单位" label-width="52px">
									<el-input v-model="item.unit" placeholder="件/台" />
								</el-form-item>
							</el-col>
							<el-col :span="4">
								<el-form-item label="数量" label-width="52px">
									<el-input-number
										v-model="item.quantity"
										:min="0"
										:controls="false"
										style="width: 100%"
										@change="syncItemAmount(item)"
									/>
								</el-form-item>
							</el-col>
							<el-col :span="4">
								<el-form-item label="单价" label-width="52px">
									<el-input-number
										v-model="item.unitPrice"
										:min="0"
										:controls="false"
										:precision="2"
										style="width: 100%"
										@change="syncItemAmount(item)"
									/>
								</el-form-item>
							</el-col>
							<el-col :span="5">
								<el-form-item label="金额" label-width="52px">
									<el-input
										:model-value="Number(item.amount || 0).toFixed(2)"
										readonly
									/>
								</el-form-item>
							</el-col>
							<el-col :span="15">
								<el-form-item label="备注" label-width="52px">
									<el-input v-model="item.remark" placeholder="可选" />
								</el-form-item>
							</el-col>
							<el-col :span="4" class="purchase-workspace__item-action">
								<el-button text type="danger" @click="removeItem(index)">
									删除明细
								</el-button>
							</el-col>
						</el-row>
					</div>
				</el-card>

				<el-form-item label="备注">
					<el-input v-model="form.remark" type="textarea" :rows="4" placeholder="可选" />
				</el-form-item>
			</el-form>

			<template #footer>
				<div class="purchase-workspace__dialog-footer">
					<el-button @click="formVisible = false">取消</el-button>
					<el-button type="primary" :loading="submitLoading" @click="submitForm">
						保存
					</el-button>
				</div>
			</template>
		</el-dialog>
	</div>

	<el-card v-else shadow="never">
		<el-empty description="当前账号没有该页面权限" />
	</el-card>
</template>

<script lang="ts" setup>
defineOptions({
	name: 'performance-purchase-workspace'
});

import { computed, onMounted, reactive, ref, watch } from 'vue';
import { ElMessage, type FormInstance, type FormRules } from 'element-plus';
import { checkPerm } from '/$/base/utils/permission';
import { useDict } from '/$/dict';
import { service } from '/@/cool';
import { useUserStore } from '/$/base/store/user';
import { useListPage } from '../../composables/use-list-page.js';
import { performanceAccessContextService } from '../../service/access-context';
import { performancePurchaseOrderService } from '../../service/purchase-order';
import { resolvePerformanceRoleFact } from '../../service/role-fact';
import { performanceSupplierService } from '../../service/supplier';
import {
	confirmElementAction,
	promptElementAction,
	runTrackedElementAction
} from '../shared/action-feedback';
import {
	createElementWarningFromErrorHandler,
	showElementErrorFromError,
	showElementWarningFromError
} from '../shared/error-message';
import { loadDepartmentOptions, loadUserOptions } from '../../utils/lookup-options.js';
import type {
	DepartmentOption,
	PerformanceAccessContext,
	PurchaseOrderItemRecord,
	PurchaseOrderRecord,
	PurchaseOrderStatus,
	SupplierOption,
	SupplierRecord,
	UserOption
} from '../../types';
import {
	createEmptyPurchaseOrder,
	createEmptyPurchaseOrderItem,
	normalizePurchaseOrderDomainRecord
} from '../../types';

type PurchaseWorkspaceViewKey = 'main' | 'inquiry' | 'approval' | 'execution' | 'receipt';
type PurchaseActionKey =
	| 'detail'
	| 'edit'
	| 'delete'
	| 'submitInquiry'
	| 'submitApproval'
	| 'approve'
	| 'reject'
	| 'receive'
	| 'close';

interface PurchaseWorkspaceConfig {
	title: string;
	statusSummary: string;
	notice: string;
	fixedStatuses: PurchaseOrderStatus[];
	actionKeys: PurchaseActionKey[];
	allowCreate: boolean;
}

const PURCHASE_ORDER_STATUS_DICT_KEY = 'performance.purchaseOrder.status';

const props = withDefaults(
	defineProps<{
		viewKey?: PurchaseWorkspaceViewKey;
	}>(),
	{
		viewKey: 'main'
	}
);

const WORKSPACE_CONFIG_MAP: Record<PurchaseWorkspaceViewKey, PurchaseWorkspaceConfig> = {
	main: {
		title: '采购管理',
		statusSummary: '全状态主链',
		notice: 'purchaseOrder 仍是唯一主资源；本页承接创建采购单、详情、询价提交、提交审批、审批、收货与关闭的最小闭环，不扩付款、对账或库存总账联动。',
		fixedStatuses: [],
		actionKeys: [
			'detail',
			'edit',
			'delete',
			'submitInquiry',
			'submitApproval',
			'approve',
			'reject',
			'receive',
			'close'
		],
		allowCreate: true
	},
	inquiry: {
		title: '询价管理',
		statusSummary: 'draft / inquiring',
		notice: '询价管理只处理 draft -> inquiring 和 inquiring -> pendingApproval 的链路，仍围绕同一张采购单推进。',
		fixedStatuses: ['draft', 'inquiring'],
		actionKeys: ['detail', 'submitInquiry', 'submitApproval'],
		allowCreate: false
	},
	approval: {
		title: '采购审批',
		statusSummary: 'pendingApproval',
		notice: '采购审批页只处理 pendingApproval 状态；reject 固定回 draft，不在前端直改状态。',
		fixedStatuses: ['pendingApproval'],
		actionKeys: ['detail', 'approve', 'reject'],
		allowCreate: false
	},
	execution: {
		title: '订单管理',
		statusSummary: 'approved / received / closed',
		notice: '订单管理是 purchaseOrder 执行视角别名，不新增第二套订单资源；仅展示执行态与关闭态。',
		fixedStatuses: ['approved', 'received', 'closed'],
		actionKeys: ['detail', 'receive', 'close'],
		allowCreate: false
	},
	receipt: {
		title: '收货管理',
		statusSummary: 'approved / received',
		notice: '收货管理只处理 approved / received 视图，支持累计收货；close 仍通过采购单动作完成。',
		fixedStatuses: ['approved', 'received'],
		actionKeys: ['detail', 'receive'],
		allowCreate: false
	}
};

const MERGED_VIEW_FETCH_SIZE = 200;

const user = useUserStore();
const { dict } = useDict();
const userOptions = ref<UserOption[]>([]);
const departmentOptions = ref<DepartmentOption[]>([]);
const supplierOptions = ref<SupplierOption[]>([]);
const submitLoading = ref(false);
const formVisible = ref(false);
const detailVisible = ref(false);
const editingOrder = ref<PurchaseOrderRecord | null>(null);
const detailOrder = ref<PurchaseOrderRecord | null>(null);
const formRef = ref<FormInstance>();
const actionLoadingId = ref<number | null>(null);
const actionLoadingType = ref<PurchaseActionKey | null>(null);
const accessContext = ref<PerformanceAccessContext | null>(null);

const form = reactive<PurchaseOrderRecord>(createEmptyPurchaseOrder());

const rules: FormRules = {
	title: [{ required: true, message: '请输入采购标题', trigger: 'blur' }],
	supplierId: [{ required: true, message: '请选择供应商', trigger: 'change' }],
	requesterId: [{ required: true, message: '请选择申请人', trigger: 'change' }],
	departmentId: [{ required: true, message: '请选择申请部门', trigger: 'change' }],
	orderDate: [{ required: true, message: '请选择采购日期', trigger: 'change' }],
	totalAmount: [
		{ required: true, message: '请输入采购总金额', trigger: 'change' },
		{
			validator: (_rule, value, callback) => {
				if (value == null || Number(value) <= 0) {
					callback(new Error('采购总金额必须大于 0'));
					return;
				}

				callback();
			},
			trigger: 'change'
		}
	]
};

const workspaceConfig = computed(() => WORKSPACE_CONFIG_MAP[props.viewKey]);
const canAccess = computed(() => checkPerm(performancePurchaseOrderService.permission.page));
const roleFact = computed(() =>
	resolvePerformanceRoleFact({
		personaKey: accessContext.value?.activePersonaKey || null,
		roleKind: accessContext.value?.roleKind || null
	})
);
const showAddButton = computed(
	() =>
		workspaceConfig.value.allowCreate &&
		checkPerm(performancePurchaseOrderService.permission.add)
);
const purchaseOrderStatusOptions = computed<Array<{ label: string; value: PurchaseOrderStatus }>>(
	() =>
		dict.get(PURCHASE_ORDER_STATUS_DICT_KEY).value.map(item => ({
			label: item.label,
			value: item.value as PurchaseOrderStatus
		}))
);
const currentStatusOptions = computed(() => {
	if (!workspaceConfig.value.fixedStatuses.length) {
		return purchaseOrderStatusOptions.value;
	}

	return purchaseOrderStatusOptions.value.filter(item =>
		workspaceConfig.value.fixedStatuses.includes(item.value)
	);
});
const purchaseOrderList = useListPage({
	createFilters: () => ({
		keyword: '',
		supplierId: undefined as number | undefined,
		departmentId: undefined as number | undefined,
		status: '' as PurchaseOrderStatus | '',
		startDate: '',
		endDate: ''
	}),
	canLoad: () => canAccess.value,
	fetchPage: async params => {
		const requestFilters = buildQueryFilters();
		const explicitStatus = params.status || undefined;

		if (workspaceConfig.value.fixedStatuses.length > 1 && !explicitStatus) {
			const resultList = await Promise.all(
				workspaceConfig.value.fixedStatuses.map(status =>
					performancePurchaseOrderService.fetchPage({
						...requestFilters,
						page: 1,
						size: MERGED_VIEW_FETCH_SIZE,
						status
					})
				)
			);
			const merged = dedupeOrders(
				resultList.flatMap(item => item.list || []).map(normalizePurchaseOrderDomainRecord)
			);
			const total = merged.length;
			const maxPage = Math.max(1, Math.ceil(total / params.size));
			const page = Math.min(params.page, maxPage);

			if (page !== params.page) {
				purchaseOrderList.pager.page = page;
			}

			return {
				list: merged.slice((page - 1) * params.size, page * params.size),
				pagination: { total }
			};
		}

		const resolvedStatus =
			explicitStatus ||
			(workspaceConfig.value.fixedStatuses.length === 1
				? workspaceConfig.value.fixedStatuses[0]
				: undefined);
		const result = await performancePurchaseOrderService.fetchPage({
			...requestFilters,
			page: params.page,
			size: params.size,
			status: resolvedStatus
		});

		return {
			...result,
			list: (result.list || []).map(normalizePurchaseOrderDomainRecord)
		};
	},
	onError: (error: unknown) => {
		showElementErrorFromError(error, '采购单列表加载失败');
	}
});
const rows = purchaseOrderList.rows;
const tableLoading = purchaseOrderList.loading;
const filters = purchaseOrderList.filters;
const pagination = purchaseOrderList.pager;
const filterSupplierIdModel = computed<number | undefined>({
	get: () => filters.supplierId ?? undefined,
	set: value => {
		filters.supplierId = value;
	}
});
const filterDepartmentIdModel = computed<number | undefined>({
	get: () => filters.departmentId ?? undefined,
	set: value => {
		filters.departmentId = value;
	}
});
const formSupplierIdModel = computed<number | undefined>({
	get: () => form.supplierId ?? undefined,
	set: value => {
		form.supplierId = value;
	}
});
const formRequesterIdModel = computed<number | undefined>({
	get: () => form.requesterId ?? undefined,
	set: value => {
		form.requesterId = value;
	}
});
const formDepartmentIdModel = computed<number | undefined>({
	get: () => form.departmentId ?? undefined,
	set: value => {
		form.departmentId = value;
	}
});
const expectedDeliveryDateModel = computed<string | undefined>({
	get: () => form.expectedDeliveryDate || undefined,
	set: value => {
		form.expectedDeliveryDate = value || '';
	}
});
const totalAmountModel = computed<number | undefined>({
	get: () => Number(form.totalAmount || 0),
	set: value => {
		form.totalAmount = Number(value || 0);
	}
});
const summaryMetrics = computed(() => {
	return rows.value.reduce(
		(result, item) => {
			result.totalAmount += Number(item.totalAmount || 0);
			result.pendingApprovalCount += item.status === 'pendingApproval' ? 1 : 0;
			result.receivedQuantity += Number(item.receivedQuantity || 0);
			result.closedCount += item.status === 'closed' ? 1 : 0;
			return result;
		},
		{
			totalAmount: 0,
			pendingApprovalCount: 0,
			receivedQuantity: 0,
			closedCount: 0
		}
	);
});

watch(
	() => props.viewKey,
	async () => {
		filters.status = '';
		pagination.page = 1;
		await refresh();
	}
);

onMounted(async () => {
	await dict.refresh([PURCHASE_ORDER_STATUS_DICT_KEY]);
	await Promise.all([loadAccessContext(), loadUsers(), loadDepartments(), loadSuppliers()]);
	await refresh();
});

async function loadAccessContext() {
	try {
		accessContext.value = await performanceAccessContextService.fetchContext();
	} catch {
		accessContext.value = null;
	}
}

async function loadUsers() {
	userOptions.value = await loadUserOptions(
		() =>
			service.base.sys.user.page({
				page: 1,
				size: 500
			}),
		createElementWarningFromErrorHandler('申请人选项加载失败')
	);
}

async function loadDepartments() {
	departmentOptions.value = await loadDepartmentOptions(
		() => service.base.sys.department.list(),
		createElementWarningFromErrorHandler('部门选项加载失败')
	);
}

async function loadSuppliers() {
	try {
		const result = await performanceSupplierService.fetchPage({
			page: 1,
			size: 200
		});
		supplierOptions.value = (result.list || []).map(item => ({
			id: Number(item.id),
			name: item.name,
			status: item.status
		}));
	} catch (error: unknown) {
		supplierOptions.value = [];
		showElementWarningFromError(error, '供应商选项加载失败');
	}
}

async function refresh() {
	await purchaseOrderList.reload();
}

function buildQueryFilters() {
	return {
		keyword: filters.keyword || undefined,
		supplierId: filters.supplierId,
		departmentId: filters.departmentId,
		startDate: filters.startDate || undefined,
		endDate: filters.endDate || undefined
	};
}

function handleSearch() {
	if (filters.startDate && filters.endDate && filters.startDate > filters.endDate) {
		ElMessage.warning('结束日期不能早于开始日期');
		return;
	}

	void purchaseOrderList.search();
}

function handleReset() {
	void purchaseOrderList.reset({
		supplierId: undefined,
		departmentId: undefined
	});
}

function changePage(page: number) {
	void purchaseOrderList.goToPage(page);
}

function openCreate() {
	editingOrder.value = null;
	Object.assign(form, createEmptyPurchaseOrder(), {
		requesterId: resolveCurrentUserId(),
		departmentId: resolveCurrentDepartmentId(),
		currency: 'CNY',
		items: [createEmptyPurchaseOrderItem()]
	});
	formVisible.value = true;
}

async function openDetail(row: PurchaseOrderRecord) {
	if (!row.id) {
		return;
	}

	try {
		detailOrder.value = normalizePurchaseOrderDomainRecord(
			await performancePurchaseOrderService.fetchInfo({ id: row.id })
		);
		detailVisible.value = true;
	} catch (error: unknown) {
		showElementErrorFromError(error, '采购单详情加载失败');
	}
}

async function openEdit(row: PurchaseOrderRecord) {
	if (!canShowAction('edit', row) || !row.id) {
		ElMessage.warning('仅 draft 采购单允许编辑');
		return;
	}

	try {
		const detail = normalizePurchaseOrderDomainRecord(
			await performancePurchaseOrderService.fetchInfo({ id: row.id })
		);
		if (detail.status !== 'draft') {
			ElMessage.warning('仅 draft 采购单允许编辑');
			return;
		}

		editingOrder.value = detail;
		Object.assign(form, createEmptyPurchaseOrder(), detail, {
			orderNo: detail.orderNo || '',
			expectedDeliveryDate: detail.expectedDeliveryDate || '',
			currency: detail.currency || 'CNY',
			remark: detail.remark || '',
			items: detail.items?.length
				? detail.items.map(cloneItem)
				: [createEmptyPurchaseOrderItem()]
		});
		formVisible.value = true;
	} catch (error: unknown) {
		showElementErrorFromError(error, '采购单详情加载失败');
	}
}

async function submitForm() {
	await formRef.value?.validate();
	syncDepartmentByRequester();

	if (form.totalAmount <= 0) {
		ElMessage.error('采购总金额必须大于 0');
		return;
	}

	submitLoading.value = true;

	try {
		const payload: Partial<PurchaseOrderRecord> = {
			id: editingOrder.value?.id,
			orderNo: normalizeOptionalText(form.orderNo),
			title: form.title.trim(),
			supplierId: form.supplierId,
			departmentId: form.departmentId,
			requesterId: form.requesterId,
			orderDate: form.orderDate,
			expectedDeliveryDate: normalizeOptionalText(form.expectedDeliveryDate),
			totalAmount: Number(form.totalAmount),
			currency: normalizeOptionalText(form.currency) || 'CNY',
			remark: normalizeOptionalText(form.remark),
			items: sanitizeItems(form.items),
			status: 'draft'
		};

		if (editingOrder.value?.id) {
			await performancePurchaseOrderService.updatePurchaseOrder(
				payload as Partial<PurchaseOrderRecord> & { id: number }
			);
		} else {
			await performancePurchaseOrderService.createPurchaseOrder(payload);
		}

		ElMessage.success('保存成功');
		formVisible.value = false;
		await refresh();
	} catch (error: unknown) {
		showElementErrorFromError(error, '采购单保存失败');
	} finally {
		submitLoading.value = false;
	}
}

async function handleDelete(row: PurchaseOrderRecord) {
	if (!row.id) {
		return;
	}

	const confirmed = await confirmElementAction(
		`确认删除采购单「${row.title || row.orderNo || row.id}」吗？`,
		'删除确认'
	);

	if (!confirmed) {
		return;
	}

	await runRowAction(row, 'delete', async () => {
		await performancePurchaseOrderService.removePurchaseOrder({
			ids: [row.id!]
		});
	});
}

async function handleSubmitInquiry(row: PurchaseOrderRecord) {
	if (!row.id) {
		return;
	}

	const confirmed = await confirmElementAction(
		`确认提交采购单「${row.title}」进入询价吗？`,
		'询价确认'
	);

	if (!confirmed) {
		return;
	}

	await runRowAction(row, 'submitInquiry', async () => {
		await performancePurchaseOrderService.submitInquiry({ id: row.id! });
	});
}

async function handleSubmitApproval(row: PurchaseOrderRecord) {
	if (!row.id) {
		return;
	}

	const confirmed = await confirmElementAction(
		`确认提交采购单「${row.title}」进入审批吗？`,
		'提交审批确认'
	);

	if (!confirmed) {
		return;
	}

	await runRowAction(row, 'submitApproval', async () => {
		await performancePurchaseOrderService.submitApproval({ id: row.id! });
	});
}

async function handleApprove(row: PurchaseOrderRecord) {
	if (!row.id) {
		return;
	}

	const result = await promptElementAction('请输入审批备注，可留空', '审批通过', {
		inputValue: row.approvalRemark || '',
		confirmButtonText: '通过',
		cancelButtonText: '取消'
	});

	if (!result) {
		return;
	}

	await runRowAction(row, 'approve', async () => {
		await performancePurchaseOrderService.approve({
			id: row.id!,
			approvalRemark: normalizeOptionalText(result.value)
		});
	});
}

async function handleReject(row: PurchaseOrderRecord) {
	if (!row.id) {
		return;
	}

	const result = await promptElementAction('请输入驳回原因', '审批驳回', {
		inputValidator: input => String(input || '').trim().length > 0 || '请输入驳回原因',
		confirmButtonText: '驳回',
		cancelButtonText: '取消'
	});

	if (!result) {
		return;
	}

	await runRowAction(row, 'reject', async () => {
		await performancePurchaseOrderService.reject({
			id: row.id!,
			approvalRemark: String(result.value || '').trim()
		});
	});
}

async function handleReceive(row: PurchaseOrderRecord) {
	if (!row.id) {
		return;
	}

	const result = await promptElementAction('请输入本次收货数量', '收货登记', {
		inputType: 'number',
		inputValue: '1',
		inputValidator: input => {
			const parsed = Number(input);
			return parsed > 0 || '收货数量必须大于 0';
		},
		confirmButtonText: '登记收货',
		cancelButtonText: '取消'
	});

	if (!result) {
		return;
	}

	await runRowAction(row, 'receive', async () => {
		await performancePurchaseOrderService.receive({
			id: row.id!,
			receivedQuantity: Number(result.value),
			receivedAt: new Date().toISOString().slice(0, 10)
		});
	});
}

async function handleClose(row: PurchaseOrderRecord) {
	if (!row.id) {
		return;
	}

	const result = await promptElementAction('请输入关闭原因', '关闭采购单', {
		inputValidator: input => String(input || '').trim().length > 0 || '关闭原因不能为空',
		confirmButtonText: '关闭',
		cancelButtonText: '取消'
	});

	if (!result) {
		return;
	}

	await runRowAction(row, 'close', async () => {
		await performancePurchaseOrderService.close({
			id: row.id!,
			closedReason: String(result.value || '').trim()
		});
	});
}

async function runRowAction(
	row: PurchaseOrderRecord,
	action: PurchaseActionKey,
	request: () => Promise<unknown>
) {
	await runTrackedElementAction<PurchaseActionKey>({
		rowId: Number(row.id || 0),
		actionType: action,
		request,
		successMessage: actionSuccessText(action),
		errorMessage: actionFailText(action),
		setLoading: (rowId, actionType) => {
			actionLoadingId.value = rowId;
			actionLoadingType.value = actionType;
		},
		onSuccess: async () => {
			if (detailVisible.value && detailOrder.value?.id === row.id) {
				await openDetail(row);
			}
		},
		refresh
	});
}

function syncDepartmentByRequester(value?: number) {
	const current = userOptions.value.find(item => item.id === Number(value || form.requesterId));

	if (!current?.departmentId) {
		return;
	}

	form.departmentId = current.departmentId;
	form.departmentName = current.departmentName || '';
}

function addItem() {
	if (!Array.isArray(form.items)) {
		form.items = [];
	}

	form.items.push(createEmptyPurchaseOrderItem());
}

function removeItem(index: number) {
	if (!Array.isArray(form.items)) {
		form.items = [createEmptyPurchaseOrderItem()];
		return;
	}

	if (form.items.length === 1) {
		form.items.splice(0, 1, createEmptyPurchaseOrderItem());
		return;
	}

	form.items.splice(index, 1);
}

function syncItemAmount(item: PurchaseOrderItemRecord) {
	const quantity = Number(item.quantity || 0);
	const unitPrice = Number(item.unitPrice || 0);
	item.amount = Number((quantity * unitPrice).toFixed(2));
}

function canShowAction(action: PurchaseActionKey, row: PurchaseOrderRecord) {
	if (!workspaceConfig.value.actionKeys.includes(action)) {
		return false;
	}

	switch (action) {
		case 'detail':
			return checkPerm(performancePurchaseOrderService.permission.info);
		case 'edit':
			return (
				checkPerm(performancePurchaseOrderService.permission.update) &&
				row.status === 'draft'
			);
		case 'delete':
			return (
				checkPerm(performancePurchaseOrderService.permission.delete) &&
				row.status === 'draft'
			);
		case 'submitInquiry':
			return (
				checkPerm(performancePurchaseOrderService.permission.submitInquiry) &&
				row.status === 'draft'
			);
		case 'submitApproval':
			return (
				checkPerm(performancePurchaseOrderService.permission.submitApproval) &&
				row.status === 'inquiring'
			);
		case 'approve':
			return (
				checkPerm(performancePurchaseOrderService.permission.approve) &&
				row.status === 'pendingApproval'
			);
		case 'reject':
			return (
				checkPerm(performancePurchaseOrderService.permission.reject) &&
				row.status === 'pendingApproval'
			);
		case 'receive':
			return (
				checkPerm(performancePurchaseOrderService.permission.receive) &&
				['approved', 'received'].includes(String(row.status || ''))
			);
		case 'close':
			return (
				checkPerm(performancePurchaseOrderService.permission.close) &&
				['approved', 'received'].includes(String(row.status || ''))
			);
		default:
			return false;
	}
}

function isActionLoading(row: PurchaseOrderRecord, action: PurchaseActionKey) {
	return Number(row.id || 0) === actionLoadingId.value && actionLoadingType.value === action;
}

function sanitizeItems(items?: PurchaseOrderItemRecord[]) {
	return (items || [])
		.map(item => {
			const quantity = Number(item.quantity || 0);
			const unitPrice = Number(item.unitPrice || 0);
			return {
				itemName: String(item.itemName || '').trim(),
				specification: normalizeOptionalText(item.specification),
				unit: normalizeOptionalText(item.unit),
				quantity,
				unitPrice,
				amount: Number((quantity * unitPrice).toFixed(2)),
				remark: normalizeOptionalText(item.remark)
			};
		})
		.filter(item => item.itemName || item.quantity > 0 || item.unitPrice > 0);
}

function dedupeOrders(list: PurchaseOrderRecord[]) {
	const recordMap = new Map<number, PurchaseOrderRecord>();

	for (const item of list) {
		const id = Number(item.id || 0);
		if (!id) {
			continue;
		}
		recordMap.set(id, item);
	}

	return Array.from(recordMap.values()).sort((a, b) => {
		return resolveSortTimestamp(b) - resolveSortTimestamp(a);
	});
}

function resolveSortTimestamp(item: PurchaseOrderRecord) {
	return new Date(item.updateTime || item.createTime || item.orderDate || 0).getTime() || 0;
}

function detailNotice(order: PurchaseOrderRecord) {
	switch (order.status) {
		case 'draft':
			return '当前采购单仍是 draft，可编辑、提交询价或删除。';
		case 'inquiring':
			return '当前采购单处于询价中，可继续查看询价记录并提交审批。';
		case 'pendingApproval':
			return '当前采购单待审批，可执行通过或驳回。';
		case 'approved':
			return '当前采购单已审批，可收货或关闭。';
		case 'received':
			return '当前采购单已进入累计收货阶段，可继续收货或关闭。';
		case 'closed':
			return '当前采购单已关闭，只读展示关闭原因。';
		case 'cancelled':
			return '当前采购单已取消，只读展示。';
		default:
			return '当前采购单详情已对齐 Theme11 扩容字段。';
	}
}

function approvalActionLabel(action?: string) {
	switch (action) {
		case 'submitted':
			return '提交审批';
		case 'approved':
			return '审批通过';
		case 'rejected':
			return '审批驳回';
		case 'closed':
			return '关闭';
		default:
			return action || '-';
	}
}

function actionSuccessText(action: PurchaseActionKey) {
	switch (action) {
		case 'delete':
			return '删除成功';
		case 'submitInquiry':
			return '提交询价成功';
		case 'submitApproval':
			return '提交审批成功';
		case 'approve':
			return '审批通过成功';
		case 'reject':
			return '审批驳回成功';
		case 'receive':
			return '收货登记成功';
		case 'close':
			return '关闭成功';
		default:
			return '操作成功';
	}
}

function actionFailText(action: PurchaseActionKey) {
	switch (action) {
		case 'delete':
			return '删除失败';
		case 'submitInquiry':
			return '提交询价失败';
		case 'submitApproval':
			return '提交审批失败';
		case 'approve':
			return '审批通过失败';
		case 'reject':
			return '审批驳回失败';
		case 'receive':
			return '收货登记失败';
		case 'close':
			return '关闭失败';
		default:
			return '操作失败';
	}
}

function statusLabel(status?: PurchaseOrderStatus | '') {
	return dict.getLabel(PURCHASE_ORDER_STATUS_DICT_KEY, status) || status || '-';
}

function statusTagType(status?: PurchaseOrderStatus | '') {
	return dict.getMeta(PURCHASE_ORDER_STATUS_DICT_KEY, status)?.tone || 'info';
}

function supplierLabel(id?: number) {
	if (!id) {
		return '-';
	}

	return supplierOptions.value.find(item => item.id === Number(id))?.name || `供应商${id}`;
}

function requesterLabel(id?: number) {
	if (!id) {
		return '-';
	}

	return userOptions.value.find(item => item.id === Number(id))?.name || `员工${id}`;
}

function departmentLabel(id?: number) {
	if (!id) {
		return '-';
	}

	return departmentOptions.value.find(item => item.id === Number(id))?.label || `部门${id}`;
}

function formatAmount(value?: number, currency?: string) {
	if (value == null) {
		return '-';
	}

	return `${currency || 'CNY'} ${Number(value).toFixed(2)}`;
}

function resolveCurrentUserId() {
	const currentUserId = Number(user.info?.id || 0);
	return currentUserId || undefined;
}

function resolveCurrentDepartmentId() {
	const currentDepartmentId = Number(user.info?.departmentId || 0);
	return currentDepartmentId || undefined;
}

function normalizeOptionalText(value?: string | null) {
	const normalized = String(value ?? '').trim();
	return normalized || undefined;
}

function cloneItem(item: PurchaseOrderItemRecord) {
	return {
		...item,
		itemName: item.itemName || '',
		specification: item.specification || '',
		unit: item.unit || '',
		remark: item.remark || ''
	};
}
</script>

<style lang="scss" scoped>
@use '../../../../styles/patterns.data-panel.scss' as dataPanel;
@use '../../../../styles/patterns.overlay-responsive.scss' as overlayResponsive;

.purchase-workspace {
	@include dataPanel.data-panel-shell;

	--purchase-workspace-card-bg: var(--app-surface-card);
	--purchase-workspace-muted-bg: var(--app-surface-muted);
	--purchase-workspace-border: var(--app-border-strong);
	--purchase-workspace-text: var(--app-text-primary);
	--purchase-workspace-text-secondary: var(--app-text-secondary);

	:deep(.el-card) {
		border-color: var(--purchase-workspace-border);
		background: var(--purchase-workspace-card-bg);
		box-shadow: var(--app-shadow-surface);
	}

	:deep(.el-table) {
		@include dataPanel.data-panel-table;
	}

	:deep(.el-dialog__body .el-descriptions__label) {
		background: var(--purchase-workspace-muted-bg);
	}

	@include overlayResponsive.horizontal-scroll-table(920px);

	&__toolbar {
		@include dataPanel.data-panel-toolbar;
	}

	&__toolbar-left,
	&__toolbar-right,
	&__header-main,
	&__metrics,
	&__items-header {
		display: flex;
		align-items: center;
		gap: var(--app-space-3);
		flex-wrap: wrap;
	}

	&__header,
	&__detail {
		display: grid;
		gap: var(--app-space-3);
	}

	&__header-main h2 {
		margin: 0;
		font-size: var(--app-font-size-title);
		color: var(--purchase-workspace-text);
	}

	&__pagination {
		display: flex;
		justify-content: flex-end;
		padding-top: var(--app-space-4);
	}

	&__dialog-footer {
		display: flex;
		justify-content: flex-end;
		gap: var(--app-space-3);
	}

	&__items-card,
	&__detail-grid {
		display: grid;
		gap: var(--app-space-3);
	}

	&__detail-grid {
		grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
	}

	&__item-row {
		padding: var(--app-space-3);
		border: 1px solid var(--purchase-workspace-border);
		border-radius: var(--app-radius-md);
		background: var(--purchase-workspace-card-bg);
	}

	&__item-action {
		display: flex;
		align-items: center;
		justify-content: flex-end;
	}

	@include overlayResponsive.overlay-responsive;

	@media (max-width: 768px) {
		&__toolbar-left,
		&__toolbar-right,
		&__header-main,
		&__metrics,
		&__items-header {
			flex-direction: column;
			align-items: stretch;
		}

		&__detail-grid {
			grid-template-columns: 1fr;
		}

		&__pagination {
			justify-content: flex-start;
		}

		&__toolbar-left,
		&__toolbar-right {
			> * {
				max-width: 100%;
				min-width: 0;
			}

			:deep(.el-input),
			:deep(.el-select),
			:deep(.el-date-editor.el-input),
			:deep(.el-date-editor.el-date-editor) {
				width: 100% !important;
			}
		}
	}
}
</style>
