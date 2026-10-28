# Native UI observations

Observed through cua_repl on the exact disposable app path (not screenshots):

1. Dirty reload: “Do you want to save the changes you made to Disposable lifecycle reply test?” Buttons Save, Don’t Save, Cancel. Clicked Cancel; the project remained visible with one unsaved file.
2. Repeated reload: clicked Save, then entered the scratch path in the in-workbench Save As field. The file was written; the replacement workbench showed saved.txt and the exact text (see saved-reloaded.png).
3. Crash: “The window terminated unexpectedly (reason: 'killed', code: '2')”. “Don’t restore editors” was unchecked. Clicked Reopen. Subsequent AX observation timed out. Main-process enumeration independently found zero BrowserWindows; retained WebContents and a new replacement WebContents remained. See recovery-state.json and neighbour-extension-hosts.log.

The generic app-name lookup initially selected/launched a different checkout’s Electron default page; no test actions were taken there. All actual native test actions used the exact current checkout app path.
