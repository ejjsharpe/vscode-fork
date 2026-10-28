/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { onPrototypeConnectionRevoked, prototypeBinding, revokePrototypeConnection } from './prototypeLifetime.js';
import { WebContents } from 'electron';
import { validatedIpcMain } from './ipcMain.js';
import { VSBuffer } from '../../../common/buffer.js';
import { Emitter } from '../../../common/event.js';
import { IDisposable, toDisposable } from '../../../common/lifecycle.js';
import { ClientConnectionEvent, IPCServer } from '../common/ipc.js';
import { Protocol as ElectronProtocol } from '../common/ipc.electron.js';

export class Server extends IPCServer {
	private static readonly clients = new Map<number, IDisposable>();

	constructor(resolveContext?: (contents: WebContents, nonce: unknown) => string | undefined) {
		const onConnect = new Emitter<ClientConnectionEvent>();
		super(onConnect.event);
		validatedIpcMain.on('vscode:hello', (event, key: string, nonce: unknown) => {
			const contents = event.sender;
			const context = resolveContext?.(contents, nonce);
			if (resolveContext && !context) { return; }
			Server.clients.get(contents.id)?.dispose();
			const disconnect = new Emitter<void>();
			const messages = new Emitter<VSBuffer>();
			let active = true;
			const isCurrent = () => {
				if (!active) { return false; }
				try { if (context) { prototypeBinding(context); } return true; } catch { return false; }
			};
			const receive = (incoming: Electron.IpcMainEvent, message: Buffer, messageKey: string, messageNonce: unknown) => {
				if (incoming.sender === contents && incoming.senderFrame === contents.mainFrame && messageKey === key && messageNonce === nonce && isCurrent()) {
					messages.fire(VSBuffer.wrap(message));
				}
			};
			const dispose = toDisposable(() => {
				if (!active) { return; }
				active = false;
				validatedIpcMain.removeListener('vscode:message', receive);
				validatedIpcMain.removeListener('vscode:disconnect', goodbye);
				revocation.dispose();
				if (context) { revokePrototypeConnection(context); }
				disconnect.fire();
				disconnect.dispose();
				messages.dispose();
				if (Server.clients.get(contents.id) === dispose) { Server.clients.delete(contents.id); }
			});
			const goodbye = (incoming: Electron.IpcMainEvent, _message: unknown, messageKey: string, messageNonce: unknown) => {
				if (incoming.sender === contents && messageKey === key && messageNonce === nonce) { dispose.dispose(); }
			};
			const revocation = onPrototypeConnectionRevoked(revoked => { if (revoked === context) { dispose.dispose(); } });
			validatedIpcMain.on('vscode:message', receive);
			validatedIpcMain.on('vscode:disconnect', goodbye);
			Server.clients.set(contents.id, dispose);
			const protocol = new ElectronProtocol({ send: (channel, message) => {
				if (isCurrent()) { contents.mainFrame.send(channel, message, key); }
			} }, messages.event);
			onConnect.fire({ protocol, onDidClientDisconnect: disconnect.event, context });
		});
	}
}
