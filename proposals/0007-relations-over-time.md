# 0007 - A holding keeps its parent and its instrument for life

- Status: draft
- Author: Florian Mousseau
- Created: 2026-11-07
- Target version: 0.6.0

## Problem

Ownership is history (5.7): a share that changes closes its row with `until` and
opens a new one with `from`. The two other relations a holding carries are not.
`parentId` (5.3) and `instrumentId` (5.3, 5.6) hold one value with no date, and
section 6 reads both as they stand today, for every date T.

Two ordinary events then rewrite the past without any record being changed:

- **A position moves to another account.** A producer that sets the new
  `parentId` on the existing holding moves every old valuation with it. Section 6
  reads ownership on `root(h)`, so if the new account belongs to another subject,
  the position's whole history is attributed to that subject, before the move as
  after it.
- **A merger replaces the instrument.** Section 5.6 invites the producer to put
  the resulting instrument "via a new `instrumentId` on the holding". Every
  earlier valuation and quantity then reads as units of the new instrument.

The amounts are all still there and the document validates. What is wrong is
who owned them and what they were, at every date before the event. Section 11
asks producers not to rewrite history; this is a rewrite the format itself
suggests.

## Proposal

No new field. The rule uses what 0.4.0 already gives a holding: `openedAt` and
`closedAt`, and the transfer legs of 5.6.

- Section 5.3: `parentId` and `instrumentId` are fixed for the life of a holding.
  A producer MUST NOT change `instrumentId` on a holding that has any valuation
  or transaction, whatever its date, the day of the change included. A producer
  MUST NOT change `parentId` on a holding when it, or any holding below it in
  the `parentId` chain, has any valuation or transaction: moving an account
  that carries no valuation of its own still moves `root(h)` for every position
  inside it.
- A move to another parent is recorded by closing the old holding (`closedAt` =
  the day of the move, with a final valuation at zero) and opening a new one
  under the new parent (`openedAt` = the same day). The two legs of the move
  SHOULD share a `transferId` and name each other in `counterpartHoldingId`, so
  that the move reads as one event and not as a sale plus a purchase. A SHOULD,
  like every `transferId` of 5.6: net worth and ownership at each date are
  right without the link, which only restores the continuity of the position.
  An account that moves with its positions is closed and reopened the same way,
  with each position below it.
- A merger or an exchange of shares is recorded the same way: the old holding is
  closed on the old instrument, the new one is opened on the resulting
  instrument, and the `corporate_action` transaction (5.6) carries the `factor`
  on the new holding. Section 5.6 drops "via a new `instrumentId` on the
  holding".
- Section 13: the reference validator cannot see a rewrite inside one document,
  so this stays a producer rule (section 14, producer conformance), like the
  append-only convention of section 11.

A test in `tests/` derives net worth at a date before and after a move between
two owners, and checks that each subject keeps the share it held at each date.
A second one moves an account holding with no valuation of its own and checks
the same.

## Compatibility

Additive for the schema: no field is added, removed or tightened, and every
valid document stays valid. A producer that today rewrites `parentId` or
`instrumentId` becomes non-conformant to the producer rule. Its documents were
already giving wrong history; the derived numbers at past dates change to the
correct ones once it follows the rule.

## Alternatives considered

- **Dated relations**, a `parents` list of `{ parentId, from, until }` like
  ownership rows. Precise, but it adds a field, a second history mechanism
  beside `openedAt`/`closedAt`, and a new overlap rule for the validator, for an
  event that close-and-reopen already expresses.
- **A `predecessorId` on the new holding.** A clearer link than the transfer
  legs, but a new reference to validate. It can come later if consumers need to
  join the two halves of a position without reading transactions.
