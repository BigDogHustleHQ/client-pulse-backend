#!/usr/bin/env node
// Regenerates Bruno .bru request files from openapi.yaml.
// Runs automatically via the PostToolUse hook in .claude/settings.json
// whenever openapi.yaml is saved.

import { readFileSync, writeFileSync, mkdirSync, readdirSync, existsSync, rmSync } from 'node:fs';
import { resolve, join, dirname, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, '..');
const require = createRequire(import.meta.url);

let yaml;
try {
  yaml = require('js-yaml');
} catch {
  console.error('[sync-api-docs] js-yaml not installed. Run: npm install --save-dev js-yaml');
  process.exit(1);
}

const specPath = join(root, 'openapi.yaml');
if (!existsSync(specPath)) {
  console.error('[sync-api-docs] openapi.yaml not found at repo root');
  process.exit(1);
}

const spec = yaml.load(readFileSync(specPath, 'utf8'));
const brunoDir = join(root, 'bruno');
const generated = new Set();

let seq = 1;

for (const [path, pathItem] of Object.entries(spec.paths ?? {})) {
  for (const method of ['get', 'post', 'put', 'patch', 'delete']) {
    const op = pathItem[method];
    if (!op) continue;

    const tag = op.tags?.[0] ?? 'Ungrouped';
    const name = op.summary ?? op.operationId ?? `${method.toUpperCase()} ${path}`;
    // Bruno uses :param notation for path parameters
    const url = `{{baseUrl}}${path.replace(/\{(\w+)\}/g, ':$1')}`;
    const hasBody = ['post', 'put', 'patch'].includes(method);

    // Path params section
    const pathMatches = [...path.matchAll(/\{(\w+)\}/g)];
    const pathParamLines = pathMatches.map((m) => {
      const paramDef = op.parameters?.find((p) => p.name === m[1] && p.in === 'path');
      const ex = paramDef?.example ?? paramDef?.schema?.example ?? '';
      return `  ${m[1]}: ${ex}`;
    });

    // Request body example
    let bodyExample = '{}';
    const bodyContent = op.requestBody?.content?.['application/json'];
    if (bodyContent?.example) {
      bodyExample = JSON.stringify(bodyContent.example, null, 2);
    } else if (bodyContent?.schema?.example) {
      bodyExample = JSON.stringify(bodyContent.schema.example, null, 2);
    }

    const lines = [
      `meta {`,
      `  name: ${name}`,
      `  type: http`,
      `  seq: ${seq++}`,
      `}`,
      ``,
      `${method} {`,
      `  url: ${url}`,
      `  body: ${hasBody ? 'json' : 'none'}`,
      `  auth: none`,
      `}`,
      ``,
      `headers {`,
      `  Accept: application/json`,
      ...(hasBody ? [`  Content-Type: application/json`] : []),
      `}`,
    ];

    if (pathParamLines.length) {
      lines.push(``, `params:path {`, ...pathParamLines, `}`);
    }

    if (hasBody) {
      lines.push(``, `body:json {`, bodyExample, `}`);
    }

    if (op.description) {
      lines.push(``, `docs {`, `  ${op.description.trim()}`, `}`);
    }

    const content = lines.join('\n') + '\n';
    const folderPath = join(brunoDir, tag);
    mkdirSync(folderPath, { recursive: true });
    const filePath = join(folderPath, `${name}.bru`);
    writeFileSync(filePath, content, 'utf8');
    generated.add(filePath);
    console.log(`  ✓ ${relative(root, filePath)}`);
  }
}

// Remove .bru files that no longer correspond to a spec entry
// (skip environments/ and collection.bru)
function pruneStale(dir) {
  if (!existsSync(dir)) return;
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory() && entry.name !== 'environments') {
      pruneStale(full);
    } else if (entry.isFile() && entry.name.endsWith('.bru') && !generated.has(full)) {
      rmSync(full);
      console.log(`  ✗ removed ${relative(root, full)}`);
    }
  }
}

pruneStale(brunoDir);
console.log('[sync-api-docs] Bruno collection synced from openapi.yaml');
