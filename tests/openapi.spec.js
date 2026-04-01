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

const readGatewayConfig = async () => {
  const configPath = path.join(projectRoot, 'gateway.config.ts')
  return fs.readFile(configPath, 'utf-8')
}

test('swagger spec includes OpenAPI metadata', async () => {
  const spec = await readSwaggerSpec()
  assert.ok(spec.openapi, 'Expected openapi version to be defined')
  assert.ok(spec.info, 'Expected info section to be defined')
  assert.ok(spec.paths, 'Expected paths to be defined')
})

test('gateway forwards required headers to EdgeAPI transport', async () => {
  const gatewayConfig = await readGatewayConfig()

  assert.match(
    gatewayConfig,
    /transportEntries:\s*\{\s*EdgeAPI:\s*\{[\s\S]*headers:\s*\[/,
    'Expected EdgeAPI transportEntries headers to be configured',
  )

  const expectedHeaderMappings = [
    "['accept', '{context.headers.accept}']",
    "['accept-encoding', '{context.headers.accept-encoding}']",
    "['authorization', '{context.headers.authorization}']",
    "['user-agent', '{context.headers.user-agent}']",
    "['x-app-name', '{context.headers.x-app-name}']",
    "['x-app-version', '{context.headers.x-app-version}']",
    "['x-app-code', '{context.headers.x-app-code}']",
    "['x-app-source', '{context.headers.x-app-source}']",
    "['x-app-locale', '{context.headers.x-app-locale}']",
    "['x-app-build', '{context.headers.x-app-build}']",
  ]

  for (const mapping of expectedHeaderMappings) {
    assert.ok(
      gatewayConfig.includes(mapping),
      `Expected gateway config to include header mapping: ${mapping}`,
    )
  }
})
