/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import assert from 'assert';
import { Emitter, Event } from '../../../../base/common/event.js';
import { ClientConnectionEvent, IPCServer } from '../../../../base/parts/ipc/common/ipc.js';
import { IMessagePortConnectionScope } from '../../../../base/parts/ipc/common/ipc.mp.js';
import { upcastPartial } from '../../../../base/test/common/mock.js';
import { ensureNoDisposablesAreLeakedInTestSuite } from '../../../../base/test/common/utils.js';
import { IMainProcessService } from '../../../ipc/common/mainProcessService.js';
import { NullLogService } from '../../../log/common/log.js';
import { IAgentNetworkFilterService } from '../../../networkFilter/common/networkFilterService.js';
import { NullTelemetryService } from '../../../telemetry/common/telemetryUtils.js';
import { PlaywrightChannel } from '../../node/playwrightChannel.js';

suite('PlaywrightChannel native ownership', () => {
	const store = ensureNoDisposablesAreLeakedInTestSuite();

	function fixture() {
		const connections = store.add(new Emitter<ClientConnectionEvent>());
		const server = store.add(new IPCServer<string>(connections.event));
		const scopes = new Map<string, IMessagePortConnectionScope>([['owner', { role: 'project', workbench: 10, generation: 1 }]]);
		const getScope = (context: string) => {
			const scope = scopes.get(context);
			if (!scope) { throw new Error('Expired connection'); }
			return scope;
		};
		const main = upcastPartial<IMainProcessService>({ getChannel: () => ({ call: async () => undefined as never, listen: () => Event.None }) });
		const channel = store.add(new PlaywrightChannel(server, main, new NullLogService(), upcastPartial<IAgentNetworkFilterService>({}), NullTelemetryService, getScope));
		return { channel, scopes };
	}

	test('rejects another workbench at initialization', async () => {
		const { channel } = fixture();
		await assert.rejects(async () => channel.call('owner', '__initialize', { windowId: 20, useSessionStorageAffinity: true }), /workbench/);
	});

	test('current owners work while revoked owners and lifecycle methods reject', async () => {
		const { channel, scopes } = fixture();
		await channel.call('owner', '__initialize', { windowId: 10, useSessionStorageAffinity: true });
		await channel.call('owner', 'setSessionNetwork', ['session', undefined]);
		await assert.rejects(async () => channel.call('owner', 'dispose', []), /Method not found/);
		scopes.delete('owner');
		await assert.rejects(async () => channel.call('owner', 'setSessionNetwork', ['session', undefined]), /Expired connection/);
	});
});
