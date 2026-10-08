// Lints the specification prose with markdownlint, the library, and
// .markdownlint.json. It replaces markdownlint-cli2, whose file globbing pulls
// in micromatch and braces: braces carries a high advisory with no fixed
// release, so the audit step could not go green while the CLI was installed.
// The file list is walked by hand instead, over the same four patterns.
import { readFileSync, readdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join, relative } from "node:path";
import { lint } from "markdownlint/promise";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

// Below this, the walk has gone wrong and a green result would mean nothing.
const MIN_FILES = 10;

function markdownIn(dir, recursive) {
  const found = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const path = join(dir, entry.name);
    if (entry.isDirectory() && recursive) found.push(...markdownIn(path, true));
    else if (entry.isFile() && entry.name.endsWith(".md")) found.push(path);
  }
  return found;
}

const files = [
  ...markdownIn(root, false),
  ...["versions", "proposals", ".github"].flatMap((dir) => markdownIn(join(root, dir), true)),
].map((path) => relative(root, path));

if (files.length < MIN_FILES) {
  console.error(`Only ${files.length} Markdown file(s) found, expected at least ${MIN_FILES}.`);
  process.exit(1);
}

const config = JSON.parse(readFileSync(join(root, ".markdownlint.json"), "utf8"));
process.chdir(root);
const results = await lint({ files, config });
const report = Object.entries(results).flatMap(([file, issues]) =>
  issues.map((issue) => {
    const detail = issue.errorDetail ? ` [${issue.errorDetail}]` : "";
    return `${file}:${issue.lineNumber} ${issue.ruleNames.join("/")} ${issue.ruleDescription}${detail}`;
  }),
);

if (report.length > 0) {
  console.error(report.join("\n"));
  process.exit(1);
}
console.log(`${files.length} Markdown file(s) linted, 0 issues.`);
