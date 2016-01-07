var loopback = require('loopback');
var remoteConnector = require('..');

exports.createMemoryDataSource = createMemoryDataSource;
exports.createModel = createModel;
exports.createRemoteDataSource = createRemoteDataSource;
exports.createRestAppAndListen = createRestAppAndListen;
exports.getUserProperties = getUserProperties;

function createRestAppAndListen(port) {
  var app = loopback();

  app.set('host', '127.0.0.1');
  if (port) app.set('port', port);

  app.use(loopback.rest());
  app.locals.handler = app.listen();

  return app;
}

function createMemoryDataSource() {
  return loopback.createDataSource({connector: 'memory'});
}

function createRemoteDataSource(remoteApp) {
  return loopback.createDataSource({
    url: 'http://' + remoteApp.get('host') + ':' + remoteApp.get('port'),
    connector: remoteConnector
  });
}

/**
 * Used to create models based on a set of options. May associate or link to an
 * app.
 */
function createModel(options) {
  var Model = loopback.PersistedModel.extend(options.parent, options.properties,
      options.options);
  if (options.app) options.app.model(Model);
  if (options.datasource) Model.attachTo(options.datasource);
  return Model;
}

function getUserProperties() {
  return {
    'first': String,
    'last': String,
    'age': Number,
    'password': String,
    'gender': String,
    'domain': String,
    'email': String
  };
}
