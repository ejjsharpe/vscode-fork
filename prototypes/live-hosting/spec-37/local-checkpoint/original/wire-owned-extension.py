from pathlib import Path
def edit(path, fn):
 p=Path('src/vs/'+path);p.write_text(fn(p.read_text()))
def imp(s,text):
 i=s.index('import ');return s[:i]+text+'\n'+s[i:]
edit('platform/extensions/common/extensionHostStarter.ts',lambda s:imp(s,"import { IV8Profile } from '../../profiling/common/profiling.js';").replace('\tenableInspectPort(id: string):', '\tstartCpuProfile(id: string): Promise<string>;\n\tstopCpuProfile(id: string, handle: string): Promise<IV8Profile>;\n\tenableInspectPort(id: string):'))
edit('platform/extensions/node/extensionHostProfiling.ts',lambda s:imp(s,"import { open as openInspector, url as inspectorUrl } from 'inspector';").replace('/** Main owns', '''export const extensionHostProfileNonceEnv = 'VSCODE_EXT_HOST_PROFILE_NONCE';

/** Runs before extensions and consumes the private main-issued startup challenge. */
export function initializeExtensionHostInspector(environment: NodeJS.ProcessEnv, publish: (message: unknown) => void): void {
	const nonce = environment[extensionHostProfileNonceEnv];
	delete environment[extensionHostProfileNonceEnv];
	if (!nonce) { return; }
	if (!inspectorUrl()) { openInspector(0, '127.0.0.1', false); }
	const endpoint = inspectorUrl();
	if (endpoint) { publish({ type: 'vscode:extension-host-inspector', nonce, pid: process.pid, endpoint }); }
}

/** Main owns'''))
edit('platform/extensions/electron-main/extensionHostStarter.ts',lambda s:imp(s,"import { generateUuid } from '../../../base/common/uuid.js';\nimport { prototypeBinding } from '../../../base/parts/ipc/electron-main/prototypeLifetime.js';\nimport { IV8Profile } from '../../profiling/common/profiling.js';\nimport { ExtensionHostProfiling, extensionHostProfileNonceEnv } from '../node/extensionHostProfiling.js';").replace('Disposable, IDisposable','Disposable, DisposableMap, DisposableStore, IDisposable').replace('\tprivate _shutdown = false;', '\tprivate readonly _profiling = this._register(new DisposableMap<string, { capture: ExtensionHostProfiling; dispose(): void }>());\n\tprivate _shutdown = false;').replace('return this._getExtHost(id).onMessage;', "return Event.filter(this._getExtHost(id).onMessage, message => !message || typeof message !== 'object' || (message as { type?: unknown }).type !== 'vscode:extension-host-inspector');").replace('\t\tconst disposable = extHost.onExit(({ pid, code, signal }) => {', '\t\tconst disposable = extHost.onExit(({ pid, code, signal }) => {\n\t\t\tthis._profiling.deleteAndDispose(id);').replace('async start(id: string, opts: IExtensionHostProcessOptions):', 'async start(id: string, opts: IExtensionHostProcessOptions & { nativeConnectionContext?: string }):').replace("\t\tconst extHost = this._getExtHost(id);\n\t\tconst args", '''		const extHost = this._getExtHost(id);
		if (this._profiling.has(id)) { throw new Error('Extension host already started'); }
		const context = opts.nativeConnectionContext;
		if (context) { prototypeBinding(context); }
		const nonce = generateUuid();
		let actualPid: number | undefined;
		const lifetime = new DisposableStore();
		const capture = lifetime.add(new ExtensionHostProfiling(nonce, () => actualPid, () => {
			if (context) { prototypeBinding(context); }
			if (this._shutdown || this._extHosts.get(id) !== extHost) { throw new Error('Extension host profiling owner expired'); }
		}));
		lifetime.add(Event.once(extHost.onSpawn)(pid => actualPid = pid));
		lifetime.add(extHost.onMessage(message => capture.acceptStartupMessage(message)));
		this._profiling.set(id, { capture, dispose: () => lifetime.dispose() });
		const args''').replace('\t\t\t...opts,\n\t\t\ttype:', '\t\t\t...opts,\n\t\t\tenv: { ...opts.env, [extensionHostProfileNonceEnv]: nonce },\n\t\t\ttype:').replace('\tasync enableInspectPort(', '''	async startCpuProfile(id: string): Promise<string> {
		const owner = this._profiling.get(id);
		if (!owner) { throw new Error('Extension host profiling unavailable'); }
		return owner.capture.startCpuProfile();
	}

	async stopCpuProfile(id: string, handle: string): Promise<IV8Profile> {
		const owner = this._profiling.get(id);
		if (!owner) { throw new Error('Extension host profiling unavailable'); }
		return owner.capture.stopCpuProfile(handle);
	}

	async enableInspectPort(''').replace('\t\textHostProcess.kill();\n\t\textHostProcess.dispose();', '\t\tthis._profiling.deleteAndDispose(id);\n\t\textHostProcess.kill();\n\t\textHostProcess.dispose();'))
edit('workbench/api/node/extensionHostProcess.ts',lambda s:imp(s,"import { initializeExtensionHostInspector } from '../../../platform/extensions/node/extensionHostProfiling.js';\nimport { isUtilityProcess } from '../../../base/parts/sandbox/node/electronTypes.js';").replace("const require = createRequire(import.meta.url);", "const require = createRequire(import.meta.url);\n\n// Attest the actual child inspector before extension code can run or block its JS thread.\nif (isUtilityProcess(process)) { initializeExtensionHostInspector(process.env, message => process.parentPort.postMessage(message)); }"))
edit('workbench/services/extensions/common/extensions.ts',lambda s:s.replace('export interface IExtensionHost {', 'export interface IExtensionHost {\n\tstartProfile?(): Promise<IExtensionHostRawProfileSession>;'))
edit('workbench/services/extensions/common/extensionHostManager.ts',lambda s:s[:s.index('\tpublic async startProfile():')]+'''	public async startProfile(): Promise<IExtensionHostRawProfileSession> {
		const owner = this._extensionHost;
		if (!owner.startProfile || this._store.isDisposed) { throw new Error('Extension host profiling unavailable'); }
		const session = await owner.startProfile();
		if (this._store.isDisposed) {
			await session.stop().catch(() => undefined);
			throw new Error('Extension host expired');
		}
		return { stop: async () => {
			if (this._store.isDisposed) { throw new Error('Extension host expired'); }
			const profile = await session.stop();
			if (this._store.isDisposed) { throw new Error('Extension host expired'); }
			return profile;
		} };
	}

'''+s[s.index('\tpublic async getInspectPort('):])
edit('workbench/services/extensions/electron-browser/localProcessExtensionHost.ts',lambda s:imp(s,"import { IV8Profile } from '../../../../platform/profiling/common/profiling.js';\nimport { IExtensionHostRawProfileSession } from '../common/extensions.js';").replace('\tpublic enableInspectPort(): Promise<boolean> {', '\tpublic startCpuProfile(): Promise<string> { return this._extensionHostStarter.startCpuProfile(this._id); }\n\tpublic stopCpuProfile(id: string): Promise<IV8Profile> { return this._extensionHostStarter.stopCpuProfile(this._id, id); }\n\n\tpublic enableInspectPort(): Promise<boolean> {',1).replace('\tpublic async enableInspectPort(): Promise<boolean> {', '''	public async startProfile(): Promise<IExtensionHostRawProfileSession> {
		if (this._terminating || this._store.isDisposed) { throw new Error('Extension host expired'); }
		await this.start();
		const owner = this._extensionHostProcess;
		if (!owner || this._terminating || this._store.isDisposed) { throw new Error('Extension host expired'); }
		const id = await owner.startCpuProfile();
		const validate = () => {
			if (this._terminating || this._store.isDisposed || this._extensionHostProcess !== owner) { throw new Error('Extension host expired'); }
		};
		try { validate(); } catch (error) { await owner.stopCpuProfile(id).catch(() => undefined); throw error; }
		return { stop: async () => {
			validate();
			const result = await owner.stopCpuProfile(id);
			validate();
			return result;
		} };
	}

	public async enableInspectPort(): Promise<boolean> {'''))
