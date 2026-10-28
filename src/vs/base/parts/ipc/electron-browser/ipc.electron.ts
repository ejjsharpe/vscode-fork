/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { VSBuffer } from '../../../common/buffer.js';
import { Event } from '../../../common/event.js';
import { IDisposable } from '../../../common/lifecycle.js';
import { IPCClient } from '../common/ipc.js';
import { Protocol as ElectronProtocol } from '../common/ipc.electron.js';
import { ipcRenderer } from '../../sandbox/electron-browser/globals.js';

/**
 * An implementation of `IPCClient` on top of Electron `ipcRenderer` IPC communication
 * provided from sandbox globals (via preload script).
 */
export class Client extends IPCClient implements IDisposable {

	private protocol: ElectronProtocol;

	private static createProtocol(): ElectronProtocol {
		const key = crypto.randomUUID();
		const messages = Event.fromNodeEventEmitter<{ message: VSBuffer; key: string }>(ipcRenderer, 'vscode:message', (_, message, responseKey) => ({ message: VSBuffer.wrap(message), key: responseKey }));
		const onMessage = Event.map(Event.filter(messages, message => message.key === key), message => message.message);
		ipcRenderer.send('vscode:hello', key);
		return new ElectronProtocol({ send: (channel, message) => ipcRenderer.send(channel, message, key) }, onMessage);
	}

	constructor(id: string) {
		const protocol = Client.createProtocol();
		super(protocol, id);

		this.protocol = protocol;
	}

	override dispose(): void {
		this.protocol.disconnect();
		super.dispose();
	}
}
