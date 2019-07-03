'use strict';
const mongoose = require('mongoose');

mongoose.Promise = global.Promise;

const WorkoutSchema = mongoose.Schema({
  userId: {
    type: String, 
    required: true
  },
  workoutName: {type: String, required: true}
});

const Workout = mongoose.model('Workout', WorkoutSchema);

module.exports = {Workout};