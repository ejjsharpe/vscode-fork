/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { extUriBiasedIgnorePathCase } from '../../../base/common/resources.js';
import { URI } from '../../../base/common/uri.js';
import { localize } from '../../../nls.js';
import { Event } from '../../../base/common/event.js';
import { CancellationToken } from '../../../base/common/cancellation.js';
import { createDecorator } from '../../instantiation/common/instantiation.js';
import { IRelayChannel } from './relayTransport.js';
import { devContainerSamples, devContainerSampleUri, IDevContainerRepository, IDevContainerSampleSource } from './devContainerSamples.js';

export const DEV_CONTAINER_AGENT_HOST_CHANNEL = 'devContainerAgentHost';
export const VSCODE_REMOTE_CONTAINERS_SESSION_ENV = 'VSCODE_REMOTE_CONTAINERS_SESSION';

/** Inputs required to start or reuse a workspace's Dev Container Agent Host. */
export interface IDevContainerAgentHostWorkspaceConfig {
	readonly connectionId: string;
	/** Native workspace path; the remote protocol facade also accepts a host URI's path. */
	readonly workspaceFolder: string;
	readonly name: string;
	/** Whether this explicit connection may restart a container stopped after its sessions became idle. */
	readonly resume?: boolean;
	/** Configure the container to permit nested terminal sandboxing. */
	readonly sandboxEnabled?: boolean;
}

export type IDevContainerAgentHostConfig = IDevContainerAgentHostWorkspaceConfig | (Omit<IDevContainerAgentHostWorkspaceConfig, 'workspaceFolder'> & IDevContainerSampleSource);

/** Serializable connection metadata returned to the renderer. */
export interface IDevContainerAgentHostConnectResult {
	readonly connectionId: string;
	readonly address: string;
	readonly name: string;
	readonly remoteWorkspaceFolder: string;
	/** Native source workspace path on the parent host, when reported by the launcher. */
	readonly hostWorkspaceFolder?: string;
	readonly repository?: IDevContainerRepository;
	/** Whether the actual container has the Docker options needed for nested sandboxing. */
	readonly sandboxSupported?: boolean;
	/** Only desktop-local containers may receive the connecting client's trust roots. */
	readonly forwardClientCertificates?: boolean;
}

/** One chunk of output from a Dev Container CLI process. */
export interface IDevContainerAgentHostOutput {
	readonly connectionId: string;
	readonly data: string;
}

/** Docker sandbox prerequisites observed during an attempted connection, including failed startup. */
export interface IDevContainerAgentHostSandboxSupport {
	readonly connectionId: string;
	readonly supported: boolean;
}

export const IDevContainerAgentHostMainService = createDecorator<IDevContainerAgentHostMainService>('devContainerAgentHostMainService');

export interface IDiscoveredDevContainer {
	readonly id: string;
	readonly name: string;
	readonly workspaceFolder?: string;
}

/** Host-side service that owns Dev Container CLI processes and protocol relays. */
export interface IDevContainerAgentHostMainService extends IRelayChannel {
	readonly _serviceBrand: undefined;

	readonly onDidCloseConnection: Event<string>;
	/** Streaming stdout and stderr from Dev Container CLI processes. */
	readonly onDidOutput: Event<IDevContainerAgentHostOutput>;
	readonly onDidChangeSandboxSupport?: Event<IDevContainerAgentHostSandboxSupport>;

	/** Whether Docker can be resolved from the user's shell environment. */
	isDockerAvailable(): Promise<boolean>;
	/** Local desktop discovery only; not exposed by remote protocol clients. */
	listDevContainers?(token: CancellationToken): Promise<readonly IDiscoveredDevContainer[]>;
	connect(config: IDevContainerAgentHostConfig, token?: CancellationToken): Promise<IDevContainerAgentHostConnectResult>;
	disconnect(connectionId: string): Promise<void>;
	stopContainer(source: string | IDevContainerSampleSource, token?: CancellationToken, validate?: () => void): Promise<boolean>;
	removeContainer(source: string | IDevContainerSampleSource, token?: CancellationToken, validate?: () => void): Promise<boolean>;
}

/** Stable source identity used by container operations and IPC ownership checks. */
export function getDevContainerAgentHostSourceKey(source: string | IDevContainerSampleSource): string {
	if (typeof source === 'string') {
		return extUriBiasedIgnorePathCase.getComparisonKey(URI.file(source));
	}
	const sample = devContainerSamples.find(sample => sample.id === source.sampleId);
	if (!sample) {
		throw new Error(localize('devContainerAgentHost.unknownSample', "Unknown Dev Container sample: {0}", source.sampleId));
	}
	return devContainerSampleUri(sample).toString();
}
