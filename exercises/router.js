'use strict';
const express = require('express');
const { Workout } = require('../workouts/model');
const { Exercise } = require('./model');
const { createError, handleError, sendRes } = require('../utils');
const { jwtAuth } = require('../auth');
const {validateExercise} = require('./validate');
const {userExist} = require('../users/validate');
const mongoose = require('mongoose');

const router = express.Router({mergeParams: true});

const workoutExist = (req, res, next) => {
  const {workoutId} = req.params; 
  return Workout
    .findById(workoutId)
    .then(workout => workout ? 
      next() :
      sendRes(res, 404, 'Workout not found', 'validationError')
    )
    .catch(err => {
      if (err instanceof mongoose.Error.CastError) {
        return res.status(400).json({message: 'Invalid workout ID'})
      };

      return handleError(res, err, 'EXERCISE MIDDLEWARE ERROR')
    });
};

const middlewares = [
  jwtAuth,
  userExist,
  workoutExist,
  validateExercise
]

const middlewaresGet = [...middlewares.slice(1,-1)];

router.post('/', middlewares, (req, res) => {
  const {exerciseName} = req.body;
  const {workoutId} = req.params;

  const data = {...req.body, workoutId};

  return Exercise
    .findOne({exerciseName, workoutId})
    .countDocuments()
    .then(count => count > 0 ?
      createError(
        400, 
        'Exercise name already exists for this workout',
        'validationError'
      )
      :
      Exercise.create(data)
    )
    .then(exercise => res.status(201).json(exercise))
    .catch(error => {

      return handleError(res, error, 'ADD EXERCISE ERROR')
    });
});

router.get('/', middlewaresGet, (req, res) => {
  const {workoutId} = req.params;
  return Exercise
    .find({workoutId})
    .then(results => res.status(200).json(results))
    .catch(error => {
      return handleError(res, error, 'GET EXERCISE ERROR');
    });
});

router.put('/:exerciseId', middlewares, (req, res) => {
  const { exerciseName } = req.body;
  const {workoutId, exerciseId}  = req.params;

  return Exercise
    .find({workoutId})
    .then(results => {
      const sameName = results.find(item => 
        item._id.toString() !== exerciseId && 
        item.exerciseName === exerciseName
      );

      if (sameName) {
        return createError(
          400, 
          `Exercise name "${exerciseName}" already exists for this workout`, 
          'validationError'
        );
      };
      
      return Exercise
        .findByIdAndUpdate(exerciseId, req.body)
    })
    .then(result => result ? 
      res.status(200).json(result) :
      createError(404, 'Exercise not found', 'validationError')
    )
    .catch(error => {
      if (error instanceof mongoose.Error.CastError) {
        return sendRes(res, 400, 'Invalid exercise ID');
      };

      return handleError(res, error, 'UPDATE EXERCISE ERROR');
    })
});

router.delete('/:exerciseId', middlewaresGet, (req, res) => {
    const {exerciseId} = req.params;

    return Exercise
      .findByIdAndDelete(exerciseId)
      .then(result => result ? 
        sendRes(res, 200, 'Exercise deleted') :
        createError(404, 'Exercise not found')
      )
      .catch(error => {
        if (error instanceof mongoose.Error.CastError) {
          return res.status(400).json({message: 'Invalid exercise ID'});
        };

        return handleError(res, error, 'DELETE EXERCISE ERROR');
      });
});

module.exports = { router };