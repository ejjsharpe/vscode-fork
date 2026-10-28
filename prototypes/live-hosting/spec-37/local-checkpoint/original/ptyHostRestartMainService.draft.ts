/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { basename } from '../../../base/common/resources.js';
import { prototypeBinding, prototypeDocumentGeneration } from '../../../base/parts/ipc/electron-main/prototypeLifetime.js';
import { localize } from '../../../nls.js';
import { IDialogMainService } from '../../dialogs/electron-main/dialogMainService.js';
import { ICodeWindow } from '../../window/electron-main/window.js';
import { IWindowsMainService } from '../../windows/electron-main/windows.js';
import { isSingleFolderWorkspaceIdentifier, isWorkspaceIdentifier } from '../../workspace/common/workspace.js';

/** The existing renderer recovery control requests one explicitly confirmed app-wide restart. */
export class PtyHostRestartMainService {
	private pending: Promise<void> | undefined;

	constructor(private readonly windows: IWindowsMainService, private readonly dialogs: IDialogMainService, private readonly restart: () => Promise<void>) { }

	request(context: string): Promise<void> {
		this.caller(context);
		if (!this.pending) {
			// Install the shared operation before dispatch, including synchronous dialog reentry.
			const attempt = Promise.resolve().then(() => this.confirmAndRestart(context));
			this.pending = attempt;
			const clear = () => { if (this.pending === attempt) { this.pending = undefined; } };
			void attempt.then(clear, clear);
		}
		return this.pending.then(() => { this.caller(context); });
	}

	private caller(context: string): ICodeWindow {
		const binding = prototypeBinding(context);
		const window = this.windows.getWindowById(binding.workbench);
		if (binding.scope.role === 'auxiliary' || window?.webContents !== binding.contents || !window.win || window.win.isDestroyed()) { throw new Error('Rejected terminal restart owner'); }
		return window;
	}

	private async confirmAndRestart(context: string): Promise<void> {
		const caller = this.caller(context);
		const affected = this.windows.getWindows().map(window => ({ window, contents: window.webContents, generation: prototypeDocumentGeneration(window.webContents) }));
		const validate = () => {
			this.caller(context);
			const current = this.windows.getWindows();
			if (current.length !== affected.length || affected.some(entry => !current.includes(entry.window) || entry.window.webContents !== entry.contents || entry.contents.isDestroyed() || prototypeDocumentGeneration(entry.contents) !== entry.generation)) {
				throw new Error(localize('terminalRestartChanged', "Projects changed while confirming the terminal restart. Run the command again."));
			}
		};
		const names = affected.map(({ window }) => {
			if (window.config?.isSessionsWindow) { return localize('terminalRestartAgents', "Agents"); }
			const workspace = window.openedWorkspace;
			return isSingleFolderWorkspaceIdentifier(workspace) ? basename(workspace.uri) : isWorkspaceIdentifier(workspace) ? basename(workspace.configPath) : localize('terminalRestartEmpty', "Empty Project");
		});
		validate();
		const result = await this.dialogs.showMessageBox({
			type: 'warning',
			message: localize('terminalRestartAll', "Restart the terminal host for all projects?"),
			detail: localize('terminalRestartImpact', "All local terminal processes will stop. Tasks and debug sessions using those terminals may be interrupted.") + '\n\n' + names.join('\n'),
			buttons: [localize('terminalRestartButton', "&&Restart Terminal Host"), localize('terminalRestartCancel', "Cancel")],
			defaultId: 1,
			cancelId: 1,
			noLink: true
		}, caller.win!, validate);
		validate();
		if (result.response !== 0) { return; }
		await this.restart();
	}
}
