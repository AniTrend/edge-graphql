---
name: hive-gateway-otel-enrichment
description: Use when improving tracing, metrics, or log correlation in Hive Gateway runtime backed by OpenTelemetry Node SDK and OTLP exporters.
---

# Hive Gateway OpenTelemetry Enrichment

Use this skill to expand observability quality without creating excessive trace noise.

## Objectives

- Better request-to-upstream trace visibility
- Better logs↔traces correlation
- Controlled telemetry volume and export behavior

## Repository touchpoints

- `gateway.config.ts`
- `.env.example`
- `README.md`
- `tests/openapi.spec.js` (and add tests when behavior becomes contractual)

## Recommended sequence

1. Confirm baseline telemetry wiring in `gateway.config.ts`.
2. Add env-driven controls first (sampling, batching, exporters, toggles).
3. Add high-value span points only (upstream fetch, auth/header propagation decisions, exceptional paths).
4. Ensure graceful shutdown flush behavior remains intact.
5. Document every new env var in `.env.example` and README.
6. Validate locally with collector endpoint configured.

## Design rules

- Prefer selective spans over blanket instrumentation expansion.
- Keep service/resource attributes stable (`service.name`, `service.version`).
- Keep default behavior safe in production (no debug/console exporter by default).
- Preserve startup order so telemetry setup is initialized before runtime behavior relying on it.

## Validation checklist

- Gateway starts with and without OTEL env vars
- Spans emitted for GraphQL lifecycle and upstream HTTP calls
- No crashes on shutdown; flush path still executes
- Lint, typecheck, and tests pass
