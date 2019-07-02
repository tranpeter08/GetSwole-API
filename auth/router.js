'use strict';
const express = require('express');
const passport = require('passport');
const jwt = require('jsonwebtoken');
const config = require('../config');

const router = express.Router();

const createAuthToken = function(payload) {
  return jwt.sign({payload}, config.JWT_SECRET, {
    algorithm: 'HS256',
    expiresIn: config.JWT_EXPIRY,
    subject: payload.username
  });
};

const localAuth = passport.authenticate('local', {session: false});

router.post('/login', (req, res, next)=> {
  passport.authenticate('local', {session: false}, (err, user, info) => {

    if (err) {
      return next(err)
    };

    if (info) {
      if (info.reason === 'LoginError') {
        return res.status(401).json(info);
      };

      return res.status(400).json(info);
    };

    const authToken = createAuthToken(user.serialize());
    return res.json({authToken});

  })(req, res, next);
});

const jwtAuth = passport.authenticate('jwt', {session: false});

router.post('/refresh', jwtAuth, (req, res) => {
  const authToken = createAuthToken(req.user.payload);
  res.json({authToken});
});

router.get('/test', jwtAuth, (req, res) => {
  res.json({isValid: true});
});

module.exports = {router, jwtAuth, createAuthToken};