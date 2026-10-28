/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { IpcMainEvent, Menu, MenuItem } from 'electron';
import { onPrototypeDocumentRevoked, prototypeDocumentGeneration, prototypeDocumentOwnsReply } from '../../ipc/electron-main/prototypeLifetime.js';
import { validatedIpcMain } from '../../ipc/electron-main/ipcMain.js';
import { CONTEXT_MENU_CHANNEL, CONTEXT_MENU_CLOSE_CHANNEL, IPopupOptions, ISerializableContextMenuItem } from '../common/contextmenu.js';

export function registerContextMenuListener(): void {
	validatedIpcMain.on(CONTEXT_MENU_CHANNEL, (event: IpcMainEvent, contextMenuId: number, items: ISerializableContextMenuItem[], onClickChannel: string, options: IPopupOptions | undefined, nonce: unknown, ...extra: unknown[]) => {
		const generation = prototypeDocumentGeneration(event.sender);
		if (generation === undefined || extra.length || !Number.isSafeInteger(contextMenuId) || contextMenuId < 0 || onClickChannel !== `vscode:onContextMenu${contextMenuId}` || !Array.isArray(items) || !prototypeDocumentOwnsReply(event.sender, generation, event, nonce)) {
			return;
		}

		let active = true;
		const send = (channel: string, ...args: unknown[]) => {
			if (active && prototypeDocumentOwnsReply(event.sender, generation, event, nonce)) {
				event.sender.send(channel, ...args);
			}
		};
		const menu = createMenu(send, onClickChannel, items);
		const revocation = onPrototypeDocumentRevoked(document => {
			if (document.contents === event.sender && document.generation === generation) {
				active = false;
				revocation.dispose();
				menu.closePopup();
			}
		});

		try {
			menu.popup({
				x: options?.x,
				y: options?.y,
				positioningItem: options?.positioningItem,
				callback: () => {
					// Retain the native menu until dismissal (microsoft/vscode#72447).
					if (menu && active) {
						send(onClickChannel, -1);
						send(CONTEXT_MENU_CLOSE_CHANNEL, contextMenuId);
					}
					active = false;
					revocation.dispose();
				}
			});
		} catch (error) {
			active = false;
			revocation.dispose();
			throw error;
		}
	});
}

function createMenu(send: (channel: string, ...args: unknown[]) => void, onClickChannel: string, items: ISerializableContextMenuItem[]): Menu {
	const menu = new Menu();

	items.forEach(item => {
		let menuitem: MenuItem;

		// Separator
		if (item.type === 'separator') {
			menuitem = new MenuItem({
				type: item.type,
			});
		}

		// Sub Menu
		else if (Array.isArray(item.submenu)) {
			menuitem = new MenuItem({
				submenu: createMenu(send, onClickChannel, item.submenu),
				label: item.label
			});
		}

		// Normal Menu Item
		else {
			menuitem = new MenuItem({
				label: item.label,
				type: item.type,
				accelerator: item.accelerator,
				checked: item.checked,
				enabled: item.enabled,
				visible: item.visible,
				click: (menuItem, win, contextmenuEvent) => send(onClickChannel, item.id, contextmenuEvent)
			});
		}

		menu.append(menuitem);
	});

	return menu;
}
