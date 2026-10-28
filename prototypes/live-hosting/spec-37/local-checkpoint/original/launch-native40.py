import json
import os
from pathlib import Path
import platform
import shutil
import subprocess
import sys
import tempfile

root = Path(__file__).resolve().parent
repo = root / 'integration'
fixtures = root / 'runtime/native40'
state = Path(tempfile.mkdtemp(prefix='escode-spec37-40-', dir='/tmp'))
for name in ['user-data', 'shared-data', 'extensions']:
    (state / name).mkdir()
shutil.copytree(fixtures / 'extension', state / 'extensions/scratch.spec37-native-check-0.0.1')
for folder in ['single', 'multi-a']:
    (fixtures / folder / '.native40-fixture').touch()
args = [str(repo / 'scripts/code.sh'), f'--user-data-dir={state}/user-data', f'--shared-data-dir={state}/shared-data', f'--extensions-dir={state}/extensions', '--disable-workspace-trust', '--use-inmemory-secretstorage', '--log=trace', '--new-window', str(fixtures / 'single'), str(fixtures / 'multi.code-workspace')]
with (fixtures / 'runtime.log').open('w') as output:
    proc = subprocess.Popen(args, cwd=repo, env={**os.environ, 'VSCODE_SKIP_PRELAUNCH': '1'}, stdout=output, stderr=subprocess.STDOUT, start_new_session=True)
metadata = { 'pid': proc.pid, 'source': sys.argv[1], 'checkoutAtLaunch': subprocess.check_output(['git', 'rev-parse', 'HEAD'], cwd=repo, text=True).strip(), 'args': args, 'state': str(state), 'machine': platform.machine(), 'macOS': platform.mac_ver()[0] }
(fixtures / 'launch.json').write_text(json.dumps(metadata, indent=2) + '\n')
print(json.dumps(metadata))
