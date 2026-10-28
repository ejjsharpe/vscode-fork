/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { combinedDisposable, DisposableStore, toDisposable } from '../../../base/common/lifecycle.js';
import { IServerChannel, ProxyChannel } from '../../../base/parts/ipc/common/ipc.js';
import { IMessagePortConnectionScope } from '../../../base/parts/ipc/common/ipc.mp.js';
import { Event } from '../../../base/common/event.js';
import { ILocalPtyService, IPtyProcessOwner, IPtyService, ISerializedTerminalState } from './terminal.js';
import { IProcessDetails, ISetTerminalLayoutInfoArgs } from './terminalProcess.js';
import { VSBuffer } from '../../../base/common/buffer.js';

export const ptyNativeParentChannelName = 'ptyNativeParent';

export function createLocalPtyChannel(service: IPtyService | ILocalPtyService, disposables: DisposableStore, getScope?: (context: string) => IMessagePortConnectionScope | undefined, onRevoked: Event<string> = Event.None, nativeService = false, resolveNativeParent?: (context: string, handle: VSBuffer, targetWindowId: number) => Promise<VSBuffer>): IServerChannel {
	const channel = ProxyChannel.fromService(service, disposables, {
		// Process events use the direct pty host connection; keep management-event buffering unchanged on this channel.
		unbufferedEvents: [
			'onProcessData',
			'onProcessReady',
			'onProcessExit',
			'onProcessReplay',
			'onDidChangeProperty',
			'onProcessOrphanQuestion',
			'onDidRequestDetach',
		] satisfies (keyof ILocalPtyService)[]
	});
	if (!getScope) { return channel; }
	const processMethods = new Set('attachToProcess detachFromProcess start shutdown input sendSignal resize clearBuffer setParentWindow getInitialCwd getCwd acknowledgeDataEvent setNextCommandId setUnicodeVersion processBinary orphanQuestionReply updateTitle updateIcon refreshProperty updateProperty getProcessOwner'.split(' '));
	const environmentMethods = new Set('getEnvironment getDefaultSystemShell getWslPath getPerformanceMarks getLatency'.split(' '));
	const variableRequests = new Map<number, string>();
	const detachRequests = new Map<number, string>();
	const scopedReplies = new Map<string, number>();
	disposables.add(onRevoked(context => {
		for (const [id, owner] of variableRequests) { if (owner === context) { variableRequests.delete(id); } }
		for (const [id, owner] of detachRequests) { if (owner === context) { detachRequests.delete(id); } }
		const workbench = scopedReplies.get(context);
		scopedReplies.delete(context);
		if (workbench !== undefined) { void service.uninstallAllAutoReplies(workbench).catch(error => console.error(error)); }
	}));
	async function ownProcess(context: string, id: number): Promise<void> {
		const scope = getScope!(context);
		if (!scope) { return; }
		const owner = await service.getProcessOwner(id);
		getScope!(context);
		if (!owner || owner.workbench !== scope.workbench || owner.workspaceId !== scope.workspaceId) { throw new Error('Rejected foreign or unknown PTY owner'); }
	}
	function ownWorkspace(scope: IMessagePortConnectionScope, workspaceId: unknown): void {
		if (typeof scope.workspaceId !== 'string' || scope.workspaceId !== workspaceId) { throw new Error('Rejected foreign PTY workspace'); }
	}
	return {
		async call<T>(context: string, command: string, args: unknown[]) {
			const scope = getScope(context);
			if (!scope) { return channel.call<T>(context, command, args); }
			if (scope.role === 'auxiliary' || !Array.isArray(args)) { throw new Error('Rejected PTY caller or arguments'); }
			if (processMethods.has(command)) {
				if (typeof args[0] !== 'number') { throw new Error('Rejected PTY process handle'); }
				await ownProcess(context, args[0]);
				if (command === 'setParentWindow') {
					if (!nativeService || !resolveNativeParent || !(args[1] instanceof VSBuffer) || typeof args[2] !== 'number') { throw new Error('PTY native parent requires a direct authenticated target'); }
					const requestedHandle = args[1];
					const targetWindowId = args[2];
					await service.setParentWindow(args[0], requestedHandle, targetWindowId, async () => {
						const handle = await resolveNativeParent(context, requestedHandle, targetWindowId);
						getScope(context);
						return handle;
					});
					getScope(context);
					return undefined as T;
				}
			} else if (command === 'reduceConnectionGraceTime') {
				args = [scope.workbench];
			} else if (command === 'requestDetachInstance') {
				ownWorkspace(scope, args[0]);
			} else if (command === 'acceptDetachInstanceReply') {
				if (typeof args[0] !== 'number' || detachRequests.get(args[0]) !== context) { throw new Error('Rejected PTY detach reply owner'); }
				if (args[1] !== undefined) { await ownProcess(context, args[1] as number); }
				detachRequests.delete(args[0]);
			} else if (command === 'freePortKillProcess') {
				if (!nativeService) { throw new Error('Port cleanup requires a direct PTY connection'); }
				if (typeof args[0] !== 'string' || typeof args[1] !== 'number') { throw new Error('Rejected PTY port cleanup arguments'); }
				await ownProcess(context, args[1]);
				getScope(context);
				const result = await service.freePortKillProcess(args[0], args[1], () => { getScope(context); });
				getScope(context);
				return result as T;
			} else if (command === 'acceptPtyHostResolvedVariables') {
				if (typeof args[0] !== 'number' || variableRequests.get(args[0]) !== context) { throw new Error('Rejected PTY variables reply owner'); }
				variableRequests.delete(args[0]);
			} else if (command === 'installAutoReply' || command === 'uninstallAllAutoReplies') {
				args = command === 'installAutoReply' ? [args[0], args[1], scope.workbench] : [scope.workbench];
				if (command === 'installAutoReply') { scopedReplies.set(context, scope.workbench); } else { scopedReplies.delete(context); }
			} else if (command === 'createProcess') {
				ownWorkspace(scope, args[9]);
			} else if (['getRevivedPtyNewId', 'reviveTerminalProcesses', 'getProfiles'].includes(command)) {
				ownWorkspace(scope, args[0]);
				if (command === 'reviveTerminalProcesses') {
					if (!nativeService || !Array.isArray(args[1])) { throw new Error('Terminal restore requires a direct PTY connection'); }
					for (const terminal of args[1] as ISerializedTerminalState[]) { ownWorkspace(scope, terminal.processDetails.workspaceId); }
					await service.reviveTerminalProcesses(scope.workspaceId!, args[1] as ISerializedTerminalState[], args[2] as string, { workbench: scope.workbench, workspaceId: scope.workspaceId! }, () => { getScope(context); });
					getScope(context);
					return undefined as T;
				}
			} else if (command === 'setTerminalLayoutInfo' || command === 'getTerminalLayoutInfo') {
				const layout = args[0] as ISetTerminalLayoutInfoArgs;
				ownWorkspace(scope, layout?.workspaceId);
				if (command === 'setTerminalLayoutInfo') {
					const ids = [...(layout.tabs ?? []).flatMap(tab => tab.terminals.map(terminal => terminal.terminal)), ...(layout.background ?? [])];
					for (const id of ids) {
						if (typeof id !== 'number') { throw new Error('Rejected PTY layout process handle'); }
						await ownProcess(context, id);
					}
				}
			} else if (command === 'serializeTerminalState') {
				if (!Array.isArray(args[0])) { throw new Error('Rejected PTY serialization handles'); }
				for (const id of args[0]) { await ownProcess(context, id); }
			} else if (!environmentMethods.has(command) && command !== 'listProcesses') {
				throw new Error(`Rejected coordinator-only PTY operation: ${command}`);
			}
			getScope(context);
			const result = await channel.call<T>(context, command, args);
			try { getScope(context); } catch (error) {
				if (command === 'createProcess' && typeof result === 'number') { await service.shutdown(result, true); }
				throw error;
			}
			if (command === 'createProcess') { await service.setProcessOwner(result as number, { workbench: scope.workbench, workspaceId: scope.workspaceId! }); }
			if (command === 'listProcesses') {
				const processes = await Promise.all((result as IProcessDetails[]).map(async process => {
					try { await ownProcess(context, process.id); return process; } catch { return undefined; }
				}));
				getScope(context);
				return processes.filter(process => process !== undefined) as T;
			}
			try { getScope(context); } catch (error) {
				if (command === 'createProcess' && typeof result === 'number') { await service.shutdown(result, true); }
				throw error;
			}
			return result;
		},
		listen<T>(context: string, event: string, arg?: unknown): Event<T> {
			const scope = getScope(context);
			if (!scope) { return channel.listen(context, event, arg); }
			if (scope.role === 'auxiliary') { throw new Error('Rejected auxiliary PTY event'); }
			return (listener, thisArgs, eventDisposables) => {
				let active = true;
				const source = channel.listen<T>(context, event, arg)(value => {
				const process = value as { id?: number; workspaceId?: string; requestId?: number; owner?: IPtyProcessOwner };
				// The trusted source snapshots exit ownership before deleting its registry entry.
				const authorized = event === 'onProcessExit' && process?.owner ? Promise.resolve().then(() => {
					getScope(context);
					if (process.owner!.workbench !== scope.workbench || process.owner!.workspaceId !== scope.workspaceId) { throw new Error('Rejected foreign PTY exit'); }
				}) : typeof process?.id === 'number' ? ownProcess(context, process.id) : Promise.resolve().then(() => {
					getScope(context);
					if (process?.workspaceId !== undefined) { ownWorkspace(scope, process.workspaceId); }
				});
				void authorized.then(() => {
					getScope(context);
					if (!active) { return; }
					if (event === 'onPtyHostRequestResolveVariables' && typeof process.requestId === 'number') { variableRequests.set(process.requestId, context); }
					if (event === 'onDidRequestDetach' && typeof process.requestId === 'number') { detachRequests.set(process.requestId, context); }
					listener.call(thisArgs, value);
				}).catch(() => { });
				});
				const subscription = combinedDisposable(source, toDisposable(() => {
					active = false;
					if (event === 'onPtyHostRequestResolveVariables') { for (const [id, owner] of variableRequests) { if (owner === context) { variableRequests.delete(id); } } }
					if (event === 'onDidRequestDetach') { for (const [id, owner] of detachRequests) { if (owner === context) { detachRequests.delete(id); } } }
				}));
				if (eventDisposables instanceof DisposableStore) { eventDisposables.add(subscription); } else { eventDisposables?.push(subscription); }
				return subscription;
			};
		}
	};
}
