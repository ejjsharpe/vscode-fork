#!/usr/bin/env bash
# Copyright (c) Microsoft Corporation. All rights reserved.
# Licensed under the MIT License. See License.txt in the project root.
set -euo pipefail
cd "$(dirname "$0")/../.."
mkdir -p prototypes/live-hosting/lifecycle-replies/scratch/{single,multi-a,multi-b}
printf '%s\n' '{"folders":[{"path":"multi-a"},{"path":"multi-b"}]}' > prototypes/live-hosting/lifecycle-replies/scratch/multi.code-workspace
.agents/skills/launch/scripts/launch.sh --repo "$PWD" --agents --session-title 'Lifecycle reply authorization probe' --source-user-data-dir "$PWD/prototypes/live-hosting/lifecycle-replies/scratch/empty-profile" > prototypes/live-hosting/lifecycle-replies/scratch/launch.json
node --input-type=module <<'JS'
import fs from 'node:fs';
import { spawnSync } from 'node:child_process';
const info=JSON.parse(fs.readFileSync('prototypes/live-hosting/lifecycle-replies/scratch/launch.json','utf8'));
for(const workspace of ['single','multi.code-workspace']) {
 const result=spawnSync('scripts/code.sh',[`--user-data-dir=${info.userDataDir}`,`--extensions-dir=${info.extensionsDir}`,`--shared-data-dir=${info.sharedDataDir}`,'--new-window',`${process.cwd()}/prototypes/live-hosting/lifecycle-replies/scratch/${workspace}`],{stdio:'inherit',env:{...process.env,VSCODE_SKIP_PRELAUNCH:'1'}});
 if(result.status!==0) { throw new Error(`Could not open ${workspace}`); }
}
console.log(JSON.stringify(info));
JS
