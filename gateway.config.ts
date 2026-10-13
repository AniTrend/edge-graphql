import { telemetryEnabled } from './telemetry'
import 'dotenv/config'
import { defineConfig } from '@graphql-hive/gateway'

const port = Number(process.env.PORT ?? 8800)
const host = process.env.APP_HOST ?? '0.0.0.0'
const graphiql = Boolean(process.env.GRAPHIQL ?? 'false')

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
        ['x-app-id', '{context.headers.x-app-id}'],
        ['x-app-package', '{context.headers.x-app-package}'],
        ['x-app-version', '{context.headers.x-app-version}'],
        ['x-app-code', '{context.headers.x-app-code}'],
        ['x-app-source', '{context.headers.x-app-source}'],
        ['x-app-locale', '{context.headers.x-app-locale}'],
        ['x-app-build-type', '{context.headers.x-app-build-type}'],
        ['x-device-build-id', '{context.headers.x-device-build-id}'],
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
