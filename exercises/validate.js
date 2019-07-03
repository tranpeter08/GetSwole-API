'use strict';

exports.validateExercise = function(req, res, next) {
  const {resistUnit, exerciseName} = req.body;

  const correctUnits = ['lb', 'kg', 'other'];

  if (!exerciseName) {
    return res.status(400).json({message: 'Exercise name required'});
  };

  if (exerciseName.trim() === '') {
    return res.status(400).json({message: 'Exercise name cannot be empty'});
  };

  if (!correctUnits.includes(resistUnit)) {
    return res.status(400).json({message: 'Incorrect resistance unit'});
  };

  return next();
}