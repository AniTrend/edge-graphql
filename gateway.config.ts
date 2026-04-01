import 'dotenv/config'
import { defineConfig } from '@graphql-hive/gateway'

const port = Number(process.env.PORT ?? 8800)
const host = process.env.APP_HOST ?? '0.0.0.0'
const graphiql = Boolean(process.env.GRAPHIQL ?? 'false')

export const gatewayConfig = defineConfig({
  supergraph: './supergraph.graphql',
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
