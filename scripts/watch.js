#!/bin/sh
':' //; exec "$(command -v nodejs || command -v node)" "$0" "$@"

// ^ See http://unix.stackexchange.com/questions/65235/universal-node-js-shebang

var path = require('path');
var SRC = path.join(process.cwd(), 'src/');
var NODE_MODULES = path.join(process.cwd(), 'node_modules/');

var spawn = require('child_process').spawn;
function launchMake (event, path) {
  console.log(event, 'File:', path);
  var make = spawn('make', ['build']);
  make.stdout.pipe(process.stdout);
  make.stderr.pipe(process.stderr);
}

require('chokidar')
  .watch([SRC, NODE_MODULES], {ignored: /[\/\\]\./, persistent: true, ignoreInitial: true})
  .on('all', launchMake);
