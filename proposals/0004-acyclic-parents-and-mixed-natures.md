# 0004 - Parent chains are acyclic, and a child keeps its own nature

- Status: draft
- Author: Florian Mousseau
- Created: 2026-10-19
- Target version: 0.4.0 (clarification; could ship as 0.3.1)

## Problem

`parentId` builds a tree, and section 6 walks it: `treeValue(h, T)` is the sum over
children. Nothing says the chain ends. A document where `h1` has parent `h2` and `h2`
has parent `h1` validates, has no root, and sends a consumer that follows section 6
literally into an endless walk.

Section 6 also applies `sign(h.nature)` once, at the root, and sums the children's
values under it. A margin loan held inside a brokerage account (a liability child of
an asset parent) is then added as an asset. The specification describes the pattern
(`held_in`, the single-envelope account of 5.3) and gives it the wrong sign.

## Proposal

- Section 4, document integrity: a chain of `parentId` MUST be acyclic. The
  reference validator reports a cycle as an error, in the same class as a
  duplicate id. (A `parentId` that dangles stays permitted, as today.)
- Section 6: `treeValue(h, T)` applies `sign(child.nature)` to each child's own
  value, relative to the sign of its parent; equivalently, net worth is the sum
  over *all* holdings of `sign(h.nature) * latestValue(h, T) * ownedShare(h, S)`
  where a holding with children contributes its children's values and not its own.
  The worked text keeps the "counted once" guarantee and fixes the sign.

## Compatibility

Editorial for the schema. The cycle rule turns a document no consumer could use
into an invalid one. The sign rule changes the derived net worth of a document
holding a liability under an asset parent; that number was wrong.

## Alternatives considered

- Forbidding a child whose nature differs from its parent's. Rejected: the margin
  loan inside the account is a real and common shape, and the format's job is to
  record it.
