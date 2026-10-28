/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { VSBuffer } from '../../../base/common/buffer.js';
import { IServerChannel } from '../../../base/parts/ipc/common/ipc.js';
import { prototypeBinding, prototypeDocumentGeneration } from '../../../base/parts/ipc/electron-main/prototypeLifetime.js';
import { IAuxiliaryWindow } from '../../auxiliaryWindow/electron-main/auxiliaryWindow.js';
import { ICodeWindow } from '../../window/electron-main/window.js';

/** Only the trusted PTY process calls this reverse channel with its authenticated origin. */
export function createPtyNativeParentChannel(getWindow: (id: number) => ICodeWindow | undefined, getAuxiliaryWindows: () => readonly IAuxiliaryWindow[]): IServerChannel {
	return {
		async call<T>(_context: unknown, command: string, args: unknown[]) {
			if (command !== 'resolve' || !Array.isArray(args) || typeof args[0] !== 'string' || !(args[1] instanceof VSBuffer) || typeof args[2] !== 'number') { throw new Error('Rejected PTY native target arguments'); }
			const binding = prototypeBinding(args[0]);
			const owner = getWindow(binding.workbench);
			if (binding.scope.role === 'auxiliary' || owner?.webContents !== binding.contents) { throw new Error('Rejected PTY native owner'); }
			const target = args[2] === owner.id ? owner : getAuxiliaryWindows().find(window => window.id === args[2] && window.parentId === owner.id);
			if (!target?.win || target.win.isDestroyed() || target.webContents.isDestroyed() || prototypeDocumentGeneration(target.webContents) === undefined) { throw new Error('Rejected foreign or expired PTY native target'); }
			const handle = VSBuffer.wrap(target.win.getNativeWindowHandle());
			if (!handle.equals(args[1])) { throw new Error('Rejected foreign or unknown PTY native handle'); }
			prototypeBinding(args[0]);
			return handle as T;
		},
		listen() { throw new Error('PTY native parents have no events'); }
	};
}
