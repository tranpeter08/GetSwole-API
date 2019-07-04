'use strict';

const mongoose = require('mongoose');

function createError(code, message, reason) {
  return Promise.reject({code, message, reason});
}

function handleError(res, error, log = 'ERROR') {
  console.error(log, error);
  if (error instanceof mongoose.Error.CastError) {
    return res.status(400).json({message: 'Invalid Object Id'})
  };

  if (error.reason) {
    const {reason, code, message} = error;
    return sendRes(res, code, message, reason);
  };

  return sendRes(res, 500, 'Internal server error');
};

function sendRes(res, code, message, reason) {
  const resMessage = {
    code,
    message,
    reason
  }
  return res.status(code).json(resMessage);
}

const queryStr = queryObj => {
  let queryArr = [];

  for (const key in queryObj) {
    if (Array.isArray(queryObj[key])) {
      queryObj[key].forEach(item => {
        queryArr.push(`${key}=${item}`)
      })
    } else {
      queryArr.push(`${key}=${queryObj[key]}`)
    }
  };

  return queryArr.join('&');
}

module.exports = {createError, handleError, sendRes, queryStr};