/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

// THROWAWAY: explicit native-service scopes for the live hosting experiment.
import { Event } from '../../../base/common/event.js';
import { IServerChannel } from '../../../base/parts/ipc/common/ipc.js';
import { IWindowsMainService } from './windows.js';

const ownMethods = new Set(`getProcessId getNativeWindowHandle isFullScreen toggleFullScreen isMaximized maximizeWindow unmaximizeWindow minimizeWindow moveWindowTop isWindowAlwaysOnTop toggleWindowAlwaysOnTop setWindowAlwaysOnTop positionWindow updateWindowControls updateWindowAccentColor focusWindow setMinimumSize saveWindowSplash setBackgroundThrottling showMessageBox showSaveDialog showOpenDialog startFileDrag setRepresentedFilename setDocumentEdited setApplicationBadge getScreenshot triggerPaste updateTouchBar notifyReady resolveProxy openDevTools toggleDevTools profileRenderer getAgentHostEditorState updateAgentHostEditorState claimAgentsWindowInvitation markAgentsWindowInvitationShown releaseAgentsWindowInvitation syncSystemWideKeybindings`.split(' '));
const appMethods = new Set(`getWindowCount getActiveWindowId getActiveWindowPosition getWindows getCursorScreenPoint showItemInFolder openExternal moveItemToTrash getMediaAccessStatus requestScreenCaptureAccess isAdmin getOSStatistics getFreeDiskSpace getOSProperties getOSVirtualMachineHint isGPUCompositingEnabled getOSColorScheme hasWSLFeatureInstalled readClipboardText readImage writeImage writeClipboardText readClipboardFindText writeClipboardFindText writeClipboardBuffer readClipboardBuffer hasClipboard resolveProxyWithPackage readProxyConfigWithPackage lookupAuthorization lookupKerberosAuthorization loadCertificates isPortFree findFreePort windowsGetStringRegKey getSystemIdleState getSystemIdleTime getCurrentThermalState isOnBatteryPower`.split(' '));
const ownEvents = new Set(`onDidOpenMainWindow onDidTriggerWindowSystemContextMenu onDidMaximizeWindow onDidUnmaximizeWindow onDidChangeWindowFullScreen onDidBlurMainWindow onDidFocusMainWindow onDidBlurMainOrAuxiliaryWindow onDidFocusMainOrAuxiliaryWindow onDidChangeWindowAlwaysOnTop`.split(' '));
const appEvents = new Set(`onDidSuspendOS onDidResumeOS onDidChangeOnBatteryPower onDidChangeThermalState onDidChangeSpeedLimit onWillShutdownOS onDidLockScreen onDidUnlockScreen onDidChangeColorScheme onDidChangePassword onDidChangeDisplay onDidChangeGPUCompositing onDidChangeAgentHostEditorState`.split(' '));

function caller(context: string, windows: IWindowsMainService) {
	const match = /^window:(\d+)$/.exec(context);
	const window = match ? windows.getWindowById(Number(match[1])) : undefined;
	if (!window || window.webContents.isDestroyed()) { throw new Error('Rejected unregistered or stale caller'); }
	return window;
}

function checkTargets(value: unknown, id: number): void {
	if (!value || typeof value !== 'object') { return; }
	for (const [key, target] of Object.entries(value)) {
		if (['windowId', 'targetWindowId', 'responseWindowId'].includes(key) && target !== undefined && target !== id) {
			throw new Error(`Rejected foreign/unknown target ${key}`);
		}
		checkTargets(target, id);
	}
}

export function prototypeNativeChannel(channel: IServerChannel<string>, windows: IWindowsMainService): IServerChannel<string> {
	return {
		async call(context, command, args: unknown[], token) {
			const window = caller(context, windows);
			if (!Array.isArray(args) || args[0] !== window.id) { throw new Error('Rejected caller ID impersonation'); }
			if (!ownMethods.has(command) && !appMethods.has(command)) { throw new Error(`Unclassified/coordinator-only native operation: ${command}`); }
			checkTargets(args.slice(1), window.id);
			if (command === 'getNativeWindowHandle' && args[1] !== window.id) { throw new Error('Rejected explicit target'); }
			return channel.call(context, command, args, token);
		},
		listen(context, event, arg) {
			const window = caller(context, windows);
			if (appEvents.has(event)) { return channel.listen(context, event, arg); }
			if (!ownEvents.has(event)) { throw new Error(`Unclassified native event: ${event}`); }
			return Event.filter(channel.listen(context, event, arg), value => {
				const target = typeof value === 'number' ? value : (value as { windowId?: number })?.windowId;
				return target === window.id;
			});
		}
	};
}

export function prototypeExtensionChannel(channel: IServerChannel<string>, windows: IWindowsMainService): IServerChannel<string> {
	// shortcut: frame identity survives some reloads; replace with a revocable document generation before acceptance.
	const owners = new Map<string, { window: number; frame: Electron.WebFrameMain }>();
	function authorize(context: string, id: unknown) {
		const window = caller(context, windows);
		const owner = typeof id === 'string' ? owners.get(id) : undefined;
		if (!owner || owner.window !== window.id || owner.frame !== window.webContents.mainFrame || owner.frame.isDestroyed()) { throw new Error('Rejected extension-host owner/lifetime'); }
		return window;
	}
	return {
		async call(context, command, args: unknown[], token) {
			const window = caller(context, windows);
			if (command === 'createExtensionHost') {
				const frame = window.webContents.mainFrame;
				const result = await channel.call<{ id: string }>(context, command, args, token);
				owners.set(result.id, { window: window.id, frame });
				return result as never;
			}
			authorize(context, args?.[0]);
			if (!['start', 'enableInspectPort', 'kill', 'waitForExit'].includes(command)) { throw new Error('Rejected extension-host operation'); }
			checkTargets(args, window.id);
			if (command === 'start') {
				const options = args[1] as { responseWindowId?: number };
				if (options?.responseWindowId !== window.id) { throw new Error('Rejected extension-host destination'); }
			}
			return channel.call(context, command, args, token);
		},
		listen(context, event, id) {
			authorize(context, id);
			if (!['onDynamicStdout', 'onDynamicStderr', 'onDynamicMessage', 'onDynamicExit'].includes(event)) { throw new Error('Rejected extension-host event'); }
			return channel.listen(context, event, id);
		}
	};
}
