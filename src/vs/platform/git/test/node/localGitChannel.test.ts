/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import assert from 'assert';
import * as cp from 'child_process';
import { Emitter } from '../../../../base/common/event.js';
import { ensureNoDisposablesAreLeakedInTestSuite } from '../../../../base/test/common/utils.js';
import { NullLogService } from '../../../log/common/log.js';
import { LocalGitService } from '../../node/localGitService.js';
import { LocalGitChannel } from '../../node/localGitChannel.js';

suite('LocalGitChannel', () => {
	const store = ensureNoDisposablesAreLeakedInTestSuite();
	test('one project cannot cancel another project operation and revocation terminates its process', async () => {
		const removed = store.add(new Emitter<{ ctx: string }>());
		let callback: ((error: Error | null, stdout: string, stderr: string) => void) | undefined;
		let kills = 0;
		const exec = ((_command: string, _args: unknown, _options: unknown, done: typeof callback) => {
			callback = done;
			return { kill: () => { kills++; return true; } };
		}) as typeof cp.execFile;
		const channel = store.add(new LocalGitChannel(new LocalGitService(new NullLogService(), exec), removed.event, () => {}));
		const pending = channel.call('one', 'fetch', ['operation', '/repo']);
		const rejected = assert.rejects(pending);
		await assert.rejects(channel.call('two', 'cancel', ['operation']), /Foreign/);
		assert.strictEqual(kills, 0);
		removed.fire({ ctx: 'one' });
		assert.strictEqual(kills, 1);
		callback!(null, '', '');
		await rejected;
	});

	test('expiry between validation and checkout prevents the later mutation', async () => {
		const removed = store.add(new Emitter<{ ctx: string }>());
		let live = true;
		const calls: unknown[] = [];
		const sha = '0123456789012345678901234567890123456789';
		const exec = ((_command: string, args: unknown, _options: unknown, done: (error: Error | null, stdout: string, stderr: string) => void) => {
			calls.push(args);
			queueMicrotask(() => { done(null, sha, ''); live = false; });
			return { kill: () => true };
		}) as typeof cp.execFile;
		const channel = store.add(new LocalGitChannel(new LocalGitService(new NullLogService(), exec), removed.event, () => { if (!live) { throw new Error('Expired'); } }));
		await assert.rejects(channel.call('one', 'checkoutCommit', ['operation', '/repo', sha]), /Expired/);
		assert.deepStrictEqual(calls, [['rev-parse', `${sha}^{commit}`]]);
	});
	test('serialized readonly arguments cannot supply a native operation selector', async () => {
		const removed = store.add(new Emitter<{ ctx: string }>());
		let spawned = 0;
		const exec = ((_command: string, _args: unknown, _options: unknown, done: (error: Error | null, stdout: string, stderr: string) => void) => {
			spawned++;
			queueMicrotask(() => done(null, 'main', ''));
			return { kill: () => true };
		}) as typeof cp.execFile;
		const channel = store.add(new LocalGitChannel(new LocalGitService(new NullLogService(), exec), removed.event, () => {}));
		await assert.rejects(channel.call('one', 'revParse', ['/repo', 'HEAD', 'foreign-native-operation']), /Invalid/);
		assert.strictEqual(spawned, 0);
		assert.strictEqual(await channel.call('one', 'revParse', ['/repo', 'HEAD']), 'main');
		assert.strictEqual(spawned, 1);
	});

});
