/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import type { IJSONSchema } from '../../../base/common/jsonSchema.js';
import { URI } from '../../../base/common/uri.js';
import { ValidationError, ValidatorBase } from '../../../base/common/validation.js';

/** Exact durable workspace and execution environment selected for a conversation. */
export interface IChatHomeWorkspace {
	readonly kind: 'folder' | 'workspace';
	readonly uri: string;
	readonly remoteAuthority?: string;
}

/** `null` is intentional No Workspace; absence means unresolved ownership. */
export type ChatHomeWorkspace = IChatHomeWorkspace | null;

export const CHAT_HOME_WORKSPACE_METADATA_KEY = 'vscode.chatHomeWorkspace';
export const CHAT_HOME_WORKSPACES_METADATA_KEY = 'vscode.chatHomeWorkspaces';

class ChatHomeWorkspaceValidator extends ValidatorBase<ChatHomeWorkspace> {
	validate(value: unknown): { content: ChatHomeWorkspace; error: undefined } | { content: undefined; error: ValidationError } {
		if (value === null) {
			return { content: null, error: undefined };
		}
		if (typeof value === 'object' && !Array.isArray(value) && value !== null) {
			const candidate = value as Partial<IChatHomeWorkspace>;
			if ((candidate.kind === 'folder' || candidate.kind === 'workspace')
				&& typeof candidate.uri === 'string' && candidate.uri.length > 0 && candidate.uri.length <= 4096
				&& !candidate.uri.includes('\0')
				&& (candidate.remoteAuthority === undefined || (typeof candidate.remoteAuthority === 'string' && candidate.remoteAuthority.length > 0 && candidate.remoteAuthority.length <= 4096 && !candidate.remoteAuthority.includes('\0')))) {
				try {
					const uri = URI.parse(candidate.uri, true);
					if (uri.scheme && uri.path) {
						return { content: { kind: candidate.kind, uri: candidate.uri, ...(candidate.remoteAuthority === undefined ? {} : { remoteAuthority: candidate.remoteAuthority }) }, error: undefined };
					}
				} catch { /* Invalid persisted or remote URI. */ }
			}
		}
		return { content: undefined, error: { message: 'Expected an exact folder or workspace URI and environment, or null.' } };
	}

	getJSONSchema(): IJSONSchema {
		return { type: ['object', 'null'] };
	}
}

export const chatHomeWorkspaceValidator = new ChatHomeWorkspaceValidator();

/** Reads validated ownership without treating malformed or missing metadata as No Workspace. */
export function readChatHomeWorkspace(value: unknown): ChatHomeWorkspace | undefined {
	return chatHomeWorkspaceValidator.validate(value).content;
}

/** Reads only the addressed chat's recorded home; session membership confers no home. */
export function readChatHomeWorkspaceFromMeta(meta: Readonly<Record<string, unknown>> | undefined, chat: string): ChatHomeWorkspace | undefined {
	const homes = meta?.[CHAT_HOME_WORKSPACES_METADATA_KEY];
	return homes && typeof homes === 'object' && !Array.isArray(homes)
		? readChatHomeWorkspace((homes as Record<string, unknown>)[chat]) : undefined;
}

/** Updates one recorded home while retaining unrelated metadata and chat homes. */
export function withChatHomeWorkspace(meta: Readonly<Record<string, unknown>> | undefined, chat: string, home: ChatHomeWorkspace): Record<string, unknown> {
	const previous = meta?.[CHAT_HOME_WORKSPACES_METADATA_KEY];
	const homes = previous && typeof previous === 'object' && !Array.isArray(previous) ? previous : {};
	return { ...meta, [CHAT_HOME_WORKSPACES_METADATA_KEY]: { ...homes, [chat]: home } };
}
