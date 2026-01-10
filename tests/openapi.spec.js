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

test('swagger spec includes OpenAPI metadata', async () => {
  const spec = await readSwaggerSpec()
  assert.ok(spec.openapi, 'Expected openapi version to be defined')
  assert.ok(spec.info, 'Expected info section to be defined')
  assert.ok(spec.paths, 'Expected paths to be defined')
})
