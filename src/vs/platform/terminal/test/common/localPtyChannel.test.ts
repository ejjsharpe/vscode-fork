/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { deepStrictEqual, rejects } from 'assert';
import { DeferredPromise, timeout } from '../../../../base/common/async.js';
import { Emitter, Event } from '../../../../base/common/event.js';
import { DisposableStore } from '../../../../base/common/lifecycle.js';
import { upcastPartial } from '../../../../base/test/common/mock.js';
import { ensureNoDisposablesAreLeakedInTestSuite } from '../../../../base/test/common/utils.js';
import { createLocalPtyChannel } from '../../common/localPtyChannel.js';
import { ILocalPtyService } from '../../common/terminal.js';
import { VSBuffer } from '../../../../base/common/buffer.js';

type PtyEventData<K extends keyof ILocalPtyService> = ILocalPtyService[K] extends Event<infer T> ? T : never;

suite('LocalPtyChannel', () => {
	const store = ensureNoDisposablesAreLeakedInTestSuite();

	function createFixture() {
		const processEvents = {
			onProcessData: store.add(new Emitter<PtyEventData<'onProcessData'>>()),
			onProcessReady: store.add(new Emitter<PtyEventData<'onProcessReady'>>()),
			onProcessExit: store.add(new Emitter<PtyEventData<'onProcessExit'>>()),
			onProcessReplay: store.add(new Emitter<PtyEventData<'onProcessReplay'>>()),
			onDidChangeProperty: store.add(new Emitter<PtyEventData<'onDidChangeProperty'>>()),
			onProcessOrphanQuestion: store.add(new Emitter<PtyEventData<'onProcessOrphanQuestion'>>()),
			onDidRequestDetach: store.add(new Emitter<PtyEventData<'onDidRequestDetach'>>()),
		};
		const lifecycleEvents = {
			onPtyHostStart: store.add(new Emitter<void>()),
			onPtyHostExit: store.add(new Emitter<number>()),
			onPtyHostUnresponsive: store.add(new Emitter<void>()),
			onPtyHostResponsive: store.add(new Emitter<void>()),
			onPtyHostRequestResolveVariables: store.add(new Emitter<PtyEventData<'onPtyHostRequestResolveVariables'>>()),
		};
		const service = upcastPartial<ILocalPtyService>({
			onProcessData: processEvents.onProcessData.event,
			onProcessReady: processEvents.onProcessReady.event,
			onProcessExit: processEvents.onProcessExit.event,
			onProcessReplay: processEvents.onProcessReplay.event,
			onDidChangeProperty: processEvents.onDidChangeProperty.event,
			onProcessOrphanQuestion: processEvents.onProcessOrphanQuestion.event,
			onDidRequestDetach: processEvents.onDidRequestDetach.event,
			onPtyHostStart: lifecycleEvents.onPtyHostStart.event,
			onPtyHostExit: lifecycleEvents.onPtyHostExit.event,
			onPtyHostUnresponsive: lifecycleEvents.onPtyHostUnresponsive.event,
			onPtyHostResponsive: lifecycleEvents.onPtyHostResponsive.event,
			onPtyHostRequestResolveVariables: lifecycleEvents.onPtyHostRequestResolveVariables.event,
		});
		const channel = createLocalPtyChannel(service, store.add(new DisposableStore()));
		return { processEvents, lifecycleEvents, channel };
	}

	test('does not retain subscriptions for unused process events', () => {
		const { processEvents } = createFixture();
		const received: PtyEventData<'onProcessData'>[] = [];
		const directListener = store.add(processEvents.onProcessData.event(e => received.push(e)));
		const output = { id: 1, event: 'terminal output\r\n' };
		processEvents.onProcessData.fire(output);
		directListener.dispose();

		for (let i = 0; i < 100; i++) {
			processEvents.onProcessData.fire(output);
		}

		deepStrictEqual({
			received,
			subscribedProcessEvents: Object.entries(processEvents).filter(([, emitter]) => emitter.hasListeners()).map(([name]) => name)
		}, {
			received: [output],
			subscribedProcessEvents: []
		});
	});

	test('delivers live output to local listeners without replaying earlier output', () => {
		const { processEvents, channel } = createFixture();
		const firstWindow: PtyEventData<'onProcessData'>[] = [];
		const secondWindow: PtyEventData<'onProcessData'>[] = [];
		const firstOutput = { id: 1, event: 'first' };
		const secondOutput = { id: 1, event: 'second' };

		processEvents.onProcessData.fire({ id: 1, event: 'before listening' });
		const firstListener = store.add(channel.listen<PtyEventData<'onProcessData'>>('first', 'onProcessData')(e => firstWindow.push(e)));
		const secondListener = store.add(channel.listen<PtyEventData<'onProcessData'>>('second', 'onProcessData')(e => secondWindow.push(e)));
		processEvents.onProcessData.fire(firstOutput);
		firstListener.dispose();
		processEvents.onProcessData.fire(secondOutput);
		secondListener.dispose();

		deepStrictEqual({
			firstWindow,
			secondWindow,
			hasListeners: processEvents.onProcessData.hasListeners()
		}, {
			firstWindow: [firstOutput],
			secondWindow: [firstOutput, secondOutput],
			hasListeners: false
		});
	});

	test('preserves early and live lifecycle notifications', async () => {
		const { lifecycleEvents, channel } = createFixture();
		const received: { [K in keyof typeof lifecycleEvents]: PtyEventData<K>[] } = {
			onPtyHostStart: [],
			onPtyHostExit: [],
			onPtyHostUnresponsive: [],
			onPtyHostResponsive: [],
			onPtyHostRequestResolveVariables: [],
		};
		const earlyRequest = { requestId: 1, workspaceId: 'workspace', originalText: ['${workspaceFolder}'] };
		const liveRequest = { requestId: 2, workspaceId: 'workspace', originalText: ['${env:HOME}'] };

		lifecycleEvents.onPtyHostStart.fire();
		lifecycleEvents.onPtyHostExit.fire(1);
		lifecycleEvents.onPtyHostUnresponsive.fire();
		lifecycleEvents.onPtyHostResponsive.fire();
		lifecycleEvents.onPtyHostRequestResolveVariables.fire(earlyRequest);

		store.add(channel.listen<void>('window', 'onPtyHostStart')(e => received.onPtyHostStart.push(e)));
		store.add(channel.listen<number>('window', 'onPtyHostExit')(e => received.onPtyHostExit.push(e)));
		store.add(channel.listen<void>('window', 'onPtyHostUnresponsive')(e => received.onPtyHostUnresponsive.push(e)));
		store.add(channel.listen<void>('window', 'onPtyHostResponsive')(e => received.onPtyHostResponsive.push(e)));
		store.add(channel.listen<PtyEventData<'onPtyHostRequestResolveVariables'>>('window', 'onPtyHostRequestResolveVariables')(e => received.onPtyHostRequestResolveVariables.push(e)));
		await timeout(0);

		lifecycleEvents.onPtyHostStart.fire();
		lifecycleEvents.onPtyHostExit.fire(2);
		lifecycleEvents.onPtyHostUnresponsive.fire();
		lifecycleEvents.onPtyHostResponsive.fire();
		lifecycleEvents.onPtyHostRequestResolveVariables.fire(liveRequest);

		deepStrictEqual(received, {
			onPtyHostStart: [undefined, undefined],
			onPtyHostExit: [1, 2],
			onPtyHostUnresponsive: [undefined, undefined],
			onPtyHostResponsive: [undefined, undefined],
			onPtyHostRequestResolveVariables: [earlyRequest, liveRequest],
		});
	});

	test('limits process access to the authenticated workbench and workspace', async () => {
		const owners = new Map([[1, { workbench: 51, workspaceId: 'one' }], [2, { workbench: 52, workspaceId: 'two' }]]);
		const service = upcastPartial<ILocalPtyService>({
			getProcessOwner: async id => owners.get(id),
			getCwd: async () => '/one',
		});
		let current = true;
		const channel = createLocalPtyChannel(service, store.add(new DisposableStore()), () => {
			if (!current) { throw new Error('Revoked'); }
			return { role: 'project', workbench: 51, generation: 1, workspaceId: 'one' };
		});
		const own = await channel.call('main-issued', 'getCwd', [1]);
		await rejects(channel.call('main-issued', 'getCwd', [2]), /owner/);
		current = false;
		await rejects(channel.call('main-issued', 'getCwd', [1]), /Revoked/);
		deepStrictEqual(own, '/one');
	});

	test('delivers the final owned exit after the native process registry removes its handle', async () => {
		const exits = store.add(new Emitter<{ id: number; event: number; owner: { workbench: number; workspaceId: string } }>());
		const received: number[] = [];
		const service = upcastPartial<ILocalPtyService>({ onProcessExit: exits.event, getProcessOwner: async () => undefined });
		const channel = createLocalPtyChannel(service, store.add(new DisposableStore()), () => ({ role: 'project', workbench: 51, generation: 1, workspaceId: 'one' }));
		store.add(channel.listen<{ id: number }>('one', 'onProcessExit')(exit => received.push(exit.id)));
		exits.fire({ id: 1, event: 0, owner: { workbench: 51, workspaceId: 'one' } });
		exits.fire({ id: 2, event: 0, owner: { workbench: 52, workspaceId: 'two' } });
		await timeout(0);
		deepStrictEqual(received, [1]);
	});

	test('binds restore, grace time and port cleanup to the current terminal owner', async () => {
		const calls: unknown[] = [];
		const service = upcastPartial<ILocalPtyService>({
			getProcessOwner: async id => id === 1 ? { workbench: 51, workspaceId: 'one' } : undefined,
			reduceConnectionGraceTime: async workbench => { calls.push(workbench); },
			freePortKillProcess: async (port, id, validate) => { validate?.(); calls.push([port, id]); return { port, processId: '123' }; },
			reviveTerminalProcesses: async (_workspace, _state, _locale, owner, validate) => { validate?.(); calls.push(owner); },
		});
		const channel = createLocalPtyChannel(service, store.add(new DisposableStore()), () => ({ role: 'project', workbench: 51, generation: 1, workspaceId: 'one' }), Event.None, true);
		await channel.call('one', 'reduceConnectionGraceTime', [52]);
		await channel.call('one', 'freePortKillProcess', ['3000', 1]);
		await rejects(channel.call('one', 'freePortKillProcess', ['3000', 2]), /owner/);
		await channel.call('one', 'reviveTerminalProcesses', ['one', [], 'en']);
		await rejects(channel.call('one', 'setTerminalLayoutInfo', [{ workspaceId: 'one', tabs: [{ terminals: [{ terminal: '2' }] }] }]), /handle/);
		deepStrictEqual(calls, [51, ['3000', 1], { workbench: 51, workspaceId: 'one' }]);
	});

	test('revokes a pending native terminal effect before its later action', async () => {
		const started = new DeferredPromise<void>();
		const proceed = new DeferredPromise<void>();
		let current = true;
		let killed = false;
		const service = upcastPartial<ILocalPtyService>({
			getProcessOwner: async () => ({ workbench: 51, workspaceId: 'one' }),
			freePortKillProcess: async (port, _id, validate) => { await started.complete(); await proceed.p; validate?.(); killed = true; return { port, processId: '123' }; },
		});
		const channel = createLocalPtyChannel(service, store.add(new DisposableStore()), () => {
			if (!current) { throw new Error('Revoked'); }
			return { role: 'project', workbench: 51, generation: 1, workspaceId: 'one' };
		}, Event.None, true);
		const pending = channel.call('one', 'freePortKillProcess', ['3000', 1]);
		await started.p;
		current = false;
		await proceed.complete();
		await rejects(pending, /Revoked/);
		deepStrictEqual(killed, false);
	});

	test('revalidates the live native target after a queued PTY setter resumes', async () => {
		const started = new DeferredPromise<void>();
		const proceed = new DeferredPromise<void>();
		let nativeTargetLive = true;
		let attached = false;
		const handle = VSBuffer.fromString('own-native-handle');
		const service = upcastPartial<ILocalPtyService>({
			getProcessOwner: async () => ({ workbench: 51, workspaceId: 'one' }),
			setParentWindow: async (_id, _handle, _targetId, resolveNativeParent) => {
				await started.complete();
				await proceed.p;
				await resolveNativeParent!();
				attached = true;
			}
		});
		const channel = createLocalPtyChannel(service, store.add(new DisposableStore()), () => ({ role: 'project', workbench: 51, generation: 1, workspaceId: 'one' }), Event.None, true, async (_context, supplied, targetId) => {
			if (!nativeTargetLive || targetId !== 52 || !handle.equals(supplied)) { throw new Error('Native target expired'); }
			return handle;
		});
		const pending = channel.call('one', 'setParentWindow', [1, handle, 52]);
		await started.p;
		nativeTargetLive = false;
		await proceed.complete();
		await rejects(pending, /expired/);
		deepStrictEqual(attached, false);
	});
});
