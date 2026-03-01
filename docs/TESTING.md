# Testing

We use Playwright for e2e tests. 37 tests across 4 suites.

| Suite | Tests | Covers |
|-------|-------|--------|
| `assignment.spec.ts` | 7 | home page, cards, search, filters |
| `attempt.spec.ts` | 10 | editor, query execution, hints, reset |
| `api-edge-cases.spec.ts` | 14 | security validation, bad inputs, CRUD |
| `responsive.spec.ts` | 6 | mobile, tablet, desktop viewports |

## Running them

```bash
cd tests
npx playwright install
npm run test:e2e

# or with the visual UI
npm run test:e2e:ui
```

Make sure both backend and frontend are running first (`npm run dev` from root).