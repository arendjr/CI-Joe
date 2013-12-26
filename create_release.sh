#!/bin/bash

mkdir dist/ci-joe-$1
mkdir dist/ci-joe-$1/www

cp -R app \
      config \
      joe.sh \
      lib \
      LICENSE.GPL.txt \
      node_modules \
      package.json \
      README.md \
      slave.sh \
      dist/ci-joe-$1
cp -R www/build \
      www/css \
      www/favicon.png \
      www/fonts \
      www/img \
      www/js \
      www/translations \
      dist/ci-joe-$1/www

pushd dist
tar czf ci-joe-$1.tar.gz ci-joe-$1
popd
