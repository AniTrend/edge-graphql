import { test } from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const projectRoot = path.resolve(__dirname, '..')

const readSwaggerSpec = async () => {
  const specPath = path.join(projectRoot, 'swagger-spec.json')
  const raw = await fs.readFile(specPath, 'utf-8')
  return JSON.parse(raw)
}

const readFixture = async () => {
  const fixturePath = path.join(__dirname, 'fixtures', 'public-contract.json')
  const raw = await fs.readFile(fixturePath, 'utf-8')
  return JSON.parse(raw)
}

// ── Metadata and structure ──────────────────────────────────────────

test('swagger spec includes required top-level fields', async () => {
  const spec = await readSwaggerSpec()
  assert.ok(spec.openapi, 'Expected openapi version to be defined')
  assert.ok(spec.info, 'Expected info section to be defined')
  assert.ok(spec.paths, 'Expected paths to be defined')
  assert.ok(spec.components, 'Expected components to be defined')
  assert.ok(spec.components.schemas, 'Expected components.schemas to be defined')
})

test('OpenAPI version is 3.x', async () => {
  const spec = await readSwaggerSpec()
  assert.ok(
    String(spec.openapi).startsWith('3.'),
    `Expected OpenAPI version to start with '3.', got '${spec.openapi}'`,
  )
})

// ── Schema names: reject garbage ─────────────────────────────────────

test('OpenAPI schemas do not contain forbidden generated names', async () => {
  const spec = await readSwaggerSpec()
  const fixture = await readFixture()
  const schemaNames = Object.keys(spec.components?.schemas ?? {})

  const forbiddenPatterns = fixture.forbiddenTypePatterns ?? []
  const isForbidden = (name) =>
    forbiddenPatterns.some((pattern) => new RegExp(pattern, 'i').test(name)) ||
    name === 'undefined'

  const forbidden = schemaNames.filter((name) => isForbidden(name))

  assert.deepEqual(
    forbidden,
    [],
    forbidden.length > 0
      ? `Forbidden schema names found: ${forbidden.join(', ')}`
      : undefined,
  )
})

// ── Type arrays: reject OpenAPI 3.0-invalid type arrays ──────────────

test('OpenAPI 3.0 schema nodes do not use JSON Schema type arrays', async () => {
  const spec = await readSwaggerSpec()
  const offenders = []

  const visit = (value, path = '$') => {
    if (!value || typeof value !== 'object') return

    if (Array.isArray(value.type)) {
      offenders.push({ path, type: value.type })
    }

    for (const [key, child] of Object.entries(value)) {
      visit(child, `${path}.${key}`)
    }
  }

  visit(spec)

  assert.deepEqual(
    offenders,
    [],
    offenders.length > 0
      ? `Type arrays found at: ${offenders.map((o) => `${o.path}: [${o.type}]`).join('; ')}`
      : undefined,
  )
})

// ── Expected operationIds ────────────────────────────────────────────

test('OpenAPI exposes all expected operationIds', async () => {
  const spec = await readSwaggerSpec()
  const actual = []

  for (const pathItem of Object.values(spec.paths ?? {})) {
    for (const operation of Object.values(pathItem ?? {})) {
      if (operation && typeof operation === 'object' && operation.operationId) {
        actual.push(operation.operationId)
      }
    }
  }

  // 16 total operationIds: 9 GET (composed into Query) + 7 push/mutation
  const expected = [
    // GET operations (composed into GraphQL Query fields)
    'character',
    'config',
    'episodes',
    'index',
    'news',
    'newsFeed',
    'person',
    'series',
    'studio',
    // Push / mutation-only operations (not composed into supergraph)
    'confirmInstallation',
    'deleteInstallation',
    'registerInstallation',
    'sendTestPush',
    'updatePreferences',
    'updateProfile',
    'vapid',
  ]

  const missing = expected.filter((id) => !actual.includes(id))

  assert.deepEqual(
    missing,
    [],
    missing.length > 0
      ? `Missing operationIds: ${missing.join(', ')}`
      : undefined,
  )
})

// ── Expected GET paths ───────────────────────────────────────────────

test('OpenAPI exposes all expected GET paths', async () => {
  const spec = await readSwaggerSpec()

  const expectedPaths = [
    '/v1',
    '/v1/characters',
    '/v1/config',
    '/v1/episodes',
    '/v1/news',
    '/v1/news/feed',
    '/v1/people',
    '/v1/push/vapid',
    '/v1/series',
    '/v1/studios',
  ]

  for (const expectedPath of expectedPaths) {
    assert.ok(
      spec.paths?.[expectedPath],
      `Expected path ${expectedPath} to exist in OpenAPI spec`,
    )
  }
})

// ── Contract fixture: check stability ────────────────────────────────

test('public-contract fixture queryFields match operationIds', async () => {
  const fixture = await readFixture()
  const spec = await readSwaggerSpec()
  const actual = []

  for (const pathItem of Object.values(spec.paths ?? {})) {
    for (const operation of Object.values(pathItem ?? {})) {
      if (operation && typeof operation === 'object' && operation.operationId) {
        actual.push(operation.operationId)
      }
    }
  }

  // fixture queryFields should be a subset of actual operationIds
  for (const field of fixture.queryFields) {
    assert.ok(
      actual.includes(field),
      `Fixture queryField '${field}' not found in OpenAPI operationIds`,
    )
  }
})
