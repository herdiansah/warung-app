# Maintainership Guide

## Project Structure

- `server.ts` — Express backend entry (production mode serves `dist/` via `express.static`)
- `src/` — React frontend + middleware + utils
- `prisma/` — Schema, migrations, seed
- `tests/` — API integration tests (vitest) and E2E tests (Playwright)
- `docs/` — Plans, milestones, deployment, technical specs
- `scripts/` — Backup/restore shell scripts

## Release Process

1. Update `CHANGELOG.md` with the new version and date
2. Update `package.json` version
3. Commit and tag: `git tag v1.0.0 && git push origin v1.0.0`
4. Create a GitHub Release with the changelog entry
5. Attach migration and rollback notes if applicable

## Code Review

- Every PR must pass `npm test`, `npm run lint`, `npm run build`, and `npx prisma validate`
- API changes must include tests
- UI changes must include E2E tests (or a documented reason why not)
- No secrets in commits

## Issue Labels

| Label | Purpose |
|-------|---------|
| `good first issue` | Well-scoped tasks for new contributors, with clear instructions |
| `bug` | Verified bug with reproduction steps |
| `enhancement` | Feature request, linked to milestone |
| `dependencies` | Dependabot PRs |
| `help wanted` | Needs community contribution |
| `needs discussion` | Requires design decision or input |

## Good First Issues

Good first issues are low-risk, well-defined tasks. Suggested areas:

- Adding validation tests for existing endpoints
- Translating documentation to Indonesian
- Improving error messages
- Adding component tests (vitest)
- Small UI improvements (with clear before/after)

## Communication

- Issues and PRs: English preferred (technical), Indonesian acceptable
- Community participation governed by [CODE_OF_CONDUCT.md](../CODE_OF_CONDUCT.md)

## Security

- Report vulnerabilities per [SECURITY.md](../SECURITY.md)
- Run `npm audit` before each release
- Dependabot automatically creates PRs for dependency updates