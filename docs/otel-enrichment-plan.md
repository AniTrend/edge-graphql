# OpenTelemetry Enrichment Plan

Status: Proposed  
Owner: edge-graphql maintainers  
Last updated: 2026-05-21

## Goal

Improve trace quality, performance diagnostics, and logs↔traces correlation for the GraphQL gateway without creating excessive telemetry volume or runtime overhead.

## Current baseline (from repository)

- Gateway runtime: `@graphql-hive/gateway` via `gateway.config.ts`
- Telemetry bootstrap: `NodeSDK` in `gateway.config.ts`
- Exporters: OTLP HTTP trace/metric/log exporters
- Auto-instrumentation: `getNodeAutoInstrumentations()`
- Gateway tracing: `openTelemetry: { traces: telemetryEnabled }`
- Shutdown handling: `telemetrySdk.shutdown()` on `SIGINT`/`SIGTERM`

## Documentation context used

- Hive Gateway Monitoring/Tracing: `https://the-guild.dev/graphql/hive/docs/gateway/monitoring-tracing`
- Hive Gateway config reference: `https://the-guild.dev/graphql/hive/docs/api-reference/gateway-config`
- OpenTelemetry JS Node getting started: `https://opentelemetry.io/docs/languages/js/getting-started/nodejs/`

> Note: Context7 CLI was unavailable in this runtime, so official vendor docs were used directly.

---

## Success criteria

1. **Trace completeness**
   - For each GraphQL request, we can see:
     - incoming HTTP span
     - GraphQL lifecycle spans
     - upstream fetch spans to `EdgeAPI`
2. **Actionable performance visibility**
   - p50/p95/p99 latency views by operation and upstream target
   - error-rate views for upstream failures and GraphQL execution failures
3. **Low-noise telemetry**
   - Trace sampling and span filtering tuned to environment/traffic
   - no high-cardinality attributes by default
4. **Correlation**
   - request ID and trace context consistently propagated
   - logs can be pivoted to trace IDs

---

## Phased implementation plan

## Phase 1 — Stabilize telemetry bootstrap and controls (quick wins)

### Changes

1. Extract telemetry setup into `telemetry.ts` and import it first in `gateway.config.ts`.
   - Aligns with Hive recommendation for early instrumentation registration.
2. Add explicit env-driven sampling and batching controls.
3. Keep OTLP endpoint resolution behavior, but make defaults explicit and documented.
4. Keep startup resilient when telemetry env vars are missing.

### Candidate env vars

- `OTEL_SERVICE_NAME` (already supported)
- `OTEL_SERVICE_VERSION`
- `OTEL_TRACES_SAMPLER`
- `OTEL_TRACES_SAMPLER_ARG`
- `OTEL_BSP_MAX_QUEUE_SIZE`
- `OTEL_BSP_MAX_EXPORT_BATCH_SIZE`
- `OTEL_BSP_SCHEDULE_DELAY`
- `OTEL_BSP_EXPORT_TIMEOUT`
- `OTEL_LOG_LEVEL` (debug windows only)

### Acceptance checks

- Gateway starts with telemetry enabled and disabled.
- Traces still export to configured OTLP endpoint(s).
- No regression in `npm run lint`, `npm run typecheck`, `npm test`.

---

## Phase 2 — Improve span quality with Hive Gateway trace config

### Changes

Move from boolean trace toggle to object trace config in `gateway.config.ts`, e.g.:

- `openTelemetry.traces = { spans: { ... } }`
- Configure/confirm:
  - `inheritContext: true`
  - `propagateContext: true`
  - `configureDiagLogger: true` (prod-safe log level)

Then tune span filters:

- Keep: `http`, `graphql`, `graphqlParse`, `graphqlValidate`, `graphqlExecute`, `upstreamFetch`, `subgraphExecute`
- Filter low-value requests (health/readiness) from tracing
- Optionally reduce anonymous/noisy operation documents in traces

### Acceptance checks

- Trace tree reflects lifecycle + upstream calls.
- Health probes do not dominate trace traffic.
- Upstream errors are visible and linked to request trace.

---

## Phase 3 — Add targeted custom spans and attributes

### Changes

1. Add custom spans only for high-value logic boundaries, for example:
   - auth/context enrichment
   - header propagation decisions to `EdgeAPI`
   - upstream retry/fallback decision points (if introduced)
2. Add stable low-cardinality attributes:
   - `app.request.id`
   - `gateway.subgraph` (where relevant)
   - operation type/name (bounded/sanitized)
3. Avoid sensitive/high-cardinality payload attributes.

### Acceptance checks

- Custom spans appear as children of request traces.
- Added attributes are consistent and queryable in backend.
- No PII or unbounded-cardinality fields emitted.

---

## Phase 4 — Logs ↔ traces correlation

### Changes

1. Ensure request IDs are consistently present and propagated.
2. Ensure logs include trace/span correlation fields when available.
3. Add a short runbook section for using `OTEL_LOG_LEVEL` during incident debugging.

### Acceptance checks

- Given a log entry for an error, trace can be located quickly.
- Given a trace, related logs can be queried using trace/request identifiers.

---

## Phase 5 — Operationalization (dashboards + alerts)

### Dashboard baseline

- Gateway request rate / latency (p50/p95/p99)
- GraphQL operation latency by operation name/type
- Upstream (`EdgeAPI`) latency and error rate
- Top failing operations and upstream status code buckets

### Alert baseline

- p95 latency breach sustained for N minutes
- upstream 5xx rate above threshold
- exporter/backpressure symptoms (queue saturation indicators where available)

### Acceptance checks

- Alerts fire in staging when synthetic failures are introduced.
- On-call can identify whether bottleneck is gateway execution vs upstream fetch.

---

## File-level rollout map

- `gateway.config.ts`
  - move to object-based `openTelemetry` config
  - add span filters and context/diagnostic controls
- `telemetry.ts` (new)
  - NodeSDK setup, exporters, env-driven sampling/batching
- `.env.example`
  - document any newly adopted env vars
- `tests/openapi.spec.js`
  - extend assertions for object-based `openTelemetry` config and key env snippets
- `README.md`
  - add “OTel tuning knobs” section with examples

---

## Risks and mitigations

1. **Too much trace volume**
   - Mitigation: parent+ratio sampling, span filters, staged rollout.
2. **Missing trace parentage/context**
   - Mitigation: keep context propagation enabled; verify with distributed trace views.
3. **Performance overhead from instrumentation**
   - Mitigation: benchmark before/after, disable low-value spans, avoid verbose diagnostics in prod.
4. **Config drift across environments**
   - Mitigation: centralize required env vars and defaults in `.env.example` and deployment manifests.

---

## Suggested execution order (tickets)

1. Create `telemetry.ts` and wire first import
2. Add env controls + docs in `.env.example`
3. Convert `openTelemetry.traces` to object config and add filters
4. Add targeted custom spans + low-cardinality attributes
5. Add correlation/logging runbook and dashboard definitions
6. Final regression pass and staging validation

---

## Verification checklist per phase

- `npm run lint`
- `npm run typecheck`
- `npm test`
- manual trace validation in OTLP backend
- compare request latency overhead before/after (baseline vs phase)
