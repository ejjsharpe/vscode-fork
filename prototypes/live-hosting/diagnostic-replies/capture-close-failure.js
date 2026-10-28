// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License. See License.txt in the project root.
(() => ({observed:globalThis.bootstrapRetryResult,laterLifecycleReady:process.getBuiltinModule('module').createRequire(process.cwd()+'/package.json')('./out/vs/base/parts/ipc/electron-main/prototypeLifetime.js').prototypeLifecycleReady(replyProbe.service.prototypeWindows.get(100002).webContents)}))()
