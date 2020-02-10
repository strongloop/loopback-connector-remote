// Copyright IBM Corp. 2016,2019. All Rights Reserved.
// Node module: loopback-connector-remote
// This file is licensed under the MIT License.
// License text available at https://opensource.org/licenses/MIT

'use strict';

const assert = require('assert');
const helper = require('./helper');
const loopback = require('loopback');
const TaskEmitter = require('strong-task-emitter');

describe('Model tests', function() {
  let User;

  beforeEach(function() {
    const app = helper.createRestAppAndListen();
    const db = helper.createMemoryDataSource(app);

    User = app.registry.createModel({
      name: 'user',
      properties: helper.getUserProperties(),
      options: {forceId: false},
    });
    app.model(User, {dataSource: db});
  });

  describe('Model.validatesPresenceOf(properties...)', function() {
    it('should require a model to include a property to be considered valid',
      function() {
        User.validatesPresenceOf('first', 'last', 'age');
        const joe = new User({first: 'joe'});
        assert(joe.isValid() === false, 'model should not validate');
        assert(joe.errors.last, 'should have a missing last error');
        assert(joe.errors.age, 'should have a missing age error');
      });
  });

  describe('Model.validatesLengthOf(property, options)', function() {
    it('should require a property length to be within a specified range',
      function() {
        User.validatesLengthOf('password', {min: 5, message: {min:
          'Password is too short'}});
        const joe = new User({password: '1234'});
        assert(joe.isValid() === false, 'model should not be valid');
        assert(joe.errors.password, 'should have password error');
      });
  });

  describe('Model.validatesInclusionOf(property, options)', function() {
    it('should require a value for `property` to be in the specified array',
      function() {
        User.validatesInclusionOf('gender', {in: ['male', 'female']});
        const foo = new User({gender: 'bar'});
        assert(foo.isValid() === false, 'model should not be valid');
        assert(foo.errors.gender, 'should have gender error');
      });
  });

  describe('Model.validatesExclusionOf(property, options)', function() {
    it('should require a value for `property` to not exist in the specified ' +
        'array', function() {
      User.validatesExclusionOf('domain', {in: ['www', 'billing', 'admin']});
      const foo = new User({domain: 'www'});
      const bar = new User({domain: 'billing'});
      const bat = new User({domain: 'admin'});
      assert(foo.isValid() === false);
      assert(bar.isValid() === false);
      assert(bat.isValid() === false);
      assert(foo.errors.domain, 'model should have a domain error');
      assert(bat.errors.domain, 'model should have a domain error');
      assert(bat.errors.domain, 'model should have a domain error');
    });
  });

  describe('Model.validatesNumericalityOf(property, options)', function() {
    it('should require a value for `property` to be a specific type of ' +
        '`Number`', function() {
      User.validatesNumericalityOf('age', {int: true});
      const joe = new User({age: 10.2});
      assert(joe.isValid() === false);
      const bob = new User({age: 0});
      assert(bob.isValid() === true);
      assert(joe.errors.age, 'model should have an age error');
    });
  });

  describe('myModel.isValid()', function() {
    it('should validate the model instance', function() {
      User.validatesNumericalityOf('age', {int: true});
      const user = new User({first: 'joe', age: 'flarg'});
      const valid = user.isValid();
      assert(valid === false);
      assert(user.errors.age, 'model should have age error');
    });

    it('should validate the model asynchronously', function(done) {
      User.validatesNumericalityOf('age', {int: true});
      const user = new User({first: 'joe', age: 'flarg'});
      user.isValid(function(valid) {
        assert(valid === false);
        assert(user.errors.age, 'model should have age error');
        done();
      });
    });
  });

  describe('Model.create([data], [callback])', function() {
    it('should create an instance and save to the attached data source',
      function(done) {
        User.create({first: 'Joe', last: 'Bob'}, function(err, user) {
          if (err) return done(err);
          assert(user instanceof User);
          done();
        });
      });
  });

  describe('model.save([options], [callback])', function() {
    it('should save an instance of a Model to the attached data source',
      function(done) {
        const joe = new User({first: 'Joe', last: 'Bob'});
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
        User.create({first: 'joe', age: 100}, function(err, user) {
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
        User.upsert({first: 'joe', id: 7}, function(err, user) {
          if (err) return done(err);
          assert.equal(user.first, 'joe');

          User.upsert({first: 'bob', id: 7}, function(err, updatedUser) {
            if (err) return done(err);
            assert.equal(updatedUser.first, 'bob');
            done();
          });
        });
      });
  });

  describe('model.destroy([callback])', function() {
    it('should remove a model from the attached data source', function(done) {
      User.create({first: 'joe', last: 'bob'}, function(err, user) {
        if (err) return done(err);
        User.findById(user.id, function(err, foundUser) {
          if (err) return done(err);
          assert.equal(user.id, foundUser.id);
          foundUser.destroy(function(err) {
            if (err) return done(err);
            User.findById(user.id, function(err, notFound) {
              if (err) return done(err);
              assert.equal(notFound, null);
              done();
            });
          });
        });
      });
    });
  });

  describe('Model.deleteById(id, [callback])', function() {
    it('should delete a model instance from the attached data source',
      function(done) {
        User.create({first: 'joe', last: 'bob'}, function(err, user) {
          if (err) return done(err);
          User.deleteById(user.id, function(err) {
            if (err) return done(err);
            User.findById(user.id, function(err, notFound) {
              if (err) return done(err);
              assert.equal(notFound, null);
              done();
            });
          });
        });
      });
  });

  describe('Model.findById(id, callback)', function() {
    it('should find an instance by id', function(done) {
      User.create({first: 'michael', last: 'jordan', id: 23}, function(err) {
        if (err) return done(err);
        User.findById(23, function(err, user) {
          if (err) return done(err);
          assert(user, 'user should have been found');
          assert.equal(user.id, 23);
          assert.equal(user.first, 'michael');
          assert.equal(user.last, 'jordan');
          done();
        });
      });
    });
  });

  describe('Model.count([query], callback)', function() {
    it('should return the count of Model instances in data source',
      function(done) {
        const taskEmitter = new TaskEmitter();
        taskEmitter
          .task(User, 'create', {first: 'jill', age: 100})
          .task(User, 'create', {first: 'bob', age: 200})
          .task(User, 'create', {first: 'jan'})
          .task(User, 'create', {first: 'sam'})
          .task(User, 'create', {first: 'suzy'})
          .on('done', function() {
            User.count({age: {gt: 99}}, function(err, count) {
              if (err) return done(err);
              assert.equal(count, 2);
              done();
            });
          });
      });
  });
});
