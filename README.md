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

Hive Gateway runtime options are configured in gateway.config.ts. Header
forwarding to the upstream REST service is handled there through transportEntries
for the EdgeAPI subgraph.

## OpenTelemetry

Gateway startup now initializes OpenTelemetry when any OTLP endpoint is set.
Configuration is environment-driven:

- `OTEL_EXPORTER_OTLP_ENDPOINT`: base endpoint used as fallback for all signals
- `OTEL_EXPORTER_OTLP_TRACES_ENDPOINT`: traces endpoint
- `OTEL_EXPORTER_OTLP_METRICS_ENDPOINT`: metrics endpoint
- `OTEL_EXPORTER_OTLP_LOGS_ENDPOINT`: logs endpoint

If signal-specific variables are omitted, the gateway derives them from
`OTEL_EXPORTER_OTLP_ENDPOINT` using `/v1/traces`, `/v1/metrics`, and `/v1/logs`.

The gateway enables Hive Gateway OpenTelemetry tracing and auto-instrumentation
for Node.js runtime libraries, and flushes telemetry on `SIGINT`/`SIGTERM`.

Forwarded header allowlist:

- accept
- accept-encoding
- authorization
- user-agent
- x-app-name
- x-app-version
- x-app-code
- x-app-source
- x-app-locale
- x-app-build

Note: header propagation is runtime behavior and is not configured in
swagger-spec.json.
