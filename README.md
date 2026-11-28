# Asset Notation

[![License: Apache-2.0](https://img.shields.io/badge/license-Apache--2.0-blue.svg)](LICENSE)
[![Spec version](https://img.shields.io/badge/spec-0.5.0-blue.svg)](versions/0.5.0.md)
[![CI](https://github.com/assetnotation/spec/actions/workflows/ci.yml/badge.svg)](https://github.com/assetnotation/spec/actions/workflows/ci.yml)

An open, portable notation for what you own and owe.

Asset Notation is a neutral data format for the assets and liabilities of a person or
a household over time. It covers accounts, positions, properties, debts and their
values, across institutions and asset classes. Everything fits in one self-describing
JSON document that any application can read and write. The format records the facts,
and net worth is derived from them.

> Status v0.5.0, before 1.0. The model is exercised against real data before any
> v1.0, so expect occasional breaking changes until then. Feedback and proposals are
> welcome.

## Why

Today wealth data is locked inside each aggregator and each institution, and no neutral
format moves it between them. Move banks, change apps, or simply want a long-term
archive you control, and the picture falls apart. Asset Notation keeps bank-messaging
standards (ISO 20022) and brokerage feeds in place. It consolidates their outputs into
one portable document the owner controls.

One generic entity, the `Holding`, covers every asset and liability. Each value is
time-stamped and names its source. Money is never a float. Identifiers come from ISO
standards instead of new inventions. Unknown fields and kinds are preserved, never
rejected, so a document stays readable by tools older than it.

## The format at a glance

```json
{
  "assetnotation": "0.5.0",
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

- [`versions/0.5.0.md`](versions/0.5.0.md) is the normative specification. Previous
  versions stay in [`versions/`](versions/).
- [`schema/0.5.0/asset-notation.schema.json`](schema/0.5.0/asset-notation.schema.json)
  is the JSON Schema.
- [`examples/`](examples/) holds a minimal document, a full household, and a
  multi-currency brokerage with paired trade legs and a stock split.

## Validate a document

The repository ships a JSON Schema and a tiny validator. With Node.js 20+:

```sh
npm install
npm run validate    # validate examples/*.json against the schema
npm run lint:md     # lint the specification prose
npm run check       # both
```

To validate your own document, drop it in `examples/`, or point your own ajv setup at
`schema/0.5.0/asset-notation.schema.json` (JSON Schema draft 2020-12). Each example is
checked against the schema of the version it declares. On top of the schema, the
validator flags duplicate ids and unresolved references.

## Test an implementation

[`tests/conformance/0.5.0.json`](tests/conformance/0.5.0.json) is a language-neutral
corpus for anyone writing a parser or validator. It holds 59 whole documents, each with the
verdict a conformant validator must reach and the section of the specification that
decides it. The valid cases cover what a consumer must tolerate, such as unknown kinds
and fields, dangling references under partial disclosure, a corporate action with no
amount, or masked account numbers. The invalid cases cover what it must refuse, such as
a float or a formatted amount, a lower-case currency, an extra key in a money object, a
share above one, or a duplicate id. Each invalid case names, in `expect`, the JSON Pointer where the
error belongs, so it cannot pass by failing for an unrelated reason. Load the file,
validate each `document`, compare with `valid`. `npm run validate` runs it against
the reference schema.

## Repository layout

```text
versions/    the specification, one Markdown source per version
schema/      the JSON Schema, one folder per version
examples/    conformant example documents (validated in CI)
tests/       the example validator and the conformance corpus (CI gate)
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
