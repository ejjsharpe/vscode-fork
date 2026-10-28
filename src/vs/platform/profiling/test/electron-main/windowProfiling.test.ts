/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import assert from 'assert';
import type { WebContents } from 'electron';
import { upcastPartial } from '../../../../base/test/common/mock.js';
import { ensureNoDisposablesAreLeakedInTestSuite } from '../../../../base/test/common/utils.js';
import { NullLogService } from '../../../log/common/log.js';
import { WindowProfiler } from '../../electron-main/windowProfiling.js';

suite('WindowProfiler', () => {
	const store = ensureNoDisposablesAreLeakedInTestSuite();

	test('profiles the exact supplied workbench contents and releases its inspector', async () => {
		const profile = { nodes: [], startTime: 1, endTime: 2 };
		let attached = false;
		const contents = upcastPartial<WebContents>({ debugger: upcastPartial<Electron.Debugger>({
			attach: () => { attached = true; },
			detach: () => { attached = false; },
			isAttached: () => attached,
			sendCommand: async () => ({ profile })
		}) });
		const profiler = new WindowProfiler(contents, 'exact-workbench', () => {}, store.add(new NullLogService()));
		assert.deepStrictEqual({ profile: await profiler.inspect(0), attached }, { profile, attached: false });
	});
	test('owner loss prevents a late profile result and still releases the inspector', async () => {
		let current = true;
		let attached = false;
		const contents = upcastPartial<WebContents>({ debugger: upcastPartial<Electron.Debugger>({
			attach: () => { attached = true; },
			detach: () => { attached = false; },
			isAttached: () => attached,
			sendCommand: async method => {
				if (method === 'Profiler.start') { current = false; }
				if (method === 'Profiler.stop') { throw new Error('Expired inspector must not collect a new result'); }
			}
		}) });
		const profiler = new WindowProfiler(contents, 'expired-workbench', () => {
			if (!current) { throw new Error('Expired profile owner'); }
		}, store.add(new NullLogService()));
		await assert.rejects(profiler.inspect(0), /Expired profile owner/);
		assert.strictEqual(attached, false);
	});

});
