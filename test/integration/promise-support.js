var assert = require('assert');
var helper = require('../helper');
var Promise = require('bluebird');

var globalPromiseSetManually = false;
var User;

describe('promise support', function() {
  before(setGlobalPromise);
  before(createUserModel);
  after(resetGlobalPromise);

  context('create', function() {
    it('supports promises', function() {
      var retval = User.create();
      assert(retval && typeof retval.then === 'function');
    });
  });

  context('find', function() {
    it('supports promises', function() {
      var retval = User.find();
      assert(retval && typeof retval.then === 'function');
    });
  });

  context('findById', function() {
    it('supports promises', function() {
      var retval = User.findById(1);
      assert(retval && typeof retval.then === 'function');
    });
  });
});

function setGlobalPromise() {
  if (!global.Promise) {
    global.Promise = Promise;
    globalPromiseSetManually = true;
  }
}

function createUserModel() {
  User = helper.createModel({
    parent: 'user',
    app: helper.createRestAppAndListen(),
    datasource: helper.createMemoryDataSource(),
    properties: helper.getUserProperties()
  });
}

function resetGlobalPromise() {
  if (globalPromiseSetManually)
    global.Promise = undefined;
}
