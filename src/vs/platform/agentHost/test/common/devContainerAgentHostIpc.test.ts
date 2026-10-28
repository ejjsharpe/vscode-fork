/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import assert from 'assert';
import { CancellationToken, CancellationTokenSource } from '../../../../base/common/cancellation.js';
import { Emitter, Event } from '../../../../base/common/event.js';
import { DisposableStore } from '../../../../base/common/lifecycle.js';
import { mock } from '../../../../base/test/common/mock.js';
import { ensureNoDisposablesAreLeakedInTestSuite } from '../../../../base/test/common/utils.js';
import { IDevContainerAgentHostMainService, IDevContainerAgentHostSandboxSupport, IDiscoveredDevContainer } from '../../common/devContainerAgentHost.js';
import { createDevContainerAgentHostChannel } from '../../common/devContainerAgentHostIpc.js';

suite('Dev Container Agent Host IPC', () => {
	const store = ensureNoDisposablesAreLeakedInTestSuite();

	test('forwards discovery cancellation through the channel instead of serialized arguments', async () => {
		const source = store.add(new CancellationTokenSource());
		let observedToken: CancellationToken | undefined;
		let finish: (() => void) | undefined;
		const service = new class extends mock<IDevContainerAgentHostMainService>() {
			override readonly onDidCloseConnection = Event.None;
			override readonly onDidOutput = Event.None;
			override async listDevContainers(token: CancellationToken): Promise<readonly IDiscoveredDevContainer[]> {
				observedToken = token;
				await new Promise<void>(resolve => { finish = resolve; });
				return [{ id: 'test', name: 'Project', workspaceFolder: '/project' }];
			}
			override async isDockerAvailable() { return true; }
		}();
		const channel = createDevContainerAgentHostChannel(service, store.add(new DisposableStore()), { getScope: () => undefined, onDidRemoveConnection: Event.None });
		const discovering = channel.call('', 'listDevContainers', undefined, source.token);
		source.cancel();
		finish?.();
		await assert.rejects(discovering);
		assert.deepStrictEqual({
			canceled: observedToken?.isCancellationRequested,
			sameToken: observedToken === source.token, available: await channel.call('', 'isDockerAvailable', []),
		}, {
			canceled: true, sameToken: false, available: true,
		});
	});

	test('preserves unbuffered sandbox support facts before a connect rejection', async () => {
		const events = store.add(new Emitter<{ connectionId: string; supported: boolean }>());
		const service = new class extends mock<IDevContainerAgentHostMainService>() {
			override readonly onDidChangeSandboxSupport = events.event;
			override async connect(): Promise<never> {
				events.fire({ connectionId: 'after', supported: true });
				throw new Error('Connect refused');
			}
		}();
		const channel = createDevContainerAgentHostChannel(service, store.add(new DisposableStore()), { getScope: () => undefined, onDidRemoveConnection: Event.None });
		events.fire({ connectionId: 'before', supported: false });
		const seen: IDevContainerAgentHostSandboxSupport[] = [];
		store.add(channel.listen<IDevContainerAgentHostSandboxSupport>('', 'onDidChangeSandboxSupport')(event => seen.push(event)));
		await assert.rejects(async () => channel.call('', 'connect', [{ connectionId: 'after', workspaceFolder: '/project', name: 'Project' }]), /Connect refused/);
		assert.deepStrictEqual(seen, [{ connectionId: 'after', supported: true }]);
	});
});
