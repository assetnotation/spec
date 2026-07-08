// Validates every examples/*.json against the JSON Schema matching the version the
// document declares in its `assetnotation` field (matched on major.minor).
// Used as the CI gate and as a local proof that the schemas and the examples agree.
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
  if (entry.validate(doc)) {
    console.log(`PASS  ${file} (Asset Notation ${entry.version})`);
  } else {
    failures += 1;
    console.error(`FAIL  ${file} (Asset Notation ${entry.version})`);
    for (const err of entry.validate.errors ?? []) {
      console.error(`      ${err.instancePath || "/"} ${err.message}`);
    }
  }
}

console.log(`\n${files.length - failures}/${files.length} example(s) valid.`);
if (failures > 0) process.exit(1);
