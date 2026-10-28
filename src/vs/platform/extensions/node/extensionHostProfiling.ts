/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { open as openInspector, url as inspectorUrl } from 'inspector';
import { Disposable } from '../../../base/common/lifecycle.js';
import { generateUuid } from '../../../base/common/uuid.js';
import { ProfilingSession, startProfiling } from '../../../base/node/profiling.js';
import { IV8Profile } from '../../profiling/common/profiling.js';

export const extensionHostProfileNonceEnv = 'VSCODE_EXT_HOST_PROFILE_NONCE';

/** Runs before extensions and consumes the private main-issued startup challenge. */
export function initializeExtensionHostInspector(environment: NodeJS.ProcessEnv, publish: (message: unknown) => void): void {
	const nonce = environment[extensionHostProfileNonceEnv];
	delete environment[extensionHostProfileNonceEnv];
	if (!nonce) { return; }
	if (!inspectorUrl()) { openInspector(0, '127.0.0.1', false); }
	const endpoint = inspectorUrl();
	if (endpoint) { publish({ type: 'vscode:extension-host-inspector', nonce, pid: process.pid, endpoint }); }
}

/** Main owns this capability; renderer endpoints and handles cannot select a process. */
export class ExtensionHostProfiling extends Disposable {
	private endpoint: { url: URL; pid: number } | undefined;
	private active: { id: string; session: ProfilingSession } | undefined;
	private starting = false;

	constructor(private readonly nonce: string, private readonly pid: () => number | undefined, private readonly validateOwner: () => void, private readonly start = startProfiling) { super(); }

	acceptStartupMessage(message: unknown): boolean {
		if (this.endpoint || this._store.isDisposed || !message || typeof message !== 'object') { return false; }
		const ready = message as { type?: unknown; nonce?: unknown; pid?: unknown; endpoint?: unknown };
		if (ready.type !== 'vscode:extension-host-inspector' || ready.nonce !== this.nonce || ready.pid !== this.pid() || typeof ready.pid !== 'number' || typeof ready.endpoint !== 'string') { return false; }
		try {
			this.validateOwner();
			const url = new URL(ready.endpoint);
			if (url.protocol !== 'ws:' || !url.hostname || !url.port || url.pathname === '/' || url.username || url.password) { return false; }
			this.endpoint = { url, pid: ready.pid };
			return true;
		} catch { return false; }
	}

	private validate(): void {
		this.validateOwner();
		if (this._store.isDisposed || !this.endpoint || this.endpoint.pid !== this.pid()) { throw new Error('Extension host profiling owner expired'); }
	}

	async startCpuProfile(): Promise<string> {
		if (!this.endpoint) { throw new Error('Extension host inspector unavailable'); }
		this.validate();
		if (this.starting || this.active) { throw new Error('A profile is already running'); }
		this.starting = true;
		const { url } = this.endpoint;
		const connectionUrl = new URL(url.href);
		if (connectionUrl.hostname === '0.0.0.0') { connectionUrl.hostname = '127.0.0.1'; }
		else if (connectionUrl.hostname === '[::]') { connectionUrl.hostname = '[::1]'; }
		try {
			const session = await this.start({ host: connectionUrl.hostname.replace(/^\[|\]$/g, ''), port: Number(connectionUrl.port), checkForPaused: true, validateOwner: () => this.validate(), target: targets => {
				this.validate();
				const target = targets.find(target => {
					try {
						const advertised = new URL(target.webSocketDebuggerUrl);
						return advertised.protocol === 'ws:' && advertised.port === url.port && advertised.pathname === url.pathname && advertised.search === url.search;
					} catch { return false; }
				});
				if (!target) { throw new Error('Owned extension host inspector target expired'); }
				// Discovery may advertise its HTTP request host. Keep main's connection address and exact attested target path.
				return { ...target, webSocketDebuggerUrl: connectionUrl.href };
			} });
			try { this.validate(); }
			catch (error) { await session.stop().catch(() => undefined); throw error; }
			const entry = this.active = { id: generateUuid(), session };
			return entry.id;
		} finally { this.starting = false; }
	}

	async stopCpuProfile(id: string): Promise<IV8Profile> {
		this.validate();
		const entry = this.active;
		if (!entry || entry.id !== id) { throw new Error('Unknown extension host profile'); }
		this.active = undefined;
		const result = await entry.session.stop();
		this.validate();
		return result.profile;
	}

	override dispose(): void {
		const entry = this.active;
		this.active = undefined;
		if (entry) { void entry.session.stop().catch(() => undefined); }
		super.dispose();
	}
}
