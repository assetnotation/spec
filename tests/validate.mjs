// Validates every examples/*.json against the Asset Notation JSON Schema.
// Used as the CI gate and as a local proof that the schema and the examples agree.
import { readFileSync, readdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import Ajv2020 from "ajv/dist/2020.js";
import addFormats from "ajv-formats";

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, "..");
const VERSION = "0.1.0";

const schemaPath = join(root, "schema", VERSION, "asset-notation.schema.json");
const schema = JSON.parse(readFileSync(schemaPath, "utf8"));

const ajv = new Ajv2020({ allErrors: true, strict: false });
addFormats(ajv);
const validate = ajv.compile(schema);

const examplesDir = join(root, "examples");
const files = readdirSync(examplesDir).filter((f) => f.endsWith(".json")).sort();

let failures = 0;
for (const file of files) {
  const doc = JSON.parse(readFileSync(join(examplesDir, file), "utf8"));
  if (validate(doc)) {
    console.log(`PASS  ${file}`);
  } else {
    failures += 1;
    console.error(`FAIL  ${file}`);
    for (const err of validate.errors ?? []) {
      console.error(`      ${err.instancePath || "/"} ${err.message}`);
    }
  }
}

console.log(`\n${files.length - failures}/${files.length} example(s) valid against Asset Notation ${VERSION}.`);
if (failures > 0) process.exit(1);
