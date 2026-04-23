<template>
	<cl-page background-color="#f4f6fb">
		<cl-topbar :border="false" background-color="transparent" />

		<view class="login-page">
			<view class="login-page__hero">
				<text class="login-page__title">学道绩效移动端</text>
				<text class="login-page__subtitle">
					只开放已冻结的工作台、我的考核、待我审批、目标与 360 环评链路
				</text>
			</view>

			<view class="login-card">
				<view class="login-card__field">
					<text class="login-card__label">账号</text>
					<input
						v-model.trim="form.username"
						class="login-card__input"
						placeholder="请输入账号"
						confirm-type="next"
					/>
				</view>

				<view class="login-card__field">
					<text class="login-card__label">密码</text>
					<input
						v-model.trim="form.password"
						class="login-card__input"
						type="password"
						placeholder="请输入密码"
						confirm-type="done"
					/>
				</view>

				<view class="login-card__field">
					<text class="login-card__label">验证码</text>
					<view class="login-card__captcha-row">
						<input
							v-model.trim="form.verifyCode"
							class="login-card__input login-card__input--captcha"
							placeholder="请输入验证码"
							confirm-type="done"
						/>

						<view class="login-card__captcha" @tap="loadCaptcha">
							<image
								v-if="captchaImage"
								class="login-card__captcha-image"
								:src="captchaImage"
								mode="aspectFit"
							/>
							<text v-else class="login-card__captcha-text">刷新验证码</text>
						</view>
					</view>
				</view>

				<cl-button
					type="primary"
					fill
					:height="88"
					:loading="loading"
					@tap="submit"
				>
					登录
				</cl-button>

				<view class="login-card__tips">
					<text>验证账号建议：</text>
					<text>`employee_platform` / `manager_rd`，测试口令统一 `123456`。</text>
				</view>
			</view>
		</view>
	</cl-page>
</template>

<script lang="ts" setup>
import { onShow } from "@dcloudio/uni-app";
import { reactive, ref } from "vue";
import { router } from "/@/cool/router";
import { useStore } from "/@/cool/store";
import { adminBaseOpenService } from "/@/service/admin/base/open";
import { useUi } from "/$/cool-ui";

const { user } = useStore();
const ui = useUi();

const loading = ref(false);
const captchaImage = ref("");

const form = reactive({
	username: "",
	password: "",
	captchaId: "",
	verifyCode: "",
});

function normalizeCaptchaImage(data?: string) {
	if (!data) {
		return "";
	}

	if (data.includes(";base64,")) {
		return data;
	}

	return `data:image/svg+xml;utf8,${encodeURIComponent(data)}`;
}

async function loadCaptcha() {
	try {
		const res = await adminBaseOpenService.captcha({
			height: 52,
			width: 140,
			color: "#163a70",
		});

		form.captchaId = res.captchaId || "";
		form.verifyCode = "";
		captchaImage.value = normalizeCaptchaImage(res.data);
	} catch (error: any) {
		captchaImage.value = "";
		ui.showTips(error?.message || "验证码获取失败");
	}
}

async function submit() {
	if (!form.username || !form.password || !form.verifyCode || !form.captchaId) {
		ui.showTips("请完整填写登录信息");
		return;
	}

	loading.value = true;

	try {
		const res = await adminBaseOpenService.login({
			username: form.username,
			password: form.password,
			captchaId: form.captchaId,
			verifyCode: form.verifyCode,
		});

		user.setToken(res);
		await user.get();
		await user.fetchPermMenu();

		if (!user.workbenchPages.length) {
			await user.logout({ remote: false, reLaunch: false });
			ui.showTips("当前账号不在移动端开放范围");
			await loadCaptcha();
			return;
		}

		router.push({
			path: "/pages/index/home",
			mode: "reLaunch",
			isGuard: false,
		});
	} catch (error: any) {
		ui.showTips(error?.message || "登录失败");
		await loadCaptcha();
	} finally {
		loading.value = false;
	}
}

onShow(() => {
	if (!form.captchaId) {
		loadCaptcha();
	}
});
</script>

<style lang="scss" scoped>
.login-page {
	min-height: 100vh;
	padding: 80rpx 32rpx 48rpx;
	background:
		radial-gradient(circle at top left, rgba(47, 111, 237, 0.14), transparent 34%),
		linear-gradient(180deg, #eef3ff 0%, #f4f6fb 48%, #f8fafc 100%);
	box-sizing: border-box;

	&__hero {
		margin-top: 72rpx;
		margin-bottom: 48rpx;
	}

	&__title {
		display: block;
		font-size: 58rpx;
		font-weight: 700;
		line-height: 1.2;
		color: #172033;
	}

	&__subtitle {
		display: block;
		margin-top: 20rpx;
		font-size: 26rpx;
		line-height: 1.7;
		color: #5f6c86;
	}
}

.login-card {
	padding: 36rpx 28rpx;
	border-radius: 32rpx;
	background: rgba(255, 255, 255, 0.94);
	box-shadow: 0 18rpx 48rpx rgba(34, 56, 99, 0.08);
	backdrop-filter: blur(12rpx);

	&__field + &__field {
		margin-top: 28rpx;
	}

	&__label {
		display: block;
		margin-bottom: 14rpx;
		font-size: 24rpx;
		font-weight: 600;
		color: #43506a;
	}

	&__input {
		height: 88rpx;
		padding: 0 24rpx;
		border-radius: 22rpx;
		background: #f6f8fc;
		font-size: 28rpx;
		color: #172033;
		box-sizing: border-box;

		&--captcha {
			flex: 1;
		}
	}

	&__captcha-row {
		display: flex;
		gap: 18rpx;
		align-items: center;
	}

	&__captcha {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 220rpx;
		height: 88rpx;
		border-radius: 22rpx;
		background: #eef3ff;
		overflow: hidden;
	}

	&__captcha-image {
		width: 100%;
		height: 100%;
	}

	&__captcha-text {
		font-size: 24rpx;
		color: #325cb3;
	}

	:deep(.cl-button) {
		margin-top: 36rpx;
	}

	&__tips {
		margin-top: 24rpx;
		font-size: 22rpx;
		line-height: 1.8;
		color: #6a7487;
	}
}
</style>
