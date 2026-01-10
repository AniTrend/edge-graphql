import 'dotenv/config'
import { defineConfig } from '@graphql-mesh/compose-cli'
import { loadOpenAPISubgraph } from '@omnigraph/openapi'

const endpoint = process.env.EDGE
if (!endpoint) {
  throw new Error('EDGE env var is required')
}

export const composeConfig = defineConfig({
  subgraphs: [
    {
      sourceHandler: loadOpenAPISubgraph('EdgeAPI', {
        source: './swagger-spec.json',
        endpoint,
      }),
    },
  ],
})
