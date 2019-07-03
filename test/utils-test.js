const {User, Profile} = require('../users');
const {Workout} = require('../workouts');
const {Exercise} = require('../exercises');
const {Recipe} = require('../recipes');
const mongoose = require('mongoose');

function createUser(username, profile) {
  console.log('Creating fake user...');

  const password = 'fakePassword0';
  const email = 'fakeEmail@0.com';

  return User.hashPassword(password)
    .then(hash => User.create({username, password: hash, email}))
    .then(({_id}) => {
      return Profile.create({userId: _id, ...profile});
    });
};

function clearDocuments() {
  console.log('Clearing documents...');

  return User.deleteMany({}),
    Profile.deleteMany({}),
    Workout.deleteMany({}),
    Exercise.deleteMany({}),
    Recipe.deleteMany({});
};

function dropDB() {
  console.log('Clearing DB...')

  return mongoose.connection.dropDatabase();
}

module.exports = {createUser, clearDocuments, dropDB};