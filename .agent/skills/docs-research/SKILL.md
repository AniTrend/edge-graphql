---
name: docs-research
description: Research framework and repository documentation for feature discovery using Context7 and DeepWiki, then map findings to edge-graphql implementation decisions.
---

# Docs Research Skill

Use this skill when a task requires understanding external docs before changing code.

## When To Use

- Planning a new feature or refactor in this repository
- Verifying current API/config options in external libraries
- Confirming behavior differences between versions
- Validating integration assumptions before implementation

## Sources To Prefer

1. Context7 for package/framework docs and API references
2. DeepWiki for repository-level docs and implementation guidance
3. Local repository files (`swagger-spec.json`, `mesh.config.ts`, `gateway.config.ts`) for final alignment

## Workflow

1. Identify the documentation target category.
- Library/package docs: use Context7
- GitHub repository docs/architecture: use DeepWiki

2. Research with Context7 for package APIs.
- Resolve library ID first
- Fetch focused docs by topic (API option names, examples, defaults)
- Capture exact option names and constraints

3. Research with DeepWiki for repository-oriented context.
- Read wiki structure first
- Pull the most relevant sections
- Ask focused questions about architecture, extension points, and common patterns

4. Cross-check findings with this repository.
- Match doc options to existing files and versions in `package.json`
- Separate generated artifacts from source-of-truth files
- Note whether change belongs in OpenAPI, mesh composition, or gateway runtime

5. Produce an implementation-ready summary.
- What is supported
- What file should change
- Risks, caveats, and validation steps

## Output Format

- Documentation sources consulted
- Confirmed capabilities/options
- Proposed file-level changes in this repo
- Validation checklist (typecheck, lint, tests, runtime check)

## Repository Mapping Hints

- OpenAPI operation/source changes: `swagger-spec.json`, `mesh.config.ts`
- Gateway runtime behavior: `gateway.config.ts`
- Generated output for verification only: `supergraph.graphql`
- Capability overview: `docs/project-capabilities.md`
