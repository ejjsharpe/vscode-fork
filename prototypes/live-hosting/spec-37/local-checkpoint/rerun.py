#!/usr/bin/env python3
"""Prepare isolated fixtures and rerun a bounded historical experiment."""
import argparse
import json
import os
from pathlib import Path
import shutil
import subprocess
import tempfile

parser = argparse.ArgumentParser(description=__doc__)
parser.add_argument('scenario', choices=['startup', 'tabs', 'attachment', 'native40'])
parser.add_argument('--prepare-only', action='store_true')
args = parser.parse_args()
archive = Path(__file__).resolve().parent
repo = archive.parents[3]
run = Path(tempfile.mkdtemp(prefix='escode-prototype-', dir='/tmp'))
(run / 'integration').symlink_to(repo, target_is_directory=True)
for name in ['startup-smoke.mjs', 'tabs-smoke.mjs', 'launch-native40.py']:
    shutil.copy2(archive / 'original' / name, run / name)
for name in ['single', 'multi-a', 'multi-b', 'native40/single', 'native40/multi-a', 'native40/multi-b']:
    source = archive / 'original/runtime' / name
    target = run / 'runtime' / name
    target.mkdir(parents=True)
    if source.exists():
        for path in source.rglob('*'):
            if path.is_file() and path.suffix not in ['.log', '.jsonl'] and path.name != 'extension-inactive.json':
                output = target / path.relative_to(source)
                output.parent.mkdir(parents=True, exist_ok=True)
                shutil.copy2(path, output)
for name in ['', 'native40']:
    (run / 'runtime' / name / 'multi.code-workspace').write_text(json.dumps({'folders': [{'path': 'multi-a'}, {'path': 'multi-b'}]}) + '\n')
shutil.copytree(archive / 'original/runtime/native40/extension', run / 'runtime/native40/extension')
shutil.copytree(archive / 'original/native-host-41', run / 'native-host-41')
for name in ['user-data/User', 'startup', 'tabs', 'extensions', 'shared-data']:
    (run / 'runtime' / name).mkdir(parents=True, exist_ok=True)
(run / 'runtime/user-data/User/settings.json').write_text(json.dumps({'workbench.startupEditor': 'none', 'security.workspace.trust.enabled': False}) + '\n')
source = subprocess.check_output(['git', 'rev-parse', 'HEAD'], cwd=repo, text=True).strip()
metadata = {'scenario': args.scenario, 'source': source, 'checkout': str(repo), 'run': str(run), 'historicalResults': 'Not reused as current-source acceptance'}
(run / 'rerun.json').write_text(json.dumps(metadata, indent=2) + '\n')
assert (run / 'integration/node_modules/playwright/index.mjs').is_file(), 'Install dependencies in this checkout first'
assert (run / 'runtime/native40/single/.vscode/tasks.json').is_file()
print(json.dumps(metadata), flush=True)
if not args.prepare_only:
    if args.scenario == 'attachment':
        command = [str(repo / '.build/electron/escode.app/Contents/MacOS/escode'), str(run / 'native-host-41')]
    elif args.scenario == 'native40':
        command = ['python3', str(run / 'launch-native40.py'), source]
    else:
        command = ['node', str(run / ('startup-smoke.mjs' if args.scenario == 'startup' else 'tabs-smoke.mjs'))]
    subprocess.run(command, cwd=run, env={**os.environ, 'ESCODE_CHECK_ROOT': str(repo)}, check=True)
