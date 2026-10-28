// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License. See License.txt in the project root.
import assert from 'node:assert/strict';
import fs from 'node:fs';
const here = new URL('./', import.meta.url);
const identities = JSON.parse(fs.readFileSync(new URL('identities.json', here))).result.value;
const text = fs.readFileSync(new URL('sender-probe.txt', here), 'utf8');
const probe = JSON.parse(text.split('\n').find(line => line.startsWith('{"callerWorkbench"')));
assert.equal(identities.windows.length, 1);
assert.deepEqual(identities.windows[0].children.map(view => view.wc), [2, 3, 4]);
assert.equal(probe.callerWorkbench, 100002);
const pids = identities.contents.filter(entry => entry.id !== 1).sort((a, b) => a.id - b.id).map(entry => entry.pid);
assert.deepEqual(probe.results.map(entry => entry.pid), [...pids, null]);
console.log('Evidence is consistent: one native host, three real workbench views, cross-workbench PID queries accepted. Sender-binding acceptance gate FAILED.');
