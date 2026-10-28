/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { Event } from '../../../base/common/event.js';
import { DisposableStore } from '../../../base/common/lifecycle.js';
import { IServerChannel } from '../../../base/parts/ipc/common/ipc.js';
import { IMessagePortConnectionScope } from '../../../base/parts/ipc/common/ipc.mp.js';
import { onPrototypeConnectionRevoked } from '../../../base/parts/ipc/electron-main/prototypeLifetime.js';
import { IBrowserViewCreationContext, IBrowserViewCreateOptions, IBrowserViewCreatedEvent, getBrowserViewSessionNetwork } from '../common/browserView.js';
import { IBrowserViewMainService } from './browserViewMainService.js';
import { IBrowserViewGroupMainService } from './browserViewGroupMainService.js';
import { IBrowserViewGroupFilter } from '../common/browserViewGroup.js';

type BrowserCallerScope = IMessagePortConnectionScope & { readonly auxiliaryWindowIds?: readonly number[] };

function delegatedContext(context: string, args: unknown[]): { context: string; args: unknown[] } {
	if (!Array.isArray(args)) { throw new Error('Rejected browser arguments'); }
	const delegate = args.at(-1) as { nativeConnectionContext?: unknown } | undefined;
	if (delegate && typeof delegate === 'object' && Object.prototype.hasOwnProperty.call(delegate, 'nativeConnectionContext')) {
		if (context !== 'main' || typeof delegate.nativeConnectionContext !== 'string') { throw new Error('Rejected browser authority delegation'); }
		return { context: delegate.nativeConnectionContext, args: args.slice(0, -1) };
	}
	return { context, args };
}

async function validateCreation(scope: IMessagePortConnectionScope, options: IBrowserViewCreationContext, service: IBrowserViewMainService): Promise<void> {
	if (!options || options.host?.windowId !== scope.workbench) { throw new Error('Rejected foreign browser host'); }
	if (!options.session || (typeof options.session !== 'string' && typeof options.session !== 'object')) { throw new Error('Rejected browser session selector'); }
	if (scope.role !== 'agents' && (options.owner?.type !== 'user' || options.host.sessionId !== undefined)) { throw new Error('Rejected browser agent ownership grant'); }
	if (typeof options.session === 'string') {
		const views = await service.getBrowserViews(scope.workbench);
		if (!views.some(view => service.tryGetBrowserView(view.id)?.session.id === options.session)) { throw new Error('Rejected foreign browser session owner'); }
	}
	if (typeof options.session === 'object' && getBrowserViewSessionNetwork(options.session)?.authority !== undefined && getBrowserViewSessionNetwork(options.session)?.authority !== scope.remoteAuthority) { throw new Error('Rejected foreign browser network'); }
}

/** Authenticates workbench-native browser operations independently of the selected tab. */
export function prototypeBrowserViewChannel(channel: IServerChannel<string>, service: IBrowserViewMainService, resolveScope: (context: string) => BrowserCallerScope | undefined, disposables: DisposableStore): IServerChannel<string> {
	const owners = new Map<string, { context: string; scope: IMessagePortConnectionScope; created: boolean }>();
	disposables.add(onPrototypeConnectionRevoked(context => {
		for (const [id, owner] of owners) {
			if (owner.context !== context) { continue; }
			owners.delete(id);
			if (owner.created) { void service.destroyBrowserView(id).catch(error => console.error(error)); }
		}
	}));
	function ownView(context: string, scope: IMessagePortConnectionScope, id: unknown): string {
		if (typeof id !== 'string') { throw new Error('Rejected browser handle'); }
		const view = service.tryGetBrowserView(id);
		const owner = owners.get(id);
		if (!view || view.host.windowId !== scope.workbench || (owner && (owner.scope.workbench !== scope.workbench || owner.scope.generation !== scope.generation))) { throw new Error('Rejected foreign or unknown browser owner'); }
		return id;
	}
	const viewMethods = new Set('destroyBrowserView setOwner getState setAudience layout setVisible loadURL getURL goBack goForward reload toggleDevTools canGoBack canGoForward captureScreenshot focus findInPage stopFindInPage getSelectedText clearStorage setBrowserZoomIndex setDeviceEmulation trustCertificate untrustCertificate deleteBrowserHistory setPermissions selectDevice getConsoleLogs toggleElementSelection setElementComments toggleAreaSelection getAccessibilitySnapshot'.split(' '));
	return {
		async call<T>(context: string, command: string, args: unknown[]) {
			const request = delegatedContext(context, args);
			context = request.context;
			args = request.args;
			const scope = resolveScope(context);
			if (!scope) { return channel.call<T>(context, command, args); }
			if (scope.role === 'auxiliary' || !Array.isArray(args)) { throw new Error('Rejected browser caller or arguments'); }
			if (command === 'getOrCreateBrowserView') {
				const id = args[0];
				if (typeof id !== 'string' || !id || id.length > 200) { throw new Error('Rejected browser handle'); }
				const existing = service.tryGetBrowserView(id);
				if (existing) { ownView(context, scope, id); }
				const options = args[1] as IBrowserViewCreateOptions;
				await validateCreation(scope, options, service);
				resolveScope(context);
				if (!existing) { owners.set(id, { context, scope, created: true }); }
				const result = await channel.call<T>(context, command, args);
				try { resolveScope(context); } catch (error) { if (!existing) { await service.destroyBrowserView(id); } throw error; }
				return result;
			}
			if (command === 'getBrowserViews') {
				if (args[0] !== undefined && args[0] !== scope.workbench) { throw new Error('Rejected foreign browser host'); }
				args = [scope.workbench];
			} else if (command === 'updateWindowConfiguration') {
				if (args[0] !== scope.workbench) { throw new Error('Rejected foreign browser host'); }
			} else if (command === 'clearWorkspaceStorage') {
				if (args[0] !== scope.workspaceId) { throw new Error('Rejected foreign browser workspace'); }
			} else if (command === 'clearGlobalStorage') {
				// Clearing deliberately global browser storage is an application-wide capability.
			} else if (command === 'setSessionNetworkRestrictions') {
				if (scope.role !== 'agents') { throw new Error('Rejected non-owner browser session policy'); }
			} else if (viewMethods.has(command)) {
				ownView(context, scope, args[0]);
				if (command === 'getAccessibilitySnapshot' && args[1] !== scope.workbench) { throw new Error('Rejected foreign browser host'); }
				if (command === 'layout') {
					const target = (args[1] as { windowId?: number })?.windowId;
					if (target !== scope.workbench && (target === undefined || !scope.auxiliaryWindowIds?.includes(target))) { throw new Error('Rejected foreign browser layout host'); }
				}
				if (scope.role !== 'agents' && command === 'setOwner' && (args[1] as { type?: string })?.type !== 'user') { throw new Error('Rejected browser agent ownership grant'); }
			} else { throw new Error(`Rejected browser operation: ${command}`); }
			const result = await channel.call<T>(context, command, args);
			resolveScope(context);
			if (command === 'destroyBrowserView') { owners.delete(args[0] as string); }
			return result;
		},
		listen<T>(context: string, event: string, arg?: unknown): Event<T> {
			if (arg && typeof arg === 'object' && Object.prototype.hasOwnProperty.call(arg, 'nativeConnectionContext')) {
				const delegation = arg as { nativeConnectionContext: unknown; id?: unknown };
				if (context !== 'main' || typeof delegation.nativeConnectionContext !== 'string') { throw new Error('Rejected browser event delegation'); }
				context = delegation.nativeConnectionContext;
				arg = delegation.id;
			}
			const scope = resolveScope(context);
			if (!scope) { return channel.listen(context, event, arg); }
			if (scope.role === 'auxiliary') { throw new Error('Rejected auxiliary browser event'); }
			if (event === 'onDynamicBrowserViewEvent') {
				if (arg !== scope.workbench) { throw new Error('Rejected foreign browser event host'); }
			} else if (event !== 'onDidCreateBrowserView') { throw new Error('Rejected browser event'); }
			// This source synchronously replays its initial snapshot when subscribed.
			// Event.filter's intermediate emitter subscribes before adding its listener and loses that replay.
			return (listener, thisArgs, eventDisposables) => channel.listen<T>(context, event, arg)(value => {
				let permitted: boolean;
				try {
					resolveScope(context);
					permitted = event !== 'onDidCreateBrowserView' || (value as IBrowserViewCreatedEvent).info.host.windowId === scope.workbench;
				} catch { return; }
				if (permitted) { listener.call(thisArgs, value); }
			}, undefined, eventDisposables);
		}
	};
}

/** Browser/CDP groups retain the originating renderer's scope through trusted shared-process calls. */
export function prototypeBrowserGroupChannel(channel: IServerChannel<string>, service: IBrowserViewGroupMainService, browsers: IBrowserViewMainService, resolveScope: (context: string) => IMessagePortConnectionScope | undefined, disposables: DisposableStore): IServerChannel<string> {
	const owners = new Map<string, string>();
	disposables.add(onPrototypeConnectionRevoked(context => {
		for (const [id, owner] of owners) {
			if (owner === context) { owners.delete(id); void service.destroyGroup(id).catch(error => console.error(error)); }
		}
	}));
	function ownGroup(context: string, id: unknown): void {
		if (typeof id !== 'string' || owners.get(id) !== context) { throw new Error('Rejected foreign or unknown browser group owner'); }
	}
	return {
		async call<T>(context: string, command: string, args: unknown[]) {
			const request = delegatedContext(context, args);
			context = request.context;
			args = request.args;
			const scope = resolveScope(context);
			if (!scope) { return channel.call<T>(context, command, args); }
			if (scope.role === 'auxiliary') { throw new Error('Rejected auxiliary browser group'); }
			if (command === 'createGroup') {
				const filter = args[0] as IBrowserViewGroupFilter;
				const options = args[1] as IBrowserViewCreationContext;
				if (!filter || typeof filter !== 'object') { throw new Error('Rejected browser group filter'); }
				for (const id of filter.browserIds ?? []) {
					if (browsers.tryGetBrowserView(id)?.host.windowId !== scope.workbench) { throw new Error('Rejected foreign browser group member'); }
				}
				await validateCreation(scope, options, browsers);
				resolveScope(context);
				const id = await service.createGroup(filter, options, () => { resolveScope(context); });
				try { resolveScope(context); } catch (error) { await service.destroyGroup(id); throw error; }
				owners.set(id, context);
				return id as T;
			}
			if (command === 'setSessionNetworkRestrictions') {
				if (scope.role !== 'agents') { throw new Error('Rejected non-owner browser policy'); }
			} else {
				ownGroup(context, args[0]);
				if (!['sendCDPMessage', 'destroyGroup'].includes(command)) { throw new Error('Rejected browser group operation'); }
			}
			const result = await channel.call<T>(context, command, args);
			resolveScope(context);
			if (command === 'destroyGroup') { owners.delete(args[0] as string); }
			return result;
		},
		listen<T>(context: string, event: string, arg?: unknown): Event<T> {
			if (arg && typeof arg === 'object' && Object.prototype.hasOwnProperty.call(arg, 'nativeConnectionContext')) {
				const delegation = arg as { nativeConnectionContext: unknown; id?: unknown };
				if (context !== 'main' || typeof delegation.nativeConnectionContext !== 'string') { throw new Error('Rejected browser event delegation'); }
				context = delegation.nativeConnectionContext;
				arg = delegation.id;
			}
			const scope = resolveScope(context);
			if (!scope) { return channel.listen(context, event, arg); }
			ownGroup(context, arg);
			if (!['onDynamicDidDestroy', 'onDynamicCDPMessage'].includes(event)) { throw new Error('Rejected browser group event'); }
			return Event.filter(channel.listen<T>(context, event, arg), () => { try { resolveScope(context); ownGroup(context, arg); return true; } catch { return false; } });
		}
	};
}
