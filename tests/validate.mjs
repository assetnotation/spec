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
  return { errors, notes };
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
    } else if (c.expect === "duplicate-id") {
      if (!errors.some((e) => e.startsWith("duplicate id"))) problem = "accepted without a duplicate-id error";
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
