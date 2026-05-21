---
name: supergraph-change-validation
description: Use when validating whether a composed supergraph change is safe to serve through Hive Gateway after OpenAPI or mesh configuration updates.
---

# Supergraph Change Validation

This skill focuses on **verification after composition**.

## Inputs

- Updated `swagger-spec.json` and/or `mesh.config.ts`
- Regenerated `supergraph.graphql`

## Validation steps

1. Recompose:
   - `npm run build`
2. Inspect `supergraph.graphql` diff:
   - expected Query fields
   - expected argument mapping (`queryParamArgMap`)
   - expected transport directives/subgraph names
3. Check runtime compatibility:
   - `gateway.config.ts` `transportEntries` key names match subgraph names
   - required forwarded headers still present
4. Run checks:
   - `npm run lint`
   - `npm run typecheck`
   - `npm test`

## Failure triage hints

- Missing field in GraphQL → usually OpenAPI operationId/path/method mismatch
- Wrong Query vs Mutation placement → check OpenAPI method and source-handler override options
- Upstream call mismatch → inspect generated `@httpOperation` path/query mapping
- Runtime execution failure with correct supergraph → inspect `gateway.config.ts` transport headers/endpoints

## Done criteria

- Supergraph changes are intentional and explainable
- Gateway transport config remains aligned
- Quality gates pass
