import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const engine = await readFile(new URL("../lib/progressTracking.js", import.meta.url), "utf8");

assert.doesNotMatch(engine, /expectedAnswer/);
assert.doesNotMatch(engine, /proof\.text/);
assert.doesNotMatch(engine, /answerText/);
assert.match(engine, /MAX_PROGRESS_RECORDS/);
assert.match(engine, /latestProgressRecords/);
assert.match(engine, /summarizeProgress/);
assert.match(engine, /validateProgressData/);

console.log("Bloc 7 : assertions de confidentialité du moteur validées.");
