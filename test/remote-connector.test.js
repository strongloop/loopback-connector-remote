// Copyright IBM Corp. 2014,2019. All Rights Reserved.
// Node module: loopback-connector-remote
// This file is licensed under the MIT License.
// License text available at https://opensource.org/licenses/MIT

'use strict';

const assert = require('assert');
const helper = require('./helper');
const loopback = require('loopback');

describe('RemoteConnector', function() {
  let serverApp, clientApp, ServerModel, ClientModel;

  before(function setupServer(done) {
    const app = serverApp = helper.createRestAppAndListen();
    const db = helper.createMemoryDataSource(app);

    ServerModel = app.registry.createModel({
      name: 'TestModel',
    });
    app.model(ServerModel, {dataSource: db});

    app.locals.handler.on('listening', function() { done(); });
  });

  before(function setupRemoteClient() {
    const app = clientApp = loopback({localRegistry: true});
    const remoteDs = helper.createRemoteDataSource(clientApp, serverApp);

    ClientModel = app.registry.createModel({
      name: 'TestModel',
    });
    app.model(ClientModel, {dataSource: remoteDs});
  });

  after(function() {
    serverApp.locals.handler.close();
    ServerModel = null;
    ClientModel = null;
  });

  it('should support the save method', function(done) {
    let calledServerCreate = false;

    ServerModel.create = function(data, options, cb, callback) {
      if (typeof options === 'function') {
        callback = cb;
        cb = options;
        options = {};
      }

      calledServerCreate = true;
      data.id = 1;
      if (callback) callback(null, data);
      else cb(null, data);
    };

    const m = new ClientModel({foo: 'bar'});
    m.save(function(err, instance) {
      if (err) return done(err);
      assert(instance);
      assert(instance instanceof ClientModel);
      assert(calledServerCreate);
      done();
    });
  });

  it('should support aliases', function(done) {
    let calledServerUpsert = false;
    ServerModel.patchOrCreate =
    ServerModel.upsert = function(id, options, cb) {
      if (typeof options === 'function') {
        cb = options;
        options = {};
      }

      calledServerUpsert = true;
      cb();
    };

    ClientModel.updateOrCreate({}, function(err, instance) {
      if (err) return done(err);
      assert(instance);
      assert(instance instanceof ClientModel);
      assert(calledServerUpsert, 'server upsert should have been called');
      done();
    });
  });
});

describe('Custom Path', function() {
  let serverApp, clientApp, ServerModel, ClientModel;

  before(function setupServer(done) {
    const app = serverApp = helper.createRestAppAndListen();
    const db = helper.createMemoryDataSource(app);

    ServerModel = app.registry.createModel({
      name: 'TestModel',
      options: {
        http: {path: '/custom'},
      },
    });
    app.model(ServerModel, {dataSource: db});

    serverApp.locals.handler.on('listening', function() { done(); });
  });

  before(function setupRemoteClient() {
    const app = clientApp = loopback({localRegistry: true});
    const remoteDs = helper.createRemoteDataSource(clientApp, serverApp);

    ClientModel = app.registry.createModel({
      name: 'TestModel',
      options: {
        dataSource: 'remote',
        http: {path: '/custom'},
      },
    });
    app.model(ClientModel, {dataSource: remoteDs});
  });

  after(function() {
    serverApp.locals.handler.close();
    ServerModel = null;
    ClientModel = null;
  });

  it('should support http.path configuration', function(done) {
    ClientModel.create({}, function(err, instance) {
      if (err) return done(err);
      assert(instance);
      done();
    });
  });
});

describe('RemoteConnector with options', () => {
  it('should have the remoting options passed to the remote object', () => {
    const app = loopback();
    const dataSource = app.dataSource('remote', {
      url: 'http://example.com',
      connector: require('..'),
      options: {'test': 'abc'},
    });

    assert.deepEqual(dataSource.connector.remotes.options, {test: 'abc'});
  });
});
