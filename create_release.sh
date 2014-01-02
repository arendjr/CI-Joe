#!/bin/bash


DEST_DIR=dist/ci-joe-$1

# clean-up previous build
rm -Rf $DEST_DIR

# make sure we use a clean config for releases
mv config/app.yaml config.app.yaml.safe
git checkout config/app.yaml

# copy all assets to release destination dir
mkdir $DEST_DIR
cp -R app \
      config \
      Gruntfile.js \
      joe.sh \
      lib \
      LICENSE.GPL.txt \
      node_modules \
      package.json \
      README.md \
      slave.sh \
      www \
      $DEST_DIR

# restore config
mv config.app.yaml.safe config/app.yaml

# create dist build
pushd $DEST_DIR
grunt dist
EXIT_CODE=$?
popd

# create tarball, if the build was successful
if [ $EXIT_CODE -eq 0 ]; then

    if [ "$2" != "--no-tarball" ]; then
        # make sure we only package non-development dependencies in the tarball
        rm -Rf $DEST_DIR/node_modules
        mkdir $DEST_DIR/node_modules
        DEPS=`cat package.json | \
              tools/JSON.sh -b | \
              grep "\[\"dependencies\"," | \
              sed "s/\[\"dependencies\",\"\(.*\)\"\].*/\1/g"`
        for dep in $DEPS; do
            cp -R node_modules/$dep $DEST_DIR/node_modules
        done

        pushd dist
        tar czf ci-joe-$1.tar.gz ci-joe-$1
        rm -R ci-joe-$1
        popd
    fi
fi

exit $EXIT_CODE
