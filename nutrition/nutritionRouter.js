const express = require('express');
const request = require('request');
const config = require('../config');
const { jwtAuth } = require('../auth');

const router = express.Router({mergeParams: true});

let links;
const NUTRIENT_ROOT_URL = 'https://api.edamam.com/api/food-database/'

router.get('/', jwtAuth, (req, res, next) => {
  const {ingr} = req.query;
  
  const searchQuery = {
    app_id: config.EDAMAM_NUTRITION_ID,
    app_key: config.EDAMAM_NUTRITION_KEY,
    ingr
  };

  const options = {
    json: true,
    qs: searchQuery
  };

  request.get(
    NUTRIENT_ROOT_URL + 'parser', 
    options,
    (err, resp, body) => {

      if (err) {
        console.log('Edamam Error: \n', err)
       return res.status(500).json({message: 'Internal Server Error'});
      };

      if (resp.statusCode !== 200) {
        return next(resp);
      };
      
      if (body._links) {
        links = body._links;
        body.hasNext = true;
        delete body._links;
      }

      return res.json({...body});
    }
  );
});

router.post('/', jwtAuth,(req, res, next) => {
  const options = {
    json: true,
    qs: {
      app_id: config.EDAMAM_NUTRITION_ID,
      app_key: config.EDAMAM_NUTRITION_KEY
    },
    body: req.body
  };
  
  request.post(
    NUTRIENT_ROOT_URL + 'nutrients',
    options,
    (err, resp, body) => {

      if (err) {
        console.log('Edamam Error: \n', err)
       return res.status(500).json({message: 'Internal Server Error'});
      };

      if (resp.statusCode !== 200) {
        return next(resp);
      };
      
      return res.json(body)
    }
  )
})

router.get('/next', jwtAuth, (req, res, next) => {
  if (!links) {
    return res.status(404).send({message: 'Not found'});
  }

  request(
    links.next.href,
    {json: true},
    (err, resp, body) => {
      
      if (err) {
        return res.status(resp.statusCode).json(err);
      };

      if (resp.statusCode !== 200) {
        return next(resp);
      };

      if (body._links) {
        links = body._links
        body.hasNext = true;
        delete body._links;
      };

      return res.json(body);
    }
  )
})

module.exports = { router };