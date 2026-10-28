(()=>{
 const p=globalThis.replyProbe,s=p.service;
 return {requests:p.requests,results:p.results,windows:[...s.prototypeWindows.values()].map(w=>({id:w.id,ready:w.isReady,closePending:w.closePending})),pendingUnload:[...s.mapWindowIdToPendingUnload.keys()],pendingCloses:[...s.pendingProjectCloses.keys()],closing:[...s.closingProjects],disposal:globalThis.disposalResult};
})()
