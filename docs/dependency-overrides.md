# Dependency override rationale

The overrides in `package.json` are intentionally narrow and should be revisited when the upstream packages move their dependency ranges.

## Security fixes

- `@graphql-hive/gateway-runtime` has two scoped parent overrides: `@graphql-hive/yoga@0.49.9` and `@graphql-yoga/plugin-apollo-usage-report@0.19.6`. Its declared `^0.48.2` and `^0.16.0` ranges cannot select the patched parent releases. These are deliberate pre-1.0 minor migrations; GraphQL 16 and Yoga 5 remain within both parents' peer ranges. The remaining consumers are refreshed within their existing ranges, so every `@graphql-tools/utils` dependency resolves to `12.1.0` without forcing that utility across incompatible major ranges. Ref: #336; supersedes the incomplete lockfile update in #343.
  - [GHSA-7mx3-vvmw-hjmv](https://github.com/ardatan/graphql-tools/security/advisories/GHSA-7mx3-vvmw-hjmv) (`mergeDeep`, fixed in `12.0.1`) and [GHSA-c4qx-w738-7hr3](https://github.com/ardatan/graphql-tools/security/advisories/GHSA-c4qx-w738-7hr3) (`mergeIncrementalResult`, fixed in `12.0.2`) affect separate paths. Updating only legacy 10.x/11.x copies is insufficient when `12.0.1` copies remain.
  - Parent migration notes: [Hive Yoga](https://github.com/graphql-hive/console/blob/main/packages/libraries/yoga/CHANGELOG.md) and [Apollo reporting](https://github.com/graphql-hive/graphql-yoga/blob/main/packages/plugins/apollo-usage-report/CHANGELOG.md). Hive adds optional metrics and deprecates runtime schema publishing; Apollo adds GraphQL 17 compatibility while retaining GraphQL 16. This gateway does not currently configure either reporting provider.
  - `tests/graphql-tools-security.spec.js` checks every locked/installed copy and exercises dangerous merge keys, malformed incremental paths, and ordinary merge behavior. A dependency update that reintroduces any stable version below `12.0.2` fails `npm test`.
  - Remove these overrides once Gateway Runtime itself declares patched parent ranges. Re-run a clean install, the security tests, composition/surface tests, typecheck, lint, and a gateway request smoke test. Source changes alone do not establish that a published/deployed image is remediated.
- `axios` is pinned to `1.18.1` to incorporate the security update from the open Dependabot update, Ref: #228. It is consumed transitively by the OpenTelemetry Jaeger remote sampler.
- `@opentelemetry/propagator-jaeger` is pinned to `2.10.0` because the current OpenTelemetry SDK pins `2.8.0`, which is affected by `GHSA-45rx-2jwx-cxfr`. Version `2.10.0` aligns with the existing `@opentelemetry/core` override.
- `brace-expansion` is overridden only below `glob@10.5.0` and its `minimatch` dependency at `2.1.4`. This fixes the vulnerable 2.x subtree while preserving the separate `5.0.9` subtree required by ESLint's `minimatch` 10 dependency.

## Deferred major updates

- TypeScript remains on the TypeScript 6 line. The current `typescript-eslint` packages require a TypeScript version below `6.1.0`, and TypeScript 7 does not provide the JavaScript compiler API they need. Ref: #214.
- `js-yaml` remains pinned to `4.3.1`. Current GraphQL Mesh utilities use v4 APIs removed in js-yaml 5, including `DEFAULT_SCHEMA.extend` and `Type`. Ref: #190.

Do not use `npm audit fix --force` for these dependencies. Its proposed gateway downgrade would be a breaking runtime change. Re-evaluate the deferred updates when the upstream consumers publish compatible releases.
