#!/bin/sh

npm run build-prod
git submodule update --init --recursive
git submodule update --recursive --remote
cd CSRF-frontend-test
npm install
npm run build
cp -r build ../dist/frontend
