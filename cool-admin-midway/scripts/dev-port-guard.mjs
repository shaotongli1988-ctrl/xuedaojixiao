/**
 * Dev port guard for cool-admin-midway.
 * This file blocks ambiguous local startup when the same repo already has a backend listener on 8001/other ports.
 * It is not responsible for launching Midway itself or managing production processes.
 * Maintenance pitfall: keep the default port and env names aligned with src/config/config.default.ts.
 */
import { execFileSync } from 'node:child_process';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, '..');
const defaultPort = 8001;

const args = new Set(process.argv.slice(2));
const shouldKill = args.has('--kill');
const shouldKillAll = args.has('--kill-all');
const allowMultiInstance =
	process.env.COOL_ADMIN_ALLOW_MULTI_INSTANCE === '1' || args.has('--allow-multi');

const portConfig = resolvePortConfig();
const listeners = listNodeListeners();
const repoListeners = listeners.filter(item => item.cwd === projectRoot);

if (shouldKill || shouldKillAll) {
	const targets = shouldKillAll
		? repoListeners
		: repoListeners.filter(item => item.port === portConfig.port);

	if (!targets.length) {
		console.log(
			shouldKillAll
				? `[dev-port-guard] no listener found for ${projectRoot}`
				: `[dev-port-guard] no ${projectRoot} listener found on port ${portConfig.port}`
		);
		process.exit(0);
	}

	for (const target of targets) {
		process.kill(target.pid, 'SIGTERM');
		console.log(
			`[dev-port-guard] stopped pid=${target.pid} port=${target.port} cwd=${target.cwd}`
		);
	}

	process.exit(0);
}

const samePortListener = repoListeners.find(item => item.port === portConfig.port);

if (samePortListener) {
	fail(
		[
			`port ${portConfig.port} is already occupied by the same repo`,
			describeListener(samePortListener),
			'Resolve it by stopping the old process first, or run `npm run dev:port:free`.',
		].join('\n')
	);
}

if (repoListeners.length && !allowMultiInstance) {
	const details = repoListeners.map(describeListener).join('\n');
	fail(
		[
			`another backend instance from the same repo is already listening on a different port while you are trying to start ${portConfig.port}`,
			details,
			`This is how stale 8001 / new 8006 drift happens.`,
			`Stop the existing instance, or explicitly reuse it with PORT=${repoListeners[0].port}, or bypass with COOL_ADMIN_ALLOW_MULTI_INSTANCE=1 if you really need multiple instances.`,
		].join('\n')
	);
}

console.log(
	`[dev-port-guard] ok targetPort=${portConfig.port} explicit=${portConfig.explicit ? 'yes' : 'no'}`
);

function resolvePortConfig() {
	const raw = process.env.COOL_ADMIN_PORT ?? process.env.PORT;

	if (!raw) {
		return {
			port: defaultPort,
			explicit: false,
		};
	}

	const port = Number(raw);
	if (!Number.isInteger(port) || port <= 0) {
		fail(`invalid port value: ${raw}`);
	}

	return {
		port,
		explicit: true,
	};
}

function listNodeListeners() {
	const output = runLsof(['-nP', '-iTCP', '-sTCP:LISTEN', '-Fpcn']);

	if (!output.trim()) {
		return [];
	}

	const records = [];
	let current = null;

	for (const line of output.split('\n')) {
		if (!line) {
			continue;
		}

		const prefix = line[0];
		const value = line.slice(1);

		if (prefix === 'p') {
			if (current) {
				records.push(current);
			}
			current = {
				pid: Number(value),
				command: '',
				name: '',
			};
			continue;
		}

		if (!current) {
			continue;
		}

		if (prefix === 'c') {
			current.command = value;
			continue;
		}

		if (prefix === 'n') {
			current.name = value;
		}
	}

	if (current) {
		records.push(current);
	}

	return records
		.filter(item => item.command === 'node')
		.map(item => ({
			...item,
			port: parsePort(item.name),
			cwd: readProcessCwd(item.pid),
		}))
		.filter(item => Number.isInteger(item.port));
}

function parsePort(name) {
	const matched = String(name || '').match(/:(\d+)(?:->|$)/);
	return matched ? Number(matched[1]) : NaN;
}

function readProcessCwd(pid) {
	const output = runLsof(['-a', '-p', String(pid), '-d', 'cwd', '-Fn']);
	const line = output
		.split('\n')
		.find(item => item.startsWith('n'));

	return line ? line.slice(1) : '';
}

function runLsof(args) {
	try {
		return execFileSync('lsof', args, {
			encoding: 'utf8',
			stdio: ['ignore', 'pipe', 'pipe'],
		});
	} catch (error) {
		if (error.status === 1) {
			return '';
		}
		throw error;
	}
}

function describeListener(listener) {
	return `- pid=${listener.pid} port=${listener.port} cwd=${listener.cwd || 'unknown'}`;
}

function fail(message) {
	console.error(`[dev-port-guard] ${message}`);
	process.exit(1);
}
