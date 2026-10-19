# 0001 - Ownership over time

- Status: implemented (0.4.0)
- Author: Florian Mousseau
- Created: 2026-10-19
- Target version: 0.4.0

## Problem

The format records assets and liabilities *over time*: valuations and transactions
carry a date. Ownership does not. An `ownership` row is `{ subjectId, holdingId,
share }` with no date and no id, so a share that changes (a gift, a marriage, a
divorce, a buy-in to a company) cannot be expressed, and the append-only convention
of section 11 cannot apply to it: there is no way to add a superseding row, only to
rewrite the old one.

Net worth as of a past date T (section 6) therefore uses today's shares for every T.

## Proposal

Add two optional fields to `ownership`:

| Field | Req | Type | Notes |
|---|---|---|---|
| `from` | MAY | date | First day the share holds. Absent: since always. |
| `until` | MAY | date | Last day the share holds, exclusive. Absent: still holds. |

`ownedShare(h, S, T)` in section 6 sums the rows whose interval contains T. Two rows
for the same subject and holding MUST NOT have overlapping intervals; the reference
validator reports an overlap as an error, and shares of one holding summing above 1
on any day as a note.

## Compatibility

Additive. A document without `from` and `until` keeps its meaning exactly. A 0.3
consumer ignores the two fields and reads the latest state, as today.

## Alternatives considered

- An `asOf` on ownership rows, like valuations, with "latest row wins". Rejected:
  a share is a state with a start and an end, not a measurement; "latest wins"
  cannot express an interval that ended.
- Leaving ownership static and asking producers to export one document per
  date. Rejected: that is what the time series exists to avoid.
