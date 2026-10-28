/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import type { Client } from 'chrome-remote-interface';
import { timeout } from '../common/async.js';

export interface ProfileResult {
	profile: Profile;
}

export interface Profile {
	nodes: ProfileNode[];
	samples?: number[];
	timeDeltas?: number[];
	startTime: number;
	endTime: number;
}

export interface ProfileNode {
	id: number;
	hitCount?: number;
	children?: number[];
	callFrame: {
		url: string;
		scriptId: string;
		functionName: string;
		lineNumber: number;
		columnNumber: number;
	};
	deoptReason?: string;
	positionTicks?: { line: number; ticks: number }[];
}

export interface ProfilingSession {
	stop(afterDelay?: number): Promise<ProfileResult>;
}

export interface Target {
	description: string;
	devtoolsFrontendUrl: string;
	id: string;
	title: string;
	type: string;
	url: string;
	webSocketDebuggerUrl: string;
}

export interface StartOptions {
	host?: string;
	port: number;
	tries?: number;
	retryWait?: number;
	checkForPaused?: boolean;
	validateOwner?: () => void;
	target?: (targets: Target[]) => Target;
}


export type ProfilingConnectionFactory = (options: { host?: string; port: number; target?: (targets: Target[]) => Target; local: boolean }) => Promise<Client>;

const createConnection: ProfilingConnectionFactory = async options => {
	const { default: cdp } = await import('chrome-remote-interface');
	return cdp(options);
};

async function connectWithRetry(host: string | undefined, port: number, tries: number = 10, retryWait: number = 50, errors: Error[] = [], target?: (targets: Target[]) => Target, connect: ProfilingConnectionFactory = createConnection, validateOwner?: () => void): Promise<Client> {
	if (typeof target === 'undefined') {
		target = function (targets: Target[]) {
			const target = targets.find(target => {
				if (target.webSocketDebuggerUrl) {
					if (target.type === 'page') {
						return target.url.indexOf('bootstrap/index.html') > 0;
					} else {
						return true;
					}
				}
				return false;
			});
			if (!target) {
				throw new class extends Error {
					code: string;
					constructor() {
						super('no target');
						this.code = 'ECONNREFUSED';
					}
				};
			}
			return target;
		};
	}

	const selectTarget = target;
	validateOwner?.();
	try {
		const client = await connect({
			host,
			port,
			target: targets => { validateOwner?.(); return selectTarget(targets); },
			local: true,
		});
		try { validateOwner?.(); }
		catch (error) { await client.close().catch(() => undefined); throw error; }
		return client;
	} catch (e) {
		errors.push(e);
		validateOwner?.();
		if (tries <= 1) {
			throw new class extends Error {
				errors: Error[];
				constructor() {
					super('failed to connect');
					this.errors = errors;
				}
			};
		}
		await timeout(retryWait);
		return connectWithRetry(host, port, tries - 1, retryWait, errors, target, connect, validateOwner);
	}
}

export async function startProfiling(options: StartOptions, connect: ProfilingConnectionFactory = createConnection): Promise<ProfilingSession> {
	options.validateOwner?.();
	const client = await connectWithRetry(options.host, options.port, options.tries, options.retryWait, [], options.target, connect, options.validateOwner);
	const { Runtime, Profiler } = client;
	let keepPausedConnection = false;
	let profileStarted = false;
	try {
		options.validateOwner?.();
		if (options.checkForPaused) {
			// Disconnecting a paused runtime can resume it. Preserve the debugger's pause.
			const { Debugger } = client;
			let isPaused = false;
			client.on('event', message => { if (message.method === 'Debugger.paused') { isPaused = true; } });
			await Debugger.enable();
			options.validateOwner?.();
			if (isPaused) {
				keepPausedConnection = true;
				throw new Error('runtime is paused');
			}
		} else {
			await Runtime.runIfWaitingForDebugger();
			options.validateOwner?.();
		}

		await Profiler.enable();
		options.validateOwner?.();
		await Profiler.setSamplingInterval({ interval: 100 });
		options.validateOwner?.();
		await Profiler.start();
		profileStarted = true;
		options.validateOwner?.();
		return {
			stop: async (n: number = 0) => {
				try {
					if (n > 0) { await timeout(n); }
					// Stopping this owned session is also required cleanup after revocation.
					const data = await Profiler.stop();
					options.validateOwner?.();
					return data as ProfileResult;
				} finally { await client.close(); }
			}
		};
	} catch (error) {
		if (!keepPausedConnection) {
			if (profileStarted) { await Profiler.stop().catch(() => undefined); }
			await client.close().catch(() => undefined);
		}
		throw error;
	}
}
