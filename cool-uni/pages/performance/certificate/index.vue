<!-- 文件职责：承接 cool-uni 证书管理移动列表；不负责证书发放、记录明细或来源课程跳转；维护重点是只消费证书台账摘要字段。 -->
<template>
	<cl-page background-color="#f4f6fb">
		<scroll-view class="certificate-page" scroll-y>
			<view class="certificate-page__header">
				<text class="certificate-page__title">证书管理</text>
				<text class="certificate-page__subtitle"
					>查看证书台账、发证机构、有效期和发放数量，复杂维护动作仍保留桌面端</text
				>
			</view>

			<page-state
				v-if="!allowed"
				title="无权限访问该页面"
				description="当前账号没有证书管理移动端入口。"
				action-text="返回工作台"
				@action="goHome"
			/>

			<view v-else class="certificate-page__body">
				<view class="toolbar-card">
					<cl-input
						v-model="keyword"
						:border="false"
						:height="76"
						:border-radius="16"
						placeholder="证书名称 / 编码"
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
					title="当前暂无证书"
					description="当前筛选条件下暂无数据。"
				/>

				<view v-else class="certificate-list">
					<view v-for="item in rows" :key="item.id" class="certificate-card">
						<view class="certificate-card__top">
							<view>
								<text class="certificate-card__title">{{ item.name }}</text>
								<text class="certificate-card__meta"
									>{{ item.code || "-" }} · {{ item.category || "-" }}</text
								>
							</view>
							<status-pill
								:label="statusLabel(item.status)"
								:tone="statusTone(item.status)"
							/>
						</view>

						<view class="certificate-card__grid">
							<text>发证机构：{{ item.issuer || "-" }}</text>
							<text>有效期：{{ item.validityMonths ?? "-" }} 个月</text>
							<text>发放数量：{{ item.issuedCount ?? 0 }}</text>
							<text>更新时间：{{ item.updateTime || "-" }}</text>
						</view>

						<text class="certificate-card__summary">{{
							item.description || "暂无证书说明"
						}}</text>
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
import { performanceCertificateService } from "/@/service/performance/certificate";
import { type CertificateRecord } from "/@/types/performance-certificate";

const CERTIFICATE_STATUS_DICT_KEY = "performance.certificate.status";

const { router } = useCool();
const { user, dict } = useStore();

const keyword = ref("");
const activeStatus = ref<string>("all");
const allowed = computed(() => user.canAccessRoute("/pages/performance/certificate/index"));
const statusTabs = computed(() => [
	{ label: "全部", value: "all" },
	...dict.get(CERTIFICATE_STATUS_DICT_KEY).map((item) => ({
		label: item.label,
		value: String(item.value),
	})),
]);
const certificateList = useListPage<CertificateRecord>({
	canLoad: () => allowed.value,
	fetchPage: async () => {
		await dict.refresh([CERTIFICATE_STATUS_DICT_KEY]);
		return performanceCertificateService.fetchPage({
			page: 1,
			size: 20,
			keyword: keyword.value.trim() || undefined,
			status: activeStatus.value === "all" ? undefined : activeStatus.value,
		});
	},
	resolveError: (error) => (error as any)?.message || "证书列表加载失败",
});
const rows = certificateList.rows;
const loading = certificateList.loading;
const error = certificateList.error;
const load = certificateList.reload;

function resetFilters() {
	keyword.value = "";
	activeStatus.value = "all";
	load();
}

function goHome() {
	router.push({ path: "/pages/index/home", mode: "reLaunch", isGuard: false });
}

function statusLabel(value?: string) {
	return dict.getLabel(CERTIFICATE_STATUS_DICT_KEY, value) || value || "未知";
}

function statusTone(value?: string): "info" | "warning" | "success" | "error" {
	const tone = dict.getMeta(CERTIFICATE_STATUS_DICT_KEY, value)?.tone;
	return tone === "warning" || tone === "error" || tone === "success" ? tone : "info";
}

watch(activeStatus, load);
onShow(load);
onPullDownRefresh(async () => {
	await load();
	uni.stopPullDownRefresh();
});
</script>

<style lang="scss" scoped>
.certificate-page {
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
.certificate-card {
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

.certificate-list {
	display: flex;
	flex-direction: column;
	gap: 20rpx;
}

.certificate-card {
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
		white-space: pre-wrap;
	}
}
</style>
