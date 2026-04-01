import 'dotenv/config'
import { defineConfig } from '@graphql-hive/gateway'

const port = Number(process.env.PORT ?? 8800)
const host = process.env.APP_HOST ?? '0.0.0.0'
const graphiql = Boolean(process.env.GRAPHIQL ?? 'false')

export const gatewayConfig = defineConfig({
  supergraph: './supergraph.graphql',
  port,
  host,
  graphqlEndpoint: '/graphql',
  healthCheckEndpoint: '/health',
  readinessCheckEndpoint: '/ready',
  graphiql,
})
