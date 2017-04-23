'use strict';

const fs = require('fs');
const pkg = require('./package.json');

fs.writeFileSync('src/socket.ts',
    fs.readFileSync('src/socket.ts', 'utf8')
    .replace(/const packageVersion = '.*?'; \/\/ package version/, `const packageVersion = '${pkg.version}'; // package version`)
);
