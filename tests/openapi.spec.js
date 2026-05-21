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

const readTelemetryConfig = async () => {
  const telemetryPath = path.join(projectRoot, 'telemetry.ts')
  return fs.readFile(telemetryPath, 'utf-8')
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

test('gateway config and telemetry bootstrap wiring are configured', async () => {
  const gatewayConfig = await readGatewayConfig()
  const telemetryConfig = await readTelemetryConfig()

  const gatewayRequiredSnippets = [
    "import { telemetryEnabled } from './telemetry'",
    "openTelemetry: {",
    'traces: telemetryEnabled',
  ]

  for (const snippet of gatewayRequiredSnippets) {
    assert.ok(
      gatewayConfig.includes(snippet),
      `Expected gateway config to include telemetry wiring snippet: ${snippet}`,
    )
  }

  const telemetryRequiredSnippets = [
    'OTEL_EXPORTER_OTLP_ENDPOINT',
    'OTEL_EXPORTER_OTLP_TRACES_ENDPOINT',
    'OTEL_EXPORTER_OTLP_METRICS_ENDPOINT',
    'OTEL_EXPORTER_OTLP_LOGS_ENDPOINT',
    'OTEL_TRACES_ENABLED',
    'OTEL_METRICS_ENABLED',
    'OTEL_LOGS_ENABLED',
    'OTEL_BSP_MAX_QUEUE_SIZE',
    'OTEL_BSP_MAX_EXPORT_BATCH_SIZE',
    'OTEL_BSP_SCHEDULE_DELAY',
    'OTEL_BSP_EXPORT_TIMEOUT',
    'telemetrySdk.start()',
    "process.once('SIGINT'",
    "process.once('SIGTERM'",
  ]

  for (const snippet of telemetryRequiredSnippets) {
    assert.ok(
      telemetryConfig.includes(snippet),
      `Expected telemetry config to include snippet: ${snippet}`,
    )
  }
})
