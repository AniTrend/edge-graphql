---
name: openapi-mesh-supergraph
description: Use when adding, removing, or debugging API operations that flow from OpenAPI into GraphQL Mesh compose output and supergraph runtime behavior.
---

# OpenAPI → Mesh → Supergraph Skill

Use this workflow to make safe, traceable API-surface changes.

## Scope

- OpenAPI contract updates
- GraphQL field generation behavior
- Supergraph regeneration and validation

## Source-of-truth order

1. `swagger-spec.json`
2. `mesh.config.ts`
3. `gateway.config.ts`
4. `supergraph.graphql` (generated verification only)

## Workflow

1. Update `swagger-spec.json` (or `mesh.config.ts` if mapping behavior changes).
2. Run `npm run build` to regenerate `supergraph.graphql`.
3. Inspect supergraph diff for expected field/type changes.
4. Confirm gateway transport assumptions in `gateway.config.ts` still hold.
5. Run full checks:
   - `npm run lint`
   - `npm run typecheck`
   - `npm test`

## Common gotchas

- Editing `supergraph.graphql` directly (will be overwritten)
- Forgetting to recompose after contract changes
- Assuming REST path names and GraphQL field names always match exactly
- Updating docs without verifying generated output

## Done criteria

- Supergraph diff matches intended contract changes
- CI-equivalent checks pass
- README/capability docs updated when API surface changed
