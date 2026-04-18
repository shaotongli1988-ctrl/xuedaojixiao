const runtimeEnv = (globalThis as { process?: { env?: Record<string, string | undefined> } })
	.process?.env;

const proxyTarget =
	runtimeEnv?.COOL_ADMIN_PROXY_TARGET ||
	(import.meta as ImportMeta & { env?: Record<string, string | undefined> }).env
		?.VITE_DEV_PROXY_TARGET ||
	'http://127.0.0.1:8001';

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
const host = proxy[`/${value}/`]?.target;

export { proxy, host, value };
