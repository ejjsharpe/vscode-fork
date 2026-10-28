from pathlib import Path
root=Path('src/vs')
def edit(rel,fn):
 p=root/rel;s=p.read_text();p.write_text(fn(s))
def imp(s, text):
 i=s.index('import ');return s[:i]+text+'\n'+s[i:]
edit('workbench/api/common/extHost.protocol.ts',lambda s:imp(s,"import { IV8Profile } from '../../../platform/profiling/common/profiling.js';").replace('export interface ExtHostExtensionServiceShape {','export interface ExtHostExtensionServiceShape {\n\t$startCpuProfile(): Promise<string>;\n\t$stopCpuProfile(id: string): Promise<IV8Profile>;'))
edit('workbench/api/common/extHostExtensionService.ts',lambda s:imp(s,"import { IV8Profile } from '../../../platform/profiling/common/profiling.js';").replace('\tpublic terminate(reason:',"\tpublic $startCpuProfile(): Promise<string> { return Promise.reject(new Error('CPU profiling is unavailable in this extension host')); }\n\tpublic $stopCpuProfile(_id: string): Promise<IV8Profile> { return Promise.reject(new Error('CPU profiling is unavailable in this extension host')); }\n\n\tpublic terminate(reason:"))
edit('workbench/api/node/extHostExtensionService.ts',lambda s:imp(s,"import { SelfProfilingService } from '../../../platform/profiling/node/selfProfilingService.js';\nimport { IV8Profile } from '../../../platform/profiling/common/profiling.js';").replace('export class ExtHostExtensionService extends AbstractExtHostExtensionService {','export class ExtHostExtensionService extends AbstractExtHostExtensionService {\n\tprivate readonly _selfProfiler = this._register(new SelfProfilingService());\n\n\tpublic override $startCpuProfile(): Promise<string> { return this._selfProfiler.startProfiling(); }\n\tpublic override $stopCpuProfile(id: string): Promise<IV8Profile> { return this._selfProfiler.stopProfiling(id); }\n\n\tpublic override terminate(reason: string, code: number = 0): void {\n\t\tthis._selfProfiler.dispose();\n\t\tsuper.terminate(reason, code);\n\t}\n'))
edit('workbench/services/extensions/common/extensionHostProxy.ts',lambda s:imp(s,"import { IV8Profile } from '../../../../platform/profiling/common/profiling.js';").replace('export interface IExtensionHostProxy {','export interface IExtensionHostProxy {\n\tstartCpuProfile(): Promise<string>;\n\tstopCpuProfile(id: string): Promise<IV8Profile>;'))
edit('workbench/api/browser/mainThreadExtensionService.ts',lambda s:imp(s,"import { IV8Profile } from '../../../platform/profiling/common/profiling.js';").replace('class ExtensionHostProxy implements IExtensionHostProxy {','class ExtensionHostProxy implements IExtensionHostProxy {\n\tstartCpuProfile(): Promise<string> { return this._actual.$startCpuProfile(); }\n\tstopCpuProfile(id: string): Promise<IV8Profile> { return this._actual.$stopCpuProfile(id); }\n'))
edit('workbench/services/extensions/common/extensions.ts',lambda s:s.replace('export interface IExtensionService {','export interface IExtensionHostRawProfileSession {\n\tstop(): Promise<IV8Profile>;\n}\n\nexport interface IExtensionService {').replace('\tgetInspectPorts(extensionHostKind:', '\tstartExtensionHostProfile(): Promise<IExtensionHostRawProfileSession>;\n\tgetInspectPorts(extensionHostKind:').replace('\tgetInspectPorts(_extensionHostKind:',"\tstartExtensionHostProfile(): Promise<IExtensionHostRawProfileSession> { return Promise.reject(new Error('No local extension host')); }\n\tgetInspectPorts(_extensionHostKind:"))
for rel in ['extensionHostManagers.ts','extensionHostManager.ts','lazyCreateExtensionHostManager.ts','abstractExtensionService.ts']:
 edit('workbench/services/extensions/common/'+rel,lambda s:imp(s,"import { IExtensionHostRawProfileSession } from './extensions.js';"))
edit('workbench/services/extensions/common/extensionHostManagers.ts',lambda s:s.replace('\tgetInspectPort(', '\tstartProfile(): Promise<IExtensionHostRawProfileSession>;\n\tgetInspectPort('))
edit('workbench/services/extensions/common/extensionHostManager.ts',lambda s:s.replace('\tpublic async getInspectPort(','''\tpublic async startProfile(): Promise<IExtensionHostRawProfileSession> {
		const owner = this._proxy;
		const proxy = await owner;
		if (!proxy || this._proxy !== owner || this._store.isDisposed) { throw new Error('Extension host expired'); }
		const id = await proxy.startCpuProfile();
		if (this._proxy !== owner || this._store.isDisposed) {
			await proxy.stopCpuProfile(id).catch(() => undefined);
			throw new Error('Extension host expired');
		}
		return { stop: async () => {
			if (this._proxy !== owner || this._store.isDisposed) { throw new Error('Extension host expired'); }
			const profile = await proxy.stopCpuProfile(id);
			if (this._proxy !== owner || this._store.isDisposed) { throw new Error('Extension host expired'); }
			return profile;
		} };
	}

	public async getInspectPort('''))
edit('workbench/services/extensions/common/lazyCreateExtensionHostManager.ts',lambda s:s.replace('\tpublic async getInspectPort(','''\tpublic async startProfile(): Promise<IExtensionHostRawProfileSession> {
		await this._startCalled.wait();
		if (!this._actual) { throw new Error('No local extension host'); }
		return this._actual.startProfile();
	}

	public async getInspectPort('''))
edit('workbench/services/extensions/common/abstractExtensionService.ts',lambda s:s.replace('\tpublic async getInspectPorts(','''\tpublic async startExtensionHostProfile(): Promise<IExtensionHostRawProfileSession> {
		const owner = this._getExtensionHostManagers(ExtensionHostKind.LocalProcess)[0];
		if (!owner) { throw new Error('No local extension host'); }
		return owner.startProfile();
	}

	public async getInspectPorts('''))
edit('workbench/services/extensions/electron-browser/extensionHostProfiler.ts',lambda s:s.replace('IV8InspectProfilingService, ', '').replace('\t\tprivate readonly _host: string,\n\t\tprivate readonly _port: number,\n','').replace('\t\t@IV8InspectProfilingService private readonly _profilingService: IV8InspectProfilingService,\n','').replace('const id = await this._profilingService.startProfiling({ host: this._host, port: this._port });','const session = await this._extensionService.startExtensionHostProfile();').replace('await this._profilingService.stopProfiling(id)','await session.stop()'))
def profile(s):
 start=s.index('\t\tconst inspectPorts =');end=s.index('\t\tthis._setState(ProfileSessionState.Starting);',start)
 s=s[:start]+s[end:];s=s.replace('ExtensionHostProfiler, inspectPorts[0].host, inspectPorts[0].port','ExtensionHostProfiler')
 for text in ['import { randomPort }', 'import { IDialogService }', 'import { INativeHostService }','import { IProductService }','import { ExtensionHostKind }','\t\t@INativeHostService ', '\t\t@IDialogService ', '\t\t@IProductService ']:
  s='\n'.join(l for l in s.split('\n') if not l.startswith(text))
 return s
edit('workbench/contrib/extensions/electron-browser/extensionProfileService.ts',profile)
