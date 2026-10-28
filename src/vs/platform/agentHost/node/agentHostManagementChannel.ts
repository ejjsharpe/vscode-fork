/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { CancellationToken } from '../../../base/common/cancellation.js';
import { Event } from '../../../base/common/event.js';
import { DisposableStore, toDisposable } from '../../../base/common/lifecycle.js';
import { IServerChannel } from '../../../base/parts/ipc/common/ipc.js';
import { IMessagePortConnectionScope } from '../../../base/parts/ipc/common/ipc.mp.js';
import { SelfProfilingService } from '../../profiling/node/selfProfilingService.js';

/** Keeps provider management and process-only diagnostics on separately scoped connections. */
export function createAgentHostManagementChannel(channel: IServerChannel<string>, getScope: (context: string) => IMessagePortConnectionScope | undefined, onDisconnect: Event<string>, disposables: DisposableStore, createProfiler: () => SelfProfilingService = () => new SelfProfilingService()): IServerChannel<string> {
	let profiler = createProfiler();
	let profileOwner: string | undefined;
	let profileHandle: string | undefined;
	function release(): void {
		profiler.dispose();
		profiler = createProfiler();
		profileOwner = undefined;
		profileHandle = undefined;
	}
	disposables.add(onDisconnect(context => { if (profileOwner === context) { release(); } }));
	disposables.add(toDisposable(() => profiler.dispose()));
	return {
		async call<T>(context: string, command: string, args: unknown[] = [], token?: CancellationToken) {
			const scope = getScope(context);
			if (scope?.role === 'auxiliary') { throw new Error('Rejected auxiliary Agent Host management'); }
			if (command === 'startCpuProfile') {
				if (profileOwner !== undefined) { throw new Error('A profile is already running'); }
				profileOwner = context;
				const attempt = profiler;
				try {
					const handle = await attempt.startProfiling();
					getScope(context);
					if (attempt !== profiler) { throw new Error('Profiling owner expired'); }
					profileHandle = handle;
					return handle as T;
				} catch (error) { if (attempt === profiler) { release(); } throw error; }
			}
			if (command === 'stopCpuProfile') {
				if (profileOwner !== context || profileHandle === undefined || args[0] !== profileHandle) { throw new Error('Rejected foreign or unknown CPU profile owner'); }
				const attempt = profiler;
				try {
					const result = await attempt.stopProfiling(profileHandle);
					getScope(context);
					if (attempt !== profiler) { throw new Error('Profiling owner expired'); }
					return result as T;
				} finally { if (attempt === profiler) { release(); } }
			}
			if (scope && (!scope.clientId || scope.role !== 'agents' || ['shutdown', 'setSystemFullyAwake', 'setSystemNetworkOnline', 'reportMacAccessibilityTrustChange'].includes(command))) { throw new Error('Rejected non-owner Agent Host management operation'); }
			const result = await channel.call<T>(context, command, args, token);
			getScope(context);
			return result;
		},
		listen() { throw new Error('Agent Host management has no renderer events'); }
	};
}
