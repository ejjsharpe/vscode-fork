/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

(function () {

	const { ipcRenderer, webFrame, contextBridge } = require('electron');
	let documentNonce: string | undefined;
	let authorizeDocument!: () => void;
	const documentAuthorized = new Promise<void>(resolve => { authorizeDocument = resolve; });
	ipcRenderer.once('vscode:prototype-bootstrap', (_event: Electron.IpcRendererEvent, nonce: string) => {
		documentNonce = nonce;
		authorizeDocument();
	});

	function validateIPC(channel: string): true | never {
		if (!channel?.startsWith('vscode:')) {
			throw new Error(`Unsupported event IPC channel '${channel}'`);
		}

		return true;
	}

	const globals = {

		/**
		 * A minimal set of methods exposed from Electron's `ipcRenderer`
		 * to support communication to main process.
		 */
		ipcRenderer: {

			send(channel: string, ...args: unknown[]): void {
				if (validateIPC(channel)) {
					ipcRenderer.send(channel, ...args);
				}
			},

			async invoke(channel: string, ...args: unknown[]): Promise<unknown> {
				validateIPC(channel);
				if (channel === 'vscode:registerAuxiliaryWindow') {
					await documentAuthorized;
					return ipcRenderer.invoke(channel, ...args, documentNonce);
				}
				return ipcRenderer.invoke(channel, ...args);
			}
		},

		/**
		 * Support for subset of methods of Electron's `webFrame` type.
		 */
		webFrame: {

			setZoomLevel(level: number): void {
				if (typeof level === 'number') {
					webFrame.setZoomLevel(level);
				}
			}
		}
	};

	try {
		contextBridge.exposeInMainWorld('vscode', globals);
	} catch (error) {
		console.error(error);
	}
}());
