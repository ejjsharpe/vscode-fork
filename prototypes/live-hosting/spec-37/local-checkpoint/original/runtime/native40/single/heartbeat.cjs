const fs = require('node:fs');
const path = require('node:path');
const output = path.join(__dirname, process.argv[2] || 'terminal-progress.log');
let count = 0;
const timer = setInterval(() => { fs.appendFileSync(output, String(++count) + '\n'); if (count === 600) { clearInterval(timer); } }, 1000);
