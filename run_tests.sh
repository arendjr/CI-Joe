#!/bin/bash

cd "$(dirname "$0")"


DEST_DIR=dist/ci-joe-test
TEST_PORT=18080


# create test release
echo "Building..."
./create_release.sh test --no-tarball
if [ $? -ne 0 ]; then
    exit 1
fi

# copy tests to release
cp -R tests $DEST_DIR

# adjust config
pushd $DEST_DIR
mv config/app.yaml config/app.yaml.orig
cat config/app.yaml.orig | sed "s/port: 8080/port: $TEST_PORT/" > config/app.yaml
popd


echo "Starting CI-Joe test instance at port $TEST_PORT..."
cd $DEST_DIR
node app/master.js &
JOE_PID=$!
if [ "$?" -ne "0" ]; then
    echo "Error starting CI-Joe."
    exit 2
fi


echo "Starting tests..."
grunt tests $1

if [ $? -eq 0 ]; then
    rm -Rf $DEST_DIR
fi

# kill joe.sh in the background
kill $JOE_PID
