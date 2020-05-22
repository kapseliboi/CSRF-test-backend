#!/bin/sh

npm run build-prod
git clone https://github.com/kapseliboi/CSRF-frontend-test.git frontend
cd frontend
npm install
npm run build
cp -r build ../dist/frontend
