/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { Event } from '../../../base/common/event.js';
import { CancellationToken } from '../../../base/common/cancellation.js';
import { IServerChannel } from '../../../base/parts/ipc/common/ipc.js';

/** Application capabilities retain their existing service scopes and require a live workbench. */
export class SharedProcessChannel implements IServerChannel<string> {
	constructor(private readonly channel: IServerChannel<string>, private readonly validate: (ctx: string) => void, private readonly commands?: readonly string[], private readonly events?: readonly string[]) { }
	async call<T>(ctx: string, command: string, arg?: unknown, token?: CancellationToken): Promise<T> {
		this.validate(ctx);
		if (this.commands && !this.commands.includes(command)) { throw new Error(`Unknown shared-process command: ${command}`); }
		const result = await this.channel.call<T>(ctx, command, arg, token);
		this.validate(ctx);
		return result;
	}
	listen<T>(ctx: string, event: string, arg?: unknown): Event<T> {
		this.validate(ctx);
		if (this.events && !this.events.includes(event)) { throw new Error(`Unknown shared-process event: ${event}`); }
		return Event.filter(this.channel.listen<T>(ctx, event, arg), () => {
			try { this.validate(ctx); return true; } catch { return false; }
		});
	}
}
