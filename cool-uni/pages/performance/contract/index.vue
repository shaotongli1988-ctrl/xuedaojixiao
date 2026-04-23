<!-- 文件职责：承接 cool-uni 合同管理移动列表；不负责合同编辑、删除、附件或签署轨迹；维护重点是只消费合同台账摘要字段。 -->
<template>
	<cl-page background-color="#f4f6fb">
		<scroll-view class="contract-page" scroll-y>
			<view class="contract-page__header">
				<text class="contract-page__title">合同管理</text>
				<text class="contract-page__subtitle"
					>查看合同台账、状态、员工和合同周期，复杂维护动作仍保留桌面端</text
				>
			</view>

			<page-state
				v-if="!allowed"
				title="无权限访问该页面"
				description="当前账号没有合同管理移动端入口。"
				action-text="返回工作台"
				@action="goHome"
			/>

			<view v-else class="contract-page__body">
				<view class="toolbar-card">
					<cl-input
						v-model="keyword"
						:border="false"
						:height="76"
						:border-radius="16"
						placeholder="合同标题 / 合同编号"
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
					title="当前暂无合同"
					description="当前筛选条件下暂无数据。"
				/>

				<view v-else class="contract-list">
					<view v-for="item in rows" :key="item.id" class="contract-card">
						<view class="contract-card__top">
							<view>
								<text class="contract-card__title">{{
									item.title || item.contractNumber || "未命名合同"
								}}</text>
								<text class="contract-card__meta">
									{{ item.employeeName || "-" }} ·
									{{ contractTypeLabel(item.type) }}
								</text>
							</view>
							<status-pill
								:label="contractStatusLabel(item.status)"
								:tone="contractStatusTone(item.status)"
							/>
						</view>

						<view class="contract-card__grid">
							<text>合同编号：{{ item.contractNumber || "-" }}</text>
							<text>所属部门：{{ item.departmentName || "-" }}</text>
							<text>岗位：{{ item.position || "-" }}</text>
							<text>薪资：{{ formatContractSalary(item.salary) }}</text>
						</view>

						<text class="contract-card__summary">
							合同周期：{{ item.startDate || "-" }} ~ {{ item.endDate || "-" }}
						</text>
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
import { performanceContractService } from "/@/service/performance/contract";
import { formatContractSalary, type ContractRecord } from "/@/types/performance-contract";

const CONTRACT_TYPE_DICT_KEY = "performance.contract.type";
const CONTRACT_STATUS_DICT_KEY = "performance.contract.status";

const { router } = useCool();
const { user, dict } = useStore();

const keyword = ref("");
const activeStatus = ref<string>("all");
const allowed = computed(() => user.canAccessRoute("/pages/performance/contract/index"));
const statusTabs = computed(() => [
	{ label: "全部", value: "all" },
	...dict.get(CONTRACT_STATUS_DICT_KEY).map((item) => ({
		label: item.label,
		value: String(item.value),
	})),
]);
const contractList = useListPage<ContractRecord>({
	canLoad: () => allowed.value,
	fetchPage: async () => {
		await dict.refresh([CONTRACT_TYPE_DICT_KEY, CONTRACT_STATUS_DICT_KEY]);
		return performanceContractService.fetchPage({
			page: 1,
			size: 20,
			keyword: keyword.value.trim() || undefined,
			status: activeStatus.value === "all" ? undefined : activeStatus.value,
		});
	},
	resolveError: (error) => (error as any)?.message || "合同列表加载失败",
});
const rows = contractList.rows;
const loading = contractList.loading;
const error = contractList.error;
const load = contractList.reload;

function resetFilters() {
	keyword.value = "";
	activeStatus.value = "all";
	load();
}

function goHome() {
	router.push({ path: "/pages/index/home", mode: "reLaunch", isGuard: false });
}

function contractTypeLabel(value?: string | null) {
	return dict.getLabel(CONTRACT_TYPE_DICT_KEY, value) || value || "未知";
}

function contractStatusLabel(value?: string | null) {
	return dict.getLabel(CONTRACT_STATUS_DICT_KEY, value) || value || "未知";
}

function contractStatusTone(value?: string | null): "info" | "warning" | "success" | "error" {
	const tone = dict.getMeta(CONTRACT_STATUS_DICT_KEY, value)?.tone;
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
.contract-page {
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
.contract-card {
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

.contract-list {
	display: flex;
	flex-direction: column;
	gap: 20rpx;
}

.contract-card {
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
