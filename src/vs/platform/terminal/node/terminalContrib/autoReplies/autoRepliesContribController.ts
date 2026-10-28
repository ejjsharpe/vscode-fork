/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { ILogService } from '../../../../log/common/log.js';
import type { IPtyServiceContribution, ITerminalChildProcess } from '../../../common/terminal.js';
import { TerminalAutoResponder } from './terminalAutoResponder.js';

export class AutoRepliesPtyServiceContribution implements IPtyServiceContribution {
	private readonly _autoReplies: Map<number | undefined, Map<string, string>> = new Map();
	private readonly _terminalProcesses: Map<number, { process: ITerminalChildProcess; workbench?: number }> = new Map();
	private readonly _autoResponders: Map<number, Map<string, TerminalAutoResponder>> = new Map();

	constructor(
		@ILogService private readonly _logService: ILogService
	) {
	}

	async installAutoReply(match: string, reply: string, workbench?: number) {
		let replies = this._autoReplies.get(workbench);
		if (!replies) { replies = new Map(); this._autoReplies.set(workbench, replies); }
		replies.set(match, reply);
		// If the auto reply exists on any existing terminals it will be overridden
		for (const persistentProcessId of this._autoResponders.keys()) {
			const entry = this._terminalProcesses.get(persistentProcessId);
			if (!entry) {
				this._logService.error('Could not find terminal process to install auto reply');
				continue;
			}
			if (entry.workbench === workbench) { this._processInstallAutoReply(persistentProcessId, entry.process, match, reply); }
		}
	}

	async uninstallAllAutoReplies(workbench?: number) {
		this._autoReplies.delete(workbench);
		for (const [id, entry] of this._terminalProcesses) {
			if (entry.workbench !== workbench) { continue; }
			const responders = this._autoResponders.get(id);
			for (const responder of responders?.values() ?? []) { responder.dispose(); }
			responders?.clear();
		}
	}

	handleProcessReady(persistentProcessId: number, process: ITerminalChildProcess, workbench?: number): void {
		// Ready fires again when a persistent process is reattached, dispose the old responders
		const existingAutoResponders = this._autoResponders.get(persistentProcessId);
		if (existingAutoResponders) {
			for (const e of existingAutoResponders.values()) {
				e.dispose();
			}
		}
		this._terminalProcesses.set(persistentProcessId, { process, workbench });
		this._autoResponders.set(persistentProcessId, new Map());
		for (const [match, reply] of this._autoReplies.get(workbench)?.entries() ?? []) {
			this._processInstallAutoReply(persistentProcessId, process, match, reply);
		}
	}

	handleProcessDispose(persistentProcessId: number): void {
		const processAutoResponders = this._autoResponders.get(persistentProcessId);
		if (processAutoResponders) {
			for (const e of processAutoResponders.values()) {
				e.dispose();
			}
			processAutoResponders.clear();
		}
		this._autoResponders.delete(persistentProcessId);
		this._terminalProcesses.delete(persistentProcessId);
	}

	handleProcessInput(persistentProcessId: number, data: string) {
		const processAutoResponders = this._autoResponders.get(persistentProcessId);
		if (processAutoResponders) {
			for (const listener of processAutoResponders.values()) {
				listener.handleInput();
			}
		}
	}

	handleProcessResize(persistentProcessId: number, cols: number, rows: number) {
		const processAutoResponders = this._autoResponders.get(persistentProcessId);
		if (processAutoResponders) {
			for (const listener of processAutoResponders.values()) {
				listener.handleResize();
			}
		}
	}

	private _processInstallAutoReply(persistentProcessId: number, terminalProcess: ITerminalChildProcess, match: string, reply: string) {
		const processAutoResponders = this._autoResponders.get(persistentProcessId);
		if (processAutoResponders) {
			processAutoResponders.get(match)?.dispose();
			processAutoResponders.set(match, new TerminalAutoResponder(terminalProcess, match, reply, this._logService));
		}
	}
}
