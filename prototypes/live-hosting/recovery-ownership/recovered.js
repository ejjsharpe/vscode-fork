(async () => {
 const p=globalThis.recoveryProbe;
 const after=p.snapshot();
 const assert=process.getBuiltinModule('assert/strict');
 assert.equal(after.hosts.length,1);
 assert.equal(after.hosts[0].id,p.before.hosts[0].id);
 assert.equal(after.hosts[0].children,3);
 assert.equal(p.oldContents.isDestroyed(),true);
 const old=p.before.windows.find(w=>w.id===p.target.id),fresh=after.windows.find(w=>w.id===p.target.id);
 assert.notEqual(fresh.contents,old.contents);
 assert.notEqual(fresh.generation,old.generation);
 assert.equal(fresh.ready,true);
 assert.deepEqual(fresh.workspace,old.workspace);
 assert.equal(fresh.profile,old.profile);
 assert.equal(fresh.environmentHash,old.environmentHash);
 assert.equal(fresh.backupPath,old.backupPath);
 for(const id of [100000,100001]) {
  const before=p.before.windows.find(w=>w.id===id), now=after.windows.find(w=>w.id===id);
  assert.equal(now.contents,before.contents); assert.equal(now.pid,before.pid); assert.equal(now.generation,before.generation); assert.equal(now.ready,true);
 }
 return {oldDestroyed:p.oldContents.isDestroyed(),after};
})()
