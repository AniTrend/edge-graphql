import 'dotenv/config'
import { defineConfig } from '@graphql-hive/gateway'
import { getNodeAutoInstrumentations } from '@opentelemetry/auto-instrumentations-node'
import { OTLPLogExporter } from '@opentelemetry/exporter-logs-otlp-http'
import { OTLPMetricExporter } from '@opentelemetry/exporter-metrics-otlp-http'
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http'
import { resourceFromAttributes } from '@opentelemetry/resources'
import { BatchLogRecordProcessor } from '@opentelemetry/sdk-logs'
import { PeriodicExportingMetricReader } from '@opentelemetry/sdk-metrics'
import { NodeSDK } from '@opentelemetry/sdk-node'

const port = Number(process.env.PORT ?? 8800)
const host = process.env.APP_HOST ?? '0.0.0.0'
const graphiql = Boolean(process.env.GRAPHIQL ?? 'false')

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

const traceEndpoint = resolveSignalEndpoint('/v1/traces', process.env.OTEL_EXPORTER_OTLP_TRACES_ENDPOINT)
const metricsEndpoint = resolveSignalEndpoint('/v1/metrics', process.env.OTEL_EXPORTER_OTLP_METRICS_ENDPOINT)
const logsEndpoint = resolveSignalEndpoint('/v1/logs', process.env.OTEL_EXPORTER_OTLP_LOGS_ENDPOINT)

const telemetryEnabled = Boolean(traceEndpoint || metricsEndpoint || logsEndpoint)
const telemetrySdk = telemetryEnabled
  ? new NodeSDK({
      serviceName: process.env.OTEL_SERVICE_NAME ?? 'edge-graphql',
      resource: resourceFromAttributes({
        'service.version': process.env.npm_package_version ?? 'unknown',
      }),
      traceExporter: traceEndpoint
        ? new OTLPTraceExporter({
            url: traceEndpoint,
          })
        : undefined,
      metricReaders: metricsEndpoint
        ? [
            new PeriodicExportingMetricReader({
              exporter: new OTLPMetricExporter({
                url: metricsEndpoint,
              }),
            }),
          ]
        : undefined,
      logRecordProcessors: logsEndpoint
        ? [
            new BatchLogRecordProcessor(
              new OTLPLogExporter({
                url: logsEndpoint,
              }),
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

export const gatewayConfig = defineConfig({
  supergraph: './supergraph.graphql',
  openTelemetry: {
    traces: telemetryEnabled,
  },
  transportEntries: {
    EdgeAPI: {
      headers: [
        ['accept', '{context.headers.accept}'],
        ['accept-encoding', '{context.headers.accept-encoding}'],
        ['authorization', '{context.headers.authorization}'],
        ['user-agent', '{context.headers.user-agent}'],
        ['x-app-name', '{context.headers.x-app-name}'],
        ['x-app-version', '{context.headers.x-app-version}'],
        ['x-app-code', '{context.headers.x-app-code}'],
        ['x-app-source', '{context.headers.x-app-source}'],
        ['x-app-locale', '{context.headers.x-app-locale}'],
        ['x-app-build', '{context.headers.x-app-build}'],
      ],
    },
  },
  port,
  host,
  graphqlEndpoint: '/graphql',
  healthCheckEndpoint: '/health',
  readinessCheckEndpoint: '/ready',
  graphiql,
})
