<template>
	<cl-page background-color="#f4f6fb">
		<cl-topbar :show-back="false" :border="false" background-color="transparent" />

		<scroll-view class="workbench" scroll-y>
			<view class="workbench__hero">
				<view>
					<text class="workbench__hello"
						>你好，{{ user.info?.name || user.info?.username }}</text
					>
					<text class="workbench__meta">
						{{ user.info?.departmentName || "当前账号" }} ·
						{{ user.roleLabel }}
					</text>
				</view>

				<cl-button plain size="mini" @tap="logout">退出</cl-button>
			</view>

			<view class="workbench__summary">
				<text class="workbench__summary-title">移动工作台</text>
				<text class="workbench__summary-text">
					只展示当前账号在移动端已开放且拥有权限的入口，优先承接高频查看、跟进和状态动作。
				</text>
			</view>

			<page-state
				v-if="!cards.length"
				title="当前账号暂无可访问入口"
				description="请使用员工、部门经理、HR 或只读测试账号登录。其他未开放角色不提供移动端业务入口。"
				action-text="退出登录"
				@action="logout"
			/>

			<view v-else class="workbench__card-list">
				<view
					v-for="card in cards"
					:key="card.id"
					class="workbench-card"
					@tap="openCard(card.path)"
				>
					<view class="workbench-card__top">
						<text class="workbench-card__title">{{ card.title }}</text>
						<text class="workbench-card__count">
							{{ countLoading[card.id] ? "..." : (summary[card.id] ?? 0) }}
						</text>
					</view>
					<text class="workbench-card__desc">{{ card.description }}</text>
					<text class="workbench-card__action">进入</text>
				</view>
			</view>
		</scroll-view>
	</cl-page>
</template>

<script lang="ts" setup>
import { computed, reactive } from "vue";
import { onPullDownRefresh, onShow } from "@dcloudio/uni-app";
import { router } from "/@/cool/router";
import { useStore } from "/@/cool/store";
import { performanceAssessmentService } from "/@/service/performance/assessment";
import { performanceCapabilityService } from "/@/service/performance/capability";
import { performanceCertificateService } from "/@/service/performance/certificate";
import { performanceContractService } from "/@/service/performance/contract";
import {
	performanceCourseExamService,
	performanceCoursePracticeService,
	performanceCourseReciteService,
} from "/@/service/performance/courseLearning";
import { performanceDashboardService } from "/@/service/performance/dashboard";
import { performanceFeedbackService } from "/@/service/performance/feedback";
import { performanceGoalService } from "/@/service/performance/goal";
import { performanceIndicatorService } from "/@/service/performance/indicator";
import { performancePipService } from "/@/service/performance/pip";
import { performancePromotionService } from "/@/service/performance/promotion";
import { performanceRecruitPlanService } from "/@/service/performance/recruitPlan";
import { performanceResumePoolService } from "/@/service/performance/resumePool";
import { performanceSalaryService } from "/@/service/performance/salary";
import { performanceMeetingService } from "/@/service/performance/meeting";
import { performanceSuggestionService } from "/@/service/performance/suggestion";
import { performanceSupplierService } from "/@/service/performance/supplier";
import { performanceTalentAssetService } from "/@/service/performance/talentAsset";
import {
	performanceTeacherClassService,
	performanceTeacherDashboardService,
	performanceTeacherInfoService,
	performanceTeacherTodoService,
} from "/@/service/performance/teacherChannel";
import { performanceCourseService } from "/@/service/performance/course";
import { performanceJobStandardService } from "/@/service/performance/jobStandard";
import { performanceWorkPlanService } from "/@/service/performance/workPlan";
import { workbenchCards } from "/@/types/performance-mobile";
import PageState from "/@/pages/performance/components/page-state.vue";

const { user } = useStore();

const summary = reactive<Record<string, number | string>>({});
const countLoading = reactive<Record<string, boolean>>({});

const cards = computed(() => {
	return user.workbenchPages
		.map((id) => workbenchCards[id as keyof typeof workbenchCards])
		.filter(Boolean);
});

async function refreshSummary() {
	await Promise.all(
		cards.value.map(async (card) => {
			countLoading[card.id] = true;
			try {
				switch (card.id) {
					case "my-assessment": {
						const res = await performanceAssessmentService.fetchPage({
							page: 1,
							size: 1,
							mode: "my",
						});
						summary[card.id] = res?.pagination?.total || 0;
						break;
					}
					case "pending-approval": {
						const res = await performanceAssessmentService.fetchPage({
							page: 1,
							size: 1,
							mode: "pending",
						});
						summary[card.id] = res?.pagination?.total || 0;
						break;
					}
					case "goal": {
						const res = await performanceGoalService.fetchPage({
							page: 1,
							size: 1,
						});
						summary[card.id] = res?.pagination?.total || 0;
						break;
					}
					case "feedback": {
						const res = await performanceFeedbackService.fetchPage({
							page: 1,
							size: 1,
						});
						summary[card.id] = res?.pagination?.total || 0;
						break;
					}
					case "course-learning": {
						const hasLearningData =
							user.hasPerm(performanceCourseReciteService.permission.page) ||
							user.hasPerm(performanceCoursePracticeService.permission.page) ||
							user.hasPerm(performanceCourseExamService.permission.summary);
						summary[card.id] = hasLearningData ? "输入ID" : 0;
						break;
					}
					case "teacher-todo": {
						const res = await performanceTeacherTodoService.fetchPage({
							page: 1,
							size: 1,
						});
						summary[card.id] = res?.pagination?.total || 0;
						break;
					}
					case "dashboard": {
						const res = await performanceDashboardService.fetchSummary();
						summary[card.id] = Number(res?.pendingApprovalCount || 0);
						break;
					}
					case "work-plan": {
						const res = await performanceWorkPlanService.fetchPage({
							page: 1,
							size: 1,
						});
						summary[card.id] = res?.pagination?.total || 0;
						break;
					}
					case "teacher-dashboard": {
						const res = await performanceTeacherDashboardService.fetchSummary();
						summary[card.id] = Number(res?.resourceTotal || 0);
						break;
					}
					case "teacher-list": {
						const res = await performanceTeacherInfoService.fetchPage({
							page: 1,
							size: 1,
						});
						summary[card.id] = res?.pagination?.total || 0;
						break;
					}
					case "teacher-class": {
						const res = await performanceTeacherClassService.fetchPage({
							page: 1,
							size: 1,
						});
						summary[card.id] = res?.pagination?.total || 0;
						break;
					}
					case "initiated": {
						const res = await performanceAssessmentService.fetchPage({
							page: 1,
							size: 1,
							mode: "initiated",
						});
						summary[card.id] = res?.pagination?.total || 0;
						break;
					}
					case "course": {
						const res = await performanceCourseService.fetchPage({
							page: 1,
							size: 1,
						});
						summary[card.id] = res?.pagination?.total || 0;
						break;
					}
					case "meeting": {
						const res = await performanceMeetingService.fetchPage({
							page: 1,
							size: 1,
						});
						summary[card.id] = res?.pagination?.total || 0;
						break;
					}
					case "suggestion": {
						const res = await performanceSuggestionService.fetchPage({
							page: 1,
							size: 1,
						});
						summary[card.id] = res?.pagination?.total || 0;
						break;
					}
					case "capability": {
						const res = await performanceCapabilityService.fetchPage({
							page: 1,
							size: 1,
						});
						summary[card.id] = res?.pagination?.total || 0;
						break;
					}
					case "certificate": {
						const res = await performanceCertificateService.fetchPage({
							page: 1,
							size: 1,
						});
						summary[card.id] = res?.pagination?.total || 0;
						break;
					}
					case "contract": {
						const res = await performanceContractService.fetchPage({
							page: 1,
							size: 1,
						});
						summary[card.id] = res?.pagination?.total || 0;
						break;
					}
					case "job-standard": {
						const res = await performanceJobStandardService.fetchPage({
							page: 1,
							size: 1,
						});
						summary[card.id] = res?.pagination?.total || 0;
						break;
					}
					case "indicator-library": {
						const res = await performanceIndicatorService.fetchPage({
							page: 1,
							size: 1,
						});
						summary[card.id] = res?.pagination?.total || 0;
						break;
					}
					case "salary": {
						const res = await performanceSalaryService.fetchPage({
							page: 1,
							size: 1,
						});
						summary[card.id] = res?.pagination?.total || 0;
						break;
					}
					case "supplier": {
						const res = await performanceSupplierService.fetchPage({
							page: 1,
							size: 1,
						});
						summary[card.id] = res?.pagination?.total || 0;
						break;
					}
					case "pip": {
						const res = await performancePipService.fetchPage({
							page: 1,
							size: 1,
						});
						summary[card.id] = res?.pagination?.total || 0;
						break;
					}
					case "promotion": {
						const res = await performancePromotionService.fetchPage({
							page: 1,
							size: 1,
						});
						summary[card.id] = res?.pagination?.total || 0;
						break;
					}
					case "talent-asset": {
						const res = await performanceTalentAssetService.fetchPage({
							page: 1,
							size: 1,
						});
						summary[card.id] = res?.pagination?.total || 0;
						break;
					}
					case "recruit-plan": {
						const res = await performanceRecruitPlanService.fetchPage({
							page: 1,
							size: 1,
						});
						summary[card.id] = res?.pagination?.total || 0;
						break;
					}
					case "resume-pool": {
						const res = await performanceResumePoolService.fetchPage({
							page: 1,
							size: 1,
						});
						summary[card.id] = res?.pagination?.total || 0;
						break;
					}
				}
			} catch (error) {
				summary[card.id] = card.id === "course-learning" ? "输入ID" : 0;
			} finally {
				countLoading[card.id] = false;
			}
		}),
	);
}

function openCard(path: string) {
	router.push(path);
}

async function logout() {
	await user.logout({ remote: true, reLaunch: true });
}

onShow(() => {
	refreshSummary();
});

onPullDownRefresh(async () => {
	await refreshSummary();
	uni.stopPullDownRefresh();
});
</script>

<style lang="scss" scoped>
.workbench {
	min-height: 100vh;
	padding: 24rpx 24rpx 48rpx;
	box-sizing: border-box;

	&__hero {
		display: flex;
		align-items: flex-start;
		justify-content: space-between;
		padding: 24rpx 8rpx 16rpx;
	}

	&__hello {
		display: block;
		font-size: 44rpx;
		font-weight: 700;
		line-height: 1.2;
		color: #182132;
	}

	&__meta {
		display: block;
		margin-top: 12rpx;
		font-size: 24rpx;
		color: #657087;
	}

	&__summary {
		padding: 28rpx;
		border-radius: 28rpx;
		background: linear-gradient(135deg, #173f7a 0%, #2d68c8 100%);
		box-shadow: 0 16rpx 40rpx rgba(23, 63, 122, 0.18);
	}

	&__summary-title {
		display: block;
		font-size: 34rpx;
		font-weight: 700;
		color: #ffffff;
	}

	&__summary-text {
		display: block;
		margin-top: 14rpx;
		font-size: 24rpx;
		line-height: 1.7;
		color: rgba(255, 255, 255, 0.86);
	}

	&__card-list {
		display: flex;
		flex-direction: column;
		gap: 24rpx;
		margin-top: 28rpx;
	}
}

.workbench-card {
	padding: 28rpx;
	border-radius: 28rpx;
	background: #ffffff;
	box-shadow: 0 14rpx 34rpx rgba(34, 56, 99, 0.06);

	&__top {
		display: flex;
		align-items: center;
		justify-content: space-between;
	}

	&__title {
		font-size: 32rpx;
		font-weight: 700;
		color: #182132;
	}

	&__count {
		font-size: 40rpx;
		font-weight: 700;
		color: #2d68c8;
	}

	&__desc {
		display: block;
		margin-top: 18rpx;
		font-size: 24rpx;
		line-height: 1.7;
		color: #657087;
	}

	&__action {
		display: inline-block;
		margin-top: 22rpx;
		font-size: 24rpx;
		font-weight: 600;
		color: #295cb3;
	}
}
</style>
