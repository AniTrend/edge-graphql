# AGENTS.md

This project exposes a GraphQL endpoint by composing an OpenAPI contract into a supergraph and serving it via Hive Gateway.

Primary boundary:

- **Source of truth**: `swagger-spec.json`, `mesh.config.ts`, `gateway.config.ts`
- **Generated artifact**: `supergraph.graphql` (regenerate, do not hand-edit)

## 1) Fast orientation
- Stack: Node `24.16.0` (`.nvmrc`), ESM TypeScript config (`tsconfig.json`), Hive Gateway + GraphQL Mesh Compose + OpenAPI.
- Source of truth for API surface: `swagger-spec.json`.
- Generated artifact: `supergraph.graphql` (always regenerate via scripts; never hand-edit).
- Runtime wiring lives in `mesh.config.ts`, `gateway.config.ts`, and `telemetry.ts`.

## 2) Ground-truth files (read first)

- `README.md` — architecture + workflows
- `docs/project-capabilities.md` — fast capability map
- `package.json` — scripts and dependency versions
- `mesh.config.ts` — composition config
- `gateway.config.ts` — gateway runtime + telemetry
- `tests/openapi.spec.js` — baseline guardrails

## 3) Standard development flow

1. Read relevant source files.
2. Decide whether change belongs to OpenAPI contract, composition config, or gateway runtime.
3. Apply minimal edits.
4. Regenerate if needed: `npm run build`.
5. Run checks:
   - `npm run lint`
   - `npm run typecheck`
   - `npm test`
6. Confirm generated outputs and docs remain consistent.

## 4) Change routing guide

### A) Add or modify API operations

- Edit `swagger-spec.json`
- Recompose with `npm run build`
- Validate `supergraph.graphql` diff

### B) Adjust GraphQL naming or source behavior

- Edit `mesh.config.ts`
- Recompose with `npm run build`

### C) Adjust runtime behavior (headers/auth/OTel)

- Edit `gateway.config.ts`
- Validate tests and runtime startup

## 5) OpenTelemetry guidance (current repository intent)

Current baseline:

- NodeSDK bootstrap in `gateway.config.ts`
- OTLP endpoints from env vars
- `openTelemetry.traces` enabled
- graceful shutdown flush

Preferred enrichment path:

1. Improve sampling and export/batching controls (env-driven)
2. Add targeted custom spans for gateway-specific high-value events
3. Improve request-id and logs↔traces correlation
4. Keep trace volume practical via selective span filtering

## 6) Documentation lookup policy

Prefer current documentation over memory:

- GraphQL Mesh v1 docs (`/graphql/mesh/v1/...`)
- Hive Gateway docs (`/graphql/hive/docs/gateway/...`)
- Gateway config reference (`/graphql/hive/docs/api-reference/gateway-config`)

If Context7 is unavailable in the execution environment, use official vendor docs directly and record links used.

## 7) Local skills in this repository

### Skills

- Use `.agent/skills/docs-research/SKILL.md` for external documentation discovery.
- Use `.agent/skills/openapi-mesh-supergraph/SKILL.md` for OpenAPI → Mesh → supergraph change flow.
- Use `.agent/skills/supergraph-change-validation/SKILL.md` to validate composed output and runtime alignment.
- Use `.agent/skills/hive-gateway-otel-enrichment/SKILL.md` for OpenTelemetry enrichment changes.
- Docs research should prioritize Context7 first, then official vendor docs when Context7 is unavailable.

Use these skills to keep changes consistent and repeatable.

## 8) Safety checks before completion

- No manual edits to generated artifacts without regeneration
- README/docs reflect actual current behavior
- Tests/lint/typecheck pass
- Any telemetry/config changes include env var notes