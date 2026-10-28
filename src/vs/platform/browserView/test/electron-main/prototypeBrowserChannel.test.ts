/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import assert from 'assert';
import { DisposableStore } from '../../../../base/common/lifecycle.js';
import { ProxyChannel } from '../../../../base/parts/ipc/common/ipc.js';
import { upcastPartial } from '../../../../base/test/common/mock.js';
import { ensureNoDisposablesAreLeakedInTestSuite } from '../../../../base/test/common/utils.js';
import { IBrowserViewMainService } from '../../electron-main/browserViewMainService.js';
import { BrowserView } from '../../electron-main/browserView.js';
import { prototypeBrowserGroupChannel, prototypeBrowserViewChannel } from '../../electron-main/prototypeBrowserChannel.js';
import { BrowserSession } from '../../electron-main/browserSession.js';
import { IBrowserViewInfo } from '../../common/browserView.js';
import { IBrowserViewGroupMainService } from '../../electron-main/browserViewGroupMainService.js';
import { DeferredPromise } from '../../../../base/common/async.js';

suite('Native browser ownership', () => {
	const store = ensureNoDisposablesAreLeakedInTestSuite();

	test('rejects foreign handles and nested hosts while retaining current-owner access', async () => {
		const views = new Map([
			['own', upcastPartial<BrowserView>({ id: 'own', host: { windowId: 51 }, session: upcastPartial<BrowserSession>({ id: 'own-session' }) })],
			['foreign', upcastPartial<BrowserView>({ id: 'foreign', host: { windowId: 52 }, session: upcastPartial<BrowserSession>({ id: 'foreign-session' }) })]
		]);
		const service = upcastPartial<IBrowserViewMainService>({
			tryGetBrowserView: id => views.get(id),
			getURL: async () => 'https://own.example/',
			getOrCreateBrowserView: async id => upcastPartial<IBrowserViewInfo>({ id }),
		});
		let current = true;
		const disposables = store.add(new DisposableStore());
		const channel = prototypeBrowserViewChannel(ProxyChannel.fromService(service, disposables), service, () => {
			if (!current) { throw new Error('Revoked'); }
			return { role: 'project', workbench: 51, generation: 1, workspaceId: 'workspace' };
		}, disposables);
		assert.strictEqual(await channel.call('owner', 'getURL', ['own']), 'https://own.example/');
		await assert.rejects(channel.call('owner', 'getURL', ['foreign']), /owner/);
		await assert.rejects(channel.call('owner', 'getOrCreateBrowserView', ['new', { host: { windowId: 52 }, session: { scope: 'ephemeral' }, owner: { type: 'user' } }]), /host/);
		current = false;
		await assert.rejects(channel.call('owner', 'getURL', ['own']), /Revoked/);
	});

	test('destroys a browser group that completes after its delegated owner expires', async () => {
		const ready = new DeferredPromise<void>();
		const started = new DeferredPromise<void>();
		const groups = new Set<string>();
		const service = upcastPartial<IBrowserViewGroupMainService>({
			createGroup: async () => { await started.complete(); await ready.p; groups.add('late'); return 'late'; },
			destroyGroup: async id => { groups.delete(id); },
			sendCDPMessage: async id => { if (!groups.has(id)) { throw new Error('Group is gone'); } }
		});
		const browsers = upcastPartial<IBrowserViewMainService>({});
		let current = true;
		const disposables = store.add(new DisposableStore());
		const channel = prototypeBrowserGroupChannel(ProxyChannel.fromService(service, disposables), service, browsers, () => {
			if (!current) { throw new Error('Revoked'); }
			return { role: 'project', workbench: 51, generation: 1, workspaceId: 'workspace' };
		}, disposables);
		const creation = channel.call('main', 'createGroup', [{ browserIds: [] }, { host: { windowId: 51 }, owner: { type: 'user' }, session: { scope: 'ephemeral' } }, { nativeConnectionContext: 'owner' }]);
		await started.p;
		current = false;
		await ready.complete();
		await assert.rejects(creation, /Revoked/);
		await assert.rejects(service.sendCDPMessage('late', { id: 1, method: 'Target.getTargets' }), /gone/);
	});
});
