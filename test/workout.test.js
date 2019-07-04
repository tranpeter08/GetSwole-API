const chai = require('chai');
const chaiHTTP = require('chai-http');
const faker = require('faker');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');

const {app, runServer, closeServer} = require('../server');
const {User, Profile} = require('../users');
const {Workout} = require('../workouts');
const {JWT_SECRET, TEST_DATABASE_URL, TEST_PORT} = require('../config');
const {createUser, createWorkouts, clearDocuments, dropDB} = require('./utils-test');

const {expect} = chai;

chai.use(chaiHTTP);

describe('Workout endpoints', function() {
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

        return createWorkouts(userId)
      })
      .catch(err => err);
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

      it('returns an empty array using invalid credentials', function() {
        return chai.request(app)
          .get('/users/wrongUserId/workouts')
          .set(headerField, headerVal)
          .then(res => {
            expect(res.body).to.have.length(0);
          });
      });

      it('returns workouts for the correct user', function() {
        return chai.request(app)
          .get(url)
          .set(headerField, headerVal)
          .then(res => {
            expect(res).to.have.status(200);
            expect(res.body).to.have.length(10);
          });
      });
    });
  });

  describe('/users/:userId/workouts/workoutId', function() {
    let workoutId;
    let currentName;

    beforeEach(function(){
      return Workout.findOne({userId})
        .then(({_id, workoutName}) => { 
          workoutId = _id;
          currentName = workoutName; 
        })
        .catch(err => err)
    });

    afterEach(function() {
      workoutId = '';
      currentName = '';
    });

    describe('PUT method', function() {


      it('rejects an unauthorized request', function() {
        return chai.request(app)
          .put(`/users/wrongUserId/workouts/${workoutId}`)
          .then(res => {
            expect(res).to.have.status(401);
          })
      });

      it('rejects a request with invalid userId', function() {
        return chai.request(app)
          .put(`/users/wrongUserId/workouts/${workoutId}`)
          .set(headerField, headerVal)
          .then(res => {
            expect(res).to.have.status(400)
            expect(res.body.message).to.equal('Invalid user ID');
          });
      });

      it('rejects a request with invalid workoutId', function() {
        const workoutName = 'Legs'
        return chai.request(app)
          .put(url + '/wrongWorkoutId')
          .set(headerField, headerVal)
          .send({workoutName})
          .then(res => {
            expect(res).to.have.status(400)
            expect(res.body.message).to.equal('Invalid workout ID');
          });
      });

      it('updates a workout successfully', function() {
        const workoutName = 'Legs';
        return chai.request(app)
          .put(url + '/' + workoutId)
          .set(headerField, headerVal)
          .send({workoutName})
          .then(res => {
            expect(res).to.have.status(200)
          });
      });
    });

    describe('DELETE method', function() {
      it('deletes a workout successfully', function() {
        return chai.request(app)
          .delete(url + `/${workoutId}`)
          .set(headerField, headerVal)
          .then(res => {
            expect(res).to.have.status(200);

            return Workout.findById(workoutId)
          })
          .then(result => {
            expect(result).to.be.null;
          });
      });
    });
  });
});