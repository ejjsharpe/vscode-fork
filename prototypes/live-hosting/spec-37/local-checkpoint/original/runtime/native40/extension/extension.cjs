const vscode = require('vscode');
const fs = require('node:fs');
const path = require('node:path');

exports.activate = function (context) {
  const folders = (vscode.workspace.workspaceFolders || []).filter(folder => folder.uri.scheme === 'file');
  const fixture = folders.find(folder => fs.existsSync(path.join(folder.uri.fsPath, '.native40-fixture')));
  if (!fixture) { return; }
  const record = kind => fs.appendFileSync(path.join(fixture.uri.fsPath, 'extension-progress.jsonl'), JSON.stringify({ kind, pid: process.pid, time: Date.now(), workspace: vscode.workspace.workspaceFile?.toString(), folders: folders.map(folder => folder.uri.toString()) }) + '\n');
  record('activated');
  let ticks = 0;
  const timer = setInterval(() => { record('tick'); if (++ticks === 600) { clearInterval(timer); } }, 1000);
  context.subscriptions.push({ dispose: () => clearInterval(timer) });
  context.subscriptions.push(vscode.commands.registerCommand('spec37.recordWorkspace', () => record('command')));
  context.subscriptions.push(vscode.commands.registerCommand('spec37.startWork', async () => {
    record('start-work-command');
    const terminal = vscode.window.createTerminal({ name: 'Ownership heartbeat', cwd: fixture.uri.fsPath });
    terminal.sendText('node heartbeat.cjs');
    terminal.show();
    const task = async () => {
      const tasks = await vscode.tasks.fetchTasks();
      const selected = tasks.find(task => task.name === 'Ownership heartbeat task');
      if (!selected) { throw new Error('Named fixture task missing'); }
      await vscode.tasks.executeTask(selected);
      record('task-started');
    };
    await Promise.allSettled([
      task().catch(error => record('task-error:' + error.message)),
      vscode.debug.startDebugging(fixture, 'Ownership heartbeat debug').then(started => record('debug-started:' + started), error => record('debug-error:' + error.message))
    ]);
  }));
};
