'use strict';
const {User, Profile} = require('./model');
const mongoose = require('mongoose');
const {sendRes} = require('../utils');

function validateUser(req, res, next) {
  function sendErrorMessage(code, reason, message, location) {
    if (location[0]) {
      console.error({reason, message, location});
      return res.status(code).json({
        code,
        reason,
        message,
        location
      });
    };
  };

  // validate required fields
  const requiredFields = ['username', 'password', 'email']; 
  const missingFields = requiredFields.filter( field => !(field in req.body));

  if (missingFields.length > 0) {
   return sendErrorMessage(
      400, 
      'ValidationError', 
      'Missing required fields', 
      missingFields
    );
  };

  // validate Nonempty fields
  const nonEmptyFields = ['password', 'username', 'email'];
  const emptyFields = nonEmptyFields.filter(field => 
    req.body[field].trim() === ''
  );

  if (emptyFields.length > 0) {
    return sendErrorMessage(
      400,
      'ValidationError',
      'Field cannot be empty',
      emptyFields
    );
  }


  // validate trimmed fields
  const trimmedFields = ['username', 'password', 'email'];
  const nonTrimmedFields = trimmedFields.filter(field =>
    field in req.body && req.body[field].trim() !== req.body[field]
  );

  if (nonTrimmedFields.length > 0) {
    return sendErrorMessage(
      400, 
      'ValidationError', 
      'Cannot start or end with white space', 
      nonTrimmedFields
    );
  }

  // validate length of username and password
  const lengthFields = {
    username: {min: 8},
    password: {min: 10, max: 72}
  };

  const lengthFieldKeys = Object.keys(lengthFields);
  
  const badLengthFields = lengthFieldKeys.filter( field => 
    field in req.body && 
    req.body[field].length < lengthFields[field].min ||
    req.body[field].length > lengthFields[field].max
  );

  const badLengthMessage = badLengthFields.map(field => {
    if (req.body[field].trim().length < lengthFields[field].min) {

      return `${field} must be at least ${lengthFields[field].min} characters long`

    } else if(req.body[field].trim().length > lengthFields[field].max) {

      return `${field} must be no more than ${lengthFields[field].max} characters long`
    }
  });

  if (badLengthFields.length > 0) {
    return sendErrorMessage(
      400,
      'ValidationError',
      badLengthMessage,
      badLengthFields
    );
  };

  return next()
};

function validateProfile(req, res, next) {
  function sendErrorMessage(code, reason, message, location) {
    if (location[0]) {
      console.log({reason, message, location})
      return res.status(code).json({
        code,
        reason,
        message,
        location
      });
    };
  };

  const {profile} = req.body;

  // validate number fields
  const numberFields = ['height', 'inches', 'weight', 'bodyFat'];
  const nonNumberFields = numberFields.filter(field =>
    field in req.body &&
    typeof req.body[field] !== 'number' 
    ||
    'profile' in req.body &&
    typeof req.body.profile === 'object' &&
    field in profile && 
    typeof profile[field] !== 'number'
  );

  if (nonNumberFields.length > 0) {
    return sendErrorMessage(
      400, 
      'ValidationError', 
      'Field should be a number',
      nonNumberFields
    );
  };

  // validate string fields
  const stringFields = [
    'firstName', 'lastName', 'heightUnit', 'weightUnit'
  ];

  const nonStringFields = stringFields.filter(field => 
    field in req.body && 
    typeof req.body[field] !== 'string' 
    ||
    'profile' in req.body &&
    typeof profile === 'object' &&
    field in profile && 
    typeof profile[field] !== 'string'
  );

  if (nonStringFields > 0) {
    return sendErrorMessage(
      400, 
      'ValidationError', 
      'Field should be a string',
      nonStringFields
    );
  
  };
  
  // validate options
  const selectOptions = {
    heightUnit: ['cm', 'ft'], 
    weightUnit: ['lb', 'kg']
  };

  const selectFields = Object.keys(selectOptions);

  const missingOptionFields = selectFields.filter(field =>
    field in req.body &&
    !selectOptions[field].includes(req.body[field])
    ||
    'profile' in req.body && 
    typeof profile === 'object' && 
    field in profile && 
    !selectOptions[field].includes(profile[field])
  );

  if (missingOptionFields.length > 0) {
    return sendErrorMessage(
      400, 
      'ValidationError', 
      'Field unit value is invalid',
      missingOptionFields
    );
  };

  const extraInches = 
    'inches' in req.body && req.body.heightUnit === 'cm'
    ||
    'profile' in req.body && 
    typeof req.body.profile === 'object' &&
    'inches' in req.body.profile && req.body.heightUnit === 'cm';

  if (extraInches) {
    return sendErrorMessage(
      400,
      'ValidationError', 
      '"inches" should not be provided with "cm"', 
      ['inches']
    );
  }

  return next();
};

function userExist(req, res, next) {
  const {userId} = req.params;

  return User
    .findById(userId)
    .then(user => !user ? 
      res.status(404).json({
        message: 'User not found',
        reason: 'validationError'
      })
      :
      next()
    )
    .catch(error => {
      if (error instanceof mongoose.Error.CastError) {
        return sendRes(res, 400, 'Invalid user ID')      
      };

      return sendRes(res, 500, 'Internal server error');
    });
}

module.exports = { validateUser, validateProfile, userExist };