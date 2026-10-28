// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License. See License.txt in the project root.
import assert from 'node:assert/strict';
import fs from 'node:fs';
const read = name => JSON.parse(fs.readFileSync(new URL(name, import.meta.url), 'utf8'));
const caller = read('caller-results.json');
assert.equal(caller.results.length, 24);
assert.equal(caller.results.filter(row => row.rejected).length, 18);
assert.equal(new Set(caller.results.filter(row => row.command === 'getProcessId' && !row.rejected).map(row => row.result)).size, 1);
const created = read('lifetime-created.json');
const stale = read('lifetime-result.json');
assert.deepEqual(stale, {own:created.own,oldHost:created.id,accepted:true,result:false});
const runtime = read('runtime.json').result.value;
assert.equal(runtime.windows.length, 1);
assert.equal(runtime.windows[0].children.length, 3);
console.log('Saved evidence is consistent: caller checks passed; stale extension-host authority FAILED. This is not an acceptance pass.');
