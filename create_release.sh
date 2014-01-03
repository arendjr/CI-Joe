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
    # make sure we only package non-development dependencies in the tarball
    DEV_DEPS=`cat package.json | \
              tools/JSON.sh -b | \
              grep "\[\"devDependencies\"," | \
              sed "s/\[\"devDependencies\",\"\(.*\)\"\].*/\1/g"`
    for devDep in $DEV_DEPS; do
        rm -Rf $DEST_DIR/node_modules/$devDep
    done

    # remove some test dirs from dependencies, that otherwise take up most
    # of the space of our tarball
    for testDir in `find -E $DEST_DIR/node_modules -regex .*/tests?`; do
        rm -Rf $testDir
    done

    if [ "$2" != "--no-tarball" ]; then
        pushd dist
        tar czf ci-joe-$1.tar.gz ci-joe-$1
        rm -R ci-joe-$1
        popd
    fi
fi

exit $EXIT_CODE
