# client-node

[![Build Status](https://travis-ci.org/mixer/client-node.svg)](https://travis-ci.org/mixer/client-node) [![](https://badges.gitter.im/mixer/developers.png)](https://gitter.im/mixer/developers)

This is a client library for [Mixer](https://mixer.com) written in Node.js.

## Getting Started.

It's available on npm:
```
npm install --save @mixer/client-node
```

We have tutorials on our [Developer Site](https://dev.mixer.com) to help you get started.

- [Chat Tutorial](https://dev.mixer.com/tutorials/chatbot.html)
- [REST API Tutorial](https://dev.mixer.com/tutorials/rest.html)

### Visual Studio Code Reference Launch Config
```json
{
    "type": "node",
    "request": "launch",
    "name": "Run All Tests",
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


## Getting Help
Chat with us and other developers on our [gitter](https://gitter.im/mixer/mixer-dev)


