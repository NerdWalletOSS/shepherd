#!/bin/bash
DIRNAME=$(cd "$(dirname "${BASH_SOURCE[0]}")"; pwd -P)

if ! node $DIRNAME/has_react_router_1.js package.json
then
  exit 0
fi

set -e

npm uninstall react-router
npm install @nerdwallet/react-router@1

git grep -l react-router -- {test,tests,client}/{**,.}/*.js{,x} | \
  xargs sed -i '' 's/react-router/@nerdwallet\/react-router/g'
