'use strict';

function validateUser(req, res, next) {
  console.log('req body ===\n', req.body)
  function sendErrorMessage(code, reason, message, location) {
    if (location[0]) {
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

  sendErrorMessage(
    400, 
    'ValidationError', 
    'Missing required fields', 
    missingFields
  );

  // validate Nonempty fields
  const nonEmptyFields = ['password', 'username', 'email']
  const emptyFields = nonEmptyFields.filter( field => 
    req.body[field].trim() === ''
  );

  sendErrorMessage(
    400,
    'ValidationError',
    'Field cannot be empty',
    emptyFields
  );

  // validate trimmed fields
  const trimmedFields = ['username', 'password', 'email'];
  const nonTrimmedFields = trimmedFields.filter(field => 
    field in req.body && req.body[field].trim() !== req.body[field]
  );

  sendErrorMessage(
    400, 
    'ValidationError', 
    'Cannot start or end with white space', 
    nonTrimmedFields
  );

  // validate length of username and password
  const lengthFields = {
    username: {min: 8},
    password: {min: 10, max: 72}
  };

  const lengthFieldKeys = Object.keys(lengthFields);
  
  const badLengthFields = lengthFieldKeys.filter( field => 
    field in req.body && req.body[field].length < lengthFields[field].min ||
    req.body[field].length > lengthFields[field].max
  );

  const badLengthMessage = badLengthFields.map(field =>{
    if(req.body[field].trim().length < lengthFields[field].min) {
      return `${field} must be at least ${lengthFields[field].min} characters long`
    } else if(req.body[field].trim().length > lengthFields[field].max) {
      return `${field} must be no more than ${lengthFields[field].max} characters long`
    }
  });

  sendErrorMessage(
    400,
    'ValidationError',
    badLengthMessage,
    badLengthFields
  );

  next()
};

function validateProfile(req, res, next) {
  function sendErrorMessage(code, reason, message, location) {
    if (location[0]) {
      return res.status(code).json({
        code,
        reason,
        message,
        location
      });
    };
  };
  // validate number fields
  const numberFields = ['height', 'inches', 'weight', 'bodyFat'];
  const nonNumberFields = numberFields.filter( field => 
    'profile' in req.body &&
    typeof req.body.profile === 'object' &&
    field in req.body.profile && 
    typeof req.body.profile[field] !== 'number'
  );

  sendErrorMessage(
    400, 
    'ValidationError', 
    'Field should be a number',
    nonNumberFields
  );

  // validate string fields
  const stringFields = [
    'firstName', 'lastName', 'heightUnit', 'weightUnit'
  ];
  const nonStringFields = stringFields.filter(field => 
    field in req.body && typeof req.body[field] !== 'string' 
    ||
    'profile' in req.body && typeof req.body.profile === 'object' &&
    field in req.body.profile && typeof req.body.profile[field] !== 'string'
  );

  sendErrorMessage(
    400, 
    'ValidationError', 
    'Field should be a string',
    nonStringFields
  );

  // validate options
  const selectOptions = {heightUnit: ['cm', 'ft'], weightUnit: ['lb', 'kg']};
  const selectFields = Object.keys(selectOptions);
  const missingOptionFields = selectFields.filter(field =>
    'profile' in req.body && typeof req.body.profile === 'object' && 
    field in req.body.profile && 
    !selectOptions[field].includes(req.body.profile[field])
  );

  sendErrorMessage(
    400, 
    'ValidationError', 
    'Field unit is invalid',
    missingOptionFields
  );

  if(
    'profile' in req.body && typeof req.body.profile === 'object' &&
    'inches' in req.body.profile && req.body.heightUnit === 'cm'
  ) {
    sendErrorMessage(
      400, 
      'ValidationError', 
      'Incorrect height unit', 
      ['inches']
    );
  }
  next()
};

module.exports = { validateUser, validateProfile };