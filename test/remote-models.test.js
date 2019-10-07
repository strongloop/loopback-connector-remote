// Copyright IBM Corp. 2016,2018. All Rights Reserved.
// Node module: loopback-connector-remote
// This file is licensed under the MIT License.
// License text available at https://opensource.org/licenses/MIT

'use strict';

const assert = require('assert');
const helper = require('./helper');
const loopback = require('loopback');
const TaskEmitter = require('strong-task-emitter');

describe('Remote model tests', function() {
  let serverApp, ServerModel, ServerRelatedModel, ServerModelWithSingleChild,
    clientApp, ClientModel, ClientRelatedModel, ClientModelWithSingleChild;

  beforeEach(function setupServer(done) {
    const app = serverApp = helper.createRestAppAndListen();
    const db = helper.createMemoryDataSource(app);

    ServerModel = app.registry.createModel({
      name: 'TestModel',
      properties: helper.getUserProperties(),
      options: {
        forceId: false,
        relations: {
          children: {
            type: 'hasMany',
            model: 'ChildModel',
            foreignKey: 'parentId',
          },
        },
      },
    });

    ServerModelWithSingleChild = app.registry.createModel({
      name: 'TestModelWithSingleChild',
      properties: helper.getUserProperties(),
      options: {
        forceId: false,
        relations: {
          child: {
            type: 'hasOne',
            model: 'ChildModel',
            foreignKey: 'parentId',
          },
        },
      },
    });

    ServerRelatedModel = app.registry.createModel({
      name: 'ChildModel',
      properties: {
        note: {type: 'text'},
        parentId: {type: 'number'},
      },
      options: {forceId: false},
    });

    app.model(ServerModel, {dataSource: db});
    app.model(ServerRelatedModel, {dataSource: db});
    app.model(ServerModelWithSingleChild, {dataSource: db});

    serverApp.locals.handler.on('listening', function() { done(); });
  });

  beforeEach(function setupRemoteClient() {
    const app = clientApp = loopback({localRegistry: true});
    const remoteDs = helper.createRemoteDataSource(clientApp, serverApp);

    ClientRelatedModel = app.registry.createModel({
      name: 'ChildModel',
      properties: {
        note: {type: 'text'},
        parentId: {type: 'number'},
      },
      options: {
        strict: true,
      },
    });

    ClientModel = app.registry.createModel({
      name: 'TestModel',
      properties: helper.getUserProperties(),
      options: {
        relations: {
          children: {
            type: 'hasMany',
            model: 'ChildModel',
            foreignKey: 'parentId',
          },
        },
        strict: true,
      },
    });

    ClientModelWithSingleChild = app.registry.createModel({
      name: 'TestModelWithSingleChild',
      properties: helper.getUserProperties(),
      options: {
        relations: {
          child: {
            type: 'hasOne',
            model: 'ChildModel',
            foreignKey: 'parentId',
          },
        },
        strict: true,
      },
    });

    app.model(ClientModel, {dataSource: remoteDs});
    app.model(ClientRelatedModel, {dataSource: remoteDs});
    app.model(ClientModelWithSingleChild, {dataSource: remoteDs});
  });

  afterEach(function() {
    serverApp.locals.handler.close();
    ServerModel = null;
    ServerRelatedModel = null;
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
              if (err) return done(err);
              assert.equal(notFound, null);
              done();
            });
          });
        });
      });
  });

  describe('Model.exists(id, callback)', function() {
    it('should return true when the model with the given id exists',
      function(done) {
        ServerModel.create({first: 'max'}, function(err, user) {
          if (err) return done(err);
          ClientModel.exists(user.id, function(err, exist) {
            if (err) return done(err);
            assert.equal(exist, true);
            done();
          });
        });
      });

    it('should return false when there is no model with the given id',
      function(done) {
        ClientModel.exists('user-id-does-not-exist', function(err, exist) {
          if (err) return done(err);
          assert.equal(exist, false);
          done();
        });
      });
  });

  describe('Model.findById(id, callback)', function() {
    it('should return null when an instance does not exist',
      function(done) {
        ClientModel.findById(23, function(err, notFound) {
          if (err) return done(err);
          assert.equal(notFound, null);
          done();
        });
      });

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

  describe('Model.findOne([filter], callback)', function() {
    it('should return null when an instance does not exist',
      function(done) {
        ClientModel.findOne({where: {id: 24}}, function(err, notFound) {
          if (err) return done(err);
          assert.equal(notFound, null);
          done();
        });
      });

    it('should find an instance from the attached data source',
      function(done) {
        ServerModel.create({first: 'keanu', last: 'reeves', id: 24},
          function(err) {
            if (err) return done(err);
            ClientModel.findOne({where: {id: 24}}, function(err, user) {
              if (err) return done(err);
              assert.equal(user.id, 24);
              assert.equal(user.first, 'keanu');
              assert.equal(user.last, 'reeves');
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

  describe('Model find with include filter', function() {
    let hasManyParent, hasManyChild, hasOneParent, hasOneChild;
    beforeEach(givenSampleData);

    it('should return also the included requested  models', function() {
      const parentId = hasManyParent.id;
      return ClientModel.findById(hasManyParent.id, {include: 'children'})
        .then(returnedUser => {
          assert(returnedUser instanceof ClientModel);
          const user = returnedUser.toJSON();
          assert.equal(user.id, parentId);
          assert.equal(user.first, hasManyParent.first);
          assert(Array.isArray(user.children));
          assert.equal(user.children.length, 1);
          assert.deepEqual(user.children[0], hasManyChild.toJSON());
        });
    });

    it('should return cachedRelated entity without call', function() {
      const parentId = hasManyParent.id;
      return ClientModel.findById(parentId, {include: 'children'})
        .then(returnedUser => {
          assert(returnedUser instanceof ClientModel);
          const children = returnedUser.children();
          assert.equal(returnedUser.id, parentId);
          assert.equal(returnedUser.first, hasManyParent.first);
          assert(Array.isArray(children));
          assert.equal(children.length, 1);
          assert(children[0] instanceof ClientRelatedModel);
          assert.deepEqual(children[0].toJSON(), hasManyChild.toJSON());
        });
    });

    it('should also work for single (non array) relations', function() {
      const parentId = hasOneParent.id;
      return ClientModelWithSingleChild.findById(parentId, {include: 'child'})
        .then(returnedUser => {
          assert(returnedUser instanceof ClientModelWithSingleChild);
          const child = returnedUser.child();
          assert.equal(returnedUser.id, parentId);
          assert.equal(returnedUser.first, hasOneParent.first);
          assert(child instanceof ClientRelatedModel);
          assert.deepEqual(child.toJSON(), hasOneChild.toJSON());
        });
    });

    function givenSampleData() {
      return ServerModel.create({first: 'eiste', last: 'kopries'})
        .then(parent => {
          hasManyParent = parent;
          return ServerRelatedModel.create({
            note: 'mitsos',
            parentId: parent.id,
            id: 11,
          });
        })
        .then(child => {
          hasManyChild = child;
          return ServerModelWithSingleChild.create({
            first: 'mipos',
            last: 'tora',
            id: 12,
          });
        })
        .then(parent => {
          hasOneParent = parent;
          return ServerRelatedModel.create({
            note: 'mitsos3',
            parentId: parent.id,
            id: 13,
          });
        })
        .then(child => {
          hasOneChild = child;
        });
    }
  });

  describe('Model.updateAll([where], [data])', () => {
    it('returns the count of updated instances in data source', async () => {
      await ServerModel.create({first: 'baby', age: 1});
      await ServerModel.create({first: 'grandma', age: 80});

      const result = await ClientModel.updateAll(
        {age: {lt: 6}},
        {last: 'young'},
      );
      assert.deepEqual(result, {count: 1});
    });
  });
});
