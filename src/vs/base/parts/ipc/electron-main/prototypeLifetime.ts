/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

// THROWAWAY: main-owned document bootstrap and revocable connection bindings.
import { randomUUID } from 'node:crypto';
import { WebContents } from 'electron';
import { Emitter } from '../../../common/event.js';

let generation = 0;
let connection = 0;
const documents = new Map<number, { generation: number; nonce?: string; workbench: number; retired?: boolean; lifecycleReady?: boolean }>();
const bindings = new Map<string, { contents: WebContents; generation: number; workbench: number }>();
const revoked = new Emitter<string>();
export const onPrototypeConnectionRevoked = revoked.event;
const documentRevoked = new Emitter<{ contents: WebContents; generation: number; reason: string }>();
export const onPrototypeDocumentRevoked = documentRevoked.event;

export function revokePrototypeConnection(context: string): void {
	if (bindings.delete(context)) { revoked.fire(context); }
}

export function revokePrototypeDocument(contents: WebContents, reason: string): void {
	const document = documents.get(contents.id);
	if (!document) { return; }
	const wasLive = document.nonce !== undefined;
	document.nonce = undefined;
	document.lifecycleReady = false;
	if (wasLive) { documentRevoked.fire({ contents, generation: document.generation, reason }); }
	for (const [context, binding] of bindings) {
		if (binding.contents === contents) { revokePrototypeConnection(context); }
	}
	console.log('[lifetime-probe] revoke', JSON.stringify({ workbench: document.workbench, generation: document.generation, reason }));
}

export function retirePrototypeDocument(contents: WebContents, reason: string): void {
	const document = documents.get(contents.id);
	if (document) { document.retired = true; }
	revokePrototypeDocument(contents, reason);
}

export function registerPrototypeDocument(contents: WebContents, workbench: number): void {
	documents.set(contents.id, { generation: 0, workbench });
	contents.on('did-start-navigation', (_event, _url, inPlace, mainFrame) => {
		if (mainFrame && !inPlace) { revokePrototypeDocument(contents, 'navigation'); }
	});
	contents.on('render-process-gone', () => revokePrototypeDocument(contents, 'crash'));
	contents.once('destroyed', () => {
		revokePrototypeDocument(contents, 'destroyed');
		documents.delete(contents.id);
	});
	// Main pushes a fresh secret to the new document's isolated preload, never a client claim.
	contents.on('dom-ready', () => {
		if (documents.get(contents.id)?.retired) { return; }
		revokePrototypeDocument(contents, 'bootstrap');
		const document = documents.get(contents.id)!;
		document.generation = ++generation;
		document.nonce = randomUUID();
		contents.send('vscode:prototype-bootstrap', document.nonce);
		console.log('[lifetime-probe] bootstrap', JSON.stringify({ workbench, generation, webContents: contents.id }));
	});
}

export function bindPrototypeConnection(contents: WebContents, nonce: unknown): string | undefined {
	const document = documents.get(contents.id);
	if (!document?.nonce || nonce !== document.nonce) { return undefined; }
	const context = `window:${document.workbench}:document:${document.generation}:connection:${++connection}`;
	bindings.set(context, { contents, generation: document.generation, workbench: document.workbench });
	console.log('[lifetime-probe] connection', context);
	return context;
}

export function prototypeBinding(context: string) {
	const binding = bindings.get(context);
	const document = binding && documents.get(binding.contents.id);
	if (!binding || !document?.nonce || document.generation !== binding.generation || binding.contents.isDestroyed()) {
		throw new Error('Rejected revoked document/connection');
	}
	return binding;
}

export function prototypeDocumentGeneration(contents: WebContents): number | undefined {
	const document = documents.get(contents.id);
	return document?.nonce ? document.generation : undefined;
}

export function prototypeDocumentOwnsReply(contents: WebContents, generation: number, event: Electron.IpcMainEvent, nonce: unknown): boolean {
	const document = documents.get(contents.id);
	return event.sender === contents && !contents.isDestroyed() && event.senderFrame === contents.mainFrame &&
		document?.generation === generation && !!document.nonce && nonce === document.nonce;
}

// Readiness is accepted only through the authenticated current document connection.
export function markPrototypeLifecycleReady(context: string): void {
	const binding = prototypeBinding(context);
	documents.get(binding.contents.id)!.lifecycleReady = true;
	console.log('[readiness-probe] ready', Date.now(), binding.workbench, binding.generation);
}

export function prototypeLifecycleReady(contents: WebContents): boolean {
	const document = documents.get(contents.id);
	return !contents.isDestroyed() && !!document?.nonce && document.lifecycleReady === true;
}
