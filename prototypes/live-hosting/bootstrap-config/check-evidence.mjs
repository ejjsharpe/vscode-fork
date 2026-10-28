// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License. See License.txt in the project root.
import assert from 'node:assert/strict';
import fs from 'node:fs';
const read = name => JSON.parse(fs.readFileSync(new URL(`evidence/${name}.json`,import.meta.url)));
assert.equal(read('baseline').foreign.accepted,true);
assert.equal(read('baseline').auxiliary.accepted,true);
const own = read('ownership');
assert.deepEqual(own.allOwn,[{accepted:true,own:true},{accepted:true,own:true},{accepted:true,own:true}]);
for(const name of ['foreign','auxiliary','extra']) assert.equal(own[name].accepted,false);
const transitions = read('transitions');
assert.equal(transitions.earlyExplicitRequestRejected,true);
assert.equal(transitions.preloadBootstrapSucceeded,true);
assert.equal(transitions.noExplicitReplay,true);
assert.equal(transitions.neighbourGenerationPreserved,true);
assert.equal(read('close').retryResult.samePromise,true);
assert.equal(read('host').hostAlive,true);
assert.equal(read('product-ui').dirtySingleEditorPreserved,true);
assert.equal(read('product-ui').dirtyMultiEditorPreserved,true);
assert.equal(read('editor-save-cancel').editorCancelPreservedText,true);
assert.equal(read('editor-save-cancel').diskTextMatches,true);
assert.equal(read('editor-save-cancel').neighbourDirtyEditorPreserved,true);
console.log('Saved evidence is consistent; this does not rerun Electron or certify the full gate.');
