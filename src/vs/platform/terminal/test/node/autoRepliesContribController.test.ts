/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import assert from 'assert';
import { timeout } from '../../../../base/common/async.js';
import { Emitter } from '../../../../base/common/event.js';
import { mock } from '../../../../base/test/common/mock.js';
import { runWithFakedTimers } from '../../../../base/test/common/timeTravelScheduler.js';
import { ensureNoDisposablesAreLeakedInTestSuite } from '../../../../base/test/common/utils.js';
import { NullLogService } from '../../../log/common/log.js';
import { ITerminalChildProcess } from '../../common/terminal.js';
import { AutoRepliesPtyServiceContribution } from '../../node/terminalContrib/autoReplies/autoRepliesContribController.js';

suite('AutoRepliesPtyServiceContribution', () => {

	const store = ensureNoDisposablesAreLeakedInTestSuite();

	test('does not duplicate replies when a persistent process becomes ready again', () => runWithFakedTimers({ useFakeTimers: true }, async () => {
		const data = store.add(new Emitter<string>());
		const replies: string[] = [];
		const process = new class extends mock<ITerminalChildProcess>() {
			override readonly onProcessData = data.event;
			override input(value: string): void { replies.push(value); }
		};
		const contribution = new AutoRepliesPtyServiceContribution(new NullLogService());
		try {
			await contribution.installAutoReply('prompt', 'reply');
			contribution.handleProcessReady(1, process);
			// Simulates the replay that happens when the process is reattached
			contribution.handleProcessReady(1, process);
			data.fire('prompt');

			assert.deepStrictEqual(replies, ['reply']);
		} finally {
			contribution.handleProcessDispose(1);
			// Let the response throttle finish (in virtual time) before checking disposable ownership.
			await timeout(1100);
		}
	}));

	test('project auto replies cannot alter another projects terminal input', () => runWithFakedTimers({ useFakeTimers: true }, async () => {
		const data = [store.add(new Emitter<string>()), store.add(new Emitter<string>())];
		const replies: string[] = [];
		const processes = data.map((emitter, index) => new class extends mock<ITerminalChildProcess>() {
			override readonly onProcessData = emitter.event;
			override input(value: string): void { replies.push(`${index}:${value}`); }
		});
		const contribution = new AutoRepliesPtyServiceContribution(new NullLogService());
		try {
			await contribution.installAutoReply('prompt', 'one', 51);
			await contribution.installAutoReply('prompt', 'two', 52);
			contribution.handleProcessReady(1, processes[0], 51);
			contribution.handleProcessReady(2, processes[1], 52);
			await contribution.uninstallAllAutoReplies(52);
			data.forEach(emitter => emitter.fire('prompt'));
			assert.deepStrictEqual(replies, ['0:one']);
		} finally {
			contribution.handleProcessDispose(1);
			contribution.handleProcessDispose(2);
			await timeout(1100);
		}
	}));
});
