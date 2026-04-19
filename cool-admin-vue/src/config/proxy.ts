/**
 * Development proxy targets for the admin frontend.
 * This file only defines proxy routing and the currently selected dev target.
 * It does not decide backend startup ports or guarantee that a target instance is healthy.
 * Maintenance pitfall: do not silently fall back to a historical backend port; require an explicit dev target instead.
 */
const runtimeEnv = (globalThis as { process?: { env?: Record<string, string | undefined> } })
	.process?.env;

const proxyTarget =
	runtimeEnv?.COOL_ADMIN_PROXY_TARGET ||
	(import.meta as ImportMeta & { env?: Record<string, string | undefined> }).env
		?.VITE_DEV_PROXY_TARGET ||
	'';

const hasDevProxyTarget = Boolean(proxyTarget);

const proxy = {
	'/dev/': {
		target: proxyTarget,
		changeOrigin: true,
		rewrite: (path: string) => path.replace(/^\/dev/, '')
	},

	'/prod/': {
		target: 'https://show.cool-admin.com',
		changeOrigin: true,
		rewrite: (path: string) => path.replace(/^\/prod/, '/api')
	}
};

const value = 'dev';
const host = hasDevProxyTarget ? proxy[`/${value}/`]?.target : '';

export { proxy, host, value, hasDevProxyTarget };
