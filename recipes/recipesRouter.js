'use strict';
const express = require('express');
const config = require('../config');
const request = require('request');
const {queryStr} = require('../utils');
const {Recipe} = require('./model');
const { jwtAuth } = require('../auth');

const router = express.Router();

let links;
const RECIPES_ROOT_URL = 'https://api.edamam.com/search';
const app_id = config.EDAMAM_RECIPES_ID;
const app_key = config.EDAMAM_RECIPES_KEY;

router.get('/', jwtAuth, (req, res, next) => {
  
  const params = {
    app_id,
    app_key,
  };

  const searchQ = queryStr(params) + '&' + req.url.split('?')[1];

  const options = {
    json: true
  };

  request.get(
    RECIPES_ROOT_URL + '?' + searchQ,
    options,
    (error, resp, body) => {
      if (error) {
        console.log('EDAMAM ERROR \n', error);
        return res.status(500).json({message: 'Internal Server Error', error});
      };

      if (resp.statusCode !== 200) {
        return next(resp);
      };

      const {params: p, ...data} = body;

      return res.status(resp.statusCode).json(data);
    }
  );

})

router.get('/:username', jwtAuth, (req, res) => {
  const {username} = req.params;
  return Recipe.find({username})
  .then(recipes => 
    recipes.length === 0 ?
      Promise.reject({message: 'No recipes found'})
      :
      res.json(recipes)
  )
  .catch(err => res.json(err));
});

router.post('/:username/test', jwtAuth, (req, res) => {
  const {uri} = req.body;
  const {username} = req.params;
  return Recipe.findOne({uri, username})
    .count()
    .then(count => count ? 
      res.status(200).json({saved: true})
      :
      res.status(404).json({saved: false})
    )
    .catch(error => res.json({error}))
})

router.post('/:username', jwtAuth, (req, res) => {
  const {params: {username}, body: {uri}} = req;
  if (!username) {
    return res.status(400).json({message: 'username required in path'});
  }

  return Recipe.findOne({uri, username})
    .count()
    .then(count => count > 0 ? 
      res.status(400).json({message: 'Recipe already saved!'})
      : 
      Recipe.create(req.body) 
    )
    .then(recipe => res.status(201).json(recipe))
    .catch(err => res.json({message: err.message}))
});

router.delete('/:username', jwtAuth, (req, res) => {
  const {uri} = req.body;
  return Recipe.findOneAndDelete({uri})
    .then(item => !item ? 
      res.status(404).json({message: 'Recipe not found.'})
      : 
      res.status(200).json({message: 'Recipe deleted'})
    )
    .catch(error => res.json(error))
});

module.exports = { router };