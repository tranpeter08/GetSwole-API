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

describe('users endpoints', function() {
  before(function() {
    return runServer(TEST_DATABASE_URL, TEST_PORT);
  });

  afterEach(function() {
    return User.remove({});
  });

  after(function() {
    return closeServer();
  });

  describe('/users', function() {
    const username = 'testUsername';
    const password = 'testPassword';
    const email = 'testEmail@a.com';
    const url = '/users';

    it('rejects an empty request', function() {
      return chai.request(app)
        .post(url)
        .then(res => {
          expect(res).to.have.status(400);
        });
    });

    it('rejects a request with a missing username field', function() {
      return chai.request(app)
        .post(url)
        .send({password, email})
        .then(res => {
          expect(res).to.have.status(400);
        });
    });

    it('rejects a request with a missing password field', function() {
      return chai.request(app)
        .post(url)
        .send({username, email})
        .then(res => {
          expect(res).to.have.status(400);
        });
    });

    it('rejects a request with a missing email field', function() {
      return chai.request(app)
        .post(url)
        .send({username, password})
        .then(res => {
          expect(res).to.have.status(400);
        });
    });

    it('returns a valid auth token after creating a user', function() {
      return chai.request(app)
        .post(url)
        .send({username, password, email})
        .then(res => {
          expect(res).to.have.status(201);
        });
    });
  });
});