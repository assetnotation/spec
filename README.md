# Asset Notation

[![License: Apache-2.0](https://img.shields.io/badge/license-Apache--2.0-blue.svg)](LICENSE)
[![Spec version](https://img.shields.io/badge/spec-0.2.0--draft-orange.svg)](versions/0.2.0.md)
[![CI](https://github.com/assetnotation/spec/actions/workflows/ci.yml/badge.svg)](https://github.com/assetnotation/spec/actions/workflows/ci.yml)

**An open, portable notation for what you own and owe.**

Asset Notation is a neutral data format for a person's or household's **assets and
liabilities over time** - accounts, positions, properties, debts and their values,
across institutions and asset classes - in a single self-describing JSON document that
any application can read and write. Net worth is something you *derive* from it; the
format itself just records the facts.

> **Status: DRAFT (v0.2.0).** The model is exercised against real data before any v1.0.
> Expect breaking changes until then. Feedback and proposals are welcome.

## Why

Today wealth data is locked inside each aggregator and each institution, with no neutral
interchange format. Move banks, change apps, or simply want a long-term archive you
control, and the picture falls apart. Asset Notation is the neutral payload: it does not
replace bank-messaging standards (ISO 20022) or brokerage feeds - it consolidates their
outputs into one portable document the owner controls.

Design in one breath: **one generic entity** (a `Holding`, asset or liability), values
that are **time-stamped and sourced**, **money that is never a float**, identifiers
**reused from ISO standards** rather than invented, and **forward-compatibility** so
unknown fields and kinds are preserved, never rejected.

## The format at a glance

```json
{
  "assetnotation": "0.1.0",
  "generatedAt": "2026-06-24T20:00:00Z",
  "baseCurrency": "EUR",
  "holdings": [
    { "id": "h1", "kind": "checking", "nature": "asset", "currency": "EUR" },
    { "id": "h2", "kind": "mortgage", "nature": "liability", "currency": "EUR" }
  ],
  "valuations": [
    { "id": "v1", "holdingId": "h1", "asOf": "2026-06-24", "value": { "amount": "4210.55", "currency": "EUR" }, "source": "statement" },
    { "id": "v2", "holdingId": "h2", "asOf": "2026-06-24", "value": { "amount": "176400.00", "currency": "EUR" }, "source": "statement" }
  ]
}
```

- **Specification:** [`versions/0.2.0.md`](versions/0.2.0.md) - the normative document
  (draft; [`versions/0.1.0.md`](versions/0.1.0.md) is the previous version).
- **JSON Schema:** [`schema/0.2.0/asset-notation.schema.json`](schema/0.2.0/asset-notation.schema.json).
- **Examples:** [`examples/`](examples/) - a minimal document, a full household, a
  multi-currency brokerage with a stock split.

## Validate a document

The repository ships a JSON Schema and a tiny validator. With Node.js 20+:

```sh
npm install
npm run validate    # validate examples/*.json against the schema
npm run lint:md     # lint the specification prose
npm run check       # both
```

To validate your own document, drop it in `examples/` (or point your own ajv setup at
`schema/0.2.0/asset-notation.schema.json`, JSON Schema draft 2020-12). Examples are
validated against the schema matching the version each document declares.

## Repository layout

```text
versions/    the specification, one Markdown source per version
schema/      the JSON Schema, one folder per version
examples/    conformant example documents (validated in CI)
tests/       the example validator (CI gate)
proposals/   how to propose a change to the format
```

## Contributing & governance

- [CONTRIBUTING.md](CONTRIBUTING.md) - how to propose changes (DCO sign-off required).
- [GOVERNANCE.md](GOVERNANCE.md) - how decisions are made.
- [CODE_OF_CONDUCT.md](CODE_OF_CONDUCT.md) - Contributor Covenant.
- [SECURITY.md](SECURITY.md) - reporting and the format's security model.

## License

Licensed under the [Apache License 2.0](LICENSE). Permissive, with an explicit patent
grant, so anyone can implement Asset Notation freely.
