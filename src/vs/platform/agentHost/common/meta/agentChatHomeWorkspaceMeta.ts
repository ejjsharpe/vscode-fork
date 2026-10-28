/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { CHAT_HOME_WORKSPACE_METADATA_KEY, CHAT_HOME_WORKSPACES_METADATA_KEY, ChatHomeWorkspace, chatHomeWorkspaceValidator, readChatHomeWorkspace, readChatHomeWorkspaceFromMeta, withChatHomeWorkspace } from '../../../workspace/common/chatHomeWorkspace.js';

export const AgentHostChatHomeWorkspaceCapabilityMetaKey = 'vscode.chatHomeWorkspacePersistence';

/** Creation must not claim an exact home when an older host would ignore it. */
export function supportsAgentHostChatHomeWorkspace(source: { readonly _meta?: Readonly<Record<string, unknown>> } | undefined): boolean {
	return source?._meta?.[AgentHostChatHomeWorkspaceCapabilityMetaKey] === true;
}

/** Reads an explicit creation choice, distinguishing absence from invalid remote metadata. */
export function readInitialChatHomeWorkspaceMeta(source: { readonly _meta?: Readonly<Record<string, unknown>> } | undefined): ChatHomeWorkspace | undefined | 'invalid' {
	if (!source?._meta || !Object.hasOwn(source._meta, CHAT_HOME_WORKSPACE_METADATA_KEY)) {
		return undefined;
	}
	const validated = chatHomeWorkspaceValidator.validate(source._meta[CHAT_HOME_WORKSPACE_METADATA_KEY]);
	return validated.error ? 'invalid' : validated.content;
}

/** Weak discovery cannot erase an explicit recorded home or intentional No Workspace. */
export function retainRecordedChatHomeWorkspaces(previous: Readonly<Record<string, unknown>> | undefined, next: Readonly<Record<string, unknown>> | undefined): Record<string, unknown> | undefined {
	let result = next;
	const homes = previous?.[CHAT_HOME_WORKSPACES_METADATA_KEY];
	if (homes && typeof homes === 'object' && !Array.isArray(homes)) {
		for (const [chat, value] of Object.entries(homes)) {
			const home = readChatHomeWorkspace(value);
			if (home !== undefined && readChatHomeWorkspaceFromMeta(result, chat) === undefined) {
				result = withChatHomeWorkspace(result, chat, home);
			}
		}
	}
	return result;
}
