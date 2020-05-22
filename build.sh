#!/bin/sh

npm run build-prod
cd CSRF-frontend-test
npm install
npm run build
cp -r build ../dist/frontend
