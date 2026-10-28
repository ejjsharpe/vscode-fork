/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import assert from 'assert';
import { CancellationToken, CancellationTokenSource } from '../../../../base/common/cancellation.js';
import { Emitter, Event } from '../../../../base/common/event.js';
import { DeferredPromise } from '../../../../base/common/async.js';
import { DisposableStore } from '../../../../base/common/lifecycle.js';
import { IMessagePortConnectionScope } from '../../../../base/parts/ipc/common/ipc.mp.js';
import { mock } from '../../../../base/test/common/mock.js';
import { ensureNoDisposablesAreLeakedInTestSuite } from '../../../../base/test/common/utils.js';
import { ISSHConnectResult, ISSHRemoteAgentHostMainService, SSHAuthMethod } from '../../common/sshRemoteAgentHost.js';
import { IWSLRemoteAgentHostMainService } from '../../common/wslRemoteAgentHost.js';
import { ITunnelAgentHostMainService } from '../../common/tunnelAgentHost.js';
import { IDevContainerAgentHostMainService } from '../../common/devContainerAgentHost.js';
import { createSSHRemoteAgentHostChannel, createWSLRemoteAgentHostChannel, createTunnelAgentHostChannel, createOwnedDevContainerAgentHostChannel } from '../../common/remoteAgentHostIpc.js';

suite('Remote Agent Host ownership IPC', () => {
	const disposables = ensureNoDisposablesAreLeakedInTestSuite();
	function authority() {
		const removed = disposables.add(new Emitter<{ ctx: string }>());
		const scopes = new Map<string, IMessagePortConnectionScope>([
			['a', { role: 'agents', workbench: 1, generation: 1 }],
			['b', { role: 'agents', workbench: 2, generation: 1 }],
			['project', { role: 'project', workbench: 3, generation: 1, workspaceId: 'project' }],
		]);
		return {
			getScope: (ctx: string) => {
				if (ctx === 'main') { return undefined; }
				const scope = scopes.get(ctx);
				if (!scope) { throw new Error('Expired connection'); }
				return scope;
			},
			onDidRemoveConnection: removed.event,
			revoke: (ctx: string) => { scopes.delete(ctx); removed.fire({ ctx }); },
		};
	}
	const config = { host: 'host', username: 'user', name: 'Host', authMethod: SSHAuthMethod.Agent, sshConfigHost: 'alias' };
	const result: ISSHConnectResult = { connectionId: 'lease', address: 'ssh:alias', name: 'Host', config, connectionToken: undefined };

	class SSHBoundary extends mock<ISSHRemoteAgentHostMainService>() {
		readonly requests = disposables.add(new Emitter<{ requestId: string; connectionKey: string; displayHost: string; username: string; name: string; instructions: string; prompts: [] }>());
		readonly closed = disposables.add(new Emitter<string>());
		override readonly onDidCloseConnection = this.closed.event;
		readonly messages = disposables.add(new Emitter<{ connectionId: string; data: string }>());
		override readonly onDidRequestKeyboardInteractive = this.requests.event;
		override readonly onDidCancelKeyboardInteractive = Event.None;
		override readonly onDidRequestEndpointSelection = Event.None;
		override readonly onDidCancelEndpointSelection = Event.None;
		override readonly onDidRequestHostKeyVerification = Event.None;
		override readonly onDidCancelHostKeyVerification = Event.None;
		override readonly onDidRelayMessage = this.messages.event;
		readonly pending = new DeferredPromise<ISSHConnectResult>();
		readonly replies: string[] = [];
		readonly released: string[] = [];
		observedToken: CancellationToken | undefined;
		override connect(_config: object, _expected?: string, token?: CancellationToken) { this.observedToken = token; return this.pending.p; }
		override async respondKeyboardInteractive(id: string) { this.replies.push(id); }
		override async releaseRelay(id: string) { this.released.push(id); }
	}

	test('request cancellation reaches the pending service operation', async () => {
		const service = new SSHBoundary();
		const source = disposables.add(new CancellationTokenSource());
		const channel = createSSHRemoteAgentHostChannel(service, disposables.add(new DisposableStore()), authority());
		const connecting = channel.call('a', 'connect', [config], source.token);
		source.cancel();
		await service.pending.complete(result);
		await assert.rejects(connecting);
		assert.deepStrictEqual({ canceled: service.observedToken?.isCancellationRequested, released: service.released }, { canceled: true, released: ['lease'] });
	});

	test('prompt ownership is established by the pending connect before subscribers can reply', async () => {
		const service = new SSHBoundary();
		const channel = createSSHRemoteAgentHostChannel(service, disposables.add(new DisposableStore()), authority());
		const seen: string[] = [];
		disposables.add(channel.listen<{ requestId: string }>('b', 'onDidRequestKeyboardInteractive')(e => seen.push(`b:${e.requestId}`)));
		disposables.add(channel.listen<{ requestId: string }>('a', 'onDidRequestKeyboardInteractive')(e => seen.push(`a:${e.requestId}`)));
		const connecting = channel.call('a', 'connect', [config]);
		service.requests.fire({ requestId: 'prompt', connectionKey: 'ssh:alias', displayHost: 'Host', username: 'user', name: '', instructions: '', prompts: [] });
		await assert.rejects(async () => channel.call('b', 'respondKeyboardInteractive', ['prompt', ['secret']]));
		await channel.call('a', 'respondKeyboardInteractive', ['prompt', ['secret']]);
		await assert.rejects(async () => channel.call('a', 'respondKeyboardInteractive', ['prompt', ['secret']]));
		await service.pending.complete(result);
		await connecting;
		assert.deepStrictEqual({ seen, replies: service.replies }, { seen: ['a:prompt'], replies: ['prompt'] });
	});

	test('revocation suppresses events and closes a late relay allocation', async () => {
		const service = new SSHBoundary();
		const scope = authority();
		const channel = createSSHRemoteAgentHostChannel(service, disposables.add(new DisposableStore()), scope);
		const seen: string[] = [];
		disposables.add(channel.listen<{ data: string }>('a', 'onDidRelayMessage')(e => seen.push(e.data)));
		const connecting = channel.call('a', 'connect', [config]);
		scope.revoke('a');
		await service.pending.complete(result);
		await assert.rejects(connecting);
		service.messages.fire({ connectionId: 'lease', data: 'private' });
		assert.deepStrictEqual({ canceled: service.observedToken?.isCancellationRequested, released: service.released, seen }, { canceled: true, released: ['lease'], seen: [] });
	});

	test('only the connecting authority can use or renew its relay lease', async () => {
		const effects: string[] = [];
		const service = new class extends mock<ISSHRemoteAgentHostMainService>() {
			override readonly onDidRequestKeyboardInteractive = Event.None;
			override readonly onDidCancelKeyboardInteractive = Event.None;
			override readonly onDidRequestEndpointSelection = Event.None;
			override readonly onDidCancelEndpointSelection = Event.None;
			override readonly onDidRequestHostKeyVerification = Event.None;
			override readonly onDidCancelHostKeyVerification = Event.None;
			override async connect() { effects.push('connect'); return result; }
			override async relaySend(id: string) { effects.push(`send:${id}`); }
			override async releaseRelay(id: string) { effects.push(`release:${id}`); }
		}();
		const channel = createSSHRemoteAgentHostChannel(service, disposables.add(new DisposableStore()), authority());
		await assert.rejects(async () => channel.call('project', 'connect', [config]));
		await assert.rejects(async () => channel.call('unknown', 'connect', [config]));
		await channel.call('a', 'connect', [config]);
		await assert.rejects(async () => channel.call('b', 'relaySend', ['lease', 'data']));
		await assert.rejects(async () => channel.call('b', 'connect', [config, 'lease']));
		await assert.rejects(async () => channel.call('a', 'dispose', []));
		await channel.call('a', 'relaySend', ['lease', 'data']);
		await channel.call('a', 'releaseRelay', ['lease']);
		await assert.rejects(async () => channel.call('a', 'relaySend', ['lease', 'data']));
		assert.deepStrictEqual(effects, ['connect', 'send:lease', 'release:lease']);
	});
	test('a closed relay delivers its close only to the owner and rejects later use', async () => {
		const service = new SSHBoundary();
		const channel = createSSHRemoteAgentHostChannel(service, disposables.add(new DisposableStore()), authority());
		const closed: string[] = [];
		disposables.add(channel.listen<string>('b', 'onDidCloseConnection')(id => closed.push(`b:${id}`)));
		disposables.add(channel.listen<string>('a', 'onDidCloseConnection')(id => closed.push(`a:${id}`)));
		const connecting = channel.call('a', 'connect', [config]);
		await service.pending.complete(result);
		await connecting;
		service.closed.fire('lease');
		await assert.rejects(async () => channel.call('a', 'relaySend', ['lease', 'data']));
		await assert.rejects(async () => channel.call('a', 'connect', [config, 'lease']));
		assert.deepStrictEqual(closed, ['a:lease']);
	});

	test('WSL disconnect releases its own distro lease and keeps foreign leases usable', async () => {
		const released: string[] = [];
		const sent: string[] = [];
		let next = 0;
		const service = new class extends mock<IWSLRemoteAgentHostMainService>() {
			override async connect() { return { connectionId: `wsl-${++next}`, distro: 'Ubuntu', address: 'wsl:Ubuntu', name: 'Ubuntu', connectionToken: undefined }; }
			override async releaseRelay(id: string) { released.push(id); }
			override async disconnect() { throw new Error('Must not globally disconnect a shared distro'); }
			override async relaySend(id: string) { sent.push(id); }
		}();
		const scope = authority();
		const channel = createWSLRemoteAgentHostChannel(service, disposables.add(new DisposableStore()), scope);
		await channel.call('a', 'connect', [{ distro: 'Ubuntu', name: 'Ubuntu' }]);
		await channel.call('b', 'connect', [{ distro: 'Ubuntu', name: 'Ubuntu' }]);
		await assert.rejects(async () => channel.call('b', 'reconnect', ['Ubuntu', 'Ubuntu', undefined, false, 'wsl-1']));
		await channel.call('a', 'disconnect', ['Ubuntu']);
		await channel.call('b', 'relaySend', ['wsl-2', 'data']);
		scope.revoke('b');
		assert.deepStrictEqual({ released, sent }, { released: ['wsl-1', 'wsl-2'], sent: ['wsl-2'] });
	});

	test('tunnel selections are consumed only by their owner and late selections are cancelled', async () => {
		const selection = new DeferredPromise<{ selectionId: string; inventory: { userDataPath: string; endpoints: [] } }>();
		const effects: string[] = [];
		const service = new class extends mock<ITunnelAgentHostMainService>() {
			override prepareSelection() { return selection.p; }
			override async completeSelection(id: string) { effects.push(`complete:${id}`); return { ...result }; }
			override async cancelSelection(id: string) { effects.push(`cancel:${id}`); }
			override async disconnect(id: string) { effects.push(`disconnect:${id}`); }
		}();
		const scope = authority();
		const channel = createTunnelAgentHostChannel(service, disposables.add(new DisposableStore()), scope);
		const pending = channel.call('a', 'prepareSelection', ['token', 'github', 'tunnel', 'cluster']);
		await selection.complete({ selectionId: 'selection', inventory: { userDataPath: '/home', endpoints: [] } });
		await pending;
		await assert.rejects(async () => channel.call('b', 'completeSelection', ['selection', { newDedicated: true }]));
		await channel.call('a', 'completeSelection', ['selection', { newDedicated: true }]);
		await assert.rejects(async () => channel.call('a', 'completeSelection', ['selection', { newDedicated: true }]));
		const late = channel.call('b', 'prepareSelection', ['token', 'github', 'other', 'cluster']);
		scope.revoke('b');
		await assert.rejects(late);
		scope.revoke('a');
		assert.deepStrictEqual(effects, ['complete:selection', 'cancel:selection', 'disconnect:lease']);
	});

	test('tunnel deletion cannot race a foreign connection into its global cleanup', async () => {
		const deleting = new DeferredPromise<void>();
		const service = new class extends mock<ITunnelAgentHostMainService>() {
			override deleteTunnel() { return deleting.p; }
			override async connect() { return result; }
		}();
		const channel = createTunnelAgentHostChannel(service, disposables.add(new DisposableStore()), authority());
		const removed = channel.call('a', 'deleteTunnel', ['token', 'github', 'tunnel', 'cluster']);
		await assert.rejects(async () => channel.call('b', 'connect', ['token', 'github', 'tunnel', 'cluster']));
		await deleting.complete();
		await removed;
	});

	test('Dev Container preclaims protect progress, relay IDs and source operations', async () => {
		const pending = new DeferredPromise<{ connectionId: string; address: string; name: string; remoteWorkspaceFolder: string }>();
		const output = disposables.add(new Emitter<{ connectionId: string; data: string }>());
		const effects: string[] = [];
		const service = new class extends mock<IDevContainerAgentHostMainService>() {
			override readonly onDidOutput = output.event;
			override connect() { effects.push('connect'); return pending.p; }
			override async disconnect(id: string) { effects.push(`disconnect:${id}`); }
			override async stopContainer() { effects.push('stop'); return true; }
		}();
		const scope = authority();
		const channel = createOwnedDevContainerAgentHostChannel(service, disposables.add(new DisposableStore()), scope);
		const seen: string[] = [];
		disposables.add(channel.listen<{ data: string }>('a', 'onDidOutput')(e => seen.push(`a:${e.data}`)));
		disposables.add(channel.listen<{ data: string }>('b', 'onDidOutput')(e => seen.push(`b:${e.data}`)));
		const configuration = { connectionId: 'dev', workspaceFolder: '/project', name: 'Project' };
		const connecting = channel.call('a', 'connect', [configuration]);
		await assert.rejects(async () => channel.call('b', 'connect', [configuration]));
		await assert.rejects(async () => channel.call('b', 'connect', [{ ...configuration, connectionId: 'foreign' }]));
		await assert.rejects(async () => channel.call('b', 'stopContainer', ['/project']));
		output.fire({ connectionId: 'dev', data: 'progress' });
		await pending.complete({ connectionId: 'dev', address: 'devcontainer:container', name: 'Project', remoteWorkspaceFolder: '/workspace' });
		await connecting;
		await assert.rejects(async () => channel.call('b', 'relaySend', ['dev', 'data']));
		scope.revoke('a');
		output.fire({ connectionId: 'dev', data: 'expired' });
		assert.deepStrictEqual({ effects, seen }, { effects: ['connect', 'disconnect:dev'], seen: ['a:progress'] });
	});

});
