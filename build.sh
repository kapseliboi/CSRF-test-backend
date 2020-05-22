#!/bin/sh

npm run build-prod
/usr/bin/git submodule update --init --recursive
/usr/bin/git submodule update --recursive --remote
cd frontend
npm install
npm run build
cp -r build ../dist/frontend
