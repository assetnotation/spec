# 0005 - Documents that MUST be refused

- Status: draft
- Author: Florian Mousseau
- Created: 2026-10-19
- Target version: 0.4.0 (tooling; no change to the data model)

## Problem

`examples/` holds three documents that must validate, and CI proves they do. There
is no document that must be refused. An implementation can therefore pass every
check this repository offers while accepting a float for money, a duplicate id or
a timestamp without a zone: the properties the specification cares most about are
the ones nothing here tests. Section 15 lists "a conformance test corpus before
v1.0" as an open question; this is its first half.

## Proposal

Add `examples/invalid/`, one small document per rule, named after the rule it
breaks (`money-as-float.json`, `duplicate-holding-id.json`, `date-that-does-not-
exist.json`, `corporate-action-without-factor.json`, `share-as-number.json`,
`timestamp-without-zone.json`, ...). Each carries an `x-expect` field naming the
error it must produce. `tests/validate.mjs` validates them and fails if one is
accepted or produces no error matching `x-expect`. `assetnotation/js` mirrors the
folder, as it mirrors `examples/` today, and its schema-drift check covers it.

## Compatibility

None: tooling only. A document under `examples/invalid/` is not an example of the
format and the README says so.

## Alternatives considered

- Keeping the negative cases in each implementation's own tests. Rejected: an
  implementation then tests its own reading of the specification, and two
  implementations can disagree with both of them green.
