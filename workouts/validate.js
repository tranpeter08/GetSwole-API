'use strict';

function response(message) {
  return {
    message,
    reason: 'validationError', 
    location: 'workoutName'
  };
}

exports.validateWorkout = function(req, res, next) {
  const {workoutName} = req.body;

  if (!workoutName) {
    return res.status(400).json(response('Workout name is required'));
  }

  if (workoutName.trim() === '') {
    return res.status(400).json(response('Workout name cannot be empty'))
  }

  return next();
};