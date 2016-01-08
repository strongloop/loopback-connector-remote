var assert = require('assert');
var helper = require('./helper');
var TaskEmitter = require('strong-task-emitter');

describe('Remote model tests', function() {
  var ctx = this;

  beforeEach(function() {
    ctx.serverApp = helper.createRestAppAndListen(3001);
    ctx.ServerModel = helper.createModel({
      parent: 'TestModel',
      app: ctx.serverApp,
      datasource: helper.createMemoryDataSource(),
      properties: helper.userProperties
    });

    ctx.remoteApp = helper.createRestAppAndListen(3002);
    ctx.RemoteModel = helper.createModel({
      parent: 'TestModel',
      app: ctx.remoteApp,
      datasource: helper.createRemoteDataSource(ctx.serverApp),
      properties: helper.userProperties
    });
  });

  afterEach(function() {
    ctx.serverApp.locals.handler.close();
    ctx.remoteApp.locals.handler.close();
    ctx.ServerModel = null;
    ctx.RemoteModel = null;
  });

  describe('Model.create([data], [callback])', function() {
    it('should create an instance and save to the attached data source',
        function(done) {
      ctx.RemoteModel.create({first: 'Joe', last: 'Bob'}, function(err, user) {
        assert(user instanceof ctx.RemoteModel);
        done();
      });
    });
  });

  describe('model.save([options], [callback])', function() {
    it('should save an instance of a Model to the attached data source',
        function(done) {
      var joe = new ctx.RemoteModel({first: 'Joe', last: 'Bob'});
      joe.save(function(err, user) {
        assert(user.id);
        assert(!err);
        assert(!user.errors);
        done();
      });
    });
  });

  describe('model.updateAttributes(data, [callback])', function() {
    it('should save specified attributes to the attached data source',
        function(done) {
      ctx.ServerModel.create({first: 'joe', age: 100}, function(err, user) {
        assert(!err);
        assert.equal(user.first, 'joe');

        user.updateAttributes({
          first: 'updatedFirst',
          last: 'updatedLast'
        }, function(err, updatedUser) {
          assert(!err);
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
      ctx.RemoteModel.upsert({first: 'joe', id: 7}, function(err, user) {
        assert(!err);
        assert.equal(user.first, 'joe');

        ctx.RemoteModel.upsert({first: 'bob', id: 7}, function(err,
            updatedUser) {
          assert(!err);
          assert.equal(updatedUser.first, 'bob');
          done();
        });
      });
    });
  });

  describe('Model.deleteById(id, [callback])', function() {
    it('should delete a model instance from the attached data source',
        function(done) {
      ctx.ServerModel.create({first: 'joe', last: 'bob'}, function(err, user) {
        ctx.RemoteModel.deleteById(user.id, function(err) {
          ctx.RemoteModel.findById(user.id, function(err, notFound) {
            assert.equal(notFound, null);
            done();
          });
        });
      });
    });
  });

  describe('Model.findById(id, callback)', function() {
    it('should find an instance by id from the attached data source',
        function(done) {
      ctx.ServerModel.create({first: 'michael', last: 'jordan', id: 23},
          function() {
        ctx.RemoteModel.findById(23, function(err, user) {
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
      var taskEmitter = new TaskEmitter();
      taskEmitter
        .task(ctx.ServerModel, 'create', {first: 'jill', age: 100})
        .task(ctx.RemoteModel, 'create', {first: 'bob', age: 200})
        .task(ctx.RemoteModel, 'create', {first: 'jan'})
        .task(ctx.ServerModel, 'create', {first: 'sam'})
        .task(ctx.ServerModel, 'create', {first: 'suzy'})
        .on('done', function() {
          ctx.RemoteModel.count({age: {gt: 99}}, function(err, count) {
            assert.equal(count, 2);
            done();
          });
        });
    });
  });
});
