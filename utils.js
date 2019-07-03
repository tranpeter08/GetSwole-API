'use strict';
function createError(reason, message, code) {
  return Promise.reject({reason, message, code});
}

function handleError(err, res) {
  console.error('=== ERROR ===\n', err);

  if (err.reason === 'validationError'){
    return sendRes(res, err.code, err.message);
  };

  return sendRes(res, 500, 'Internal server error');
};

function sendRes(res, code, message) {
  const resMessage = {
    code,
    message
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