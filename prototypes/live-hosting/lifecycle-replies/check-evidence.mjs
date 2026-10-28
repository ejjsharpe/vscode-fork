// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License. See License.txt in the project root.
import assert from 'node:assert/strict';
import fs from 'node:fs';
const read = name => JSON.parse(fs.readFileSync(new URL(name, import.meta.url), 'utf8'));
assert.ok(read('foreign-results.json').results.every(r => r.before === 1 && r.after === 1 && r.sender === 3));
assert.deepEqual(read('authorized-save.json').results.map(r => r.result), ['ok', 'ok', 'cancel', 'ok', 'ok']);
assert.equal(read('authorized-cancel.json').generation, 4);
assert.equal(read('authorized-save.json').generation, 5);
assert.equal(read('saved-file.json').contents, 'Disposable lifecycle reply test');
assert.equal(read('phase-results.json').at(-1).unexpectedReplacement, 'interrupted');
assert.equal(read('replacement-results.json').beforeReplacement, 'interrupted');
assert.equal(read('crash-results.json').result, 'interrupted');
assert.equal(read('crash-results.json').listeners, 0);
const recovery = read('recovery-state.json');
assert.equal(recovery.windows.length, 0, 'Observed required failure: shared host was destroyed');
assert.ok(recovery.contents.some(c => c.id === 2 && !c.crashed));
assert.ok(recovery.contents.some(c => c.id === 3 && !c.crashed));
assert.ok(recovery.contents.some(c => c.id === 4 && c.crashed));
console.log('Captured evidence is consistent: sampled lifecycle checks passed; shared-host recovery failed. Not a Stage 1 pass.');
