import { router } from "/@/cool/router";
import { useStore } from "/@/cool/store";

const ignoreToken = ["/pages/user/login"];

router.beforeEach((to: { path: string }, next: () => void) => {
	const { user } = useStore();

	if (ignoreToken.includes(to.path)) {
		next();
		return;
	}

	if (!user.token) {
		router.login({ reLaunch: true });
		return;
	}

	Promise.resolve(user.hydrate())
		.then((ready) => {
			if (!ready) {
				user.logout({ remote: false, reLaunch: true });
				return;
			}

			if (!user.canAccessRoute(to.path)) {
				router.push({
					path: "/pages/index/home",
					mode: "reLaunch",
					isGuard: false,
				});
				return;
			}

			next();
		})
		.catch(() => {
			user.logout({ remote: false, reLaunch: true });
		});
});
