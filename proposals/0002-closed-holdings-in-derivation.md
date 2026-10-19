# 0002 - A closed holding stops counting

- Status: implemented (0.4.0)
- Author: Florian Mousseau
- Created: 2026-10-19
- Target version: 0.4.0 (clarification; could ship as 0.3.1)

## Problem

Section 6 derives `latestValue(h, T)` as the valuation with the greatest `asOf <= T`.
A holding closed on `closedAt` with a last statement of 500 keeps contributing 500 to
every net worth after its closure, forever, unless the producer thought to emit a
final zero valuation. Nothing in the specification asks for that valuation, and the
`closedAt` field is defined (5.3) but never used by the derivation.

## Proposal

In section 6, after `latestValue`: a holding whose `closedAt` is on or before T
contributes zero to `treeValue(h, T)`, whatever its last valuation says. In section
14, conformant producers SHOULD still emit a final valuation at closure (a zero
balance, or the payoff of a loan), because a consumer that ignores section 6 and
reads the last value alone will otherwise show a balance that no longer exists.

Symmetrically, a holding whose `openedAt` is after T contributes zero: a valuation
dated before the holding existed is a producer mistake, and the reference validator
notes it.

## Compatibility

Editorial for the schema. It changes the derived number of any consumer that
followed section 6 literally on a document with a closed holding and no final zero
valuation; that number was wrong.

## Alternatives considered

- Requiring the final zero valuation (MUST). Rejected: it makes a document invalid
  for a missing record a validator cannot see is missing, and a consumer still has
  to decide what a closed holding is worth when the record is absent.
