/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import assert from 'assert';
import { EventEmitter } from 'events';
import type { BrowserWindow, IpcMainEvent, WebContents, WebFrameMain } from 'electron';
import sinon from 'sinon';
import { VSBuffer } from '../../../../base/common/buffer.js';
import { prototypeRequestContext, registerPrototypeDocument } from '../../../../base/parts/ipc/electron-main/prototypeLifetime.js';
import { upcastPartial } from '../../../../base/test/common/mock.js';
import { ensureNoDisposablesAreLeakedInTestSuite } from '../../../../base/test/common/utils.js';
import { IAuxiliaryWindow } from '../../../auxiliaryWindow/electron-main/auxiliaryWindow.js';
import { ICodeWindow } from '../../../window/electron-main/window.js';
import { createPtyNativeParentChannel } from '../../electron-main/ptyNativeParentChannel.js';

type NodeListener = Parameters<EventEmitter['on']>[1];

suite('PTY native parents', () => {
	ensureNoDisposablesAreLeakedInTestSuite();
	test('accepts only a live exact owner or its registered auxiliary with the matching native handle', async () => {
		const log = sinon.stub(console, 'log');
		const cleanups: (() => void)[] = [];
		function document(id: number, workbench: number, auxiliary = false) {
			const events = new EventEmitter();
			const frame = upcastPartial<WebFrameMain>({});
			let nonce: string | undefined;
			const contents: WebContents = upcastPartial<WebContents>({ id, mainFrame: frame,
				on: (event: string, listener: NodeListener) => { events.on(event, listener); return contents; },
				once: (event: string, listener: NodeListener) => { events.once(event, listener); return contents; },
				isDestroyed: () => false,
				send: (_channel: string, value: string) => { nonce = value; }
			});
			registerPrototypeDocument(contents, workbench, { role: auxiliary ? 'auxiliary' : 'project' });
			events.emit('dom-ready');
			cleanups.push(() => events.emit('destroyed'));
			return { contents, context: prototypeRequestContext(upcastPartial<IpcMainEvent>({ sender: contents, senderFrame: frame }), nonce) };
		}
		try {
			const ownerDocument = document(815, 51);
			const auxiliaryDocument = document(816, 51, true);
			const ownHandle = VSBuffer.fromString('main');
			const auxiliaryHandle = VSBuffer.fromString('auxiliary');
			const owner = upcastPartial<ICodeWindow>({ id: 51, webContents: ownerDocument.contents, win: upcastPartial<BrowserWindow>({ isDestroyed: () => false, getNativeWindowHandle: () => Buffer.from(ownHandle.buffer) }) });
			const auxiliary = upcastPartial<IAuxiliaryWindow>({ id: 52, parentId: 51, webContents: auxiliaryDocument.contents, win: upcastPartial<BrowserWindow>({ isDestroyed: () => false, getNativeWindowHandle: () => Buffer.from(auxiliaryHandle.buffer) }) });
			let auxiliaries: readonly IAuxiliaryWindow[] = [auxiliary];
			const channel = createPtyNativeParentChannel(id => id === owner.id ? owner : undefined, () => auxiliaries);
			assert.ok((await channel.call<VSBuffer>('main', 'resolve', [ownerDocument.context, ownHandle, 51])).equals(ownHandle));
			assert.ok((await channel.call<VSBuffer>('main', 'resolve', [ownerDocument.context, auxiliaryHandle, 52])).equals(auxiliaryHandle));
			await assert.rejects(channel.call('main', 'resolve', [ownerDocument.context, auxiliaryHandle, 51]), /handle/);
			await assert.rejects(channel.call('main', 'resolve', [ownerDocument.context, auxiliaryHandle, 99]), /target/);
			auxiliaries = [{ ...auxiliary, id: 53 }];
			await assert.rejects(channel.call('main', 'resolve', [ownerDocument.context, auxiliaryHandle, 52]), /target/);
			await assert.rejects(channel.call('main', 'resolve', [auxiliaryDocument.context, ownHandle, 51]), /owner/);
		} finally { cleanups.forEach(dispose => dispose()); log.restore(); }
	});
});
