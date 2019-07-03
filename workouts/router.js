'use strict';
const express = require('express');
const {jwtAuth} = require('../auth');
const { Workout } = require('./model');
const { Exercise } = require('../exercises/model');
const { createError, handleError, sendRes} = require('../utils');
const {validateWorkout} = require('./validate');
const {userExist} = require('../users/validate');
const mongoose = require('mongoose')

const router = express.Router({mergeParams: true});

router.post('/', jwtAuth, userExist, validateWorkout, (req, res) => {
  const {workoutName} = req.body;
  const {userId} = req.params;

  return Workout
    .find({userId, workoutName})
    .countDocuments()
    .then(count => {
      if (count > 0) {
        return createError(
          400, 
          `Workout "${workoutName}" already exists`, 
          'validationError'
        );
      };

      return Workout
        .create({workoutName: workoutName.trim(), userId});
    })
    .then(workout => res.status(201).json(workout))
    .catch(err => {
      return handleError(res, err);
    });
});

router.get('/', jwtAuth, (req, res) => {
  const {userId} = req.params;

  return Workout
    .find({userId}, '-userId')
    .then(workouts => res.status(200).json(workouts))
    .catch(err => {
      console.log('GET WORKOUTS ERROR:', err);
      return res.status(500).json({
        error: err,
        message: 'Internal server error'});
    });
});

router.put('/:workoutId', jwtAuth, userExist, validateWorkout, (req, res) => {
  const {userId, workoutId} = req.params;
  const {workoutName} = req.body;

  return Workout
    .find({userId})
    .then(results => {
      const sameName = results.find(item => 
        item._id !== workoutId && item.workoutName === workoutName
      );

      if (sameName) {
        return createError(400, `Workout "${workoutName}" already exists.`)
      };

      return Workout
        .findByIdAndUpdate(workoutId, req.body)
    })
    .then(workout => {
      if (!workout) {
        return createError(404, 'Workout not found', 'validationError');
      };

      return res.status(200).json({message: 'Workout updated'});
    })
    .catch(error => {
      return handleError(res, error, 'UPDATE WORKOUT ERROR')
    });
});

router.delete('/:workoutId', jwtAuth, userExist, (req, res, next) => {
  const {workoutId} = req.params;

  return Workout
    .findByIdAndDelete(workoutId)
    .then(deleted => {
      if (!deleted) {
        return createError(404, 'Workout not found', 'validationError');
      };

      return Exercise.deleteMany({workoutId});
    })
    .then(() => res.status(200).json({message: 'Workout deleted'}))
    .catch(error => {
      return handleError(res, error, 'DELETE WORKOUT ERROR');
    });
  });

module.exports = { router };