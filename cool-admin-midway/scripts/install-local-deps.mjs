/**
 * Installs cool-admin-midway dependencies into .shared-deps/js without npm install.
 * This only prepares local node_modules and binary links; it does not start services.
 */
import fs from 'node:fs';
import path from 'node:path';
import https from 'node:https';
import os from 'node:os';
import { execFileSync } from 'node:child_process';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const cli = parseCliArgs(process.argv.slice(2));
const projectRoot = cli.projectRoot;
const sharedRoot = path.join(projectRoot, '.shared-deps', 'js');
const nodeModulesRoot = path.join(sharedRoot, 'node_modules');
const binRoot = path.join(nodeModulesRoot, '.bin');
const packageJsonPath = path.join(projectRoot, 'package.json');

fs.mkdirSync(nodeModulesRoot, { recursive: true });
fs.mkdirSync(binRoot, { recursive: true });

const installed = new Map();
const resolving = new Set();
let semver;

function parseCliArgs(args) {
  const parsed = {
    projectRoot: process.cwd(),
    compatOnly: false,
    registryDir: null,
    packageArgs: [],
  };

  for (let index = 0; index < args.length; index++) {
    const currentArg = args[index];

    if (currentArg === '--project-root') {
      const explicitRoot = args[index + 1];
      if (!explicitRoot) {
        throw new Error('Missing value for --project-root');
      }
      parsed.projectRoot = path.resolve(explicitRoot);
      index += 1;
      continue;
    }

    if (currentArg === '--compat-only') {
      parsed.compatOnly = true;
      continue;
    }

    if (currentArg === '--registry-dir') {
      const explicitRegistryDir = args[index + 1];
      if (!explicitRegistryDir) {
        throw new Error('Missing value for --registry-dir');
      }
      parsed.registryDir = path.resolve(explicitRegistryDir);
      index += 1;
      continue;
    }

    parsed.packageArgs.push(currentArg);
  }

  return parsed;
}

function getSemver() {
  if (!semver) {
    try {
      const requireFromShared = createRequire(path.join(nodeModulesRoot, '__resolver__.cjs'));
      semver = requireFromShared('semver');
    } catch (_error) {
      semver = createFallbackSemver();
    }
  }

  return semver;
}

function createFallbackSemver() {
  function parseVersion(version) {
    if (typeof version !== 'string') {
      return null;
    }

    const normalized = version.trim();
    if (!normalized) {
      return null;
    }

    const mainPart = normalized.split('-')[0];
    const segments = mainPart.split('.');

    if (segments.length > 3 || segments.some(segment => !/^\d+$/.test(segment))) {
      return null;
    }

    while (segments.length < 3) {
      segments.push('0');
    }

    return {
      major: Number(segments[0]),
      minor: Number(segments[1]),
      patch: Number(segments[2]),
      normalized: `${Number(segments[0])}.${Number(segments[1])}.${Number(segments[2])}`,
    };
  }

  function compare(versionA, versionB) {
    const parsedA = parseVersion(versionA);
    const parsedB = parseVersion(versionB);

    if (!parsedA || !parsedB) {
      throw new Error(`Cannot compare invalid versions: ${versionA} vs ${versionB}`);
    }

    for (const key of ['major', 'minor', 'patch']) {
      if (parsedA[key] > parsedB[key]) {
        return 1;
      }
      if (parsedA[key] < parsedB[key]) {
        return -1;
      }
    }

    return 0;
  }

  function valid(version) {
    const parsed = parseVersion(version);
    return parsed ? parsed.normalized : null;
  }

  function isWithinRange(version, lowerBound, upperBound) {
    return compare(version, lowerBound) >= 0 && compare(version, upperBound) < 0;
  }

  function satisfies(version, rawRange) {
    if (rawRange === '*' || rawRange === 'latest') {
      return true;
    }

    const range = String(rawRange).trim();
    const parsedVersion = parseVersion(version);
    if (!parsedVersion) {
      return false;
    }

    if (range.startsWith('^')) {
      const base = parseVersion(range.slice(1));
      if (!base) {
        return false;
      }

      let upperBound;
      if (base.major > 0) {
        upperBound = `${base.major + 1}.0.0`;
      } else if (base.minor > 0) {
        upperBound = `0.${base.minor + 1}.0`;
      } else {
        upperBound = `0.0.${base.patch + 1}`;
      }

      return isWithinRange(version, base.normalized, upperBound);
    }

    if (range.startsWith('~')) {
      const base = parseVersion(range.slice(1));
      if (!base) {
        return false;
      }

      return isWithinRange(version, base.normalized, `${base.major}.${base.minor + 1}.0`);
    }

    const exact = parseVersion(range);
    if (exact) {
      if (/^\d+$/.test(range)) {
        return parsedVersion.major === exact.major;
      }
      if (/^\d+\.\d+$/.test(range)) {
        return parsedVersion.major === exact.major && parsedVersion.minor === exact.minor;
      }
      return compare(version, exact.normalized) === 0;
    }

    return false;
  }

  function maxSatisfying(versions, range) {
    const candidates = versions
      .filter(version => satisfies(version, range))
      .sort(compare);

    return candidates.length ? candidates[candidates.length - 1] : null;
  }

  return { valid, satisfies, maxSatisfying };
}

function sleep(ms) {
  return new Promise(resolve => {
    setTimeout(resolve, ms);
  });
}

function encodePackageName(name) {
  return encodeURIComponent(name);
}

function fetchJson(url) {
  if (cli.registryDir) {
    return readRegistryJson(url);
  }

  return requestWithRetry(`fetch ${url}`, () => {
    return new Promise((resolve, reject) => {
      https
        .get(
          url,
          {
            headers: {
              Accept: 'application/json',
              'User-Agent': 'cool-admin-local-installer',
            },
          },
          res => {
            if (
              res.statusCode &&
              res.statusCode >= 300 &&
              res.statusCode < 400 &&
              res.headers.location
            ) {
              resolve(fetchJson(res.headers.location));
              return;
            }

            if (res.statusCode !== 200) {
              reject(new Error(`Failed to fetch ${url}: ${res.statusCode}`));
              return;
            }

            let data = '';
            res.setEncoding('utf8');
            res.on('data', chunk => {
              data += chunk;
            });
            res.on('end', () => {
              resolve(JSON.parse(data));
            });
          }
        )
        .on('error', reject);
    });
  });
}

function downloadFile(url, filePath) {
  if (url.startsWith('file://')) {
    fs.copyFileSync(new URL(url), filePath);
    return Promise.resolve();
  }

  return requestWithRetry(`download ${url}`, () => {
    return new Promise((resolve, reject) => {
      https
        .get(
          url,
          {
            headers: {
              'User-Agent': 'cool-admin-local-installer',
            },
          },
          res => {
            if (
              res.statusCode &&
              res.statusCode >= 300 &&
              res.statusCode < 400 &&
              res.headers.location
            ) {
              resolve(downloadFile(res.headers.location, filePath));
              return;
            }

            if (res.statusCode !== 200) {
              reject(new Error(`Failed to download ${url}: ${res.statusCode}`));
              return;
            }

            const output = fs.createWriteStream(filePath);
            res.pipe(output);
            output.on('finish', () => {
              output.close(resolve);
            });
            output.on('error', reject);
          }
        )
        .on('error', reject);
    });
  });
}

function readRegistryJson(url) {
  const registryPrefix = 'https://registry.npmjs.org/';
  if (!url.startsWith(registryPrefix)) {
    throw new Error(`Unsupported registry url for local registry mode: ${url}`);
  }

  const packageName = url.slice(registryPrefix.length);
  const metadataPath = path.join(cli.registryDir, `${packageName}.json`);

  if (!fs.existsSync(metadataPath)) {
    throw new Error(`Local registry metadata not found: ${metadataPath}`);
  }

  return Promise.resolve(JSON.parse(fs.readFileSync(metadataPath, 'utf8')));
}

async function requestWithRetry(label, fn, retries = 4) {
  let lastError;

  for (let index = 1; index <= retries; index++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      if (index === retries) {
        break;
      }
      await sleep(index * 1000);
    }
  }

  throw lastError ?? new Error(`Unknown failure while ${label}`);
}

function parseSpec(targetName, rawSpec) {
  if (rawSpec.startsWith('npm:')) {
    const aliasSpec = rawSpec.slice(4);
    const atIndex = aliasSpec.lastIndexOf('@');
    if (atIndex <= 0) {
      throw new Error(`Unsupported alias spec: ${rawSpec}`);
    }
    return {
      targetName,
      sourceName: aliasSpec.slice(0, atIndex),
      range: aliasSpec.slice(atIndex + 1),
    };
  }

  return {
    targetName,
    sourceName: targetName,
    range: rawSpec,
  };
}

function resolveVersion(metadata, range) {
  const semverApi = getSemver();

  if (metadata['dist-tags']?.[range]) {
    return metadata['dist-tags'][range];
  }

  if (metadata.versions?.[range]) {
    return range;
  }

  const versions = Object.keys(metadata.versions || {}).filter(version =>
    semverApi.valid(version)
  );
  const resolved = semverApi.maxSatisfying(versions, range, {
    includePrerelease: false,
  });

  if (!resolved) {
    throw new Error(`Cannot resolve version for ${metadata.name}@${range}`);
  }

  return resolved;
}

function packageDir(packageName) {
  return path.join(nodeModulesRoot, ...packageName.split('/'));
}

function resolveExtractedPackageDir(tempRoot) {
  const packageDirPath = path.join(tempRoot, 'package');
  if (fs.existsSync(packageDirPath)) {
    return packageDirPath;
  }

  const entries = fs
    .readdirSync(tempRoot, { withFileTypes: true })
    .filter(entry => entry.isDirectory())
    .map(entry => path.join(tempRoot, entry.name));

  const fallback = entries.find(entry =>
    fs.existsSync(path.join(entry, 'package.json'))
  );

  if (!fallback) {
    throw new Error(`Cannot find extracted package directory in ${tempRoot}`);
  }

  return fallback;
}

function ensurePackageParent(packageName) {
  fs.mkdirSync(path.dirname(packageDir(packageName)), { recursive: true });
}

function createBinLinks(installedDir, packageJson) {
  if (!packageJson.bin) {
    return;
  }

  const binMap =
    typeof packageJson.bin === 'string'
      ? { [packageJson.name.split('/').pop()]: packageJson.bin }
      : packageJson.bin;

  for (const [binName, relativeTarget] of Object.entries(binMap)) {
    const binPath = path.join(binRoot, binName);
    const absoluteTarget = path.join(installedDir, relativeTarget);
    const targetPath = path.relative(binRoot, absoluteTarget);

    fs.rmSync(binPath, { force: true });
    fs.chmodSync(absoluteTarget, 0o755);
    fs.symlinkSync(targetPath, binPath);
  }
}

async function installPackage(targetName, rawSpec) {
  const semverApi = getSemver();
  const specKey = `${targetName}@${rawSpec}`;

  if (resolving.has(specKey)) {
    return;
  }

  const existingVersion = installed.get(targetName);
  if (existingVersion) {
    const { range } = parseSpec(targetName, rawSpec);
    if (semverApi.valid(existingVersion) && semverApi.satisfies(existingVersion, range)) {
      return;
    }
  }

  const existingPackageJsonPath = path.join(packageDir(targetName), 'package.json');
  if (fs.existsSync(existingPackageJsonPath)) {
    const existingPackage = JSON.parse(
      fs.readFileSync(existingPackageJsonPath, 'utf8')
    );
    const { range } = parseSpec(targetName, rawSpec);
    installed.set(targetName, existingPackage.version);
    if (
      semverApi.valid(existingPackage.version) &&
      semverApi.satisfies(existingPackage.version, range)
    ) {
      return;
    }
  }

  resolving.add(specKey);

  const { sourceName, range } = parseSpec(targetName, rawSpec);
  const metadata = await fetchJson(
    `https://registry.npmjs.org/${encodePackageName(sourceName)}`
  );
  const version = resolveVersion(metadata, range);
  const manifest = metadata.versions[version];

  ensurePackageParent(targetName);

  const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'cool-admin-deps-'));
  const archivePath = path.join(tempRoot, 'package.tgz');
  await downloadFile(manifest.dist.tarball, archivePath);
  execFileSync('tar', ['-xzf', archivePath, '-C', tempRoot]);

  const extractedDir = resolveExtractedPackageDir(tempRoot);
  const destinationDir = packageDir(targetName);

  fs.rmSync(destinationDir, { recursive: true, force: true });
  fs.mkdirSync(path.dirname(destinationDir), { recursive: true });
  fs.renameSync(extractedDir, destinationDir);
  fs.rmSync(tempRoot, { recursive: true, force: true });

  const installedPackageJson = JSON.parse(
    fs.readFileSync(path.join(destinationDir, 'package.json'), 'utf8')
  );
  createBinLinks(destinationDir, installedPackageJson);
  installed.set(targetName, installedPackageJson.version);

  const dependencies = {
    ...(installedPackageJson.dependencies || {}),
    ...(installedPackageJson.optionalDependencies || {}),
  };

  for (const [dependencyName, dependencySpec] of Object.entries(dependencies)) {
    await installPackage(dependencyName, dependencySpec);
  }

  resolving.delete(specKey);
}

function runCompatBootstrap() {
  execFileSync(
    process.execPath,
    [path.join(scriptDir, 'ensure-local-lint-compat.mjs'), '--project-root', projectRoot],
    {
      stdio: 'inherit',
    }
  );
}

async function main() {
  if (cli.compatOnly) {
    runCompatBootstrap();
    console.log(`Compatibility bootstrap completed for ${projectRoot}`);
    return;
  }

  const rootPackage = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
  const rootPackages = {
    ...(rootPackage.dependencies || {}),
    ...(rootPackage.devDependencies || {}),
  };
  const packageArgs = cli.packageArgs;
  const packages =
    packageArgs.length > 0
      ? Object.fromEntries(
          packageArgs.map(item => {
            if (item.includes('=')) {
              const separatorIndex = item.indexOf('=');
              return [item.slice(0, separatorIndex), item.slice(separatorIndex + 1)];
            }
            return [item, rootPackages[item]];
          })
        )
      : rootPackages;

  for (const [name, spec] of Object.entries(packages)) {
    if (!spec) {
      throw new Error(`Package spec not found for ${name}`);
    }
    await installPackage(name, spec);
  }

  runCompatBootstrap();

  console.log(`Installed ${installed.size} packages into ${nodeModulesRoot}`);
}

main().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
