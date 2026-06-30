# Contributing to Asset Notation

Thanks for helping improve the specification. This format is meant to be implemented by
many tools, so changes are made carefully and in the open.

## What lives here

- [`versions/`](versions/) - the normative specification, one Markdown file per version.
- [`schema/`](schema/) - the JSON Schema, one folder per version.
- [`examples/`](examples/) - conformant example documents, validated in CI.
- [`proposals/`](proposals/) - design notes for larger changes.

A change to the data model is never just a prose edit: the **specification, the JSON
Schema and the examples MUST stay in sync** in the same pull request.

## How to propose a change

1. **Open an issue first** for anything that touches the data model, using the
   *Change proposal* template. Describe the problem, not just the solution.
2. Small or editorial fixes (typos, clarifications, new examples) can go straight to a
   pull request.
3. For a substantial change, add a short design note under [`proposals/`](proposals/)
   so the rationale is recorded alongside the discussion.

## Normative style

- Use RFC 2119 keywords (MUST, SHOULD, MAY) deliberately and consistently.
- Keep the core small. App-specific needs belong in `attributes`, `extensions` or `x-`
  fields, never in new core fields (see specification section 10).
- Prefer reusing an existing ISO identifier over inventing one.

## Versioning

Pre-1.0, the version is `0.MINOR.PATCH`:

- a change to the data model bumps the **minor** and adds a new `versions/<v>.md` and
  `schema/<v>/`;
- an editorial clarification that does not change the model bumps the **patch**;
- every model change updates [`CHANGELOG.md`](CHANGELOG.md).

## Checks

Before opening a pull request, run the same checks CI runs:

```sh
npm install
npm run check     # markdownlint + validate examples against the schema
```

New or changed behaviour SHOULD come with an example in `examples/` that exercises it.

## Developer Certificate of Origin (DCO)

Contributions are accepted under the [Developer Certificate of Origin
1.1](https://developercertificate.org/). You certify the DCO by signing off every
commit:

```sh
git commit -s -m "feat: ..."
```

This appends a `Signed-off-by: Your Name <you@example.com>` trailer. Commits without a
sign-off cannot be merged.

## License

By contributing, you agree that your contributions are licensed under the
[Apache License 2.0](LICENSE).
