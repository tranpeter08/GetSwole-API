'use strict';
const express = require('express');
const request = require('request');
const multer = require('multer');
const { User, Profile } = require('./model');
const { jwtAuth, createAuthToken } = require('../auth');
const { validateUser, validateProfile } = require('./validate');
const { createError, handleError, sendRes } = require('../utils');

const router = express.Router();

// endpoint to be implemented in the future
router.post('/upload', (req, res) => {
  const {image} = req.body;

  const options = {
    form: {image},
    headers: {Authorization: 'Client-ID 99bccd5e07906f'},
    json: true
  };

  request.post(
    'https://api.imgur.com/3/upload',
    options,
    (err, resp, body) => {
      if (err) {
        return res.status(resp.statusCode).json({message: 'Internal Server Error'});
      }

      if (resp.statusCode !== 200) {
        return res.status(resp.statusCode).json(body);
      }
      const {link} = body.data;
      return res.json({link});
    }
  );
});

router.post('/', validateUser, validateProfile, (req, res) => {
  const {username, password, email, profile} = req.body;
  let authToken;

  return User
    .findOne({email})
    .then(user => {
      if (user) {
        return Promise.reject({
          code: 400,
          reason: 'validationError',
          message: '* Email already being used!',
          location: ['email']
        })
      }
      return User.find({username}).countDocuments()
    })
    .then(count => {
      if (count > 0) {
        return Promise.reject({
          code: 400,
          reason: 'validationError',
          message: '* Username already being used!',
          location: ['username']
        });
      };
      return User.hashPassword(password);
    })
    .then(hash => {
      return User
        .create({
          username, 
          password: hash, 
          email
        });
    })
    .then(user => {
      authToken = createAuthToken(user.serialize());
      return Profile
        .create({userId: user._id, ...profile});
    })
    .then(profile => {
      return res.status(201).json({authToken});
    })
    .catch(err => {
      console.error('=== ERROR ===\n', err);
      
      if (err.reason === 'validationError') {
        return res.status(err.code).json(err);
      };
      
      return res.status(500).json({message: 'Internal server error'})
    });
});

router.put('/:userId', jwtAuth, (req, res) => {
  return User
    .findByIdAndUpdate(
      req.params.userId,
      req.body
    )
    .then(() => {
      return res.status(204);
    })
    .catch(err => {
      console.error('=== Error === \n', err);
      return res.status(500).json({message: 'Internal server error'})
    });

});

router.get('/:userId/profile', jwtAuth, (req, res) => {
  const {userId} = req.params;

  return Profile
    .findOne({userId}, '-userId')
    .then(profile => {
      if (!profile) {
        return sendRes(res, 404, 'profile not found');
      };

      return res.status(200).json(profile);
    })
    .catch(err => {
      return handleError(err, res);
    });
});

router.put('/:userId/profile', jwtAuth, validateProfile, (req, res) => {
  const {userId} = req.params;

  return Profile
    .findOneAndUpdate(
      {userId},
      req.body
    )
    .then(profile => {
      if (!profile) {
        return sendRes(res, 404, 'Profile not found');
      };

      return res.status(200).json({message: 'profile has been updated'});
    })
    .catch(err => {
      return handleError(err, res);
    });
});

module.exports = { router };