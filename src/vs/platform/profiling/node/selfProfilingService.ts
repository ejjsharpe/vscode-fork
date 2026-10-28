/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { Session } from 'inspector';
import { Disposable } from '../../../base/common/lifecycle.js';
import { generateUuid } from '../../../base/common/uuid.js';
import { IV8Profile } from '../common/profiling.js';

/** Profiles only the process hosting this service, without a caller-selected endpoint. */
export class SelfProfilingService extends Disposable {
	private active: { id: string; session: Session; stopping?: boolean } | undefined;

	constructor(private readonly createSession: () => Session = () => new Session()) { super(); }

	async startProfiling(): Promise<string> {
		if (this._store.isDisposed) { throw new Error('Profiling owner expired'); }
		if (this.active) { throw new Error('A profile is already running'); }
		const entry = this.active = { id: generateUuid(), session: this.createSession() };
		try {
			entry.session.connect();
			await this.post(entry.session, 'Profiler.enable');
			this.validate(entry);
			await this.post(entry.session, 'Profiler.setSamplingInterval', { interval: 100 });
			this.validate(entry);
			await this.post(entry.session, 'Profiler.start');
			this.validate(entry);
			return entry.id;
		} catch (error) {
			this.release(entry);
			throw error;
		}
	}

	async stopProfiling(id: string): Promise<IV8Profile> {
		const entry = this.active;
		if (!entry || entry.id !== id || entry.stopping) { throw new Error('Unknown profile'); }
		entry.stopping = true;
		try {
			this.validate(entry);
			const result = await this.post<{ profile: IV8Profile }>(entry.session, 'Profiler.stop');
			this.validate(entry);
			return result.profile;
		} finally {
			this.release(entry);
		}
	}

	private post<T = void>(session: Session, method: string, params: object = {}): Promise<T> {
		return new Promise<T>((resolve, reject) => session.post(method, params, (error, result) => error ? reject(error) : resolve(result as T)));
	}

	private validate(entry: { id: string; session: Session }): void {
		if (this._store.isDisposed || this.active !== entry) { throw new Error('Profiling owner expired'); }
	}

	private release(entry: { id: string; session: Session }): void {
		if (this.active === entry) {
			this.active = undefined;
			entry.session.disconnect();
		}
	}

	override dispose(): void {
		if (this.active) { this.release(this.active); }
		super.dispose();
	}
}
