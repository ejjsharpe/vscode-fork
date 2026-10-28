/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { createDecorator, IInstantiationService } from '../../instantiation/common/instantiation.js';
import { ILifecycleMainService, LifecycleMainPhase } from '../../lifecycle/electron-main/lifecycleMainService.js';
import { ILogService } from '../../log/common/log.js';
import { ICommonMenubarService, IMenubarData } from '../common/menubar.js';
import { Menubar } from './menubar.js';
import { IWindowsMainService } from '../../windows/electron-main/windows.js';
import { prototypeDocumentGeneration } from '../../../base/parts/ipc/electron-main/prototypeLifetime.js';
import { Disposable } from '../../../base/common/lifecycle.js';

export const IMenubarMainService = createDecorator<IMenubarMainService>('menubarMainService');

export interface IMenubarMainService extends ICommonMenubarService {
	readonly _serviceBrand: undefined;
}

export class MenubarMainService extends Disposable implements IMenubarMainService {

	declare readonly _serviceBrand: undefined;

	private readonly menubar: Promise<Menubar>;

	constructor(
		@IInstantiationService private readonly instantiationService: IInstantiationService,
		@ILifecycleMainService private readonly lifecycleMainService: ILifecycleMainService,
		@ILogService private readonly logService: ILogService,
		@IWindowsMainService private readonly windowsMainService: IWindowsMainService
	) {
		super();

		this.menubar = this.installMenuBarAfterWindowOpen();
	}

	private async installMenuBarAfterWindowOpen(): Promise<Menubar> {
		await this.lifecycleMainService.when(LifecycleMainPhase.AfterWindowOpen);

		return this._register(this.instantiationService.createInstance(Menubar));
	}

	async updateMenubar(windowId: number, menus: IMenubarData): Promise<void> {
		this.logService.trace('menubarService#updateMenubar', windowId);

		const window = this.windowsMainService.getWindowById(windowId);
		const contents = window?.webContents;
		const generation = contents && prototypeDocumentGeneration(contents);
		const menubar = await this.menubar;
		if (!contents || contents.isDestroyed() || window?.webContents !== contents || generation === undefined || prototypeDocumentGeneration(contents) !== generation) {
			throw new Error('Rejected expired native menu owner');
		}
		menubar.updateMenu(menus, windowId);
	}
}
