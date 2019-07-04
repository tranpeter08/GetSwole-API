'use strict';

const chai = require('chai');
const chaiHTTP = require('chai-http');
const faker = require('faker');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');

const {app, runServer, closeServer} = require('../server');
const {User, Profile} = require('../users');
const {Workout} = require('../workouts');
const {Exercise} = require('../exercises');
const {JWT_SECRET, TEST_DATABASE_URL, TEST_PORT} = require('../config');
const {createUser, createWorkouts, clearDocuments, dropDB} = require('./utils-test');

const {expect} = chai;

chai.use(chaiHTTP);

function createExercises(workoutId) {
  console.log('Creating exercises...');
  const exercises = [];

  for (let i = 0; i < 10; i++) {
    let exercise = {
      exerciseName: `Exercise #${i + 1}`,
      workoutId
    };

    exercises.push(exercise);
  };

  return Exercise.insertMany(exercises);
}

describe('Exercise endpoints', function() {
  const username = 'testUser';
  let userId;
  let headerField = 'Authorization';
  let headerVal=  '';
  let workoutId;
  let url;

  before(function() {
    return runServer(TEST_DATABASE_URL, TEST_PORT);
  });

  beforeEach(function() {
    return createUser(username)
      .then(profile => {
        userId = profile.userId;

        const token = jwt.sign(
          {payload: {username, userId}},
          JWT_SECRET,
          {algorithm: 'HS256', expiresIn: '1h'}
        );
        
        headerVal = `Bearer ${token}`;

        return createWorkouts(userId)
    })
    .then(workouts => {
      workoutId = workouts[0]._id;
      url = `/users/${userId}/workouts/${workoutId}/exercises`;
      return createExercises(workoutId);
    })
    .catch(err => err);
  });

  afterEach(function(){
    return clearDocuments(), dropDB();
  })

  after(function() {
    return closeServer();
  });

  describe('/users/:userId/workouts/:workoutId/exercises', function() {
    describe('POST method', function() {
      it('rejects an invalid userId', function() {
        const exerciseName = 'Curls';

        return chai.request(app)
          .post(`/users/wrongId/workouts/${workoutId}/exercises`)
          .set(headerField, headerVal)
          .send({exerciseName})
          .then(res => {
            expect(res).to.have.status(400);
            expect(res.body.message).to.equal('Invalid user ID')
          })
      });

      it('rejects an invalid workoutId', function() {
        const exerciseName = 'Curls';

        return chai.request(app)
          .post(`/users/${userId}/workouts/wrongId/exercises`)
          .set(headerField, headerVal)
          .send({exerciseName})
          .then(res => {
            expect(res).to.have.status(400);
            expect(res.body.message).to.equal('Invalid workout ID');
          })
      });

      it('creates an exercise successfully', function() {
        const exerciseName = 'Curls';

        return chai.request(app)
          .post(url)
          .set(headerField, headerVal)
          .send({exerciseName})
          .then(res => {
            expect(res).to.have.status(201);
            expect(res.body.exerciseName).to.equal(exerciseName);
          });
      });
    });

    describe('GET method', function() {
      it('rejects a request with an invalid userId', function() {
        return chai.request(app)
          .get(`/users/wrongId/workouts/${workoutId}/exercises`)
          .set(headerField, headerVal)
          .then(res => {
            expect(res).to.have.status(400);
            expect(res.body.message).to.equal('Invalid user ID');
          });
      });

      it('rejects a request with an invalid workoutId', function() {
        return chai.request(app)
          .get(`/users/${userId}/workouts/wrongId/exercises`)
          .set(headerField, headerVal)
          .then(res => {
            expect(res).to.have.status(400);
            expect(res.body.message).to.equal('Invalid workout ID');
          });
      });

      it('successfully gets all exercises for a workout', function() {
        return chai.request(app)
          .get(url)
          .set(headerField, headerVal)
          .then(res => {
            expect(res).to.have.status(200);
          });
      });
    });
  });

  describe(
    '/users/:userId/workouts/:workoutId/exercises/:exerciseId', 
    function() {
      const exerciseName = 'Cycling';
      let exerciseId;

      beforeEach(function() {
        return Exercise.findOne({workoutId})
          .then(result => exerciseId = result._id);
      });

      describe('PUT method', function() {
        it('rejects a request with an invalid userId', function() {
          return chai.request(app)
            .put(
              `/users/wrongId/workouts/${workoutId}/exercises/${exerciseId}`
            )
            .set(headerField, headerVal)
            .send({exerciseName})
            .then(res => {
              expect(res).to.have.status(400);
              expect(res.body.message).to.equal('Invalid user ID');
            });
        });

        it('rejects a request with an invalid workoutId', function() {
          return chai.request(app)
            .put(
              `/users/${userId}/workouts/wrongId/exercises/${exerciseId}`
            )
            .set(headerField, headerVal)
            .send({exerciseName})
            .then(res => {
              expect(res).to.have.status(400);
              expect(res.body.message).to.equal('Invalid workout ID');
            });
        });

        it('successfully updates an exercise', function() {
          return chai.request(app)
            .put(`${url}/${exerciseId}`)
            .set(headerField, headerVal)
            .send({exerciseName})
            .then(res => {
              expect(res).to.have.status(200);
              
              return Exercise.findById(exerciseId)
                .then(result => {
                  expect(result.exerciseName).to.equal(exerciseName);
                });
            });
        });
      });

      describe('DELETE method', function() {
        it('rejects a request with an invalid exerciseId', function() {
          return chai.request(app)
            .delete(`${url}/wrongId`)
            .set(headerField, headerVal)
            .then(res => {
              expect(res).to.have.status(400);
              expect(res.body.message).to.equal('Invalid exercise ID');
            });
        });

        it('successfully deletes an exercise', function() {
          return chai.request(app)
            .delete(`${url}/${exerciseId}`)
            .set(headerField, headerVal)
            .then(res => {
              expect(res).to.have.status(200);

              return Exercise.findById(exerciseId)
                .then(result => {
                  expect(result).to.be.null;
                });
            });
        });
      });
  });
});