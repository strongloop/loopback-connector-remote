// Copyright IBM Corp. 2016,2019. All Rights Reserved.
// Node module: loopback-connector-remote
// This file is licensed under the MIT License.
// License text available at https://opensource.org/licenses/MIT

'use strict';

const assert = require('assert');
const helper = require('../helper');
const Promise = require('bluebird');

let globalPromiseSetManually = false;
let User;

describe('promise support', function() {
  before(setGlobalPromise);
  before(createUserModel);
  after(resetGlobalPromise);

  context('create', function() {
    it('supports promises', function() {
      const retval = User.create();
      assert(retval && typeof retval.then === 'function');
    });
  });

  context('find', function() {
    it('supports promises', function() {
      const retval = User.find();
      assert(retval && typeof retval.then === 'function');
    });
  });

  context('findById', function() {
    it('supports promises', function() {
      const retval = User.findById(1);
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
  const app = helper.createRestAppAndListen();
  const db = helper.createMemoryDataSource(app);

  User = app.registry.createModel({
    name: 'user',
    properties: helper.getUserProperties(),
    options: {forceId: false},
  });
  app.model(User, {dataSource: db});
}

function resetGlobalPromise() {
  if (globalPromiseSetManually)
    global.Promise = undefined;
}
