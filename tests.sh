#!/bin/sh

rm -Rf tests/build

echo "Building..."
mv config/app.yaml config.app.yaml.safe
git checkout config/app.yaml

mkdir tests/build
mkdir tests/build/config
cp -R app \
      Gruntfile.js \
      lib \
      node_modules \
      www \
      tests/build
cat config/app.yaml | sed "s/port: 8080/port: 18080/" > tests/build/config/app.yaml

mv config/app.yaml.safe config.app.yaml

cd tests/build
grunt dist


echo "Starting tests..."
cd "$(dirname "$0")"
grunt tests

if [ "$?" -eq "0" ]; then
    rm -Rf tests/build
fi
