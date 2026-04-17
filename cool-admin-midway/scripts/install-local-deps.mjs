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

const projectRoot = process.cwd();
const sharedRoot = path.join(projectRoot, '.shared-deps', 'js');
const nodeModulesRoot = path.join(sharedRoot, 'node_modules');
const binRoot = path.join(nodeModulesRoot, '.bin');
const packageJsonPath = path.join(projectRoot, 'package.json');

fs.mkdirSync(nodeModulesRoot, { recursive: true });
fs.mkdirSync(binRoot, { recursive: true });

const requireFromShared = createRequire(path.join(nodeModulesRoot, '__resolver__.cjs'));
const semver = requireFromShared('semver');
const rootPackage = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
const installed = new Map();
const resolving = new Set();

function sleep(ms) {
  return new Promise(resolve => {
    setTimeout(resolve, ms);
  });
}

function encodePackageName(name) {
  return encodeURIComponent(name);
}

function fetchJson(url) {
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
  if (metadata['dist-tags']?.[range]) {
    return metadata['dist-tags'][range];
  }

  if (metadata.versions?.[range]) {
    return range;
  }

  const versions = Object.keys(metadata.versions || {}).filter(version =>
    semver.valid(version)
  );
  const resolved = semver.maxSatisfying(versions, range, {
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
  const specKey = `${targetName}@${rawSpec}`;

  if (resolving.has(specKey)) {
    return;
  }

  const existingVersion = installed.get(targetName);
  if (existingVersion) {
    const { range } = parseSpec(targetName, rawSpec);
    if (semver.valid(existingVersion) && semver.satisfies(existingVersion, range)) {
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
      semver.valid(existingPackage.version) &&
      semver.satisfies(existingPackage.version, range)
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

async function main() {
  const rootPackages = {
    ...(rootPackage.dependencies || {}),
    ...(rootPackage.devDependencies || {}),
  };
  const packageArgs = process.argv.slice(2);
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

  console.log(`Installed ${installed.size} packages into ${nodeModulesRoot}`);
}

main().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
