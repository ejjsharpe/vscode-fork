/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { IEnvironmentMainService } from '../../environment/electron-main/environmentMainService.js';
import { parsePtyHostDebugPort } from '../../environment/node/environmentService.js';
import { ILifecycleMainService } from '../../lifecycle/electron-main/lifecycleMainService.js';
import { ILogService } from '../../log/common/log.js';
import { NullTelemetryService } from '../../telemetry/common/telemetryUtils.js';
import { IReconnectConstants, TerminalSettingId } from '../common/terminal.js';
import { IPtyHostConnection, IPtyHostStarter } from '../node/ptyHost.js';
import { UtilityProcess } from '../../utilityProcess/electron-main/utilityProcess.js';
import { Client as MessagePortClient } from '../../../base/parts/ipc/electron-main/ipc.mp.js';
import { IpcMainEvent } from 'electron';
import { validatedIpcMain } from '../../../base/parts/ipc/electron-main/ipcMain.js';
import { Disposable, DisposableStore, toDisposable } from '../../../base/common/lifecycle.js';
import { Emitter } from '../../../base/common/event.js';
import { deepClone } from '../../../base/common/objects.js';
import { isNumber } from '../../../base/common/types.js';
import { IConfigurationService } from '../../configuration/common/configuration.js';
import { Schemas } from '../../../base/common/network.js';
import { prototypeBinding, prototypeRequestContext, revokePrototypeConnection } from '../../../base/parts/ipc/electron-main/prototypeLifetime.js';
import { ICodeWindow } from '../../window/electron-main/window.js';
import { IAuxiliaryWindow } from '../../auxiliaryWindow/electron-main/auxiliaryWindow.js';
import { createPtyNativeParentChannel } from './ptyNativeParentChannel.js';
import { ptyNativeParentChannelName } from '../common/localPtyChannel.js';

export class ElectronPtyHostStarter extends Disposable implements IPtyHostStarter {

	private utilityProcess: UtilityProcess | undefined = undefined;

	private readonly _onRequestConnection = this._register(new Emitter<void>());
	readonly onRequestConnection = this._onRequestConnection.event;
	private readonly _onWillShutdown = this._register(new Emitter<void>());
	readonly onWillShutdown = this._onWillShutdown.event;

	constructor(
		private readonly _reconnectConstants: IReconnectConstants,
		@IConfigurationService private readonly _configurationService: IConfigurationService,
		@IEnvironmentMainService private readonly _environmentMainService: IEnvironmentMainService,
		@ILifecycleMainService private readonly _lifecycleMainService: ILifecycleMainService,
		@ILogService private readonly _logService: ILogService,
		private readonly _getWindow: (id: number) => ICodeWindow | undefined,
		private readonly _getAuxiliaryWindows: () => readonly IAuxiliaryWindow[]
	) {
		super();

		this._register(this._lifecycleMainService.onWillShutdown(() => this._onWillShutdown.fire()));
		// Listen for new windows to establish connection directly to pty host
		const onWindowConnection = (e: IpcMainEvent, ...args: unknown[]) => {
			try { this._onWindowConnection(e, args); } catch (error) { this._logService.error(error); }
		};
		validatedIpcMain.on('vscode:createPtyHostMessageChannel', onWindowConnection);
		this._register(toDisposable(() => {
			validatedIpcMain.removeListener('vscode:createPtyHostMessageChannel', onWindowConnection);
		}));
	}

	start(): IPtyHostConnection {
		this.utilityProcess = new UtilityProcess(this._logService, NullTelemetryService, this._lifecycleMainService);

		const inspectParams = parsePtyHostDebugPort(this._environmentMainService.args, this._environmentMainService.isBuilt);
		const execArgv = inspectParams.port ? [
			'--nolazy',
			`--inspect${inspectParams.break ? '-brk' : ''}=${inspectParams.port}`
		] : undefined;

		this.utilityProcess.start({
			type: 'ptyHost',
			name: 'pty-host',
			entryPoint: 'vs/platform/terminal/node/ptyHostMain',
			execArgv,
			args: ['--logsPath', this._environmentMainService.logsHome.with({ scheme: Schemas.file }).fsPath],
			env: this._createPtyHostConfiguration()
		});

		const port = this.utilityProcess.connect();
		const client = new MessagePortClient(port, 'ptyHost');
		client.registerChannel(ptyNativeParentChannelName, createPtyNativeParentChannel(this._getWindow, this._getAuxiliaryWindows));

		const store = new DisposableStore();
		store.add(client);
		store.add(toDisposable(() => {
			this.utilityProcess?.kill();
			this.utilityProcess?.dispose();
			this.utilityProcess = undefined;
		}));

		return {
			client,
			store,
			onDidProcessExit: this.utilityProcess.onExit
		};
	}

	private _createPtyHostConfiguration() {
		this._environmentMainService.unsetSnapExportedVariables();
		const config: { [key: string]: string } = {
			...deepClone(process.env),
			VSCODE_ESM_ENTRYPOINT: 'vs/platform/terminal/node/ptyHostMain',
			VSCODE_PIPE_LOGGING: 'true',
			VSCODE_VERBOSE_LOGGING: 'true', // transmit console logs from server to client,
			VSCODE_RECONNECT_GRACE_TIME: String(this._reconnectConstants.graceTime),
			VSCODE_RECONNECT_SHORT_GRACE_TIME: String(this._reconnectConstants.shortGraceTime),
			VSCODE_RECONNECT_SCROLLBACK: String(this._reconnectConstants.scrollback),
		};
		const simulatedLatency = this._configurationService.getValue(TerminalSettingId.DeveloperPtyHostLatency);
		if (simulatedLatency && isNumber(simulatedLatency)) {
			config.VSCODE_LATENCY = String(simulatedLatency);
		}
		const startupDelay = this._configurationService.getValue(TerminalSettingId.DeveloperPtyHostStartupDelay);
		if (startupDelay && isNumber(startupDelay)) {
			config.VSCODE_STARTUP_DELAY = String(startupDelay);
		}
		this._environmentMainService.restoreSnapExportedVariables();
		return config;
	}

	private _onWindowConnection(e: IpcMainEvent, args: unknown[]) {
		if (args.length !== 2 || typeof args[0] !== 'string') { throw new Error('Rejected PTY connection arguments'); }
		const nonce = args[0];
		const context = prototypeRequestContext(e, args[1]);
		try {
			const binding = prototypeBinding(context);
			const window = this._getWindow(binding.workbench);
			if (binding.scope.role === 'auxiliary' || window?.webContents !== binding.contents || !window.win || window.win.isDestroyed()) { throw new Error('Rejected PTY native owner'); }
			this._onRequestConnection.fire();
			const port = this.utilityProcess!.connect(undefined, context);
			try { prototypeBinding(context); } catch (error) { port.close(); throw error; }
			e.sender.postMessage('vscode:createPtyHostMessageChannelResult', nonce, [port]);
		} catch (error) {
			try {
				prototypeBinding(context);
				e.sender.send('vscode:createPtyHostMessageChannelResult', { nonce, error: error instanceof Error ? error.message : String(error) });
			} catch { }
			revokePrototypeConnection(context);
			throw error;
		}
	}
}
