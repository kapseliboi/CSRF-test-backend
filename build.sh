#!/bin/sh

npm run build-prod
git submodule update --init --recursive
git submodule update --recursive --remote
cd frontend
npm install
npm run build
cp -rf build/* ../dist/frontend/
