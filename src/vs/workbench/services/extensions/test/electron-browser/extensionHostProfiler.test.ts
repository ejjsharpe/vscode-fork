/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import assert from 'assert';
import { upcastPartial } from '../../../../../base/test/common/mock.js';
import { ensureNoDisposablesAreLeakedInTestSuite } from '../../../../../base/test/common/utils.js';
import { IExtensionService } from '../../common/extensions.js';
import { ExtensionHostProfiler } from '../../electron-browser/extensionHostProfiler.js';

suite('ExtensionHostProfiler', () => {
	ensureNoDisposablesAreLeakedInTestSuite();

	test('profiles through the owning extension host and stops the original session once', async () => {
		let stops = 0;
		const service = upcastPartial<IExtensionService>({
			startExtensionHostProfile: async () => ({ stop: async () => {
				stops++;
				return { nodes: [{ id: 1, callFrame: { functionName: '(root)', scriptId: '0', url: '', lineNumber: 0, columnNumber: 0 } }], startTime: 1, endTime: 2 };
			} }),
			whenInstalledExtensionsRegistered: async () => true,
			extensions: [],
		});
		const session = await new ExtensionHostProfiler(service).start();
		const profile = await session.stop();
		assert.strictEqual(profile.data.startTime, 1);
		assert.strictEqual(await session.stop(), profile);
		assert.strictEqual(stops, 1);
	});
});
