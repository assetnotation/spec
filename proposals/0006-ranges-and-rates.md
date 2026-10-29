# 0006 - Positive rates, ordered intervals, one conversion rule, internal legs in scope

- Status: draft
- Author: Florian Mousseau
- Created: 2026-10-29
- Target version: 0.6.0

## Problem

Four rules of 0.5.0 leave a valid document that derives a wrong total, or two
conformant consumers that derive different ones.

1. **Multipliers accept zero and negatives.** `FxRate.rate` and a transaction's
   `factor` are plain `decimalString`, so `"0"` and `"-1.2"` validate. A rate of zero
   wipes out a foreign holding, a negative one turns a debt into a contribution; a
   factor of zero erases a position, a negative one inverts it.
2. **Intervals may be reversed.** Nothing requires `openedAt < closedAt` on a holding
   nor `from < until` on an ownership row. Section 6 reads `[openedAt, closedAt)` and
   `[from, until)`, so a reversed or empty interval makes the holding or the share
   invisible at every date, and no check reports the corrupt record.
3. **Two conversion rules for one record.** Section 6 converts everything "using an FX
   rate as of T", then says a tool SHOULD use the rate captured on the record. For a
   foreign balance valued in March and read in October, one consumer converts at the
   March rate, another at the October rate, and both are conformant.
4. **Internal movements outside the disclosed scope.** Section 5.6 lets a consumer
   exclude the transactions grouped by a `transferId` from external flows. Section 11
   says any subset of a document is a document. After one account is extracted, a leg
   keeps its `transferId` while its counterpart is gone, and excluding it hides a real
   income or expense of the disclosed scope.

## Proposal

1. `FxRate.rate` and `factor` MUST be strictly positive. The schema gains a
   `positiveDecimalString` (`^(0*[1-9][0-9]*(\.[0-9]+)?|0+\.[0-9]*[1-9][0-9]*)$`), and
   the conformance corpus gains a rejected case for `"0"` and for a negative value of
   each.
2. When both bounds are present, `openedAt` MUST be before `closedAt` and `from` MUST be
   before `until`. The reference validator reports a violation as an integrity error
   (section 4): `holding-interval` and `ownership-interval`. Conformance gains one case
   for a reversed and one for an empty interval of each.
3. Section 6 names two figures and their order. The **value as of T** of a foreign
   record is converted at a rate as of T, the captured `fx` serving only when the tool
   holds no rate as of T. The **historical counter-value** of a record (its cost, a
   past statement) is converted at its captured `fx`. A worked example shows one USD
   balance valued in March and read in October under a moving rate, with both figures.
4. Section 5.6 reads "internal" against the scope being computed: a consumer MAY
   exclude a leg from external flows only when every leg sharing its `transferId` is in
   that scope. A leg whose counterparts are absent counts as an external flow of the
   scope. Section 11 says so in one sentence next to partial disclosure.

## Compatibility

Points 1 and 2 invalidate documents that 0.5.0 accepted; each such document already
derived a wrong total. A validator gains two schema refusals and two integrity errors,
judged from 0.6 on only, as `negative-liability` is from 0.5. Points 3 and 4 change no
document's validity: they narrow a non-normative derivation and a SHOULD. Pre-1.0, this
ships as a minor.

## Alternatives considered

- A rate of zero as "unknown". Rejected: an absent `fx` already says it, and a zero that
  means two things is the trap this note removes.
- Normalizing a reversed interval by swapping its bounds. Rejected for the reason
  proposal 0005 gives for signs: it hides a producer bug.
- Always the captured rate. Rejected: a balance read today at a rate of last spring is a
  historical figure, not today's net worth.
