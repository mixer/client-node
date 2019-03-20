### Running Tests
Make sure any new code is unit tested.

```
npm run test
```

If using Visual Studio Code, you can use the following launch config for quickly debugging unit tests

```json
{
    "type": "node",
    "request": "launch",
    "name": "Run Unit Tests",
    "program": "${workspaceFolder}/node_modules/mocha/bin/_mocha",
    "env": {
        "TS_NODE_COMPILER_OPTIONS":"{\"module\":\"commonjs\"}"
    },
    "args": [
        "--require", "ts-node/register",
        "-u", "tdd",
        "--timeout", "999999",
        "--colors", "--recursive",
        "${workspaceFolder}/test/unit/**/*.test.js"
    ],
    "internalConsoleOptions": "openOnSessionStart",
    "skipFiles": ["node_modules/**/*", "<node_internals>"]
}
```
