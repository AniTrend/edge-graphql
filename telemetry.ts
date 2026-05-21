import 'dotenv/config'
import { readFileSync } from 'node:fs'
import { getNodeAutoInstrumentations } from '@opentelemetry/auto-instrumentations-node'
import { OTLPLogExporter } from '@opentelemetry/exporter-logs-otlp-http'
import { OTLPMetricExporter } from '@opentelemetry/exporter-metrics-otlp-http'
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http'
import { resourceFromAttributes } from '@opentelemetry/resources'
import { BatchLogRecordProcessor } from '@opentelemetry/sdk-logs'
import { PeriodicExportingMetricReader } from '@opentelemetry/sdk-metrics'
import { NodeSDK } from '@opentelemetry/sdk-node'

const parseBoolean = (value: string | undefined, defaultValue: boolean) => {
  if (value == null) {
    return defaultValue
  }

  const normalized = value.trim().toLowerCase()
  if (['1', 'true', 'yes', 'on'].includes(normalized)) {
    return true
  }

  if (['0', 'false', 'no', 'off'].includes(normalized)) {
    return false
  }

  return defaultValue
}

const parseNumber = (value: string | undefined, defaultValue: number) => {
  if (!value) {
    return defaultValue
  }

  const parsed = Number(value)
  return Number.isFinite(parsed) && parsed > 0 ? parsed : defaultValue
}

const resolveSignalEndpoint = (signalPath: '/v1/traces' | '/v1/metrics' | '/v1/logs', explicitEndpoint?: string) => {
  if (explicitEndpoint) {
    return explicitEndpoint
  }

  const baseEndpoint = process.env.OTEL_EXPORTER_OTLP_ENDPOINT
  if (!baseEndpoint) {
    return undefined
  }

  return `${baseEndpoint.replace(/\/+$/, '')}${signalPath}`
}

const resolveServiceVersion = () => {
  if (process.env.OTEL_SERVICE_VERSION) {
    return process.env.OTEL_SERVICE_VERSION
  }

  if (process.env.npm_package_version) {
    return process.env.npm_package_version
  }

  try {
    const packageJsonUrl = new URL('./package.json', import.meta.url)
    const packageJson = JSON.parse(readFileSync(packageJsonUrl, 'utf8')) as { version?: string }
    return packageJson.version ?? 'unknown'
  } catch {
    return 'unknown'
  }
}

const traceEndpoint = resolveSignalEndpoint('/v1/traces', process.env.OTEL_EXPORTER_OTLP_TRACES_ENDPOINT)
const metricsEndpoint = resolveSignalEndpoint('/v1/metrics', process.env.OTEL_EXPORTER_OTLP_METRICS_ENDPOINT)
const logsEndpoint = resolveSignalEndpoint('/v1/logs', process.env.OTEL_EXPORTER_OTLP_LOGS_ENDPOINT)

const tracesEnabled = parseBoolean(process.env.OTEL_TRACES_ENABLED, true)
const metricsEnabled = parseBoolean(process.env.OTEL_METRICS_ENABLED, true)
const logsEnabled = parseBoolean(process.env.OTEL_LOGS_ENABLED, true)

const telemetrySignalsConfigured = Boolean(
  (tracesEnabled && traceEndpoint) || (metricsEnabled && metricsEndpoint) || (logsEnabled && logsEndpoint),
)

const metricExportIntervalMillis = parseNumber(process.env.OTEL_METRIC_EXPORT_INTERVAL, 60_000)
const metricExportTimeoutMillis = parseNumber(process.env.OTEL_METRIC_EXPORT_TIMEOUT, 30_000)

const batchProcessorConfig = {
  maxQueueSize: parseNumber(process.env.OTEL_BSP_MAX_QUEUE_SIZE, 2048),
  maxExportBatchSize: parseNumber(process.env.OTEL_BSP_MAX_EXPORT_BATCH_SIZE, 512),
  scheduledDelayMillis: parseNumber(process.env.OTEL_BSP_SCHEDULE_DELAY, 5000),
  exportTimeoutMillis: parseNumber(process.env.OTEL_BSP_EXPORT_TIMEOUT, 30_000),
}

export const telemetryEnabled = telemetrySignalsConfigured

const telemetrySdk = telemetryEnabled
  ? new NodeSDK({
      serviceName: process.env.OTEL_SERVICE_NAME ?? 'edge-graphql',
      resource: resourceFromAttributes({
        'service.version': resolveServiceVersion(),
      }),
      traceExporter: tracesEnabled && traceEndpoint
        ? new OTLPTraceExporter({
            url: traceEndpoint,
          })
        : undefined,
      metricReaders: metricsEnabled && metricsEndpoint
        ? [
            new PeriodicExportingMetricReader({
              exporter: new OTLPMetricExporter({
                url: metricsEndpoint,
              }),
              exportIntervalMillis: metricExportIntervalMillis,
              exportTimeoutMillis: metricExportTimeoutMillis,
            }),
          ]
        : undefined,
      logRecordProcessors: logsEnabled && logsEndpoint
        ? [
            new BatchLogRecordProcessor(
              new OTLPLogExporter({
                url: logsEndpoint,
              }),
              batchProcessorConfig,
            ),
          ]
        : undefined,
      instrumentations: [getNodeAutoInstrumentations()],
    })
  : null

if (telemetrySdk) {
  telemetrySdk.start()
}

const shutdownTelemetry = async () => {
  if (!telemetrySdk) {
    return
  }

  try {
    await telemetrySdk.shutdown()
  } catch (error) {
    console.error('OpenTelemetry shutdown failed', error)
  }
}

process.once('SIGINT', () => {
  void shutdownTelemetry()
})

process.once('SIGTERM', () => {
  void shutdownTelemetry()
})
