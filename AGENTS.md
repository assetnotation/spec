# AGENTS.md

Rules for any agent or contributor working in this repo. They are not tied to a
particular tool. This file is tracked by git, so a fresh clone has it: it must
stand on its own. `CONTRIBUTING.md`, `GOVERNANCE.md` and `SECURITY.md` cover the
human process and remain authoritative for it.

This repo holds the specification of Asset Notation: an open, portable notation
for what you own and owe, over time. **The document is the product.** Code here
serves the document - it validates it, it never redefines it.

## The rule that is easiest to break here

**This repo never names another product.** Not fidalo, not selfstore, not
quitalo, not lacantabilite - in the spec, the examples, the tests, a commit
message or a PR body. The whole `assetnotation` organisation is under this rule,
strictly and without exception.

A notation that cites one vendor's app stops being a notation and becomes that
vendor's export format. Examples use invented, neutral data.

## Before pushing

```sh
npm run check
```

= `validate` + `test` + `lint:md`. Green before every push. A spec change that
does not validate its own examples is a spec that lies to its first reader.

## Git

- Gitflow: `feature/*` into `develop`, `release/*` from `develop` into `main`,
  `hotfix/*` from `main`. Never push directly to `develop` or `main`.
- **Never open a pull request whose SOURCE branch is `develop` or `main`.**
  GitHub deletes the source branch on merge, and that is how a long branch
  disappears for good.
- Branch and PR names follow open-source convention: English, kebab-case, and
  **no tool prefix** - not `claude/`, not `agent/`, not `codex/`.
- Commits: conventional, English, pure ASCII. Author is always
  Florian Mousseau <florian.mousseau@gmail.com>. **No AI mention anywhere** - no
  co-author line, no trailer, no branding. `gh pr create` sometimes adds a
  generated-by trailer: re-read the body and remove it.
- This repo is **public**. An agent prepares the pull request; the merge is
  Florian's call.

## Versions

A specification's version is a promise to its implementers. **Major on any
breaking change** - a removed field, a renamed key, a tightened constraint that
invalidates a document which used to be valid. Minor for an additive field.
Patch for wording that changes no behaviour.

Anything that would force `assetnotation/js` to change its parser is breaking,
whatever it looks like from here.
