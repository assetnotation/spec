# Changelog

All notable changes to the Asset Notation specification are documented here. The format
is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and the project
adheres to [Semantic Versioning](https://semver.org/) (with the pre-1.0 caveat that
minor versions may introduce breaking changes).

## [Unreleased]

Version 0.5.0 ([`versions/0.5.0.md`](versions/0.5.0.md)): one rule tightened.
Proposal 0005 in [`proposals/`](proposals/).

### Changed

- Section 5.3 and 4: a valuation of a liability MUST be zero or more, the outstanding
  as the lender states it. 0.4.0 forbade the negation but left "typically positive"
  open, and a debt valued `-90000` raised the derived net worth by 90000. The
  reference validator reports a negative liability value as an error. A document
  that valued a debt below zero no longer validates.
- Conformance corpus `tests/conformance/0.5.0.json`: the 0.4.0 cases plus a
  liability at its outstanding, at zero, below zero, an overdraft on an asset
  account, and a negative value whose holding is absent.

## [0.4.0] - 2026-10-19

Version 0.4.0 ([`versions/0.4.0.md`](versions/0.4.0.md)): additive, and states what
0.3.0 left unsaid. Proposals 0001 to 0004 in [`proposals/`](proposals/).

### Added

- `from` and `until` on ownership rows: the interval during which a share holds, so
  a share that changes is history rather than a rewrite. Two rows of one subject on
  one holding MUST NOT overlap; the reference validator reports an overlap as an
  error.
- Document integrity (section 4): a `parentId` chain MUST be acyclic; the reference
  validator reports a cycle as an error.
- Conformance corpus `tests/conformance/0.4.0.json`: the 0.3.0 cases plus ownership
  intervals, overlaps, cycles, a liability child, a repayment on both legs.

### Changed

- Section 6, the derivation: each leaf holding is signed by its own `nature` (a
  liability held inside an asset account is subtracted); a holding contributes
  nothing before `openedAt` or on and after `closedAt`; ownership is read on the
  root of the chain and as of the date.
- Section 5.6: the sign of `amount` is the holding's own, in the direction of its
  value (a repayment on a liability is negative); the legs of one `transferId` net
  to zero once each is signed by its holding's nature.
- Section 5.3 and 14: a producer SHOULD emit a final valuation when a holding closes.
- The household example and section 16 carry a mortgage payment on both sides.

### Fixed

- The household example (in `examples/household.json` and section 16 of
  `versions/0.3.0.md`) gives the brokerage account `h2` its ownership row. With
  `ownership` present and no row for `h2`, the derivation of section 6 owns it at
  zero, which contradicted the net worth the example announces (132730.55 EUR).
- Schema: a calendar date must exist. `2026-99-99` matched the `YYYY-MM-DD`
  pattern of `date` and of the date branch of `dateOrTimestamp` (`asOf`, a
  transaction's `date`, `openedAt`, `closedAt`) and validated; the `date`
  format now applies on top of the pattern, as the `date-time` format already
  did for timestamps. No document carrying a real date changes validity.

## [0.3.0] - 2026-07-10

Version 0.3.0 ([`versions/0.3.0.md`](versions/0.3.0.md)), the coherence release: one
breaking change (allowed pre-1.0), the rest additive.

### Changed

- **Breaking**: `ownership.share` is a base-10 decimal string in [0, 1] (was a JSON
  number), so ownership arithmetic follows the same no-float rule as money and
  quantities. Migration: quote the value (`0.5` becomes `"0.5"`).
- `transaction.type`, `institution.kind` and `instrument.kind` are open vocabularies
  (string plus recommended values), aligning the schema with the section 9 rule that
  consumers treat unknown values generically. `holding.nature` and `subject.type`
  stay closed. Every previously-valid value remains valid.

### Added

- `transferId` on transactions: an opaque id shared by the legs of one internal
  movement (a transfer's debit and credit, a trade and its cash settlement), netting
  to zero, so flow analytics stop double-counting internal moves.
- `quantity` on valuations: the units held as of the valuation date, making a
  valuation a self-sufficient position snapshot.
- ISO format patterns for the identifiers that are never masked (`bic`, `isin`,
  `lei`, `mic`); maskable identifiers (`iban`, `number`) stay free-form.
- Document integrity conventions (section 4): ids MUST be unique within their
  collection; references SHOULD resolve in-document but MAY dangle under partial
  disclosure, and consumers MUST tolerate that.
- Clarifications: the primary subject is the first of `subjects`; `value` takes
  precedence over `quantity` times `unitPrice`; future-dated valuations are
  projections and SHOULD carry a projective `source`; a liability's values are the
  outstanding as stated, never double-negated; a bare date compares as the start of
  that day, UTC.
- Reference validator: on top of schema validation, a duplicate id is now an error
  and an unresolved reference is reported informatively.

## [0.2.0] - 2026-07-10

Version 0.2.0 ([`versions/0.2.0.md`](versions/0.2.0.md)). Additive over 0.1.0: every
valid 0.1.0 document is a valid 0.2.0 document.

### Added

- Corporate actions: transaction type `corporate_action` with a quantity `factor`
  (split, reverse split, merger exchange ratio). `amount` is no longer required on
  such a transaction, since a corporate action moves no cash.
- Captured FX: an optional `fx: { base, rate }` object on valuations and
  transactions freezes the conversion rate the record was booked at.
- `costBasis` on holdings: the total acquisition cost of the current position,
  unchanged by corporate actions.
- A named `cash_of` link relation for the cash account serving another holding
  (settlement cash paired with a securities account).
- Sub-day transaction times: a transaction's `date` MAY be a full RFC 3339 timestamp,
  not only a calendar day (a trade execution, an on-chain settlement). A bare date
  stays valid, so 0.1.0 documents are unaffected.
- Record immutability convention: past records SHOULD be corrected by adding
  records, never by rewriting them (section 11).
- Validation policy (section 13): value objects (`money`, `fxRate`) are closed to extra
  keys, domain entities stay open for forward compatibility; the deferred
  strict-everywhere profile is documented as a future-major change.
- Schema `schema/0.2.0/`, a multi-version example validator, and a brokerage example
  exercising the new fields (a captured FX rate, a stock split and a timestamped trade).

## [0.1.0] - 2026-06-30

First public release of the Asset Notation specification.

### Added

- The normative specification ([`versions/0.1.0.md`](versions/0.1.0.md)): subjects,
  institutions, holdings (the single generic asset-or-liability entity), instruments,
  valuations, transactions and ownership shares.
- A machine-readable JSON Schema (draft 2020-12) at
  [`schema/0.1.0/asset-notation.schema.json`](schema/0.1.0/asset-notation.schema.json).
- Example documents in [`examples/`](examples/) and a validator used as a CI gate.
- Project governance, contribution guide, code of conduct and security policy.

[0.3.0]: https://github.com/assetnotation/spec/releases/tag/v0.3.0
[0.2.0]: https://github.com/assetnotation/spec/releases/tag/v0.2.0
[0.1.0]: https://github.com/assetnotation/spec/releases/tag/v0.1.0
