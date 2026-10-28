/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { Emitter, Event } from '../../../base/common/event.js';
import { Disposable } from '../../../base/common/lifecycle.js';
import { revive } from '../../../base/common/marshalling.js';
import { IServerChannel } from '../../../base/parts/ipc/common/ipc.js';
import { ILogService } from '../../log/common/log.js';
import { IBaseSerializableStorageRequest, ISerializableCompareAndSwapRequest, ISerializableCompareAndSwapResult, ISerializableGetValueRequest, ISerializableItemsChangeEvent, ISerializableUpdateRequest, Key, Value } from '../common/storageIpc.js';
import { ApplicationSharedStorageMain, IStorageChangeEvent, IStorageMain } from './storageMain.js';
import { IStorageMainService } from './storageMainService.js';
import { IUserDataProfile } from '../../userDataProfile/common/userDataProfile.js';
import { reviveIdentifier, IAnyWorkspaceIdentifier, isSingleFolderWorkspaceIdentifier, isWorkspaceIdentifier } from '../../workspace/common/workspace.js';
import { isEqual } from '../../../base/common/resources.js';

export class StorageDatabaseChannel extends Disposable implements IServerChannel {

	private static readonly STORAGE_CHANGE_DEBOUNCE_TIME = 100;

	private readonly onDidChangeApplicationStorageEmitter = this._register(new Emitter<ISerializableItemsChangeEvent>());
	private readonly onDidChangeApplicationSharedStorageEmitter = this._register(new Emitter<ISerializableItemsChangeEvent>());

	private readonly mapProfileToOnDidChangeProfileStorageEmitter = new Map<string /* profile ID */, Emitter<ISerializableItemsChangeEvent>>();

	constructor(
		private readonly logService: ILogService,
		private readonly storageMainService: IStorageMainService,
		private readonly resolveScope?: (context: unknown) => { profile: IUserDataProfile; workspace: IAnyWorkspaceIdentifier } | undefined
	) {
		super();

		this.registerStorageChangeListeners(storageMainService.applicationStorage, this.onDidChangeApplicationStorageEmitter);
		this.registerStorageChangeListeners(storageMainService.applicationSharedStorage, this.onDidChangeApplicationSharedStorageEmitter);
	}

	//#region Storage Change Events

	private registerStorageChangeListeners(storage: IStorageMain, emitter: Emitter<ISerializableItemsChangeEvent>): void {

		// Listen for changes in provided storage to send to listeners
		// that are listening. Use a debouncer to reduce IPC traffic.

		this._register(Event.debounce(storage.onDidChangeStorage, (prev: IStorageChangeEvent[] | undefined, cur: IStorageChangeEvent) => {
			if (!prev) {
				prev = [cur];
			} else {
				prev.push(cur);
			}

			return prev;
		}, StorageDatabaseChannel.STORAGE_CHANGE_DEBOUNCE_TIME)(events => {
			if (events.length) {
				emitter.fire(this.serializeStorageChangeEvents(events, storage));
			}
		}));
	}

	private serializeStorageChangeEvents(events: IStorageChangeEvent[], storage: IStorageMain): ISerializableItemsChangeEvent {
		const changed = new Map<Key, Value>();
		const deleted = new Set<Key>();
		events.forEach(event => {
			const existing = storage.get(event.key);
			if (typeof existing === 'string') {
				changed.set(event.key, existing);
			} else {
				deleted.add(event.key);
			}
		});

		return {
			changed: Array.from(changed.entries()),
			deleted: Array.from(deleted.values())
		};
	}

	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	listen(context: unknown, event: string, arg: IBaseSerializableStorageRequest): Event<any> {
		arg = this.authorize(context, arg);
		switch (event) {
			case 'onDidChangeStorage': {
				const profile = arg.profile ? revive<IUserDataProfile>(arg.profile) : undefined;

				// Without profile: application or application-shared scope
				if (!profile) {
					if (arg.applicationShared) {
						return this.currentEvents(context, this.onDidChangeApplicationSharedStorageEmitter.event);
					}

					return this.currentEvents(context, this.onDidChangeApplicationStorageEmitter.event);
				}

				// With profile: profile scope for the profile
				let profileStorageChangeEmitter = this.mapProfileToOnDidChangeProfileStorageEmitter.get(profile.id);
				if (!profileStorageChangeEmitter) {
					profileStorageChangeEmitter = this._register(new Emitter<ISerializableItemsChangeEvent>());
					this.registerStorageChangeListeners(this.storageMainService.profileStorage(profile), profileStorageChangeEmitter);
					this.mapProfileToOnDidChangeProfileStorageEmitter.set(profile.id, profileStorageChangeEmitter);
				}

				return this.currentEvents(context, profileStorageChangeEmitter.event);
			}
		}

		throw new Error(`Event not found: ${event}`);
	}

	//#endregion

	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	async call(context: unknown, command: string, arg: IBaseSerializableStorageRequest): Promise<any> {
		arg = this.authorize(context, arg);
		const profile = arg.profile ? revive<IUserDataProfile>(arg.profile) : undefined;
		const workspace = reviveIdentifier(arg.workspace);
		const applicationShared = arg.applicationShared;

		// Get storage to be ready
		const storage = await this.withStorageInitialized(profile, workspace, applicationShared);
		this.resolveScope?.(context);

		// handle call
		switch (command) {
			case 'getItems': {
				const items = new Map(storage.items);
				return Array.from(items.entries());
			}

			case 'getValue': {
				const request = arg as ISerializableGetValueRequest;
				return storage.get(request.key);
			}

			case 'getFallbackApplicationStorageItems': {
				if (storage instanceof ApplicationSharedStorageMain) {
					return Array.from(storage.applicationStorageItems.entries());
				}
				return [];
			}

			case 'updateItems': {
				const items: ISerializableUpdateRequest = arg;

				if (items.insert) {
					for (const [key, value] of items.insert) {
						storage.set(key, value);
					}
				}

				items.delete?.forEach(key => storage.delete(key));

				break;
			}

			case 'compareAndSwap': {
				const request = arg as ISerializableCompareAndSwapRequest;
				const currentValue = storage.get(request.key);
				if (currentValue !== request.expectedValue) {
					const result: ISerializableCompareAndSwapResult = { swapped: false, currentValue };
					return result;
				}

				storage.set(request.key, request.newValue);
				const result: ISerializableCompareAndSwapResult = { swapped: true, currentValue: request.newValue };
				return result;
			}

			case 'optimize': {
				return storage.optimize();
			}

			case 'isUsed': {
				const path = arg.payload as string | undefined;
				if (typeof path === 'string') {
					return this.storageMainService.isUsed(path);
				}
				return false;
			}

			default:
				throw new Error(`Call not found: ${command}`);
		}
	}

	private authorize(context: unknown, arg: IBaseSerializableStorageRequest): IBaseSerializableStorageRequest {
		const scope = this.resolveScope?.(context);
		if (!scope) { return arg; }
		if (!arg || typeof arg !== 'object') { throw new Error('Rejected storage request'); }
		if (arg.profile) {
			const requested = revive<IUserDataProfile>(arg.profile);
			if (requested.id !== scope.profile.id) { throw new Error('Rejected foreign storage profile'); }
			if (!isEqual(requested.location, scope.profile.location) || !isEqual(requested.globalStorageHome, scope.profile.globalStorageHome)) { throw new Error('Rejected forged storage profile'); }
		}
		if (arg.workspace) {
			const requested = reviveIdentifier(arg.workspace)!;
			if (requested.id !== scope.workspace.id) { throw new Error('Rejected foreign storage workspace'); }
			const requestedKind = isSingleFolderWorkspaceIdentifier(requested) ? 'folder' : isWorkspaceIdentifier(requested) ? 'workspace' : 'empty';
			const actualKind = isSingleFolderWorkspaceIdentifier(scope.workspace) ? 'folder' : isWorkspaceIdentifier(scope.workspace) ? 'workspace' : 'empty';
			const requestedUri = isSingleFolderWorkspaceIdentifier(requested) ? requested.uri : isWorkspaceIdentifier(requested) ? requested.configPath : undefined;
			const actualUri = isSingleFolderWorkspaceIdentifier(scope.workspace) ? scope.workspace.uri : isWorkspaceIdentifier(scope.workspace) ? scope.workspace.configPath : undefined;
			if (requestedKind !== actualKind || !isEqual(requestedUri, actualUri)) { throw new Error('Rejected forged storage workspace'); }
		}
		return { ...arg, ...(arg.profile ? { profile: scope.profile } : {}), ...(arg.workspace ? { workspace: scope.workspace } : {}) };
	}

	private currentEvents<T>(context: unknown, event: Event<T>): Event<T> {
		return Event.filter(event, () => {
			try { this.resolveScope?.(context); return true; } catch { return false; }
		});
	}

	private async withStorageInitialized(profile: IUserDataProfile | undefined, workspace: IAnyWorkspaceIdentifier | undefined, applicationShared?: boolean): Promise<IStorageMain> {
		let storage: IStorageMain;
		if (workspace) {
			storage = this.storageMainService.workspaceStorage(workspace);
		} else if (profile) {
			storage = this.storageMainService.profileStorage(profile);
		} else if (applicationShared) {
			storage = this.storageMainService.applicationSharedStorage;
		} else {
			storage = this.storageMainService.applicationStorage;
		}

		try {
			await storage.init();
		} catch (error) {
			this.logService.error(`StorageIPC#init: Unable to init ${workspace ? 'workspace' : profile ? 'profile' : applicationShared ? 'application-shared' : 'application'} storage due to ${error}`);
		}

		return storage;
	}
}
