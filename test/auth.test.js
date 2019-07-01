'use strict';
const chai = require('chai');
const chaiHTTP = require('chai-http');
const faker = require('faker');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');

const {app, runServer, closeServer} = require('../server');
const {User} = require('../users');
const {JWT_SECRET, TEST_DATABASE_URL, TEST_PORT} = require('../config');

const {expect} = chai;

chai.use(chaiHTTP);

describe('Auth endpoints', function() {
  const username = 'testUsername';
  const password = 'testPassword';

  before(function() {
    return runServer(TEST_DATABASE_URL, TEST_PORT);
  });

  after(function() {
    return closeServer();
  });

  beforeEach(function() {
    return User.hashPassword(password)
      .then(() => {
        return User.create({username, password})
      });
  });

  afterEach(function() {
    return User.remove({});
  });

  describe('/auth/login', function() {
    it('reject an empty request', function() {
      return chai.request(app).post('/auth/login')
        .then(res => {
          expect(res).to.have.status(400);
        })
    });
  })
});