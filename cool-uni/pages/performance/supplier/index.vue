<!-- 文件职责：承接 cool-uni 供应商管理移动列表；不负责桌面端增删改、采购联动或附件全文；维护重点是只消费供应商摘要字段。 -->
<template>
	<cl-page background-color="#f4f6fb">
		<scroll-view class="supplier-page" scroll-y>
			<view class="supplier-page__header">
				<text class="supplier-page__title">供应商管理</text>
				<text class="supplier-page__subtitle">查看供应商台账、联系人和启停状态，复杂维护动作仍保留桌面端</text>
			</view>

			<page-state
				v-if="!allowed"
				title="无权限访问该页面"
				description="当前账号没有供应商管理移动端入口。"
				action-text="返回工作台"
				@action="goHome"
			/>

			<view v-else class="supplier-page__body">
				<view class="toolbar-card">
					<cl-input
						v-model="keyword"
						:border="false"
						:height="76"
						:border-radius="16"
						placeholder="供应商名称 / 编码"
					/>
					<view class="toolbar-card__actions">
						<cl-button plain size="mini" @tap="resetFilters">重置</cl-button>
						<cl-button type="primary" size="mini" @tap="load">刷新</cl-button>
					</view>
				</view>

				<view class="status-tabs">
					<cl-tabs v-model="activeStatus" :list="statusTabs" :show-line="false" fill />
				</view>

				<page-state
					v-if="error"
					title="加载失败"
					:description="error"
					action-text="重试"
					@action="load"
				/>

				<page-state
					v-else-if="!loading && !rows.length"
					title="当前暂无供应商"
					description="当前筛选条件下暂无数据。"
				/>

				<view v-else class="supplier-list">
					<view v-for="item in rows" :key="item.id" class="supplier-card">
						<view class="supplier-card__top">
							<view>
								<text class="supplier-card__title">{{ item.name }}</text>
								<text class="supplier-card__meta">{{ item.code || "-" }} · {{ item.category || "-" }}</text>
							</view>
							<status-pill
								:label="statusLabel(item.status)"
								:tone="statusTone(item.status)"
							/>
						</view>

						<view class="supplier-card__grid">
							<text>联系人：{{ item.contactName || "-" }}</text>
							<text>联系电话：{{ item.contactPhone || "-" }}</text>
							<text>联系邮箱：{{ item.contactEmail || "-" }}</text>
							<text>更新时间：{{ item.updateTime || "-" }}</text>
						</view>

						<text class="supplier-card__summary">{{ item.remark || "暂无供应商备注" }}</text>
					</view>
				</view>
			</view>
		</scroll-view>
	</cl-page>
</template>

<script lang="ts" setup>
import { computed, ref, watch } from "vue";
import { onPullDownRefresh, onShow } from "@dcloudio/uni-app";
import { useCool } from "/@/cool";
import { useStore } from "/@/cool/store";
import { useListPage } from "/@/hooks/use-list-page";
import PageState from "/@/pages/performance/components/page-state.vue";
import StatusPill from "/@/pages/performance/components/status-pill.vue";
import { performanceSupplierService } from "/@/service/performance/supplier";
import { type SupplierRecord } from "/@/types/performance-supplier";

const SUPPLIER_STATUS_DICT_KEY = "performance.supplier.status";

const { router } = useCool();
const { user, dict } = useStore();

const keyword = ref("");
const activeStatus = ref<string>("all");
const allowed = computed(() => user.canAccessRoute("/pages/performance/supplier/index"));
const statusTabs = computed(() => [
	{ label: "全部", value: "all" },
	...dict.get(SUPPLIER_STATUS_DICT_KEY).map((item) => ({
		label: item.label,
		value: String(item.value),
	})),
]);
const supplierList = useListPage<SupplierRecord>({
	canLoad: () => allowed.value,
	fetchPage: async () => {
		await dict.refresh([SUPPLIER_STATUS_DICT_KEY]);
		return performanceSupplierService.fetchPage({
			page: 1,
			size: 20,
			keyword: keyword.value.trim() || undefined,
			status: activeStatus.value === "all" ? undefined : activeStatus.value,
		});
	},
	resolveError: (error) => (error as any)?.message || "供应商列表加载失败",
});
const rows = supplierList.rows;
const loading = supplierList.loading;
const error = supplierList.error;
const load = supplierList.reload;

function resetFilters() {
	keyword.value = "";
	activeStatus.value = "all";
	load();
}

function goHome() {
	router.push({ path: "/pages/index/home", mode: "reLaunch", isGuard: false });
}

function statusLabel(value?: string | null) {
	return dict.getLabel(SUPPLIER_STATUS_DICT_KEY, value) || value || "未知";
}

function statusTone(value?: string | null): "info" | "warning" | "success" | "error" {
	const tone = dict.getMeta(SUPPLIER_STATUS_DICT_KEY, value)?.tone;
	return tone === "success" || tone === "warning" ? tone : tone === "danger" ? "error" : "info";
}

watch(activeStatus, load);
onShow(load);
onPullDownRefresh(async () => {
	await load();
	uni.stopPullDownRefresh();
});
</script>

<style lang="scss" scoped>
.supplier-page {
	min-height: 100vh;
	padding: 24rpx;
	box-sizing: border-box;

	&__header {
		padding: 12rpx 8rpx 20rpx;
	}

	&__title {
		display: block;
		font-size: 40rpx;
		font-weight: 700;
		color: #1a2233;
	}

	&__subtitle {
		display: block;
		margin-top: 12rpx;
		font-size: 24rpx;
		line-height: 1.7;
		color: #687489;
	}

	&__body {
		display: flex;
		flex-direction: column;
		gap: 24rpx;
	}
}

.toolbar-card,
.status-tabs,
.supplier-card {
	padding: 28rpx;
	border-radius: 28rpx;
	background: #ffffff;
	box-shadow: 0 12rpx 30rpx rgba(34, 56, 99, 0.06);
}

.toolbar-card__actions {
	display: flex;
	flex-wrap: wrap;
	gap: 18rpx;
	margin-top: 18rpx;
}

.supplier-list {
	display: flex;
	flex-direction: column;
	gap: 20rpx;
}

.supplier-card {
	&__top {
		display: flex;
		align-items: flex-start;
		justify-content: space-between;
		gap: 16rpx;
	}

	&__title {
		display: block;
		font-size: 30rpx;
		font-weight: 700;
		color: #1a2233;
	}

	&__meta {
		display: block;
		margin-top: 12rpx;
		font-size: 22rpx;
		color: #748198;
	}

	&__grid {
		display: grid;
		grid-template-columns: repeat(2, minmax(0, 1fr));
		gap: 16rpx;
		margin-top: 24rpx;
		font-size: 24rpx;
		line-height: 1.6;
		color: #4f5c74;
	}

	&__summary {
		display: block;
		margin-top: 22rpx;
		font-size: 24rpx;
		line-height: 1.7;
		color: #4f5c74;
	}
}
</style>
