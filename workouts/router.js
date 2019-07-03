'use strict';
const express = require('express');
const {jwtAuth} = require('../auth');
const { Profile } = require('../users/model');
const { Workout } = require('./model');
const { Exercise } = require('../exercises/model');
const { createError, handleError, sendRes} = require('../utils');
const {validateWorkout} = require('./validate');

const router = express.Router({mergeParams: true});

router.post('/', validateWorkout, jwtAuth, (req, res) => {
  const {workoutName} = req.body;
  const {userId} = req.params;

  return Workout.find({userId, workoutName})
    .countDocuments()
    .then(count => {
      if (count > 0) {
        return createError('validationError', 'Workout already exists', 400);
      };

      return Workout.create({workoutName: workoutName.trim(), userId});
    })
    .then(workout => res.status(201).json(workout))
    .catch(err => {
      console.error('ADD WORKOUT ERROR', err)
      return handleError(err, res);
    });
});

router.get('/', jwtAuth, (req, res) => {
  const {userId} = req.params;

  return Workout.find({userId}, '-userId')
    .then(workouts => res.status(200).json(workouts))
    .catch(err => {
      console.log('GET WORKOUTS ERROR:', err);
      return res.status(500).json({
        error: err,
        message: 'Internal server error'});
    });
});

router.get('/:workoutId', jwtAuth, (req, res) => {
  return Workout
    .findById(req.params.workoutId)
    .populate('exercises')
    .then(workout => {
      if (!workout) {
        return createError('validationError', 'workout not found', 404);
      };

      return res.status(200).json(workout);
    })
    .catch(err => {
      console.log(err);
      return handleError(err, res);
    });
});

router.put('/:workoutId', validateWorkout, jwtAuth, (req, res) => {
  const {workoutName} = req.body;
  const {userId, workoutId} = req.params;

  return Workout
    .findOneAndUpdate({userId, _id: workoutId}, {workoutName})
    .then(workout => {
      if (!workout) {
        return sendRes(res, 404, 'Workout not found');
      };

      return res.status(204).json();
    })
    .catch(error => {
      console.error('UPDATE WORKOUT ERROR:', error);

      return res.status(500).json({
        error,
        message: 'Internal server error'
      });
    });
});

router.delete('/:workoutId', jwtAuth, (req, res) => {
  const {workoutId, userId} = req.params;

  return Workout
    .findOneAndDelete({userId, workoutId})
    .then(workout => {
      console.log(workout)
      if (!workout) {
        return sendRes(res, 404, 'Workout not found');
      };

      return Exercise.deleteMany({workoutId});
    })
    .then(() => res.status(200).json({message: 'Workout deleted'}))
    .catch(error => {
      console.error('DELETE WORKOUT ERROR: ', error);

      return res.status(500).json({
        error,
        message: 'Internal server error'
      });
    });
  });

module.exports = { router };