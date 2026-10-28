/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { MessagePortMain, isUtilityProcess, MessageEvent, ParentPort } from '../../sandbox/node/electronTypes.js';
import { VSBuffer } from '../../../common/buffer.js';
import { ClientConnectionEvent, IMessagePassingProtocol, IPCServer } from '../common/ipc.js';
import { Emitter, Event } from '../../../common/event.js';
import { assertType } from '../../../common/types.js';
import { DisposableStore, toDisposable } from '../../../common/lifecycle.js';
import { IMessagePortConnectionScope } from '../common/ipc.mp.js';

/**
 * The MessagePort `Protocol` leverages MessagePortMain style IPC communication
 * for the implementation of the `IMessagePassingProtocol`.
 */
class Protocol implements IMessagePassingProtocol {

	readonly onMessage;

	constructor(private port: MessagePortMain) {
		this.onMessage = Event.fromNodeEventEmitter<VSBuffer>(this.port, 'message', (e: MessageEvent) => {
			if (e.data) {
				return VSBuffer.wrap(e.data as Uint8Array);
			}
			return VSBuffer.alloc(0);
		});
		// we must call start() to ensure messages are flowing
		port.start();
	}

	send(message: VSBuffer): void {
		this.port.postMessage(message.buffer);
	}

	disconnect(): void {
		this.port.close();
	}
}

export interface IClientConnectionFilter {

	/**
	 * Allows to filter incoming messages to the
	 * server to handle them differently.
	 *
	 * @param e the message event to handle
	 * @returns `true` if the event was handled
	 * and should not be processed by the server.
	 */
	handledClientConnection(e: MessageEvent): boolean;
}

/**
 * An implementation of a `IPCServer` on top of MessagePort style IPC communication.
 * The clients register themselves via Electron Utility Process IPC transfer.
 */
export class Server extends IPCServer {

	private readonly portDisposables: DisposableStore;
	private readonly scopes: Map<string, IMessagePortConnectionScope>;

	constructor(filter?: IClientConnectionFilter, parentPort?: ParentPort) {
		if (!parentPort) {
			assertType(isUtilityProcess(process), 'Electron Utility Process');
			parentPort = process.parentPort;
		}
		const disposables = new DisposableStore();
		const scopes = new Map<string, IMessagePortConnectionScope>();
		const ports = new Map<string, MessagePortMain>();
		const connections = disposables.add(new Emitter<ClientConnectionEvent>());
		super(connections.event);
		this.portDisposables = disposables;
		this.scopes = scopes;
		const receive = (e: MessageEvent) => {
			const message = e.data as { type?: string; context?: string; scope?: IMessagePortConnectionScope; payload?: unknown } | undefined;
			if (message?.type === 'vscode:ipc-revoke' && typeof message.context === 'string') {
				const port = ports.get(message.context);
				scopes.delete(message.context);
				ports.delete(message.context);
				port?.close();
				return;
			}
			const port = e.ports.at(0);
			if (!port) { return; }
			// Only the parent can supply this envelope. The peer handshake cannot select its scope.
			const trusted = message?.type === 'vscode:ipc-connection' ? message : undefined;
			const context = trusted?.context ?? 'main';
			if (trusted) {
				if (typeof context !== 'string' || !trusted.scope || ports.has(context)) { port.close(); return; }
				scopes.set(context, trusted.scope);
				ports.set(context, port);
			}
			const closed = () => {
				scopes.delete(context);
				if (ports.delete(context)) { parentPort.postMessage({ type: 'vscode:ipc-closed', context }); }
			};
			port.on('close', closed);
			if (filter?.handledClientConnection({ data: trusted ? trusted.payload : e.data, ports: e.ports })) { return; }
			connections.fire({ protocol: new Protocol(port), context, onDidClientDisconnect: Event.fromNodeEventEmitter(port, 'close') });
		};
		parentPort.on('message', receive);
		disposables.add(toDisposable(() => {
			parentPort.removeListener('message', receive);
			for (const port of ports.values()) { port.close(); }
			ports.clear();
			scopes.clear();
		}));
	}

	/** Returns only a live scope established by main; unknown or revoked handles fail closed. */
	getConnectionScope(context: string): IMessagePortConnectionScope | undefined {
		if (context === 'main') { return undefined; }
		const scope = this.scopes.get(context);
		if (!scope) { throw new Error('Rejected unknown or revoked utility connection'); }
		return scope;
	}

	override dispose(): void {
		this.portDisposables.dispose();
		super.dispose();
	}
}

interface INodeMessagePortFragment {
	on(event: 'message', listener: (messageEvent: MessageEvent) => void): this;
	removeListener(event: 'message', listener: (messageEvent: MessageEvent) => void): this;
}

export function once(port: INodeMessagePortFragment, message: unknown, callback: () => void): void {
	const listener = (e: MessageEvent) => {
		if (e.data === message) {
			port.removeListener('message', listener);
			callback();
		}
	};

	port.on('message', listener);
}
