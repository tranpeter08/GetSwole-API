'use strict';
const chai = require('chai');
const chaiHTTP = require('chai-http');
const jwt = require('jsonwebtoken');

const {app, runServer, closeServer} = require('../server');
const {User} = require('../users');
const {JWT_SECRET, TEST_DATABASE_URL, TEST_PORT} = require('../config');
const {dropDB} = require('./utils-test');

const {expect} = chai;

chai.use(chaiHTTP);

describe('Auth endpoints', function() {
  const username = 'testUsername';
  const password = 'testPassword';
  const email = 'a@a.com';
  const userId = 'testUserId';

  before(function() {
    return runServer(TEST_DATABASE_URL, TEST_PORT);
  });

  after(function() {
    return closeServer();
  });

  beforeEach(function() {
    return User.hashPassword(password)
      .then(hash => {
        return User.create({username, password: hash, email})
      });
  });

  afterEach(function() {
    return User.deleteMany({}), dropDB();
  });

  describe('/auth/login', function() {
    const url = '/auth/login';

    it('rejects an empty request', function() {
      return chai.request(app)
        .post(url)
        .then(res => {
          const {message} = res.body;
          expect(res).to.have.status(400);
          expect(message).to.equal('Missing credentials');
        });
    });

    it('rejects request with incorrect username', function() {
      return chai.request(app)
        .post(url)
        .send({username: 'incorrect', password})
        .then(res => {
          const {location} = res.body

          expect(res).to.have.status(401);
          expect(res.body).to.be.an('object');
          expect(location).to.equal('username');
        });
    });

    it('rejects request with incorrect password', function() {
      return chai.request(app)
        .post(url)
        .send({username, password: 'wrongPassword'})
        .then(res => {
          const {location} = res.body

          expect(res).to.have.status(401);
          expect(res.body).to.be.an('object');
          expect(location).to.equal('password');
        });
    });

    it('returns a valid auth token', function() {
      return chai.request(app)
        .post(url)
        .send({username: 'testUsername', password: 'testPassword'})
        .then(res => {
          const {authToken} = res.body;
          const {payload} = jwt.verify(authToken, JWT_SECRET, {
            algorithm: ['HS256']
          });
  
          expect(res).to.have.status(200);
          expect(authToken).to.be.a('string');
          expect(payload.username).to.equal(username);
        });
    });

    describe('/auth/refresh', function() {
      const url = '/auth/refresh';
      const payload = {username, userId};

      it('rejects an empty request', function() {
        return chai.request(app)
          .post(url)
          .then(res => {
            expect(res.status).to.equal(401);
          });
      });

      it('rejects an invalid auth token', function() {
        const token = jwt.sign(
          {payload}, 
          'wrong secret', 
          {
            algorithm: 'HS256',
            expiresIn: '7d'
          }
        );

        return chai.request(app)
          .post(url)
          .set('Authorization', `Bearer ${token}`)
          .then(res => {
            expect(res.status).to.equal(401);
          })
      });

      it('rejects an expired auth token', function() {
        const token = jwt.sign(
          {payload}, 
          JWT_SECRET, 
          {
            algorithm: 'HS256',
            expiresIn: '0'
          }
        );

        return chai.request(app)
          .post(url)
          .set('Authorization', `Bearer ${token}`)
          .then(res => {
            expect(res.status).to.equal(401);
          })
      });

      it('returns a valid auth token with new expiration date', function() {
        const token = jwt.sign(
          {payload}, 
          JWT_SECRET, 
          {
            algorithm: 'HS256',
            expiresIn: '1h'
          }
        );

        const oldPayload = jwt.verify(
          token,
          JWT_SECRET,
          {algorithms: ['HS256']}
        );

        return chai.request(app)
          .post(url)
          .set('Authorization', `Bearer ${token}`)
          .then(res => {
            const {authToken} = res.body;
            const newPayload = jwt.verify(
              authToken, 
              JWT_SECRET, 
              {algorithms: ['HS256']}
            );

            expect(res).to.have.status(200);
            expect(res.body).to.be.an('object');
            expect(authToken).to.be.a('string');
            expect(newPayload.exp).to.be.at.least(oldPayload.exp);
          })
      });
    });
  });
});