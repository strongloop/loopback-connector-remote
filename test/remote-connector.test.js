var assert = require('assert');
var helper = require('./helper');

describe('RemoteConnector', function() {
  var ctx = this;

  before(function() {
    ctx.serverApp = helper.createRestAppAndListen(3001);
    ctx.ServerModel = helper.createModel({
      parent: 'TestModel',
      app: ctx.serverApp,
      datasource: helper.createMemoryDataSource()
    });
    ctx.remoteApp = helper.createRestAppAndListen(3002);
    ctx.RemoteModel = helper.createModel({
      parent: 'TestModel',
      app: ctx.remoteApp,
      datasource: helper.createRemoteDataSource(ctx.serverApp)
    });
  });

  after(function() {
    ctx.serverApp.locals.handler.close();
    ctx.remoteApp.locals.handler.close();
    ctx.ServerModel = null;
    ctx.RemoteModel = null;
  });

  it('should support the save method', function(done) {
    var calledServerCreate = false;

    ctx.ServerModel.create = function(data, cb, callback) {
      calledServerCreate = true;
      data.id = 1;
      if (callback) callback(null, data);
      else cb(null, data);
    };

    var m = new ctx.RemoteModel({foo: 'bar'});
    m.save(function(err, instance) {
      if (err) return done(err);
      assert(instance);
      assert(instance instanceof ctx.RemoteModel);
      assert(calledServerCreate);
      done();
    });
  });

  it('should support aliases', function(done) {
    var calledServerUpsert = false;
    ctx.ServerModel.upsert = function(id, cb) {
      calledServerUpsert = true;
      cb();
    };

    ctx.RemoteModel.updateOrCreate({}, function(err, instance) {
      if (err) return done(err);
      assert(instance);
      assert(instance instanceof ctx.RemoteModel);
      assert(calledServerUpsert);
      done();
    });
  });
});

describe('Custom Path', function() {
  var ctx = this;

  before(function(done) {
    ctx.serverApp = helper.createRestAppAndListen(3001);
    ctx.ServerModel = helper.createModel({
      parent: 'TestModel',
      app: ctx.serverApp,
      datasource: helper.createMemoryDataSource(),
      options: {
        http: {path: '/custom'}
      }
    });

    ctx.remoteApp = helper.createRestAppAndListen(3002);
    ctx.RemoteModel = helper.createModel({
      parent: 'TestModel',
      app: ctx.remoteApp,
      datasource: helper.createRemoteDataSource(ctx.serverApp),
      options: {
        dataSource: 'remote',
        http: {path: '/custom'}
      }
    });
    done();
  });

  after(function(done)
  {
    ctx.serverApp.locals.handler.close();
    ctx.remoteApp.locals.handler.close();
    ctx.ServerModel = null;
    ctx.RemoteModel = null;
    done();
  });

  it('should support http.path configuration', function(done) {
    ctx.RemoteModel.create({}, function(err, instance) {
      if (err) return done(err);
      assert(instance);
      done();
    });
  });
});
