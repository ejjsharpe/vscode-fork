/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { onUnexpectedError } from '../../../base/common/errors.js';
import { Event } from '../../../base/common/event.js';
import { Disposable } from '../../../base/common/lifecycle.js';
import { IServerChannel } from '../../../base/parts/ipc/common/ipc.js';
import { IMessagePortConnectionScope } from '../../../base/parts/ipc/common/ipc.mp.js';
import { ISharedProcessTunnelService } from '../../remote/common/sharedProcessTunnelService.js';

/** Tunnel IDs are leases of the authenticated connection that allocated them. */
export class SharedProcessTunnelChannel extends Disposable implements IServerChannel<string> {
	private readonly owners = new Map<string, { ctx: string; started: boolean }>();

	constructor(onDidRemoveConnection: Event<{ ctx: string }>, private readonly service: ISharedProcessTunnelService, private readonly getScope: (ctx: string) => IMessagePortConnectionScope | undefined) {
		super();
		this._register(onDidRemoveConnection(({ ctx }) => {
			for (const [id, owner] of this.owners) {
				if (owner.ctx === ctx) { this.release(id); }
			}
		}));
	}

	private validate(ctx: string): IMessagePortConnectionScope | undefined {
		const scope = this.getScope(ctx);
		if (this._store.isDisposed || scope?.role === 'auxiliary') { throw new Error('Tunnel connection expired or unavailable'); }
		return scope;
	}

	private release(id: string): void {
		this.owners.delete(id);
		void this.service.destroyTunnel(id).catch(onUnexpectedError);
	}

	async call<T>(ctx: string, command: string, args: unknown[] = []): Promise<T> {
		const scope = this.validate(ctx);
		if (command === 'createTunnel') {
			const result = await this.service.createTunnel();
			try { this.validate(ctx); }
			catch (error) { await this.service.destroyTunnel(result.id); throw error; }
			this.owners.set(result.id, { ctx, started: false });
			return result as T;
		}
		if (!['startTunnel', 'setAddress', 'destroyTunnel'].includes(command)) { throw new Error('Unknown tunnel command'); }
		const id = args[command === 'startTunnel' ? 1 : 0];
		if (typeof id !== 'string' || this.owners.get(id)?.ctx !== ctx) { throw new Error('Foreign or expired tunnel'); }
		let result: unknown;
		switch (command) {
			case 'startTunnel': {
				if (scope?.role === 'project' && scope.remoteAuthority !== args[0]) { throw new Error('Foreign tunnel authority'); }
				const owner = this.owners.get(id)!;
				if (owner.started) { throw new Error('Tunnel already started'); }
				owner.started = true;
				result = await this.service.startTunnel(...args as Parameters<ISharedProcessTunnelService['startTunnel']>);
				break;
			}
			case 'setAddress': result = await this.service.setAddress(...args as Parameters<ISharedProcessTunnelService['setAddress']>); break;
			case 'destroyTunnel':
				this.owners.delete(id);
				result = await this.service.destroyTunnel(id);
				break;
		}
		try { this.validate(ctx); }
		catch (error) { if (this.owners.has(id)) { this.release(id); } throw error; }
		return result as T;
	}

	listen<T>(): Event<T> { throw new Error('Unknown tunnel event'); }

	override dispose(): void {
		for (const id of this.owners.keys()) { this.release(id); }
		super.dispose();
	}
}
