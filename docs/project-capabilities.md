# Project Capabilities Reference

This reference describes what is currently possible in this repository for feature development and discovery.

## Runtime and Architecture

- Gateway runtime: Hive Gateway (`@graphql-hive/gateway`)
- Supergraph composition: GraphQL Mesh Compose CLI (`@graphql-mesh/compose-cli`)
- Upstream source type: OpenAPI (`@omnigraph/openapi`)
- OpenAPI source of truth: `swagger-spec.json`
- Generated federation artifact: `supergraph.graphql`

## Exposed GraphQL Surface (Current)

The current OpenAPI spec exposes 6 operations, mapped into GraphQL `Query` fields.

| Query field | HTTP method | REST path |
| --- | --- | --- |
| `config` | `GET` | `/v1/config` |
| `newsFeed` | `GET` | `/v1/news/feed` |
| `news` | `GET` | `/v1/news` |
| `episodes` | `GET` | `/v1/episodes` |
| `series` | `GET` | `/v1/series` |
| `index` | `GET` | `/v1` |

## Configurable Behaviors

### Mesh/OpenAPI layer (`mesh.config.ts`)

- Select OpenAPI source file and upstream endpoint (`EDGE` environment variable)
- Recompose schema/supergraph from OpenAPI operations
- Add/adjust source handler options for OpenAPI mapping behavior

### Gateway runtime layer (`gateway.config.ts`)

- Server network/runtime options (`port`, `host`, GraphQL endpoint, health/readiness endpoints)
- GraphiQL availability and runtime behavior
- Per-subgraph transport customization (including upstream header forwarding)
- Plugin and observability extensions supported by Hive Gateway

## What To Change For New Features

- Add or modify REST operations: update `swagger-spec.json`
- Update runtime behavior (auth/header forwarding/plugins): edit `gateway.config.ts`
- Update composition behavior or source configuration: edit `mesh.config.ts`
- Regenerate supergraph after OpenAPI/composition changes: `npm run build`

## Discovery Workflow

1. Start with this file for a quick capability map.
2. Validate operation-level details in `swagger-spec.json`.
3. Validate generated GraphQL shape in `supergraph.graphql`.
4. Validate runtime knobs in `gateway.config.ts` and `mesh.config.ts`.

## Notes

- `supergraph.graphql` is generated; do not treat it as source of truth.
- Prefer additive updates to OpenAPI and config files, then recompose.
