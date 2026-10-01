# ADR Template

Copy to `docs/adr/NNNN-slug.md` (scan the folder for the highest number, increment by one).

Keep it minimal: 1-3 sentences covering context, decision, and why. Only add optional sections when they genuinely help.

```md
# {Short title of the decision}

{1-3 sentences: what's the context, what did we decide, and why.}

<!-- Optional, only when valuable:
Status: proposed | accepted | superseded by ADR-NNNN

## Considered options
Only when the rejected alternatives are worth remembering.

## Consequences
Only when non-obvious downstream effects need calling out.
-->
```

A decision earns an ADR only if ALL three gates pass:

1. Hard to reverse
2. Surprising without context
3. The result of a real trade-off
