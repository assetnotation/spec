// Validates every examples/*.json against the JSON Schema matching the version the
// document declares in its `assetnotation` field (matched on major.minor), then checks
// the document-level invariants a JSON Schema cannot express: an id duplicated within
// its collection is an error; an unresolved reference is reported informatively but
// permitted, because any subset of a valid document is itself valid (partial
// disclosure). Then runs the conformance corpus in tests/conformance/, where each
// case states the verdict it must get. Used as the CI gate and as a local proof that
// the schemas, the examples, the corpus and the integrity rules agree.
import { readFileSync, readdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import Ajv2020 from "ajv/dist/2020.js";
import addFormats from "ajv-formats";

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, "..");

// One compiled validator per published schema version, keyed by major.minor.
const validators = new Map();
for (const version of readdirSync(join(root, "schema")).sort()) {
  const schemaPath = join(root, "schema", version, "asset-notation.schema.json");
  const schema = JSON.parse(readFileSync(schemaPath, "utf8"));
  const ajv = new Ajv2020({ allErrors: true, strict: false });
  addFormats(ajv);
  const majorMinor = version.split(".").slice(0, 2).join(".");
  validators.set(majorMinor, { version, validate: ajv.compile(schema) });
}

// Document-level invariants (any version): unique ids, resolvable references.
function checkIntegrity(doc) {
  const errors = [];
  const notes = [];
  const collections = ["subjects", "institutions", "holdings", "instruments", "valuations", "transactions"];
  const idsOf = {};
  for (const name of collections) {
    const seen = new Set();
    for (const entity of doc[name] ?? []) {
      if (typeof entity?.id !== "string") continue; // shape is the schema's job
      if (seen.has(entity.id)) errors.push(`duplicate id "${entity.id}" in ${name}`);
      seen.add(entity.id);
    }
    idsOf[name] = seen;
  }
  const ref = (from, field, id, target) => {
    if (id !== undefined && !idsOf[target].has(id)) {
      notes.push(`${from}.${field} "${id}" does not resolve to ${target} (permitted under partial disclosure)`);
    }
  };
  for (const h of doc.holdings ?? []) {
    ref(`holding ${h.id}`, "parentId", h.parentId, "holdings");
    ref(`holding ${h.id}`, "institutionId", h.institutionId, "institutions");
    ref(`holding ${h.id}`, "instrumentId", h.instrumentId, "instruments");
    for (const l of h.links ?? []) ref(`holding ${h.id}`, `link[${l.rel}].holdingId`, l.holdingId, "holdings");
  }
  for (const v of doc.valuations ?? []) ref(`valuation ${v.id}`, "holdingId", v.holdingId, "holdings");
  for (const t of doc.transactions ?? []) {
    ref(`transaction ${t.id}`, "holdingId", t.holdingId, "holdings");
    ref(`transaction ${t.id}`, "counterpartHoldingId", t.counterpartHoldingId, "holdings");
    ref(`transaction ${t.id}`, "instrumentId", t.instrumentId, "instruments");
  }
  for (const o of doc.ownership ?? []) {
    ref("ownership", "subjectId", o.subjectId, "subjects");
    ref("ownership", "holdingId", o.holdingId, "holdings");
  }
  errors.push(...parentCycles(doc), ...ownershipOverlaps(doc), ...negativeLiabilities(doc));
  return { errors, notes };
}

// A chain of parentId that comes back on itself (section 4): the derivation of
// section 6 walks the chain, and a loop has no root. Reported once per member.
function parentCycles(doc) {
  const parentOf = new Map();
  for (const h of doc.holdings ?? []) {
    if (typeof h?.id === "string" && typeof h.parentId === "string") parentOf.set(h.id, h.parentId);
  }
  const errors = [];
  for (const start of parentOf.keys()) {
    const chain = [start];
    for (let next = parentOf.get(start); next !== undefined; next = parentOf.get(next)) {
      if (next === start) {
        errors.push(`parent cycle: ${chain.join(" -> ")} -> ${start}`);
        break;
      }
      if (chain.includes(next)) break; // the loop is elsewhere, reported from its own start
      chain.push(next);
    }
  }
  return errors;
}

// Two ownership rows of one subject on one holding whose intervals overlap
// (section 5.7). A bare date compares as text: YYYY-MM-DD sorts as it dates.
function ownershipOverlaps(doc) {
  const rows = new Map();
  for (const o of doc.ownership ?? []) {
    if (typeof o?.subjectId !== "string" || typeof o.holdingId !== "string") continue;
    const key = `${o.subjectId}\u0000${o.holdingId}`;
    rows.set(key, [...(rows.get(key) ?? []), o]);
  }
  const errors = [];
  for (const [, list] of rows) {
    const sorted = list.slice().sort((a, b) => String(a.from ?? "").localeCompare(String(b.from ?? "")));
    for (let i = 1; i < sorted.length; i++) {
      const previous = sorted[i - 1];
      const current = sorted[i];
      if (previous.until === undefined || String(current.from ?? "") < String(previous.until)) {
        errors.push(`ownership of holding "${current.holdingId}" by "${current.subjectId}" overlaps: [${previous.from ?? ""}, ${previous.until ?? ""}) and [${current.from ?? ""}, ${current.until ?? ""})`);
      }
    }
  }
  return errors;
}

// A liability valued below zero (section 5.3, since 0.5.0): the derivation subtracts
// a liability, so a negative outstanding would count the debt as an asset. A
// valuation whose holding is absent is not checked: its nature is unknown.
function negativeLiabilities(doc) {
  const [major, minor] = String(doc?.assetnotation ?? "").split(".").map(Number);
  if (major === 0 && minor < 5) return [];
  const liabilities = new Set((doc.holdings ?? []).filter((h) => h?.nature === "liability").map((h) => h.id));
  return (doc.valuations ?? [])
    .filter((v) => liabilities.has(v?.holdingId) && String(v.value?.amount ?? "").trim().startsWith("-"))
    .map((v) => `negative liability value: valuation "${v.id}" of holding "${v.holdingId}" is ${v.value.amount}`);
}

// Validates one document: the schema of its declared major.minor, then the integrity
// invariants. `entry` is undefined when no schema matches the declared version.
function validateDocument(doc) {
  const majorMinor = String(doc?.assetnotation ?? "").split(".").slice(0, 2).join(".");
  const entry = validators.get(majorMinor);
  if (!entry) return { entry, schemaErrors: [], errors: [], notes: [] };
  const schemaOk = entry.validate(doc);
  const schemaErrors = schemaOk ? [] : [...entry.validate.errors];
  return { entry, schemaErrors, ...checkIntegrity(doc) };
}

const examplesDir = join(root, "examples");
const files = readdirSync(examplesDir).filter((f) => f.endsWith(".json")).sort();

let failures = 0;
for (const file of files) {
  const doc = JSON.parse(readFileSync(join(examplesDir, file), "utf8"));
  const { entry, schemaErrors, errors, notes } = validateDocument(doc);
  if (!entry) {
    failures += 1;
    console.error(`FAIL  ${file}`);
    console.error(`      no schema for declared version "${doc.assetnotation}"`);
    continue;
  }
  if (schemaErrors.length === 0 && errors.length === 0) {
    console.log(`PASS  ${file} (Asset Notation ${entry.version})`);
  } else {
    failures += 1;
    console.error(`FAIL  ${file} (Asset Notation ${entry.version})`);
    for (const err of schemaErrors) console.error(`      ${err.instancePath || "/"} ${err.message}`);
    for (const err of errors) console.error(`      ${err}`);
  }
  for (const note of notes) console.log(`note  ${file}: ${note}`);
}
console.log(`
${files.length - failures}/${files.length} example(s) valid.`);

// Conformance cases: each one carries the verdict a conformant validator must
// reach. An invalid case must fail for its stated reason - an error at its
// `expect` path, or a duplicate id - so a case that breaks for an unrelated
// reason (a typo in the case itself) cannot pass as proof.
// The document-level invariants a case may expect, and the prefix of the error
// each one raises.
const INVARIANTS = { "duplicate-id": "duplicate id", "parent-cycle": "parent cycle", "ownership-overlap": "ownership of holding", "negative-liability": "negative liability value" };
const conformanceDir = join(here, "conformance");
let caseCount = 0;
let caseFailures = 0;
for (const file of readdirSync(conformanceDir).filter((f) => f.endsWith(".json")).sort()) {
  const suite = JSON.parse(readFileSync(join(conformanceDir, file), "utf8"));
  for (const c of suite.cases) {
    caseCount += 1;
    const label = `${file} ${c.valid ? "valid" : "invalid"}: ${c.name} (section ${c.section})`;
    const { entry, schemaErrors, errors } = validateDocument(c.document);
    let problem = null;
    if (!entry || entry.version !== suite.version) {
      problem = `declares "${c.document?.assetnotation}", suite is ${suite.version}`;
    } else if (c.valid) {
      const found = [...schemaErrors.map((e) => `${e.instancePath || "/"} ${e.message}`), ...errors];
      if (found.length > 0) problem = `rejected: ${found.join("; ")}`;
    } else if (c.expect in INVARIANTS) {
      if (!errors.some((e) => e.startsWith(INVARIANTS[c.expect]))) problem = `accepted without a ${c.expect} error`;
    } else if (!schemaErrors.some((e) => e.instancePath === c.expect)) {
      const at = schemaErrors.map((e) => e.instancePath || "/").join(", ") || "nowhere";
      problem = `expected an error at "${c.expect || "/"}", got one at ${at}`;
    }
    if (problem) {
      caseFailures += 1;
      console.error(`FAIL  ${label}`);
      console.error(`      ${problem}`);
    }
  }
}
// Below this, the walk has gone wrong and a green result would mean nothing.
const MIN_CASES = 40;
if (caseCount < MIN_CASES) {
  caseFailures += 1;
  console.error(`FAIL  only ${caseCount} conformance case(s) found, expected at least ${MIN_CASES}`);
}
console.log(`${caseCount - caseFailures}/${caseCount} conformance case(s) reach their verdict.`);

if (failures > 0 || caseFailures > 0) process.exit(1);
