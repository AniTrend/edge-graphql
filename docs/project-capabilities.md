# Project Capabilities Reference

This file is the quick capability map for `edge-graphql`.

## Runtime and Architecture

- Gateway runtime: Hive Gateway (`@graphql-hive/gateway`)
- Composition: GraphQL Mesh Compose CLI (`@graphql-mesh/compose-cli`)
- Source handler: OpenAPI (`@omnigraph/openapi`)
- OpenAPI source of truth: `swagger-spec.json`
- Generated federation artifact: `supergraph.graphql`

## Exposed GraphQL Surface (Current)

Current OpenAPI operations map to GraphQL `Query` fields as follows:

| Query field | HTTP method | REST path |
| --- | --- | --- |
| `config` | `GET` | `/v1/config` |
| `newsFeed` | `GET` | `/v1/news/feed` |
| `news` | `GET` | `/v1/news` |
| `episodes` | `GET` | `/v1/episodes` |
| `series` | `GET` | `/v1/series` |
| `studio` | `GET` | `/v1/studios` |
| `person` | `GET` | `/v1/people` |
| `character` | `GET` | `/v1/characters` |
| `index` | `GET` | `/v1` |

## Configurable Behaviors

### Mesh/OpenAPI layer (`mesh.config.ts`)

- Choose OpenAPI source file and upstream endpoint (`EDGE` env var)
- Recompose schema/supergraph from OpenAPI operations
- Adjust source handler options for OpenAPI mapping behavior

### Gateway runtime layer (`gateway.config.ts`)

- Server runtime/network options (`port`, `host`, endpoints, GraphiQL)
- Per-subgraph transport behavior (header forwarding)
- OpenTelemetry bootstrap for traces, metrics, and logs via OTLP endpoints

### OpenTelemetry layer

- OTLP environment configuration:
  - `OTEL_EXPORTER_OTLP_ENDPOINT`
  - `OTEL_EXPORTER_OTLP_TRACES_ENDPOINT`
  - `OTEL_EXPORTER_OTLP_METRICS_ENDPOINT`
  - `OTEL_EXPORTER_OTLP_LOGS_ENDPOINT`
- Signal-specific endpoint env vars override the base OTLP endpoint
- Telemetry starts during gateway startup and is flushed on process signals

## What To Change For New Features

- Add/remove API operations: edit `swagger-spec.json`
- Update runtime behavior (headers/plugins/telemetry): edit `gateway.config.ts`
- Update composition behavior/source loading: edit `mesh.config.ts`
- Regenerate supergraph after OpenAPI/composition changes: `npm run build`

## Discovery Workflow

1. Read this file for quick capability orientation.
2. Validate operation-level details in `swagger-spec.json`.
3. Validate generated shape in `supergraph.graphql`.
4. Validate runtime knobs in `gateway.config.ts` and `mesh.config.ts`.

## Notes

- `supergraph.graphql` is generated; do not treat it as source of truth.
- Make additive source updates first, then recompose.
