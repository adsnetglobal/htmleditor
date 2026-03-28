#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const ROOT = __dirname;
const MANIFEST_PATH = path.join(ROOT, 'manifest.json');

const FALLBACK_REQUIRED_RUNTIME_FILES = [
  '_worker.js',
  'appscript.js',
  'config.js',
  'index.html',
  'wrangler.jsonc',
  'site.config.js',
  'README.md',
  'LICENSE.txt'
];

function normalizeRel(relPath) {
  return String(relPath || '').split(path.sep).join('/');
}

function existsFile(relPath) {
  const abs = path.join(ROOT, relPath);
  return fs.existsSync(abs) && fs.statSync(abs).isFile();
}

function readManifest() {
  if (!fs.existsSync(MANIFEST_PATH)) {
    return null;
  }

  try {
    return JSON.parse(fs.readFileSync(MANIFEST_PATH, 'utf8'));
  } catch (error) {
    return {
      __parse_error: error && error.message ? error.message : String(error)
    };
  }
}

function run() {
  const errors = [];
  const warnings = [];

  const manifest = readManifest();
  if (manifest && manifest.__parse_error) {
    errors.push(`manifest.json tidak valid: ${manifest.__parse_error}`);
  }

  if (!manifest) {
    warnings.push('manifest.json tidak ditemukan. Menggunakan fallback required runtime files.');
  }

  const requiredRuntimeFiles = Array.isArray(manifest && manifest.requiredRuntimeFiles)
    ? manifest.requiredRuntimeFiles.map(normalizeRel).filter(Boolean)
    : FALLBACK_REQUIRED_RUNTIME_FILES;

  for (const relPath of requiredRuntimeFiles) {
    if (!existsFile(relPath)) {
      errors.push(`missing required runtime file: ${relPath}`);
    }
  }

  if (manifest && Array.isArray(manifest.includedFiles)) {
    if (!manifest.includedFiles.includes('validate-config.js')) {
      warnings.push('manifest.includedFiles belum mencantumkan validate-config.js.');
    }
  }

  if (!existsFile('package.json')) {
    warnings.push('package.json tidak ditemukan.');
  } else {
    try {
      const pkg = JSON.parse(fs.readFileSync(path.join(ROOT, 'package.json'), 'utf8'));
      const scripts = (pkg && pkg.scripts) || {};
      if (!scripts['sync:installer']) {
        warnings.push('package.json scripts.sync:installer tidak ditemukan.');
      }
      if (!scripts['validate']) {
        warnings.push('package.json scripts.validate tidak ditemukan.');
      }
    } catch (error) {
      errors.push(`package.json tidak valid: ${error && error.message ? error.message : String(error)}`);
    }
  }

  if (existsFile('wrangler.jsonc')) {
    const wranglerRaw = fs.readFileSync(path.join(ROOT, 'wrangler.jsonc'), 'utf8');
    if (!/"main"\s*:\s*"_worker\.js"/.test(wranglerRaw)) {
      warnings.push('wrangler.jsonc tidak menunjuk main="_worker.js".');
    }
    if (!/"assets"\s*:\s*\{/.test(wranglerRaw)) {
      warnings.push('wrangler.jsonc tidak memiliki blok assets.');
    }
  }

  if (errors.length) {
    console.error('Config validation failed:');
    for (const error of errors) {
      console.error(`- ${error}`);
    }
    for (const warning of warnings) {
      console.warn(`Warning: ${warning}`);
    }
    process.exit(1);
  }

  console.log('Config validation passed.');
  for (const warning of warnings) {
    console.warn(`Warning: ${warning}`);
  }
}

run();
