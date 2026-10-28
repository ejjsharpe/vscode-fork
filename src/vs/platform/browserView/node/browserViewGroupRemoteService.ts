/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { Event } from '../../../base/common/event.js';
import { Disposable } from '../../../base/common/lifecycle.js';
import { IChannel, ProxyChannel } from '../../../base/parts/ipc/common/ipc.js';
import { IMainProcessService } from '../../ipc/common/mainProcessService.js';
import { IBrowserViewGroup, IBrowserViewGroupFilter, IBrowserViewGroupService, ipcBrowserViewGroupChannelName } from '../common/browserViewGroup.js';
import { IBrowserViewCreationContext } from '../common/browserView.js';
import { CDPEvent, CDPRequest, CDPResponse } from '../common/cdp/types.js';
import { ISandboxNetworkRestrictions } from '../../sandbox/common/sandboxSettingsResolutionHelper.js';

/**
 * Remote-process service for managing browser view groups.
 *
 * Connects to the main-process {@link BrowserViewGroupMainService} via
 * IPC and provides {@link IBrowserViewGroup} instances for
 * interacting with groups.
 *
 * Usable from the shared process.
 */
export interface IBrowserViewGroupRemoteService {
	setSessionNetworkRestrictions(sessionId: string, restrictions: ISandboxNetworkRestrictions): Promise<void>;
	/**
	 * Create a new browser view group.
	 */
	createGroup(filter: IBrowserViewGroupFilter, targetContext: IBrowserViewCreationContext): Promise<IBrowserViewGroup>;
}

/**
 * Remote proxy for a browser view group living in the main process.
 */
class RemoteBrowserViewGroup extends Disposable implements IBrowserViewGroup {
	constructor(
		readonly id: string,
		private readonly groupService: IBrowserViewGroupService,
		private readonly validateOwner: () => void,
	) {
		super();

		this._register(groupService.onDynamicDidDestroy(this.id)(() => {
			// Avoid loops
			this.dispose(true);
		}));
	}

	get onDidDestroy(): Event<void> {
		return this.groupService.onDynamicDidDestroy(this.id);
	}

	async sendCDPMessage(msg: CDPRequest): Promise<void> {
		return this.groupService.sendCDPMessage(this.id, msg);
	}

	get onCDPMessage(): Event<CDPResponse | CDPEvent> {
		return this.groupService.onDynamicCDPMessage(this.id);
	}

	override dispose(fromService = false): void {
		if (!fromService) {
			try { this.validateOwner(); }
			catch { super.dispose(); return; } // Main releases groups when their original authority expires.
			void this.groupService.destroyGroup(this.id);
		}
		super.dispose();
	}
}

export class BrowserViewGroupRemoteService implements IBrowserViewGroupRemoteService {
	private readonly _groupService: IBrowserViewGroupService;
	private readonly _groups = new Map<string, IBrowserViewGroup>();

	constructor(
		mainProcessService: IMainProcessService,
		nativeConnectionContext?: string,
		private readonly validateOwner: () => void = () => {},
	) {
		const source = mainProcessService.getChannel(ipcBrowserViewGroupChannelName);
		const channel: IChannel = nativeConnectionContext ? {
			call: async (command, args, token) => {
				this.validateOwner();
				const result = await source.call(command, [...(Array.isArray(args) ? args : []), { nativeConnectionContext }], token);
				this.validateOwner();
				return result as never;
			},
			listen: (event, id) => Event.filter(source.listen(event, { id, nativeConnectionContext }), () => {
				try { this.validateOwner(); return true; } catch { return false; }
			})
		} : source;
		this._groupService = ProxyChannel.toService<IBrowserViewGroupService>(channel);
	}

	async createGroup(filter: IBrowserViewGroupFilter, targetContext: IBrowserViewCreationContext): Promise<IBrowserViewGroup> {
		const id = await this._groupService.createGroup(filter, targetContext);
		return this._wrap(id);
	}

	setSessionNetworkRestrictions(sessionId: string, restrictions: ISandboxNetworkRestrictions): Promise<void> {
		return this._groupService.setSessionNetworkRestrictions(sessionId, restrictions);
	}

	private _wrap(id: string): IBrowserViewGroup {
		const group = new RemoteBrowserViewGroup(id, this._groupService, this.validateOwner);
		this._groups.set(id, group);

		Event.once(group.onDidDestroy)(() => {
			this._groups.delete(id);
		});

		return group;
	}
}
