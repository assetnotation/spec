# Security Policy

Asset Notation is a data format, not a running service. "Security" here covers two
things: the privacy model of the format itself, and the integrity of the artifacts in
this repository (the JSON Schema and tooling).

## The format's security model

This is normative and lives in the specification, section 11
([versions/0.1.0.md](versions/0.1.0.md)):

- An Asset Notation document is **plaintext and inherently sensitive**.
  Confidentiality, integrity and tamper-evidence are the responsibility of the
  **container** that carries the document (for example an encrypted file using
  authenticated encryption), not of this schema.
- Account numbers SHOULD be masked and identifiers MAY be redacted.
- Any subset of a valid document is itself valid, so partial disclosure needs no special
  handling.

If you believe the specification itself encourages an unsafe practice (for example, a
field that leaks more than the owner intends), please report it as described below - we
treat privacy weaknesses in the model as security issues.

## Reporting a vulnerability

Please report suspected vulnerabilities - in the schema, the tooling, or the privacy
model - **privately**, not in a public issue:

- Preferred: open a [GitHub private security advisory](https://github.com/assetnotation/spec/security/advisories/new).
- Or email [florian.mousseau@gmail.com](mailto:florian.mousseau@gmail.com).

Please include enough detail to reproduce or understand the issue. We aim to acknowledge
a report within **5 business days** and to agree on a disclosure timeline with you. We
will credit reporters who wish to be credited.

## Supported versions

During the 0.x phase, only the latest published version receives fixes. Once 1.0 is
released, this section will list the supported version range.
