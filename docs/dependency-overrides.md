# Dependency override rationale

The overrides in `package.json` are intentionally narrow and should be revisited when the upstream packages move their dependency ranges.

## Security fixes

- `axios` is pinned to `1.18.1` to incorporate the security update from the open Dependabot update, Ref: #228. It is consumed transitively by the OpenTelemetry Jaeger remote sampler.
- `@opentelemetry/propagator-jaeger` is pinned to `2.10.0` because the current OpenTelemetry SDK pins `2.8.0`, which is affected by `GHSA-45rx-2jwx-cxfr`. Version `2.10.0` aligns with the existing `@opentelemetry/core` override.
- `brace-expansion` is overridden only below `glob@10.5.0` and its `minimatch` dependency at `2.1.4`. This fixes the vulnerable 2.x subtree while preserving the separate `5.0.9` subtree required by ESLint's `minimatch` 10 dependency.

## Deferred major updates

- TypeScript remains on the TypeScript 6 line. The current `typescript-eslint` packages require a TypeScript version below `6.1.0`, and TypeScript 7 does not provide the JavaScript compiler API they need. Ref: #214.
- `js-yaml` remains pinned to `4.3.1`. Current GraphQL Mesh utilities use v4 APIs removed in js-yaml 5, including `DEFAULT_SCHEMA.extend` and `Type`. Ref: #190.

Do not use `npm audit fix --force` for these dependencies. Its proposed gateway downgrade would be a breaking runtime change. Re-evaluate the deferred updates when the upstream consumers publish compatible releases.
