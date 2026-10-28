/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import assert from 'assert';
import type { BrowserWindow, MessageBoxReturnValue, OpenDialogReturnValue, SaveDialogReturnValue } from 'electron';
import sinon from 'sinon';
import { DeferredPromise, Queue } from '../../../../base/common/async.js';
import { ensureNoDisposablesAreLeakedInTestSuite } from '../../../../base/test/common/utils.js';
import { NullLogService } from '../../../log/common/log.js';
import product from '../../../product/common/product.js';
import { IProductService } from '../../../product/common/productService.js';
import { DialogMainService } from '../../electron-main/dialogMainService.js';

type DialogResult = MessageBoxReturnValue | SaveDialogReturnValue | OpenDialogReturnValue;

interface TestDialogMainService {
	getWindowDialogQueue<T extends DialogResult>(window?: BrowserWindow): Queue<T>;
	windowDialogQueues: Map<number, Queue<DialogResult>>;
}

suite('DialogMainService', () => {

	const productService: IProductService = {
		_serviceBrand: undefined,
		...product,
		nameLong: 'Test'
	};

	test('discards a per-window dialog queue after it drains', async () => {
		const nativeDialog = { showMessageBox: sinon.stub(), showSaveDialog: sinon.stub(), showOpenDialog: sinon.stub() };
		const service = new DialogMainService(nativeDialog, new NullLogService(), productService) as unknown as TestDialogMainService;
		const window = { id: 1 } as BrowserWindow;
		const queue = service.getWindowDialogQueue<MessageBoxReturnValue>(window);

		assert.strictEqual(service.windowDialogQueues.size, 1);
		await queue.queue(async () => ({ response: 0, checkboxChecked: false }));
		await queue.whenIdle();
		assert.strictEqual(service.windowDialogQueues.size, 0);
	});

	test('queued dialogs reject expired owners before display and before returning a result', async () => {
		const result = new DeferredPromise<MessageBoxReturnValue>();
		const nativeDialog = { showMessageBox: sinon.stub().returns(result.p), showSaveDialog: sinon.stub(), showOpenDialog: sinon.stub() };
		const service = new DialogMainService(nativeDialog, new NullLogService(), productService);
		const window = { id: 1 } as BrowserWindow;
		let current = true;
		const validateOwner = () => {
			if (!current) { throw new Error('Expired dialog owner'); }
		};
		try {
			const first = service.showMessageBox({ message: 'First' }, window, validateOwner);
			const queued = service.showMessageBox({ message: 'Queued' }, window, validateOwner);
			const firstRejected = assert.rejects(first, /Expired dialog owner/);
			const queuedRejected = assert.rejects(queued, /Expired dialog owner/);
			current = false;
			await result.complete({ response: 0, checkboxChecked: false });
			await Promise.all([firstRejected, queuedRejected]);
			assert.strictEqual(nativeDialog.showMessageBox.callCount, 1);
		} finally {
			sinon.restore();
		}
	});

	for (const method of ['showSaveDialog', 'showOpenDialog'] as const) {
		test(`${method} rejects a late result and releases the file-dialog lock`, async () => {
			const result = new DeferredPromise<SaveDialogReturnValue | OpenDialogReturnValue>();
			const nativeDialog = { showMessageBox: sinon.stub(), showSaveDialog: sinon.stub().returns(result.p), showOpenDialog: sinon.stub().returns(result.p) };
			const service = new DialogMainService(nativeDialog, new NullLogService(), productService);
			const window = { id: 1 } as BrowserWindow;
			let current = true;
			const validateOwner = () => {
				if (!current) { throw new Error('Expired dialog owner'); }
			};
			const pending = service[method]({ title: 'Pick' }, window, validateOwner);
			const rejected = assert.rejects(pending, /Expired dialog owner/);
			current = false;
			const picked = method === 'showSaveDialog' ? { canceled: false, filePath: '/picked' } : { canceled: false, filePaths: ['/picked'] };
			await result.complete(picked);
			await rejected;
			current = true;
			assert.deepStrictEqual(await service[method]({ title: 'Pick' }, window, validateOwner), picked);
		});
	}

	ensureNoDisposablesAreLeakedInTestSuite();
});
