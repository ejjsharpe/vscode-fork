// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License. See License.txt in the project root.
// THROWAWAY: consistency checks for saved observations, not a fresh runtime pass.
import assert from 'node:assert/strict';
import fs from 'node:fs';
const root=new URL('./evidence/',import.meta.url);
const read=name=>JSON.parse(fs.readFileSync(new URL(name,root),'utf8'));
assert.equal(read('baseline.json').result,'failed');
const hidden=read('hidden-dialog-native.json').hosts[0];
assert.equal(hidden.views.find(view=>view.title==='Agents').visible,false);
for(const name of ['after-terminal-cancel.json','after-file-cancel.json','after-save-neighbour-cancel.json']) {
 const host=read(name).hosts[0];
 assert.equal(host.id,hidden.id);
 assert.deepEqual(host.views.map(view=>view.contents),[2,3,4]);
}
for(const name of ['command-terminal-prompt.json','later-command-prompt.json']) {
 assert.equal(read(name).safeguardWorkbench,'Agents');
 assert.equal(read(name).safeguardButton,'Terminate');
}
for(const name of ['dirty-after-terminal-cancel.json','dirty-after-file-cancel.json']) {
 assert.deepEqual(read(name).projects.map(p=>p.dirtyTextPreserved),[true,true]);
}
assert.equal(read('final-terminal-prompt.json').hosts[0].views.find(view=>view.title==='Agents').visible,true);
const completed=read('verified-completion.json');
assert.equal(completed.hostDestroyed,true);
assert.deepEqual(completed.destroyed,completed.originalViews);
assert.equal(completed.allOriginalViewsDestroyed,true);
assert.equal(completed.remainingHosts,0);
assert.equal(completed.bothSavedFilesMatch,true);
assert.deepEqual(read('after-completed-close.json').hosts,[]);
const replies=fs.readFileSync(new URL('lifecycle.txt',root),'utf8').split('\n').filter(line=>line.startsWith('[lifecycle-reply-probe] {')).map(line=>JSON.parse(line.slice(line.indexOf('{'))));
assert.equal(replies.filter(r=>r.result==='cancel').length,3);
assert.deepEqual(replies.filter(r=>r.phase==='vscode:onWillUnload').map(r=>[r.workbench,r.result]),[[100000,'ok'],[100001,'ok'],[100002,'ok']]);
assert.deepEqual(replies.slice(-6).map(r=>r.result),Array(6).fill('ok'));
console.log('PASS: saved whole-window Close evidence is consistent; full staged gate remains unvalidated');
