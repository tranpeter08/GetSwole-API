'use strict';

exports.validateExercise = function(req, res, next) {
  const {resistUnit} = req.body;

  const correctUnits = ['lb', 'kg'];

  if (!correctUnits.includes(resistUnit)) {
    return res.status(400).json({message: 'Incorrect resistance unit'});
  }

  next();
}