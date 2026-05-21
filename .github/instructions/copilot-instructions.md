# Project Overview
- GraphQL Mesh gateway that exposes a GraphQL API backed by the REST endpoints defined in `swagger-spec.json`.
- Mesh configuration is code-based in `mesh.config.ts` and loads `EDGE` from `.env` at startup.
- The GraphQL schema is generated from OpenAPI into `supergraph.graphql` and served through Hive Gateway.
- See `AGENT.md` for the agent-agnostic repository operating guide.

# Capability Reference
- Start discovery with docs/project-capabilities.md to understand the currently exposed GraphQL/REST surface area and where changes belong.
- Use swagger-spec.json as the source of truth for operation availability.
- Use supergraph.graphql only as generated verification output after composition.

# Key Files
- mesh.config.ts: Mesh v1 compose config and env loading. Fails fast if EDGE is missing.
- swagger-spec.json: OpenAPI source of truth for schema + operations.
- package.json: Mesh scripts (dev/start) and dependencies.
- .nvmrc: Node version for local development.

# Workflows
- Dev server: npm run dev (compose supergraph + Hive Gateway).
- Production serve: npm run start.
- CI uses Node (see .nvmrc) with npm scripts: lint, typecheck, test.
- Environment: EDGE must be set (via .env) to the REST API base URL.

# Conventions & Patterns
- Use Mesh config in mesh.config.ts for any source, transform, or endpoint changes.
- Avoid editing generated artifacts in .mesh or node_modules.
- Prefer updating swagger-spec.json when adding/removing API operations; schema is derived from it.

# Skills
- Use `.github/skills/docs-research/SKILL.md` for external documentation discovery.
- Use `.github/skills/openapi-mesh-supergraph/SKILL.md` for OpenAPI → Mesh → supergraph change flow.
- Use `.github/skills/supergraph-change-validation/SKILL.md` to validate composed output and runtime alignment.
- Use `.github/skills/hive-gateway-otel-enrichment/SKILL.md` for OpenTelemetry enrichment changes.
- Docs research should prioritize Context7 first, then official vendor docs when Context7 is unavailable.

# Integration Notes
- REST base URL is sourced from EDGE; requests are proxied via Mesh’s OpenAPI handler.
- The public GraphQL endpoint is /graphql (GraphiQL controlled in gateway.config.ts).
