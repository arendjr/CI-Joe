#!/bin/sh

rm -Rf tests/build

echo "Building..."
mv config/app.yaml config/app.yaml.safe
git checkout config/app.yaml

mkdir tests/build
mkdir tests/build/config
cp -R app \
      Gruntfile.js \
      joe.sh \
      lib \
      node_modules \
      package.json \
      slave.sh \
      www \
      tests/build
cat config/app.yaml | sed "s/port: 8080/port: 18080/" > tests/build/config/app.yaml

mv config/app.yaml.safe config/app.yaml

cd tests/build
grunt dist
if [ "$?" -ne "0" ]; then
    exit 1
fi


echo "Starting tests..."
cd "$(dirname "$0")"
grunt casperjs

if [ "$?" -eq "0" ]; then
    rm -Rf tests/build
fi
