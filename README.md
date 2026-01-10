# edge-graphql

GraphQL gateway generated from OpenAPI using GraphQL Mesh v1.

## Requirements

- Node.js (see .nvmrc)

## Setup

1. Copy .env.example to .env and set EDGE.
2. Install dependencies.
3. Build the supergraph.
4. Start the gateway.

## Scripts

- `npm run dev`: compose supergraph and start Hive Gateway.
- `npm run build`: compose supergraph only.
- `npm run start`: compose supergraph and start Hive Gateway.
- `npm run lint`: lint the project.
- `npm run typecheck`: run TypeScript checks.
- `npm test`: run tests.

## Docker

Build the image:

1. `docker build -t edge-graphql:local .`

Run the container:

1. `docker run --rm -p 8800:8800 --env EDGE=http://host.docker.internal:9800 edge-graphql:local`

## Endpoints

- POST /graphql

## Notes

The supergraph is generated from swagger-spec.json and served via Hive Gateway.

## Configuration

GraphQL Mesh is configured in mesh.config.ts. The file loads .env and reads EDGE
for the REST API base URL.
