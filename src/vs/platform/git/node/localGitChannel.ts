/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { onUnexpectedError } from '../../../base/common/errors.js';
import { Event } from '../../../base/common/event.js';
import { Disposable } from '../../../base/common/lifecycle.js';
import { generateUuid } from '../../../base/common/uuid.js';
import { IServerChannel } from '../../../base/parts/ipc/common/ipc.js';
import { LocalGitService } from './localGitService.js';

/** Cancellation IDs and multi-command Git work belong to one live connection. */
export class LocalGitChannel extends Disposable implements IServerChannel<string> {
	private readonly operations = new Map<string, { ctx: string; id: string; live: boolean }>();

	constructor(private readonly service: LocalGitService, onDidRemoveConnection: Event<{ ctx: string }>, private readonly validate: (ctx: string) => void) {
		super();
		this._register(onDidRemoveConnection(({ ctx }) => {
			for (const operation of this.operations.values()) {
				if (operation.ctx === ctx) { operation.live = false; void service.cancel(operation.id).catch(onUnexpectedError); }
			}
		}));
	}

	async call<T>(ctx: string, command: string, args: unknown[] = []): Promise<T> {
		this.validate(ctx);
		const readonly = command === 'revParse' || command === 'revListCount';
		if (readonly && (args.length !== (command === 'revParse' ? 2 : 3) || args.some(arg => typeof arg !== 'string'))) { throw new Error('Invalid readonly Git arguments'); }
		if (!readonly && !['clone', 'pull', 'checkout', 'checkoutCommit', 'getRemoteUrl', 'fetch', 'cancel'].includes(command)) { throw new Error('Unknown Git command'); }
		const clientId = readonly ? generateUuid() : args[0];
		if (typeof clientId !== 'string') { throw new Error('Invalid Git operation'); }
		const key = `${ctx}\0${clientId}`;
		if (command === 'cancel') {
			const operation = this.operations.get(key);
			if (!operation?.live) { throw new Error('Foreign or expired Git operation'); }
			operation.live = false;
			await this.service.cancel(operation.id);
			return undefined as T;
		}
		if (this.operations.has(key)) { throw new Error('Git operation already running'); }
		const operation = { ctx, id: generateUuid(), live: true };
		this.operations.set(key, operation);
		const nativeArgs = readonly ? [...args, operation.id] : [operation.id, ...args.slice(1)];
		const validate = () => {
			this.validate(ctx);
			if (!operation.live || this._store.isDisposed) { throw new Error('Git operation expired'); }
		};
		try {
			const result = await this.service.runWithAuthority(operation.id, validate, async () => {
				switch (command) {
					case 'clone': return this.service.clone(...nativeArgs as Parameters<LocalGitService['clone']>);
					case 'pull': return this.service.pull(...nativeArgs as Parameters<LocalGitService['pull']>);
					case 'checkout': return this.service.checkout(...nativeArgs as Parameters<LocalGitService['checkout']>);
					case 'checkoutCommit': return this.service.checkoutCommit(...nativeArgs as Parameters<LocalGitService['checkoutCommit']>);
					case 'getRemoteUrl': return this.service.getRemoteUrl(...nativeArgs as Parameters<LocalGitService['getRemoteUrl']>);
					case 'fetch': return this.service.fetch(...nativeArgs as Parameters<LocalGitService['fetch']>);
					case 'revParse': return this.service.revParse(...nativeArgs as Parameters<LocalGitService['revParse']>);
					case 'revListCount': return this.service.revListCount(...nativeArgs as Parameters<LocalGitService['revListCount']>);
					default: throw new Error('Unknown Git command');
				}
			});
			validate();
			return result as T;
		} finally { this.operations.delete(key); }
	}

	listen<T>(): Event<T> { throw new Error('Unknown Git event'); }

	override dispose(): void {
		for (const operation of this.operations.values()) { operation.live = false; void this.service.cancel(operation.id).catch(onUnexpectedError); }
		super.dispose();
	}
}
