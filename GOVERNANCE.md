# Governance

Asset Notation is an open specification. This document describes how decisions are
made. It is intentionally lightweight for the project's current size and is expected to
grow as adoption grows.

## Current phase: maintainer-led (0.x)

While the specification is pre-1.0 and still maturing, the project is led by its
maintainer(s) listed in [MAINTAINERS.md](MAINTAINERS.md). The maintainer:

- triages issues and reviews pull requests;
- decides what goes into each version, guided by the design principles in the
  [specification](versions/0.1.0.md);
- cuts releases and maintains the changelog.

Decisions are made by **lazy consensus**: a change proposed in an issue or pull request
is accepted if no maintainer objects within a reasonable review window. Substantive
changes to the data model SHOULD first be discussed in an issue (see
[CONTRIBUTING.md](CONTRIBUTING.md)) before a pull request is opened.

## Path to a steering committee

The maintainer-led phase is a starting point, not the end state. A **Technical Steering
Committee (TSC)** will be formed once **two or more independent implementations** exist
and are maintained by different parties. At that point:

- maintainers of independent implementations are invited to join the TSC;
- the TSC takes over acceptance of breaking changes and release approval, by majority
  vote, with the design principles as the tie-breaker;
- this document is updated by the TSC to record its membership and process.

The realistic long-term target is a stable, de-facto open specification with a small
TSC, optionally aligned with an established standards body if and when that adds value.

## Changing this document

Governance changes are made by pull request and follow the same process as any other
change. Until a TSC exists, they require maintainer approval.
