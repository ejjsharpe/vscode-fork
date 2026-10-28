/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

// Native services are scoped to the authenticated workbench document.
import { onPrototypeConnectionRevoked, prototypeBinding, markPrototypeLifecycleReady } from '../../../base/parts/ipc/electron-main/prototypeLifetime.js';
import { CancellationToken } from '../../../base/common/cancellation.js';
import { Event } from '../../../base/common/event.js';
import { IServerChannel } from '../../../base/parts/ipc/common/ipc.js';
import { IWindowsMainService } from './windows.js';
import { DisposableStore } from '../../../base/common/lifecycle.js';
import { IAuxiliaryWindowsMainService } from '../../auxiliaryWindow/electron-main/auxiliaryWindows.js';

const ownMethods = new Set(`closeWindow reload getProcessId getNativeWindowHandle isFullScreen toggleFullScreen isMaximized maximizeWindow unmaximizeWindow minimizeWindow moveWindowTop isWindowAlwaysOnTop toggleWindowAlwaysOnTop setWindowAlwaysOnTop positionWindow updateWindowControls updateWindowAccentColor focusWindow focusProjectTabs setMinimumSize saveWindowSplash setBackgroundThrottling showMessageBox showSaveDialog showOpenDialog startFileDrag setRepresentedFilename setDocumentEdited setApplicationBadge getScreenshot triggerPaste updateTouchBar notifyReady resolveProxy openDevTools toggleDevTools profileRenderer getAgentHostEditorState updateAgentHostEditorState claimAgentsWindowInvitation markAgentsWindowInvitationShown releaseAgentsWindowInvitation syncSystemWideKeybindings`.split(' '));
const appMethods = new Set(`getWindowCount getActiveWindowId getActiveWindowPosition getWindows getCursorScreenPoint showItemInFolder openExternal moveItemToTrash getMediaAccessStatus requestScreenCaptureAccess isAdmin getOSStatistics getFreeDiskSpace getOSProperties getOSVirtualMachineHint isGPUCompositingEnabled getOSColorScheme hasWSLFeatureInstalled readClipboardText readImage writeImage writeClipboardText readClipboardFindText writeClipboardFindText writeClipboardBuffer readClipboardBuffer hasClipboard resolveProxyWithPackage readProxyConfigWithPackage lookupAuthorization lookupKerberosAuthorization loadCertificates isPortFree findFreePort windowsGetStringRegKey getSystemIdleState getSystemIdleTime getCurrentThermalState isOnBatteryPower`.split(' '));
const ownEvents = new Set(`onDidOpenMainWindow onDidTriggerWindowSystemContextMenu onDidMaximizeWindow onDidUnmaximizeWindow onDidChangeWindowFullScreen onDidBlurMainWindow onDidFocusMainWindow onDidBlurMainOrAuxiliaryWindow onDidFocusMainOrAuxiliaryWindow onDidChangeWindowAlwaysOnTop`.split(' '));
const appEvents = new Set(`onDidSuspendOS onDidResumeOS onDidChangeOnBatteryPower onDidChangeThermalState onDidChangeSpeedLimit onWillShutdownOS onDidLockScreen onDidUnlockScreen onDidChangeColorScheme onDidChangePassword onDidChangeDisplay onDidChangeGPUCompositing onDidChangeAgentHostEditorState`.split(' '));

function caller(context: string, windows: IWindowsMainService) {
	const binding = prototypeBinding(context);
	const window = windows.getWindowById(binding.workbench);
	if (!window || window.webContents !== binding.contents || window.webContents.isDestroyed()) { throw new Error('Rejected unregistered or stale caller'); }
	return window;
}

function checkTargets(value: unknown, id: number, auxiliaryIds?: ReadonlySet<number>): void {
	if (!value || typeof value !== 'object') { return; }
	for (const [key, target] of Object.entries(value)) {
		if (['windowId', 'targetWindowId', 'responseWindowId'].includes(key) && target !== undefined && target !== id && !(typeof target === 'number' && auxiliaryIds?.has(target))) {
			throw new Error(`Rejected foreign/unknown target ${key}`);
		}
		checkTargets(target, id, auxiliaryIds);
	}
}

export function prototypeNativeChannel(channel: IServerChannel<string>, windows: IWindowsMainService, auxiliaryWindows?: IAuxiliaryWindowsMainService): IServerChannel<string> {
	const auxiliaryMethods = new Set('closeWindow getNativeWindowHandle isFullScreen toggleFullScreen isMaximized maximizeWindow unmaximizeWindow minimizeWindow moveWindowTop isWindowAlwaysOnTop toggleWindowAlwaysOnTop setWindowAlwaysOnTop positionWindow updateWindowControls focusWindow showMessageBox showSaveDialog showOpenDialog setRepresentedFilename setDocumentEdited'.split(' '));
	const dialogMethods = new Set(['showMessageBox', 'showSaveDialog', 'showOpenDialog']);
	const auxiliaryIds = (id: number) => new Set(auxiliaryWindows?.getWindows().filter(window => window.parentId === id && auxiliaryWindows.getWindowByWebContents(window.webContents) === window).map(window => window.id));
	return {
		async call<T>(context: string, command: string, args: unknown[], token?: CancellationToken) {
			const window = caller(context, windows);
			if (!Array.isArray(args) || args[0] !== window.id) { throw new Error('Rejected caller ID impersonation'); }
			if (!ownMethods.has(command) && !appMethods.has(command)) { throw new Error(`Unclassified/coordinator-only native operation: ${command}`); }
			const permittedAuxiliaries = auxiliaryMethods.has(command) ? auxiliaryIds(window.id) : undefined;
			checkTargets(args.slice(1), window.id, permittedAuxiliaries);
			if (command === 'getNativeWindowHandle' && args[1] !== window.id && !(typeof args[1] === 'number' && permittedAuxiliaries?.has(args[1]))) { throw new Error('Rejected explicit target'); }
			if (command === 'focusProjectTabs' && args.length !== 1) { throw new Error('Rejected project navigation arguments'); }
			prototypeBinding(context);
			if (command === 'notifyReady') { markPrototypeLifecycleReady(context); }
			let callArgs = args;
			if (dialogMethods.has(command)) {
				if (args.length !== 2) { throw new Error('Rejected native dialog arguments'); }
				// Main-only guard follows the originating connection through the native dialog queue.
				callArgs = [...args, () => { prototypeBinding(context); }];
			}
			if (command === 'profileRenderer') {
				if (args.length !== 3 || typeof args[1] !== 'string' || typeof args[2] !== 'number' || !Number.isFinite(args[2]) || args[2] < 0) { throw new Error('Rejected renderer profile arguments'); }
				callArgs = [...args, () => { prototypeBinding(context); }];
			}
			if (command === 'positionWindow') {
				if (args.length < 2 || args.length > 3) { throw new Error('Rejected native position arguments'); }
				callArgs = [args[0], args[1], args[2], () => { prototypeBinding(context); }];
			}
			const result = await channel.call<T>(context, command, callArgs, token);
			prototypeBinding(context);
			return result;
		},
		listen(context, event, arg) {
			const window = caller(context, windows);
			if (appEvents.has(event)) { return Event.filter(channel.listen(context, event, arg), () => {
				try { prototypeBinding(context); return true; } catch { return false; }
			}); }
			if (!ownEvents.has(event)) { throw new Error(`Unclassified native event: ${event}`); }
			return Event.filter(channel.listen(context, event, arg), value => {
				const target = typeof value === 'number' ? value : (value as { windowId?: number })?.windowId;
				try { prototypeBinding(context); } catch { return false; }
				return target === window.id || typeof target === 'number' && auxiliaryIds(window.id).has(target);
			});
		}
	};
}

export function prototypeExtensionChannel(channel: IServerChannel<string>, windows: IWindowsMainService, disposables?: DisposableStore): IServerChannel<string> {
	const owners = new Map<string, string>();
	const revocation = onPrototypeConnectionRevoked(context => {
		for (const [id, owner] of owners) {
			if (owner === context) {
				owners.delete(id);
				void channel.call(context, 'kill', [id]).catch(error => console.error('Workbench resource cleanup failed', error));
			}
		}
	});
	disposables?.add(revocation);
	function authorize(context: string, id: unknown) {
		const window = caller(context, windows);
		const owner = typeof id === 'string' ? owners.get(id) : undefined;
		if (!owner || owner !== context) { throw new Error('Rejected extension-host owner/lifetime'); }
		return window;
	}
	return {
		async call<T>(context: string, command: string, args: unknown[], token?: CancellationToken) {
			const window = caller(context, windows);
			if (command === 'createExtensionHost') {

				const result = await channel.call<{ id: string }>(context, command, args, token);
				try { prototypeBinding(context); }
				catch (error) { await channel.call(context, 'kill', [result.id]); throw error; }
				owners.set(result.id, context);
				return result as never;
			}
			authorize(context, args?.[0]);
			if (!['start', 'enableInspectPort', 'kill', 'waitForExit', 'startCpuProfile', 'stopCpuProfile'].includes(command)) { throw new Error('Rejected extension-host operation'); }
			checkTargets(args, window.id);
			if (command === 'start') {
				const options = args[1] as { responseWindowId?: number };
				if (options?.responseWindowId !== window.id) { throw new Error('Rejected extension-host destination'); }
				args = [args[0], { ...options, nativeConnectionContext: context }];
			}
			const result = await channel.call<T>(context, command, args, token);
			prototypeBinding(context);
			return result;
		},
		listen(context, event, id) {
			authorize(context, id);
			if (!['onDynamicStdout', 'onDynamicStderr', 'onDynamicMessage', 'onDynamicExit'].includes(event)) { throw new Error('Rejected extension-host event'); }
			return channel.listen(context, event, id);
		}
	};
}

// Renderer workers have a separate owner from provider-owned agent processes.
export function prototypeWorkerChannel(channel: IServerChannel<string>, windows: IWindowsMainService, disposables?: DisposableStore): IServerChannel<string> {
	const owners = new Map<string, { context: string; configuration: import('../../utilityProcess/common/utilityProcessWorkerService.js').IUtilityProcessWorkerConfiguration }>();
	const revocation = onPrototypeConnectionRevoked(context => {
		for (const [key, owner] of owners) {
			if (owner.context === context) {
				owners.delete(key);
				void channel.call(context, 'disposeWorker', [owner.configuration]).catch(error => console.error('Workbench worker cleanup failed', error));
			}
		}
	});
	disposables?.add(revocation);
	return {
		async call<T>(context: string, command: string, args: unknown[], token?: CancellationToken): Promise<T> {
			const window = caller(context, windows);
			if (!Array.isArray(args) || args.length !== 1) { throw new Error('Rejected worker arguments'); }
			const configuration = { ...args[0] as import('../../utilityProcess/common/utilityProcessWorkerService.js').IUtilityProcessWorkerCreateConfiguration, nativeConnectionContext: context };
			if (!configuration || configuration.reply?.windowId !== window.id || !['vs/platform/files/node/watcher/watcherMain', 'vs/platform/localTranscription/node/localTranscriptionMain'].includes(configuration.process?.moduleId)) {
				throw new Error('Rejected worker owner/module');
			}
			checkTargets(configuration, window.id);
			const key = `${window.id}:${configuration.process.moduleId}`;
			if (command === 'disposeWorker') {
				if (owners.get(key)?.context !== context) { throw new Error('Rejected worker connection'); }
				owners.delete(key);
			} else if (command === 'createWorker') {
				if (!configuration.reply.channel?.startsWith('vscode:') || typeof configuration.reply.nonce !== 'string') { throw new Error('Rejected worker reply'); }
				owners.set(key, { context, configuration });
			} else { throw new Error('Rejected worker operation'); }
			const result = await channel.call<T>(context, command, [configuration], token);
			prototypeBinding(context);
			return result;
		},
		listen() { throw new Error('Rejected worker event'); }
	};
}
