/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { CancellationToken, CancellationTokenSource } from '../../../base/common/cancellation.js';
import { CancellationError } from '../../../base/common/errors.js';
import { Emitter, Event } from '../../../base/common/event.js';
import { hasKey } from '../../../base/common/types.js';
import { DisposableStore } from '../../../base/common/lifecycle.js';
import { IServerChannel, ProxyChannel } from '../../../base/parts/ipc/common/ipc.js';
import { IMessagePortConnectionScope } from '../../../base/parts/ipc/common/ipc.mp.js';
import { computeSSHConnectionKey, ISSHAgentHostConfig, ISSHRemoteAgentHostMainService } from './sshRemoteAgentHost.js';
import { IWSLAgentHostConfig, IWSLRemoteAgentHostMainService } from './wslRemoteAgentHost.js';
import { ITunnelAgentHostMainService } from './tunnelAgentHost.js';
import { getDevContainerAgentHostSourceKey, IDevContainerAgentHostConfig, IDevContainerAgentHostMainService } from './devContainerAgentHost.js';

/** Main-attested lifetime of the Utility connection, never a renderer handshake. */
export interface IRemoteAgentHostChannelAuthority {
	getScope(context: string): IMessagePortConnectionScope | undefined;
	readonly onDidRemoveConnection: Event<{ ctx: string }>;
}

class RemoteAgentHostChannelOwners {
	readonly resources = new Map<string, { context: string; key: string; token: CancellationToken; closed?: boolean; replacement?: string }>();
	readonly pending = new Map<string, { context: string; token: CancellationToken }[]>();
	private readonly lifetimes = new Map<string, CancellationTokenSource>();

	constructor(private readonly authority: IRemoteAgentHostChannelAuthority, store: DisposableStore, private readonly release: (id: string) => Promise<void>) {
		store.add(authority.onDidRemoveConnection(({ ctx }) => {
			this.lifetimes.get(ctx)?.cancel();
			this.lifetimes.get(ctx)?.dispose();
			this.lifetimes.delete(ctx);
			for (const [id, owner] of this.resources) {
				if (owner.context === ctx) {
					this.resources.delete(id);
					void this.release(id).catch(() => { /* Transport teardown cannot report to the departed caller. */ });
				}
			}
		}));
	}

	check(context: string): void {
		const scope = this.authority.getScope(context);
		// shortcut: project provider access waits for the persistent Agents broker in #52.
		if (scope && scope.role !== 'agents') {
			throw new Error('Remote Agent Host operations require the Agents coordinator');
		}
	}

	live(context: string): boolean {
		try { this.check(context); return true; } catch { return false; }
	}

	token(context: string, store: DisposableStore): CancellationToken {
		this.check(context);
		let lifetime = this.lifetimes.get(context);
		if (!lifetime) {
			lifetime = store.add(new CancellationTokenSource());
			this.lifetimes.set(context, lifetime);
		}
		return lifetime.token;
	}

	async call<T>(context: string, token: CancellationToken | undefined, store: DisposableStore, invoke: (token: CancellationToken) => Promise<T>): Promise<T> {
		const source = new CancellationTokenSource(this.token(context, store));
		const requested = token?.onCancellationRequested(() => source.cancel());
		try {
			if (token?.isCancellationRequested) { source.cancel(); }
			if (source.token.isCancellationRequested) { throw new CancellationError(); }
			const result = await invoke(source.token);
			if (source.token.isCancellationRequested) { throw new CancellationError(); }
			this.check(context);
			return result;
		} finally {
			requested?.dispose();
			if (source.token.isCancellationRequested) {
				for (const [id, owner] of this.resources) {
					if (owner.token === source.token) { this.resources.delete(id); await this.release(id); }
				}
			}
			source.dispose();
		}
	}

	bind(context: string, id: string, key: string, token: CancellationToken): void {
		if (typeof id !== 'string' || !id || (this.resources.has(id) && this.resources.get(id)!.context !== context)) {
			throw new Error('Unknown or foreign remote Agent Host resource');
		}
		this.resources.set(id, { context, key, token });
	}

	owns(context: string, id: string): boolean {
		const owner = this.resources.get(id);
		return this.live(context) && owner?.context === context && !owner.token.isCancellationRequested && !owner.closed && !owner.replacement;
	}

	require(context: string, id: string, allowClosed = false): void {
		this.check(context);
		const owner = this.resources.get(id);
		if (typeof id !== 'string' || owner?.context !== context || owner.token.isCancellationRequested || owner.replacement || (!allowClosed && owner.closed)) {
			throw new Error('Unknown, stale or foreign remote Agent Host resource');
		}
	}

	requireExpected(context: string, id: string): void {
		const visited = new Set<string>();
		while (!visited.has(id)) {
			visited.add(id);
			const owner = this.resources.get(id);
			if (!owner || owner.context !== context) { break; }
			if (!owner.replacement) { this.require(context, id, true); return; }
			id = owner.replacement;
		}
		throw new Error('Unknown, stale or foreign remote Agent Host renewal');
	}

	closeEvent(event: Event<string> | undefined, store: DisposableStore, terminal: boolean): Event<{ context: string; id: string }> {
		const emitter = store.add(new Emitter<{ context: string; id: string }>());
		if (event) {
			store.add(event(id => {
				const owner = this.resources.get(id);
				if (owner) {
					if (terminal) { this.resources.delete(id); } else { owner.closed = true; }
					emitter.fire({ context: owner.context, id });
				}
			}));
		}
		return emitter.event;
	}

	progress(context: string, key: string): boolean {
		return this.live(context) && (this.pending.get(key)?.some(owner => owner.context === context && !owner.token.isCancellationRequested) === true || [...this.resources.values()].some(owner => owner.context === context && owner.key === key));
	}

	async connect<T extends { connectionId: string }>(context: string, key: string, create: () => Promise<T>, release: (id: string) => Promise<void>, token: CancellationToken): Promise<T> {
		this.check(context);
		const pending = this.pending.get(key) ?? [];
		const operation = { context, token };
		pending.push(operation);
		this.pending.set(key, pending);
		try {
			const result = await create();
			if (!this.live(context) || token.isCancellationRequested) {
				const owner = this.resources.get(result.connectionId);
				if (!owner || (owner.context === context && owner.token === token)) { await release(result.connectionId); }
				throw new CancellationError();
			}
			this.bind(context, result.connectionId, key, token);
			return result;
		} finally {
			pending.splice(pending.indexOf(operation), 1);
			if (pending.length === 0) { this.pending.delete(key); }
		}
	}
}

/** SSH relay leases and interactive replies belong to their originating Utility connection. */
export function createSSHRemoteAgentHostChannel(service: ISSHRemoteAgentHostMainService, store: DisposableStore, authority: IRemoteAgentHostChannelAuthority): IServerChannel<string> {
	const owners = new RemoteAgentHostChannelOwners(authority, store, id => service.releaseRelay(id));
	const relayClosed = owners.closeEvent(service.onDidRelayClose, store, false);
	const closed = owners.closeEvent(service.onDidCloseConnection, store, true);
	const proxy = ProxyChannel.fromService(service, store, { unbufferedEvents: ['onDidRequestKeyboardInteractive', 'onDidCancelKeyboardInteractive', 'onDidRequestEndpointSelection', 'onDidCancelEndpointSelection', 'onDidRequestHostKeyVerification', 'onDidCancelHostKeyVerification'] });
	const prompts = new Map<string, { context: string; reply: string; token: CancellationToken }>();
	const promptEvents = new Map<string, Emitter<{ context: string; value: object | string }>>();
	for (const [request, cancel, reply] of [
		['onDidRequestKeyboardInteractive', 'onDidCancelKeyboardInteractive', 'respondKeyboardInteractive'],
		['onDidRequestEndpointSelection', 'onDidCancelEndpointSelection', 'respondEndpointSelection'],
		['onDidRequestHostKeyVerification', 'onDidCancelHostKeyVerification', 'respondHostKeyVerification'],
	]) {
		const requests = store.add(new Emitter<{ context: string; value: object | string }>());
		const cancellations = store.add(new Emitter<{ context: string; value: object | string }>());
		promptEvents.set(request, requests);
		promptEvents.set(cancel, cancellations);
		store.add(proxy.listen<{ requestId: string; connectionKey: string }>('', request)(value => {
			const operation = owners.pending.get(value.connectionKey)?.find(owner => !owner.token.isCancellationRequested && owners.live(owner.context));
			const context = operation?.context;
			if (context !== undefined && !prompts.has(value.requestId)) {
				prompts.set(value.requestId, { context, reply, token: operation!.token });
				requests.fire({ context, value });
			}
		}));
		store.add(proxy.listen<string>('', cancel)(value => {
			const owner = prompts.get(value);
			if (owner?.reply === reply) {
				prompts.delete(value);
				cancellations.fire({ context: owner.context, value });
			}
		}));
	}
	store.add(authority.onDidRemoveConnection(({ ctx }) => {
		for (const [id, prompt] of prompts) {
			if (prompt.context === ctx) {
				prompts.delete(id);
				void proxy.call('', prompt.reply, [id, prompt.reply === 'respondHostKeyVerification' ? false : undefined]).catch(() => { /* Caller departed. */ });
			}
		}
	}));
	return {
		listen: <T>(context: string, event: string) => {
			owners.check(context);
			const prompts = promptEvents.get(event);
			if (prompts) { return Event.map(Event.filter(prompts.event, e => e.context === context && owners.live(context)), e => e.value as T); }
			switch (event) {
				case 'onDidRelayMessage': return Event.filter(proxy.listen<T & { connectionId: string }>('', event), e => owners.owns(context, e.connectionId));
				case 'onDidRelayActivity': return Event.filter(proxy.listen<T>('', event), e => owners.owns(context, e as string));
				case 'onDidRelayClose': case 'onDidCloseConnection': return Event.map(Event.filter(event === 'onDidRelayClose' ? relayClosed : closed, e => e.context === context && owners.live(context)), e => e.id as T);
				case 'onDidReportConnectProgress': case 'onDidAnnounceHostKeys': return Event.filter(proxy.listen<T & { connectionKey: string }>('', event), e => owners.progress(context, e.connectionKey));
				case 'onDidChangeConnections': return Event.filter(proxy.listen<T>('', event), () => owners.live(context) && [...owners.resources.values()].some(owner => owner.context === context));
				default: throw new Error(`Unknown SSH Agent Host event: ${event}`);
			}
		},
		call: async <T>(context: string, command: string, arg?: unknown, token?: CancellationToken) => {
			return owners.call(context, token, store, async lifetime => {
				const args = Array.isArray(arg) ? arg : [];
				switch (command) {
					case 'connect': case 'reconnect': {
						const expected = args[command === 'connect' ? 1 : 6] as string | undefined;
						if (expected !== undefined) { owners.requireExpected(context, expected); }
						const key = command === 'connect' ? computeSSHConnectionKey(args[0] as ISSHAgentHostConfig) : `ssh:${args[0]}`;
						const result = await owners.connect(context, key, () => command === 'connect'
							? service.connect(args[0] as ISSHAgentHostConfig, expected, lifetime)
							: service.reconnect(args[0], args[1], args[2], args[3], args[4], args[5], expected, lifetime), id => service.releaseRelay(id), lifetime);
						const previous = args[command === 'connect' ? 1 : 6] as string | undefined;
						if (previous && previous !== result.connectionId && owners.resources.has(previous)) { owners.resources.get(previous)!.replacement = result.connectionId; }
						return result as T;
					}
					case 'relaySend': case 'releaseRelay': {
						owners.require(context, args[0], command !== 'relaySend');
						const owner = owners.resources.get(args[0]);
						await proxy.call('', command, args, token);
						if (command === 'releaseRelay' && owners.resources.get(args[0]) === owner) { owners.resources.delete(args[0]); }
						owners.check(context);
						return undefined as T;
					}
					case 'disconnect': {
						const ids = [...owners.resources].filter(([id, owner]) => owner.context === context && !owner.replacement && (owner.key === args[0] || id === args[0])).map(([id]) => id);
						if (ids.length === 0) { throw new Error('Unknown or foreign SSH host'); }
						for (const id of ids) {
							if (lifetime.isCancellationRequested) { throw new CancellationError(); }
							owners.require(context, id, true);
							const owner = owners.resources.get(id);
							await service.releaseRelay(id);
							if (owners.resources.get(id) === owner) { owners.resources.delete(id); }
						}
						return undefined as T;
					}
					case 'respondKeyboardInteractive': case 'respondEndpointSelection': case 'respondHostKeyVerification': {
						const prompt = prompts.get(args[0]);
						if (prompt?.context !== context || prompt.reply !== command || prompt.token.isCancellationRequested) { throw new Error('Unknown or foreign SSH prompt'); }
						prompts.delete(args[0]);
						return await proxy.call<T>('', command, args, token);
					}
					case 'ensureUserSSHConfig': return await service.ensureUserSSHConfig(lifetime) as T;
					case 'listSSHConfigHosts': case 'listSSHConfigFiles': case 'resolveSSHConfig': {
						const result = await proxy.call<T>('', command, args, token); owners.check(context); return result;
					}
					default: throw new Error(`Unknown SSH Agent Host command: ${command}`);
				}
			});
		},
	};
}

/** WSL sessions may be shared; disconnect releases only the caller's leases. */
export function createWSLRemoteAgentHostChannel(service: IWSLRemoteAgentHostMainService, store: DisposableStore, authority: IRemoteAgentHostChannelAuthority): IServerChannel<string> {
	const owners = new RemoteAgentHostChannelOwners(authority, store, id => service.releaseRelay(id));
	const relayClosed = owners.closeEvent(service.onDidRelayClose, store, false);
	const closed = owners.closeEvent(service.onDidCloseConnection, store, true);
	const proxy = ProxyChannel.fromService(service, store);
	return {
		listen: <T>(context: string, event: string) => {
			owners.check(context);
			switch (event) {
				case 'onDidRelayMessage': return Event.filter(proxy.listen<T & { connectionId: string }>('', event), e => owners.owns(context, e.connectionId));
				case 'onDidRelayActivity': return Event.filter(proxy.listen<T>('', event), e => owners.owns(context, e as string));
				case 'onDidRelayClose': case 'onDidCloseConnection': return Event.map(Event.filter(event === 'onDidRelayClose' ? relayClosed : closed, e => e.context === context && owners.live(context)), e => e.id as T);
				case 'onDidReportConnectProgress': return Event.filter(proxy.listen<T & { connectionKey: string }>('', event), e => owners.progress(context, e.connectionKey));
				case 'onDidChangeConnections': return Event.filter(proxy.listen<T>('', event), () => owners.live(context) && [...owners.resources.values()].some(owner => owner.context === context));
				default: throw new Error(`Unknown WSL Agent Host event: ${event}`);
			}
		},
		call: async <T>(context: string, command: string, arg?: unknown, token?: CancellationToken) => {
			return owners.call(context, token, store, async lifetime => {
				const args = Array.isArray(arg) ? arg : [];
				switch (command) {
					case 'connect': case 'reconnect': {
						if (command === 'reconnect' && args[4] !== undefined) { owners.requireExpected(context, args[4]); }
						const key = `wsl:${command === 'connect' ? (args[0] as IWSLAgentHostConfig).distro : args[0]}`;
						const result = await owners.connect(context, key, () => command === 'connect'
							? service.connect(args[0] as IWSLAgentHostConfig, lifetime)
							: service.reconnect(args[0], args[1], args[2], args[3], args[4], lifetime), id => service.releaseRelay(id), lifetime);
						const previous = command === 'reconnect' ? args[4] as string | undefined : undefined;
						if (previous && previous !== result.connectionId && owners.resources.has(previous)) { owners.resources.get(previous)!.replacement = result.connectionId; }
						return result as T;
					}
					case 'relaySend': case 'releaseRelay': {
						owners.require(context, args[0], command !== 'relaySend');
						const owner = owners.resources.get(args[0]);
						await proxy.call('', command, args, token);
						if (command === 'releaseRelay' && owners.resources.get(args[0]) === owner) { owners.resources.delete(args[0]); }
						owners.check(context);
						return undefined as T;
					}
					case 'disconnect': {
						const ids = [...owners.resources].filter(([, owner]) => owner.context === context && !owner.replacement && owner.key === `wsl:${args[0]}`).map(([id]) => id);
						if (ids.length === 0) { throw new Error('Unknown or foreign WSL distro'); }
						for (const id of ids) {
							if (lifetime.isCancellationRequested) { throw new CancellationError(); }
							owners.require(context, id, true);
							const owner = owners.resources.get(id);
							await service.releaseRelay(id);
							if (owners.resources.get(id) === owner) { owners.resources.delete(id); }
						}
						return undefined as T;
					}
					case 'isWSLAvailable': case 'listDistros': case 'listRunningDistros': {
						const result = await proxy.call<T>('', command, args, token); owners.check(context); return result;
					}
					default: throw new Error(`Unknown WSL Agent Host command: ${command}`);
				}
			});
		},
	};
}

/** Tunnel selection handles and their resulting relays share one authenticated owner. */
export function createTunnelAgentHostChannel(service: ITunnelAgentHostMainService, store: DisposableStore, authority: IRemoteAgentHostChannelAuthority): IServerChannel<string> {
	const selections = new Map<string, { context: string; key: string }>();
	const deleting = new Set<string>();
	const preparing = new Map<string, number>();
	const owners = new RemoteAgentHostChannelOwners(authority, store, id => service.disconnect(id));
	const relayClosed = owners.closeEvent(service.onDidRelayClose, store, true);
	const proxy = ProxyChannel.fromService(service, store);
	store.add(authority.onDidRemoveConnection(({ ctx }) => {
		for (const [id, owner] of selections) {
			if (owner.context === ctx) { selections.delete(id); void service.cancelSelection(id).catch(() => { /* Caller departed. */ }); }
		}
	}));
	return {
		listen: <T>(context: string, event: string) => {
			owners.check(context);
			switch (event) {
				case 'onDidRelayMessage': return Event.filter(proxy.listen<T & { connectionId: string }>('', event), e => owners.owns(context, e.connectionId));
				case 'onDidRelayActivity': return Event.filter(proxy.listen<T>('', event), e => owners.owns(context, e as string));
				case 'onDidRelayClose': return Event.map(Event.filter(relayClosed, e => e.context === context && owners.live(context)), e => e.id as T);
				default: throw new Error(`Unknown tunnel Agent Host event: ${event}`);
			}
		},
		call: async <T>(context: string, command: string, arg?: unknown, token?: CancellationToken) => {
			return owners.call(context, token, store, async lifetime => {
				const args = Array.isArray(arg) ? arg : [];
				switch (command) {
					case 'prepareSelection': {
						if (deleting.has(args[2])) { throw new Error('Tunnel deletion is pending'); }
						preparing.set(args[2], (preparing.get(args[2]) ?? 0) + 1);
						let result;
						try { result = await service.prepareSelection(args[0], args[1], args[2], args[3], lifetime); } finally { const remaining = (preparing.get(args[2]) ?? 1) - 1; if (remaining) { preparing.set(args[2], remaining); } else { preparing.delete(args[2]); } }
						if (!owners.live(context) || lifetime.isCancellationRequested) { if (result && (!selections.has(result.selectionId) || selections.get(result.selectionId)?.context === context)) { await service.cancelSelection(result.selectionId); } throw new CancellationError(); }
						if (result) {
							if (selections.has(result.selectionId)) { throw new Error('Tunnel selection already owned'); }
							selections.set(result.selectionId, { context, key: args[2] });
						}
						return result as T;
					}
					case 'completeSelection': case 'cancelSelection': {
						const owner = selections.get(args[0]);
						if (owner?.context !== context) { throw new Error('Unknown or foreign tunnel selection'); }
						if (deleting.has(owner.key)) { throw new Error('Tunnel deletion is pending'); }
						selections.delete(args[0]);
						if (command === 'cancelSelection') { await service.cancelSelection(args[0]); return undefined as T; }
						return await owners.connect(context, owner.key, () => service.completeSelection(args[0], args[1], lifetime), id => service.disconnect(id), lifetime) as T;
					}
					case 'connect':
						if (deleting.has(args[2])) { throw new Error('Tunnel deletion is pending'); }
						return await owners.connect(context, args[2], () => service.connect(args[0], args[1], args[2], args[3], lifetime), id => service.disconnect(id), lifetime) as T;
					case 'relaySend': case 'disconnect': {
						owners.require(context, args[0], command !== 'relaySend');
						const owner = owners.resources.get(args[0]);
						await proxy.call('', command, args, token);
						if (command === 'disconnect' && owners.resources.get(args[0]) === owner) { owners.resources.delete(args[0]); }
						owners.check(context); return undefined as T;
					}
					case 'deleteTunnel': {
						if (deleting.has(args[2]) || preparing.has(args[2]) || owners.pending.has(args[2])) { throw new Error('Tunnel has pending operations'); }
						if ([...owners.resources.values(), ...selections.values()].some(owner => owner.key === args[2] && owner.context !== context)) { throw new Error('Tunnel has foreign live resources'); }
						deleting.add(args[2]);
						try { await service.deleteTunnel(args[0], args[1], args[2], args[3], lifetime); } finally { deleting.delete(args[2]); }
						owners.check(context); return undefined as T;
					}
					case 'listTunnels': {
						const result = await service.listTunnels(args[0], args[1], args[2], lifetime); owners.check(context); return result as T;
					}
					default: throw new Error(`Unknown tunnel Agent Host command: ${command}`);
				}
			});
		},
	};
}

/** Retains Dev Container's out-of-band cancellation and facts-before-error events. */
export function createOwnedDevContainerAgentHostChannel(service: IDevContainerAgentHostMainService, store: DisposableStore, authority: IRemoteAgentHostChannelAuthority): IServerChannel<string> {
	const owners = new RemoteAgentHostChannelOwners(authority, store, id => service.disconnect(id));
	const connecting = new Set<string>();
	const relayClosed = owners.closeEvent(service.onDidRelayClose, store, false);
	const closed = owners.closeEvent(service.onDidCloseConnection, store, true);
	const proxy = ProxyChannel.fromService(service, store, { unbufferedEvents: ['onDidChangeSandboxSupport', 'onDidOutput'] });
	return {
		listen: <T>(context: string, event: string) => {
			owners.check(context);
			switch (event) {
				case 'onDidRelayMessage': case 'onDidOutput': case 'onDidChangeSandboxSupport': return Event.filter(proxy.listen<T & { connectionId: string }>('', event), e => owners.owns(context, e.connectionId));
				case 'onDidRelayActivity': return Event.filter(proxy.listen<T>('', event), e => owners.owns(context, e as string));
				case 'onDidRelayClose': case 'onDidCloseConnection': return Event.map(Event.filter(event === 'onDidRelayClose' ? relayClosed : closed, e => e.context === context && owners.live(context)), e => e.id as T);
				default: throw new Error(`Unknown Dev Container Agent Host event: ${event}`);
			}
		},
		call: async <T>(context: string, command: string, arg?: unknown, token?: CancellationToken) => {
			return owners.call(context, token, store, async lifetime => {
				const args = Array.isArray(arg) ? arg : [];
				switch (command) {
					case 'connect': {
						const config = args[0] as IDevContainerAgentHostConfig;
						const key = getDevContainerAgentHostSourceKey(hasKey(config, { workspaceFolder: true }) ? config.workspaceFolder : config);
						if ([...owners.resources.values()].some(owner => owner.key === key && owner.context !== context)) { throw new Error('Dev Container source is owned by another connection'); }
						if (connecting.has(config.connectionId) || (owners.resources.has(config.connectionId) && !owners.owns(context, config.connectionId))) { throw new Error('Dev Container connection already owned'); }
						connecting.add(config.connectionId);
						owners.bind(context, config.connectionId, key, lifetime);
						try { return await owners.connect(context, key, () => service.connect(config, lifetime), id => service.disconnect(id), lifetime) as T; }
						catch (error) { if (owners.resources.get(config.connectionId)?.token === lifetime) { owners.resources.delete(config.connectionId); } throw error; }
						finally { connecting.delete(config.connectionId); }
					}
					case 'relaySend': case 'disconnect': {
						owners.require(context, args[0], command !== 'relaySend');
						const owner = owners.resources.get(args[0]);
						await proxy.call('', command, args, token);
						if (command === 'disconnect' && owners.resources.get(args[0]) === owner) { owners.resources.delete(args[0]); }
						owners.check(context); return undefined as T;
					}
					case 'stopContainer': case 'removeContainer': {
						const key = getDevContainerAgentHostSourceKey(args[0]);
						const validate = () => {
							owners.check(context);
							if ([...owners.resources.values()].some(owner => owner.key === key && owner.context !== context)) { throw new Error('Dev Container has foreign live resources'); }
						};
						validate();
						// These source operations are named Agents coordinator capabilities.
						return await (command === 'stopContainer' ? service.stopContainer(args[0], lifetime, validate) : service.removeContainer(args[0], lifetime, validate)) as T;
					}
					case 'listDevContainers': {
						const result = await proxy.call<T>('', command, [lifetime], token); owners.check(context); return result;
					}
					case 'isDockerAvailable': { const result = await service.isDockerAvailable(); owners.check(context); return result as T; }
					default: throw new Error(`Unknown Dev Container Agent Host command: ${command}`);
				}
			});
		},
	};
}
