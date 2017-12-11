// Copyright IBM Corp. 2016. All Rights Reserved.
// Node module: loopback-connector-remote
// This file is licensed under the MIT License.
// License text available at https://opensource.org/licenses/MIT

'use strict';

const assert = require('assert');
const helper = require('./helper');
const loopback = require('loopback');
const TaskEmitter = require('strong-task-emitter');

describe('Remote model tests', function() {
  let serverApp, ServerModel, clientApp, ClientModel;

  beforeEach(function setupServer(done) {
    const app = serverApp = helper.createRestAppAndListen();
    const db = helper.createMemoryDataSource(app);

    ServerModel = app.registry.createModel({
      name: 'TestModel',
      properties: helper.userProperties,
      options: {forceId: false},
    });
    app.model(ServerModel, {dataSource: db});

    serverApp.locals.handler.on('listening', function() { done(); });
  });

  beforeEach(function setupRemoteClient() {
    const app = clientApp = loopback({localRegistry: true});
    const remoteDs = helper.createRemoteDataSource(clientApp, serverApp);

    ClientModel = app.registry.createModel({
      name: 'TestModel',
    });
    app.model(ClientModel, {dataSource: remoteDs});
  });

  afterEach(function() {
    serverApp.locals.handler.close();
    ServerModel = null;
    ClientModel = null;
  });

  describe('Model.create([data], [callback])', function() {
    it('should create an instance and save to the attached data source',
      function(done) {
        ClientModel.create({first: 'Joe', last: 'Bob'}, function(err, user) {
          if (err) return done(err);
          assert(user instanceof ClientModel);
          done();
        });
      });
  });

  describe('model.save([options], [callback])', function() {
    it('should save an instance of a Model to the attached data source',
      function(done) {
        const joe = new ClientModel({first: 'Joe', last: 'Bob'});
        joe.save(function(err, user) {
          if (err) return done(err);
          assert(user.id);
          assert(!user.errors);
          done();
        });
      });
  });

  describe('model.updateAttributes(data, [callback])', function() {
    it('should save specified attributes to the attached data source',
      function(done) {
        ServerModel.create({first: 'joe', age: 100}, function(err, user) {
          if (err) return done(err);
          assert.equal(user.first, 'joe');

          user.updateAttributes({
            first: 'updatedFirst',
            last: 'updatedLast',
          }, function(err, updatedUser) {
            if (err) return done(err);
            assert.equal(updatedUser.first, 'updatedFirst');
            assert.equal(updatedUser.last, 'updatedLast');
            assert.equal(updatedUser.age, 100);
            done();
          });
        });
      });
  });

  describe('Model.upsert(data, callback)', function() {
    it('should update when a record with id=data.id is found, insert otherwise',
      function(done) {
        ClientModel.upsert({first: 'joe', id: 7}, function(err, user) {
          if (err) return done(err);
          assert.equal(user.first, 'joe');

          ClientModel.upsert({first: 'bob', id: 7}, function(err,
            updatedUser) {
            if (err) return done(err);
            assert.equal(updatedUser.first, 'bob');
            done();
          });
        });
      });
  });

  describe('Model.deleteById(id, [callback])', function() {
    it('should delete a model instance from the attached data source',
      function(done) {
        ServerModel.create({first: 'joe', last: 'bob'}, function(err, user) {
          if (err) return done(err);
          ClientModel.deleteById(user.id, function(err) {
            if (err) return done(err);
            ClientModel.findById(user.id, function(err, notFound) {
              assert.equal(notFound, null);
              assert(err && err.statusCode === 404,
                'should have failed with HTTP 404');
              done();
            });
          });
        });
      });
  });

  describe('Model.findById(id, callback)', function() {
    it('should find an instance by id from the attached data source',
      function(done) {
        ServerModel.create({first: 'michael', last: 'jordan', id: 23},
          function(err) {
            if (err) return done(err);
            ClientModel.findById(23, function(err, user) {
              if (err) return done(err);
              assert.equal(user.id, 23);
              assert.equal(user.first, 'michael');
              assert.equal(user.last, 'jordan');
              done();
            });
          });
      });
  });

  describe('Model.count([query], callback)', function() {
    it('should return the count of Model instances from both data source',
      function(done) {
        const taskEmitter = new TaskEmitter();
        taskEmitter
          .task(ServerModel, 'create', {first: 'jill', age: 100})
          .task(ClientModel, 'create', {first: 'bob', age: 200})
          .task(ClientModel, 'create', {first: 'jan'})
          .task(ServerModel, 'create', {first: 'sam'})
          .task(ServerModel, 'create', {first: 'suzy'})
          .on('done', function(err) {
            if (err) return done(err);
            ClientModel.count({age: {gt: 99}}, function(err, count) {
              if (err) return done(err);
              assert.equal(count, 2);
              done();
            });
          });
      });
  });
});
