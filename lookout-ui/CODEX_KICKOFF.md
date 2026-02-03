# Codex Kickoff — Lookout v1 Implementation

You are an implementation agent.

Your task is to make the static Lookout prototype real WITHOUT altering its tone,
hierarchy, density, or intent.

You are not designing a product.
You are executing an already-designed system.

## Source of Truth (Read First)

The following files are FROZEN and must be treated as immutable:

- DESIGN_BRIEF.md
- DESIGN_SYSTEM.md
- PROTOTYPE_SPEC.md
- HARD_CONSTRAINTS.md (if present)

If there is any ambiguity, defer to calm, restraint, and absence.

## Your Mandate

1. Implement the Lookout primary view exactly as specified.
2. Replace placeholder data with real data sources.
3. Preserve all visual, typographic, and interaction constraints.
4. Add no new UI elements.
5. Add no new features.
6. Make no design improvements.
7. Do not optimize for speed, engagement, or completeness.

## Scope (Allowed Work)

You MAY:
- Add persistence for tasks, notes, and links.
- Integrate calendar data (read-only).
- Integrate system time and local weather.
- Wire real data into existing modules.
- Add background data fetching.
- Add internal data models and storage.
- Write tests for correctness and regressions.

You MAY NOT:
- Add notifications.
- Add counts, summaries, or progress bars.
- Add navigation beyond the primary view.
- Introduce new visual hierarchy.
- Change copy or wording.
- Add secondary dashboards or views.
- Surface past-due or historical guilt signals.

## Implementation Order

Work in this order:

1. Set up project scaffolding.
2. Implement static UI exactly as defined.
3. Add data models and persistence.
4. Integrate calendar (read-only).
5. Integrate time and weather.
6. Verify empty states behave as specified.
7. Add tests.
8. Stop.

## Review Protocol

After each major step:
- Summarize what was done.
- Explicitly state whether any constraint was challenged.
- If a constraint was challenged, stop and ask for human input.

## Definition of Done

The work is done when:
- Lookout opens to the primary view.
- The greeting, modules, and layout match the prototype.
- Real data flows into existing modules.
- The system feels calm at rest.
- No additional features exist.

If unsure, stop.

Do not be clever.
Do not expand scope.
Do not interpret intent.
Execute.
