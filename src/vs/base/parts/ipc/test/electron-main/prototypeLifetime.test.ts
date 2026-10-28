/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import assert from 'assert';
import { EventEmitter } from 'events';
import { VSBuffer } from '../../../../common/buffer.js';
import type { IpcMainEvent, WebContents, WebFrameMain } from 'electron';
import sinon from 'sinon';
import { upcastPartial } from '../../../../test/common/mock.js';
import { ensureNoDisposablesAreLeakedInTestSuite } from '../../../../test/common/utils.js';
import { prototypeBinding, prototypeRequestContext, registerPrototypeDocument } from '../../electron-main/prototypeLifetime.js';
import { IPCClient } from '../../common/ipc.js';
import { Server as UtilityProcessServer } from '../../node/ipc.mp.js';
import type { MessagePortMain, ParentPort } from '../../../sandbox/node/electronTypes.js';

class TestParentPort extends EventEmitter implements ParentPort {
	postMessage(): void { }
}

type NodeListener = Parameters<EventEmitter['on']>[1];

suite('Authenticated document connections', () => {

	test('rejects foreign frames and retired credentials without changing the current owner', () => {
		const log = sinon.stub(console, 'log');
		const events = new EventEmitter();
		const frame = upcastPartial<WebFrameMain>({});
		let nonce: string | undefined;
		const contents: WebContents = upcastPartial<WebContents>({
			id: 412,
			mainFrame: frame,
			on: (event: string, listener: NodeListener) => { events.on(event, listener); return contents; },
			once: (event: string, listener: NodeListener) => { events.once(event, listener); return contents; },
			isDestroyed: () => false,
			send: (_channel: string, value: string) => { nonce = value; }
		});
		registerPrototypeDocument(contents, 51, { role: 'project', workspaceId: 'exact-workspace', remoteAuthority: 'ssh-remote+host' });
		const request = upcastPartial<IpcMainEvent>({ sender: contents, senderFrame: frame });
		try {
			events.emit('dom-ready');
			const oldNonce = nonce;
			const context = prototypeRequestContext(request, nonce);
			const binding = prototypeBinding(context);
			assert.throws(() => prototypeRequestContext(upcastPartial<IpcMainEvent>({ sender: contents, senderFrame: upcastPartial<WebFrameMain>({}) }), nonce));
			events.emit('did-start-navigation', {}, 'next', false, true);
			assert.throws(() => prototypeBinding(context));
			events.emit('dom-ready');
			assert.throws(() => prototypeRequestContext(request, oldNonce));
			const replacement = prototypeBinding(prototypeRequestContext(request, nonce));
			assert.deepStrictEqual({
				owner: binding.scope,
				replacement: replacement.scope,
				freshDocument: replacement.generation > binding.generation
			}, {
				owner: { role: 'project', workspaceId: 'exact-workspace', remoteAuthority: 'ssh-remote+host' },
				replacement: { role: 'project', workspaceId: 'exact-workspace', remoteAuthority: 'ssh-remote+host' },
				freshDocument: true
			});
		} finally {
			events.emit('destroyed');
			log.restore();
		}
	});

	test('utility connections use the parent-established context and stop after parent revocation', async () => {
		const parentEvents = new TestParentPort();
		const portEvents = new EventEmitter();
		const responses = new EventEmitter();
		const port: MessagePortMain = upcastPartial<MessagePortMain>({
			on: (event: string, listener: NodeListener) => { portEvents.on(event, listener); return port; },
			removeListener: (event: string, listener: NodeListener) => { portEvents.removeListener(event, listener); return port; },
			start: () => { },
			postMessage: data => { queueMicrotask(() => responses.emit('message', VSBuffer.wrap(data as Uint8Array))); },
			close: () => { portEvents.emit('close'); }
		});
		const server = new UtilityProcessServer(undefined, parentEvents);
		const scope = { role: 'project' as const, workbench: 51, generation: 7, workspaceId: 'exact-workspace' };
		server.registerChannel('identity', {
			call: async <T>(context: string) => ({ context, scope: server.getConnectionScope(context) }) as T,
			listen: () => { throw new Error('No events'); }
		});
		parentEvents.emit('message', { data: { type: 'vscode:ipc-connection', context: 'main-issued-connection', scope }, ports: [port] });
		const client = new IPCClient({
			onMessage: listener => { responses.on('message', listener); return { dispose: () => responses.removeListener('message', listener) }; },
			send: data => { queueMicrotask(() => portEvents.emit('message', { data: data.buffer })); }
		}, 'forged-main');
		try {
			const result = await client.getChannel('identity').call('read');
			parentEvents.emit('message', { data: { type: 'vscode:ipc-revoke', context: 'main-issued-connection' }, ports: [] });
			assert.throws(() => server.getConnectionScope('main-issued-connection'));
			assert.deepStrictEqual({ result, connections: server.connections.length }, { result: { context: 'main-issued-connection', scope }, connections: 0 });
		} finally {
			client.dispose();
			server.dispose();
		}
	});

	ensureNoDisposablesAreLeakedInTestSuite();
});
