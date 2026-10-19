# 0003 - The sign of a transaction on a liability

- Status: draft
- Author: Florian Mousseau
- Created: 2026-10-19
- Target version: 0.4.0 (clarification; could ship as 0.3.1)

## Problem

Section 5.6 defines `amount` as "signed: negative = outflow, positive = inflow", and
5.3 says a liability's values are the positive outstanding as stated by the lender.
Neither says what a repayment of 990 on a mortgage looks like. From the owner's
cash it is an outflow (`-990`); from the loan's balance it is a decrease of the
outstanding, which the positive-outstanding convention would write as `-990` too,
but a drawdown on a credit line, which raises the outstanding, is then `+` while
being cash *in* for the owner. Two producers can legitimately read 5.6 in opposite
ways, and a consumer netting `transferId` legs to zero (5.6) gets a different
answer under each.

## Proposal

State it in 5.6: `amount` is signed **from the holding's own perspective, in the
direction of its value under 5.3**. On an asset, a positive amount raises the
holding's value. On a liability, a positive amount raises the outstanding (a
drawdown, interest capitalized); a repayment is negative. A repayment is then
`-990` on the checking account and `-990` on the mortgage: each leg lowers its own
holding's value, and the owner's net worth is unchanged by the move. Amend the
netting rule of 5.6 accordingly: the legs of one `transferId` SHOULD net to zero
**after each leg is signed by its holding's nature** (`+1` asset, `-1` liability),
which is the net-worth effect; two asset legs still net to zero on the amounts
alone. `counterpartHoldingId` keeps the two sides linked.

Add one worked repayment to section 16 and to `examples/household.json`.

## Compatibility

Editorial for the schema. A producer that wrote repayments as positive "inflows to
the loan" must flip the sign; the specification was silent, so no document was
conformant or non-conformant on this point before.

## Alternatives considered

- "Owner's cash perspective" on every transaction. Rejected: a corporate action
  or an interest capitalization moves no cash, and the legs of a transfer would
  then net to zero only after reading each holding's nature.
