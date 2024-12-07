#!/bin/bash
set -e

# Admin
mongosh <<EOF
use admin
db.createUser({
  user: '$MONGO_INITDB_ROOT_USERNAME',
  pwd: '$MONGO_INITDB_ROOT_PASSWORD',
  roles:[{
    role: 'root',
    db: 'admin'
  }]
})
EOF

# Test & Main
mongosh --authenticationDatabase admin -u "$MONGO_INITDB_ROOT_USERNAME" -p "$MONGO_INITDB_ROOT_PASSWORD" <<EOF
use test
db.createUser({
  user: '$MONGO_INITDB_TEST_USERNAME',
  pwd: '$MONGO_INITDB_TEST_PASSWORD',
  roles:[{
    role: 'readWrite',
    db: 'test'
  }]
})

use main
db.createUser({
  user: '$MONGO_INITDB_MAIN_USERNAME',
  pwd: '$MONGO_INITDB_MAIN_PASSWORD',
  roles:[{
    role: 'readWrite',
    db: 'main'
  }]
})
EOF