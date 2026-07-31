# Test Report — v0.65.0

## Production syntax
- Extracted production inline JavaScript: `node --check` — PASS.

## Targeted institutional-politics runtime harness
PASS:
1. Budget contest returns a valid winning priority.
2. Three distinct institutional blocs cast preferences in the controlled test.
3. Military/security pressure can win when regional disorder is severe.
4. Budget contest memory persists.
5. Winning/losing institutional satisfaction updates persist.
6. A contested vote creates an `institutionalPolitics` World Fact.
7. Reprocessing the same year does not duplicate that budget-dispute fact.
8. A mediation quest resolution can resolve the institutional-politics World Fact.

Controlled harness result: security priority won; guild and faith blocs opposed; dispute fact resolved through mediation path.

## Static integration checks
- v0.65.0 save/version markers present.
- `regionalBudgetContest()` wired into annual budget review.
- `maybeCreateBudgetDisputeFact()` wired into annual budget review.
- `resolveInstitutionalPoliticsFromQuest()` wired into quest turn-in.
- `recommendedInvestmentForPriority()` wired into institutional investment review.
- Dashboard includes institutional budget-politics summary.

## Limitation
The package still does not contain a full jsdom/browser automation harness. Validation is syntax + targeted runtime logic + structural integration checks, not a claim of full UI automation coverage.
