// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License. See License.txt in the project root.
(()=>{
 const s=globalThis.replyProbe.service,w=s.prototypeWindows.get(100002);
 globalThis.realClose={pending:true};
 s.close(w).then(()=>globalThis.realClose={resolved:true},e=>globalThis.realClose={resolved:false,error:String(e)});
 return {requested:w.id};
})()
