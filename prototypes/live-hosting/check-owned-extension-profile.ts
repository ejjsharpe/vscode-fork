/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

// Bounded actual-Node-process proof: no workspace/provider/authentication activity.
import assert from 'node:assert/strict';
import { fork } from 'node:child_process';
import { once } from 'node:events';
import { pathToFileURL } from 'node:url';
import { resolve } from 'node:path';

(async () => {
	const moduleUrl = pathToFileURL(resolve('out/vs/platform/extensions/node/extensionHostProfiling.js')).href;
	const { ExtensionHostProfiling, extensionHostProfileNonceEnv } = await import(moduleUrl);
	const nonce = 'bounded-owned-process-check';
	const explicitHost = process.env.ESCODE_CHECK_INSPECT_HOST;
	const fixture = `
		import { initializeExtensionHostInspector } from ${JSON.stringify(moduleUrl)};
		initializeExtensionHostInspector(process.env, message => process.send(message));
		process.on('message', message => {
			if (message === 'ping') { process.send({ type: 'pong' }); }
			if (message === 'hang') {
				process.send({ type: 'hanging' });
				function deliberatelyBlockedExtension() { while (true) { Math.sqrt(Math.random()); } }
				deliberatelyBlockedExtension();
			}
		});
	`;
	const child = fork('-e', [fixture], { execArgv: ['--input-type=module', ...(explicitHost ? [`--inspect=${explicitHost}:0`] : [])], env: { ...process.env, [extensionHostProfileNonceEnv]: nonce }, stdio: ['ignore', 'ignore', 'ignore', 'ipc'] });
	let live = true;
	const target = new ExtensionHostProfiling(nonce, () => child.pid, () => { if (!live) { throw new Error('Expired'); } });
	const timeout = setTimeout(() => { child.kill('SIGKILL'); process.exitCode = 1; }, 15000);
	try {
		const [ready] = await once(child, 'message');
		assert.equal(ready.pid, child.pid);
		assert.equal(target.acceptStartupMessage({ ...ready, pid: ready.pid + 1 }), false);
		assert.equal(target.acceptStartupMessage(ready), true);
		const hanging = once(child, 'message');
		child.send('hang');
		assert.equal((await hanging)[0].type, 'hanging');
		let replied = false;
		child.on('message', message => { if (message.type === 'pong') { replied = true; } });
		child.send('ping');
		const handle = await target.startCpuProfile();
		await new Promise(resolve => setTimeout(resolve, 100));
		await assert.rejects(target.stopCpuProfile('foreign'), /Unknown/);
		const profile = await target.stopCpuProfile(handle);
		assert.equal(replied, false, 'The child JS thread must remain synchronously blocked during capture');
		assert.ok(profile.nodes.length > 1);
		assert.ok(profile.samples.length > 0);
		live = false;
		await assert.rejects(target.startCpuProfile(), /Expired/);
		console.log(JSON.stringify({ result: 'PASS', explicitInspectorHost: explicitHost, actualChildPid: child.pid, hungCaptureNodes: profile.nodes.length, samples: profile.samples.length, blockedThreadDidNotReply: !replied, foreignHandleRejected: true, revokedOwnerRejected: true }));
	} finally {
		clearTimeout(timeout);
		target.dispose();
		const exited = once(child, 'exit');
		child.kill('SIGKILL');
		await exited;
	}
})().catch(error => { console.error(error); process.exitCode = 1; });
