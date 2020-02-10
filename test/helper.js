// Copyright IBM Corp. 2016,2019. All Rights Reserved.
// Node module: loopback-connector-remote
// This file is licensed under the MIT License.
// License text available at https://opensource.org/licenses/MIT

'use strict';

const extend = require('util')._extend;
const loopback = require('loopback');
const remoteConnector = require('..');

exports.createMemoryDataSource = createMemoryDataSource;
exports.createRemoteDataSource = createRemoteDataSource;
exports.createRestAppAndListen = createRestAppAndListen;
exports.getUserProperties = getUserProperties;

function createRestAppAndListen() {
  const app = loopback({localRegistry: true});

  app.set('host', '127.0.0.1');
  app.set('port', 0);

  app.set('legacyExplorer', false);
  app.set('remoting', {
    errorHandler: {debug: true, log: false},
    context: false,
  });

  app.use(loopback.rest());
  app.locals.handler = app.listen();

  return app;
}

function createMemoryDataSource(app) {
  return app.dataSource('db', {connector: 'memory'});
}

function createRemoteDataSource(app, serverApp) {
  return app.dataSource('remote', {
    url: 'http://' + serverApp.get('host') + ':' + serverApp.get('port'),
    connector: remoteConnector,
  });
}

function getUserProperties() {
  return {
    'first': String,
    'last': String,
    'age': Number,
    'password': String,
    'gender': String,
    'domain': String,
    'email': String,
  };
}
