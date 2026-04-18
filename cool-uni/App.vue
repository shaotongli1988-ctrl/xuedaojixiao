<script setup lang="ts">
import { useStore } from "/@/cool/store";
import { onLaunch, onShow, onHide } from "@dcloudio/uni-app";

onLaunch(() => {
	const { dict, user } = useStore();

	// 获取字典
	// dict.refresh();

	if (user.token) {
		user.hydrate().catch(() => {
			user.logout({ remote: false, reLaunch: true });
		});
	}
});

onShow(() => {});
onHide(() => {});
</script>

<style lang="scss">
@import "/$/cool-ui/index.scss";
@import "/@/static/css/index.scss";
</style>
