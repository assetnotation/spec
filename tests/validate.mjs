// Validates every examples/*.json against the JSON Schema matching the version the
// document declares in its `assetnotation` field (matched on major.minor), then checks
// the document-level invariants a JSON Schema cannot express: an id duplicated within
// its collection is an error; an unresolved reference is reported informatively but
// permitted, because any subset of a valid document is itself valid (partial
// disclosure). Used as the CI gate and as a local proof that the schemas, the examples
// and the integrity rules agree.
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

const examplesDir = join(root, "examples");
const files = readdirSync(examplesDir).filter((f) => f.endsWith(".json")).sort();

let failures = 0;
for (const file of files) {
  const doc = JSON.parse(readFileSync(join(examplesDir, file), "utf8"));
  const majorMinor = String(doc.assetnotation ?? "").split(".").slice(0, 2).join(".");
  const entry = validators.get(majorMinor);
  if (!entry) {
    failures += 1;
    console.error(`FAIL  ${file}`);
    console.error(`      no schema for declared version "${doc.assetnotation}"`);
    continue;
  }
  const schemaOk = entry.validate(doc);
  const { errors, notes } = checkIntegrity(doc);
  if (schemaOk && errors.length === 0) {
    console.log(`PASS  ${file} (Asset Notation ${entry.version})`);
  } else {
    failures += 1;
    console.error(`FAIL  ${file} (Asset Notation ${entry.version})`);
    for (const err of entry.validate.errors ?? []) {
      console.error(`      ${err.instancePath || "/"} ${err.message}`);
    }
    for (const err of errors) console.error(`      ${err}`);
  }
  for (const note of notes) console.log(`note  ${file}: ${note}`);
}

console.log(`\n${files.length - failures}/${files.length} example(s) valid.`);
if (failures > 0) process.exit(1);
