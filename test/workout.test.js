const chai = require('chai');
const chaiHTTP = require('chai-http');
const faker = require('faker');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');

const {app, runServer, closeServer} = require('../server');
const {User, Profile} = require('../users');
const {Workout} = require('../workouts');
const {JWT_SECRET, TEST_DATABASE_URL, TEST_PORT} = require('../config');
const {createUser, clearDocuments, dropDB} = require('./utils-test');

const {expect} = chai;

chai.use(chaiHTTP);

function createWorkouts() {
  let arr = [];
  for (let i = 0; i < 10; i ++) {
    arr.push(`Workout #${i +1}`);
  };

  return arr;
};

describe('Exercise endpoints', function() {
  const username = 'testUser';
  let userId;
  let headerField = 'Authorization';
  let headerVal=  '';
  let url;

  before(function() {
    return runServer(TEST_DATABASE_URL, TEST_PORT);
  });

  beforeEach(function() {
    return createUser(username)
      .then(profile => {
        userId = profile.userId;
        url = `/users/${userId}/workouts`;

        const token = jwt.sign(
          {payload: {username, userId}},
          JWT_SECRET,
          {algorithm: 'HS256', expiresIn: '1h'}
        );
        
        headerVal = `Bearer ${token}`;
      });
  });

  afterEach(function(){
    return clearDocuments(), dropDB();
  });

  after(function() {
    return closeServer();
  });

  describe('/users/:userId/workouts', function() {
    describe('POST method', function() {
      it('rejects a request without authorization', function() {
        return chai.request(app)
          .post(url)
          .then(res => {
            expect(res).to.have.status(401);
          })
      });

      it('rejects an empty request', function() {
        return chai.request(app)
          .post(url)
          .set(headerField, headerVal)
          .then(res => {
            expect(res).to.have.status(400);
          })
      });

      it('creates a workout', function() {
        const data = {workoutName: 'Arms'};

        return chai.request(app)
          .post(url)
          .set(headerField, headerVal)
          .send(data)
          .then(res => {
            expect(res).to.have.status(201);
            expect(res.body.workoutName).to.equal(data.workoutName);
          });
      });
    });

    describe('GET method', function() {
      beforeEach(function() {
        const workouts = createWorkouts();
        workouts.forEach(workoutName => {
          return 
        });
      });

      it('returns workouts for a user', function() {
        
      });
    });
  });


});