/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { DisposableStore } from '../../../base/common/lifecycle.js';
import { IServerChannel } from '../../../base/parts/ipc/common/ipc.js';
import { IDevContainerAgentHostMainService } from './devContainerAgentHost.js';
import { createOwnedDevContainerAgentHostChannel, IRemoteAgentHostChannelAuthority } from './remoteAgentHostIpc.js';

/** Keeps discovery cancellation out of ProxyChannel's serialized method arguments. */
export function createDevContainerAgentHostChannel(service: IDevContainerAgentHostMainService, store: DisposableStore, authority: IRemoteAgentHostChannelAuthority): IServerChannel<string> {
	return createOwnedDevContainerAgentHostChannel(service, store, authority);
}
