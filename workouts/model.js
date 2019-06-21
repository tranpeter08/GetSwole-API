'use strict';
const mongoose = require('mongoose');

mongoose.Promise = global.Promise;

const WorkoutSchema = mongoose.Schema({
  workoutName: {type: String, required: true},
  exercises: [{type: mongoose.Schema.Types.ObjectId, ref: 'Exercise'}]
});

const Workout = mongoose.model('Workout', WorkoutSchema);

module.exports = {Workout};