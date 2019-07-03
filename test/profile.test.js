'use strict';
const chai = require('chai');
const chaiHTTP = require('chai-http');
const faker = require('faker');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');

const {app, runServer, closeServer} = require('../server');
const {User, Profile} = require('../users');
const {JWT_SECRET, TEST_DATABASE_URL, TEST_PORT} = require('../config');

const {expect} = chai;

chai.use(chaiHTTP);

function createToken(username, userId) {
  const payload = {username, userId};
  return jwt.sign(
    {payload}, 
    JWT_SECRET,
    {algorithm: 'HS256', expiresIn: '1h'}
  );
};

const defaultProfile = {
  firstName : 'John',
  height: 5,
  heightUnit: 'ft'
}

function createUser(username, profile) {
  const password = 'fakePassword0';
  const email = 'fakeEmail@0.com';

  return User.hashPassword(password)
    .then(hash => User.create({username, password: hash, email}))
    .then(({_id}) => {
      return Profile.create({userId: _id, ...profile});
    });
};

function tearDownDb() {
  return mongoose.connection.dropDatabase();
}

describe('profile endpoints', function() {
  before(function() {
    return runServer(TEST_DATABASE_URL, TEST_PORT);
  });

  after(function() {
    return closeServer();
  });

  describe('/users', function() {
    const password = 'fakePassword';
  
    afterEach(function() {
      return User.remove({}), Profile.remove({}), tearDownDb();
    });
  
    it('rejects a request with incorrect field value', function() {
      const email = 'fakeEmail@a.com';
      const username = 'fakeUser';
      
      const profile = {
        firstName: 'firstName',
        height: 5,
        heightUnit: 'kg'
      };

      return chai.request(app)
        .post('/users')
        .send({username, password, email, profile})
        .then(res => {
          expect(res).to.have.status(400);
        });
    });

    it('creates a profile', function() {
      const email = 'fakeEmail@a.com2';
      const username = 'fakeUser2';
      const profile = {
        firstName: 'firstName',
        height: 5,
        heightUnit: 'ft'
      }

      return chai.request(app)
        .post('/users')
        .send({username, password, email, profile})
        .then(res => {
          expect(res).to.have.status(201);
        });
    });
  });

  describe('/profile/:userId', function() {
    const username = 'fakeUsername0';
    let url = '/users/profile/';
    let userId;
    let token;

    beforeEach(function(){
      return createUser(username, defaultProfile);
    });
  
    afterEach(function() {
      url = '/users/profile/';
      return User.remove({}), Profile.remove({}), tearDownDb();
    });

    describe('GET method', function() {

      it('rejects a request without authorization', function() {

        return User.findOne({username})
          .then(({_id}) => {
            url+= _id;
            return chai.request(app).get(url);
          })
          .then(res => {
            expect(res).to.have.status(401);
          })
      });
  
      it('returns a profile on success', function() {
       
        return User.findOne({username})
          .then(({_id}) => {
            userId = _id;
            token = createToken(username, userId);
            url+= _id;
  
            return chai.request(app)
              .get(url)
              .set('Authorization', `Bearer ${token}`)
          })
          .then(res => {
            expect(res).to.have.status(200);
            expect(res.body.firstName).to.equal(defaultProfile.firstName);
          })
      });
    });

    describe('PUT method', function() {
      it('rejects a request without authorization', function() {

        return User.findOne({username})
          .then(({_id}) => {
            url+= _id;
            return chai.request(app)
              .put(url);
          })
          .then(res => {
            expect(res).to.have.status(401);
          })
      });
  
      it('returns an updated profile on success', function() {
        const updatedProfile = {...defaultProfile, firstName: 'Jane', height: 4};
  
        return User.findOne({username})
          .then(({_id}) => {
            userId = _id;
            token = createToken(username, userId);
            url+= _id;
  
            return chai.request(app)
              .put(url)
              .set('Authorization', `Bearer ${token}`)
              .send(updatedProfile);
          })
          .then(res => {
            expect(res).to.have.status(200);
            return Profile.findOne({userId})
          })
          .then(profile => {
            expect(profile.firstName).to.equal(updatedProfile.firstName);
            expect(profile.height).to.equal(updatedProfile.height);
          });
      });
    });
  });
});