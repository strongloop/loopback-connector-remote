var loopback = require('loopback');
var defineModelTestsWithDataSource = require('./util/model-tests');
var assert = require('assert');
var Remote = require('..');

function createAppWithRest() {
  var app = loopback();
  app.set('host', '127.0.0.1');
  app.use(loopback.rest());
  return app;
} 

function listenAndSetupRemoteDS(test, app, remoteName, cb) {
  app.listen(0, function() {
    test[remoteName] = loopback.createDataSource({
      host: '127.0.0.1',
      port: app.get('port'),
      connector: Remote,
    });
    cb();
  });
}

describe('RemoteConnector', function() {
  var remoteApp;
  var remote;

  defineModelTestsWithDataSource({
    beforeEach: function(done) {
      var test = this;
      remoteApp = createAppWithRest();
      listenAndSetupRemoteDS(test, remoteApp, 'dataSource', done);
    },
    onDefine: function(Model) {
      var RemoteModel = Model.extend(Model.modelName);
      RemoteModel.attachTo(loopback.createDataSource({
        connector: loopback.Memory
      }));
      remoteApp.model(RemoteModel);
    }
  });

  beforeEach(function(done) {
    var test = this;
    var ServerModel = this.ServerModel =
      loopback.PersistedModel.extend('TestModel');

    remoteApp = test.remoteApp = createAppWithRest();
    remoteApp.model(ServerModel);

    listenAndSetupRemoteDS(test, remoteApp, 'remote', done);
  });

  it('should support the save method', function(done) {
    var calledServerCreate = false;
    var RemoteModel = loopback.PersistedModel.extend('TestModel');
    RemoteModel.attachTo(this.remote);

    var ServerModel = this.ServerModel;

    ServerModel.create = function(data, cb) {
      calledServerCreate = true;
      data.id = 1;
      cb(null, data);
    }

    ServerModel.setupRemoting();

    var m = new RemoteModel({foo: 'bar'});
    m.save(function(err, inst) {
      assert(inst instanceof RemoteModel);
      assert(calledServerCreate);
      done();
    });
  });

  it('should support aliases', function(done) {
    var RemoteModel = loopback.PersistedModel.extend('TestModel');
    RemoteModel.attachTo(this.remote);

    var ServerModel = this.ServerModel;

    ServerModel.upsert = function(id, cb) {
      done();
    };

    RemoteModel.updateOrCreate({}, function(err, inst) {
      if (err) return done(err);
    });
  });
});

describe('Custom Path', function() {
  var test = this;

  before(function(done) {
    var ServerModel = loopback.PersistedModel.extend('TestModel', {}, {
      http: {path: '/custom'}
    });

    server = test.server = createAppWithRest();
    server.dataSource('db', {
      connector: loopback.Memory,
      name: 'db'
    });
    server.model(ServerModel, {dataSource: 'db'});

    listenAndSetupRemoteDS(test, server, 'remote', done);
  });

  it('should support http.path configuration', function(done) {
    var RemoteModel = loopback.PersistedModel.extend('TestModel', {}, {
      dataSource: 'remote',
      http: {path: '/custom'}
    });
    RemoteModel.attachTo(test.remote);

    RemoteModel.create({}, function(err, instance) {
      if (err) return assert(err);
      done();
    });
  });
});