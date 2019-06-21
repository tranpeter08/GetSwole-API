'use strict';
const express = require('express');
const { Workout } = require('../workouts/model');
const { Exercise } = require('./model');
const { createError, handleError, sendRes } = require('../utils');
const { jwtAuth } = require('../auth');

const router = express.Router({mergeParams: true});

router.post('/', jwtAuth, (req, res) => {
  const {exerciseName} = req.body;
  const {workoutId} = req.params;
  let exerciseRes;
  return Workout
    .findById(workoutId)
    .populate('exercises')
    .then(workout => {
      if (!workout) {
        return createError('validationError', 'workout not found', 404)
      }
      let result = workout.exercises.find(exercise => {
        return exercise.exerciseName === exerciseName;
      });
      if(result){
        return createError(
          'validationError',
          `exercise "${exerciseName}" already exists for this workout`,
          400
        );
      };

      return Exercise
        .create(req.body);
    })
    .then(newExercise => {
      exerciseRes = newExercise;
      return Workout
        .findById(workoutId)
        .then(workout => {
          workout.exercises.push(newExercise._id);
          workout.save();
          return workout;
        });
    })
    .then(workout => {
      return res.status(201).json(exerciseRes);
    })
    .catch(err => {
      if(err.reason === 'validationError'){
        return res.status(err.code).json({
          code: err.code,
          message: err.message
        });
      };
      return res.status(500).json({
        code: 500,
        message: "Internal Server Error"
      });
    });
});

router.get('/:exerciseId', jwtAuth, (req, res) => {
  return Exercise
    .findById(req.params.exerciseId)
    .then(exercise => {
      if(!exercise){
        return createError('validationError', 'exercise not found', 404);
      }
      return res.status(200).json(exercise);
    })
    .catch(err => {
      return handleError(err, res);
    });
});

router.put('/:exerciseId', jwtAuth, (req, res) => {
  const { exerciseName } = req.body;
  const {workoutId, exerciseId}  = req.params;

  if(!exerciseName || exerciseName && exerciseName.trim() === ""){
    return sendRes(res, 400, 'exercise field cannot be empty');
  }

  return Workout.findById(workoutId)
    .populate('exercises')
    .then(workout => {
      let result = workout.exercises.find(exercise => 
        exercise.exerciseName === exerciseName);
      if (result && result._id.toString() !== exerciseId) {
        return createError('validationError', `Exercise "${exerciseName}" already exists for this workout.`, 400)
      }
      return Exercise.findByIdAndUpdate(exerciseId, req.body);
    })
    .then(result => {
      if (!result) {
        return createError('validationError', 'exercise not found', 404);
      }
      return sendRes(res, 200, 'exercise updated successfully');
    })
    .catch(err => {
      return handleError(err, res);
    });
});

router.delete('/:exerciseId', jwtAuth, (req, res) => {
    const {workoutId, exerciseId} = req.params;
    return Workout
      .findById(workoutId)
      .then(workout => {
        if (!workout) {
          return createError('validationError', 'workout not found', 404);
        }
        workout.exercises.remove({_id: exerciseId});
        workout.save();
        return workout;
      })
      .then(workout => {
        return Exercise
          .findByIdAndDelete(exerciseId);
      })
      .then(result => {
        if (!result) {
          return createError('validationError', 'Exercise not found', 404);
        }
        return sendRes(res, 202, `Exercise "${result.exerciseName}" deleted`);
      })
      .catch(err => {
        return handleError(err, res);
      });
});

module.exports = { router };