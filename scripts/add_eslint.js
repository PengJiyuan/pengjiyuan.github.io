'use strict';

const path = require('path');
const execFile = require('child_process').execFile;
const rootDir = path.join(__dirname, '..');
const scriptPath = path.join(__dirname, 'add_commit_hooks.sh');

console.log('-----ADD ESLINT HOOK JOB: Start!-----');

execFile(scriptPath, [rootDir], null, function() {
  console.log('-----ADD ESLINT HOOK JOB: Done!-----');
});

