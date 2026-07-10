# Changelog

All notable changes to the Asset Notation specification are documented here. The format
is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and the project
adheres to [Semantic Versioning](https://semver.org/) (with the pre-1.0 caveat that
minor versions may introduce breaking changes).

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

[0.2.0]: https://github.com/assetnotation/spec/releases/tag/v0.2.0
[0.1.0]: https://github.com/assetnotation/spec/releases/tag/v0.1.0
