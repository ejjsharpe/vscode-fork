// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License. See License.txt in the project root.
import fs from 'node:fs';
import {spawnSync} from 'node:child_process';
const info=JSON.parse(fs.readFileSync('prototypes/live-hosting/replacement-readiness/scratch/launch.json','utf8'));
const result=spawnSync('scripts/code.sh',[`--user-data-dir=${info.userDataDir}`,`--extensions-dir=${info.extensionsDir}`,`--shared-data-dir=${info.sharedDataDir}`,'--disable-workspace-trust',`${process.cwd()}/prototypes/live-hosting/replacement-readiness/scratch/single`],{stdio:'inherit',env:{...process.env,VSCODE_SKIP_PRELAUNCH:'1'}});
if(result.status!==0) throw new Error('Could not open existing scratch workspace');
