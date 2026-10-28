/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { ProfileResult } from '../../../base/node/profiling.js';
import { WebContents } from 'electron';
import { timeout } from '../../../base/common/async.js';
import { ILogService } from '../../log/common/log.js';
import { IV8Profile } from '../common/profiling.js';

export class WindowProfiler {

	constructor(
		private readonly _contents: WebContents,
		private readonly _sessionId: string,
		private readonly _validateOwner: () => void,
		@ILogService private readonly _logService: ILogService,
	) { }

	async inspect(duration: number): Promise<IV8Profile> {
		this._validateOwner();
		const inspector = this._contents.debugger;
		inspector.attach();
		try {
			await inspector.sendCommand('Profiler.enable');
			this._validateOwner();
			await inspector.sendCommand('Profiler.start');
			this._logService.warn('[perf] profiling STARTED', this._sessionId);
			await timeout(duration);
			this._validateOwner();
			const data: ProfileResult = await inspector.sendCommand('Profiler.stop');
			this._validateOwner();
			this._logService.warn('[perf] profiling DONE', this._sessionId);
			return data.profile;
		} finally {
			if (inspector.isAttached()) {
				try { await inspector.sendCommand('Profiler.disable'); }
				finally { inspector.detach(); }
			}
		}
	}
}
