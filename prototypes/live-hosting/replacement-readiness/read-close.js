// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License. See License.txt in the project root.
(async()=>{const s=globalThis.replyProbe.service;return {outcome:globalThis.realClose,windows:[...s.prototypeWindows.keys()],pending:[...s.pendingProjectCloses.keys()],requests:globalThis.replyProbe.requests,results:globalThis.replyProbe.results,shell:await [...s.prototypeWindows.values()][0].win.webContents.executeJavaScript('document.body.innerText')};})()
