'use strict';
const express = require('express');
const passport = require('passport');
const jwt = require('jsonwebtoken');
const config = require('../config');

const router = express.Router();

const createAuthToken = function(user) {
  return jwt.sign({payload: user}, config.JWT_SECRET, {
    algorithm: 'HS256',
    expiresIn: config.JWT_EXPIRY,
    subject: user.username
  });
};

const localAuth = passport.authenticate('local', {session: false});

router.post('/login',(req, res, next)=> {
  passport.authenticate('local', {session: false}, (err, user, info) => {
    
    if (err) {
      console.log('passport error: \n', err)
      return next(err)
    }
    
    if (info) {
      console.log('passport info: \n', info)
      return res.status(401).json(info)
    }

    const authToken = createAuthToken(user.serialize());
    
    return res.json({authToken});
  })(req, res, next);
})

const jwtAuth = passport.authenticate('jwt', {session: false});

router.post('/refresh', jwtAuth,(req, res) => {
  const authToken = createAuthToken(req.user.payload);
  res.json({authToken});
});

router.get('/test', jwtAuth, (req, res) => {
  res.json({isValid: true})
})

module.exports = {router, jwtAuth, createAuthToken};