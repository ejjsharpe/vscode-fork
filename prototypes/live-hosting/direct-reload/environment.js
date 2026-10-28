// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License. See License.txt in the project root.
(()=>({versions:process.versions,platform:process.platform,arch:process.arch,windows:[...replyProbe.service.prototypeWindows.values()].map(w=>({id:w.id,ready:w.isReady})),requests:replyProbe.requests,results:replyProbe.results}))()
