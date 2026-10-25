# 0005 - The sign of a liability's value

- Status: implemented (0.5.0)
- Author: Florian Mousseau
- Created: 2026-10-19
- Target version: 0.5.0

## Problem

Section 5.3 of 0.4.0 says a liability's values MUST be the outstanding "as stated by
the institution (typically positive)" and that a producer MUST NOT negate a value to
express what `nature` already expresses. Nothing checks it, and "typically" leaves a
negative outstanding open. A debt valued `-90000` validates; the derivation of
section 6 subtracts it, and the net worth rises by 90000. A consumer cannot choose
between normalizing the sign and refusing the document, because the specification
does not say which reading is right.

## Proposal

A valuation of a holding whose `nature` is `liability` MUST carry an amount of zero
or more. The reference validator reports a negative one as an integrity error
(section 4). A valuation whose holding is absent from the document is not checked:
under partial disclosure its nature is unknown.

A loan repaid beyond its balance, so that the lender owes the owner, is no longer a
liability: the producer closes it at zero and records the credit on an asset holding.

## Compatibility

Breaking for a document that valued a liability below zero; such a document already
broke the "MUST NOT negate" rule of 0.4.0 and derived a wrong total. A validator
gains one error. Pre-1.0, this ships as a minor.

## Alternatives considered

- Normalize: read the absolute value of a liability's amount. Rejected: it hides a
  producer bug, and an overpaid loan would silently become a debt.
- Negative liabilities: let `nature` mark the side and the sign carry the direction.
  Rejected: it is the double negative 0.4.0 already forbids, and every transaction
  sign of section 5.6 is defined against the positive outstanding.
