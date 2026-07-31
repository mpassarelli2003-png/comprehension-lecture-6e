import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const [classification, registration, secondary, calibration, panel, mount, layout, styles, packageJson] = await Promise.all([
  readFile(new URL("../lib/questionClassification.js", import.meta.url), "utf8"),
  readFile(new URL("../lib/exerciseBankRegistration.js", import.meta.url), "utf8"),
  readFile(new URL("../app/data/secondaryExercises.js", import.meta.url), "utf8"),
  readFile(new URL("../lib/contentCalibration.js", import.meta.url), "utf8"),
  readFile(new URL("../app/admin/ContentCalibrationAdminPanel.jsx", import.meta.url), "utf8"),
  readFile(new URL("../app/admin/ContentCalibrationAdminMount.jsx", import.meta.url), "utf8"),
  readFile(new URL("../app/layout.jsx", import.meta.url), "utf8"),
  readFile(new URL("../app/contentCalibration.css", import.meta.url), "utf8"),
  readFile(new URL("../package.json", import.meta.url), "utf8")
]);

assert.match(classification, /exerciseBankRegistration\.js/);
assert.match(registration, /registerCalibratedExercises/);
assert.match(registration, /ids\.has/);
assert.match(secondary, /Secondaire 1/);
assert.match(secondary, /Secondaire 2/);
assert.match(secondary, /textType: "narratif"/);
assert.match(secondary, /textType: "informatif"/);
assert.match(secondary, /textType: "opinion"/);
assert.match(secondary, /textType: "lettre"/);
assert.match(secondary, /reviewStatus: "approved"/);
assert.match(calibration, /CONTENT_LEVEL_PROFILES/);
assert.match(calibration, /maximumComprehensionRatio/);
assert.match(calibration, /minimumInferenceInterpretationRatio/);
assert.match(calibration, /minimumReactionAppreciationRatio/);
assert.match(calibration, /coverageGaps/);
assert.match(panel, /Banque de textes calibrée/);
assert.match(panel, /Couverture par niveau/);
assert.match(panel, /Types de texte/);
assert.match(panel, /Dimensions de questions/);
assert.match(panel, /Télécharger l’audit/);
assert.match(mount, /pathname === "\/admin"/);
assert.match(layout, /ContentCalibrationAdminMount/);
assert.match(layout, /contentCalibration\.css/);
assert.match(styles, /contentCalibrationTable/);
assert.match(styles, /calibrationStatus-review/);

const pkg = JSON.parse(packageJson);
assert.match(pkg.scripts["test:block8"], /block8-content-calibration\.mjs/);
assert.match(pkg.scripts["test:block8"], /block8-integration-audit\.mjs/);
assert.match(pkg.scripts.prebuild, /test:block8/);

console.log("Bloc 8 : intégration banque, audit admin et calibrage validés.");
