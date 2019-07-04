'use strict';

const chai = require('chai');
const chaiHTTP = require('chai-http');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const nock = require('nock');

const {app, runServer, closeServer} = require('../server');
const {JWT_SECRET, TEST_DATABASE_URL, TEST_PORT} = require('../config');
const {createUser, clearDocuments, dropDB} = require('./utils-test');
const {EDAMAM_NUTRITION_ID, EDAMAM_NUTRITION_KEY} = require('../config');
const {nutritionRes} = require('./nock-responses');

const {expect} = chai;

chai.use(chaiHTTP);

describe('Nutrition end points', function() {
  const username = 'TestUser';
  const url = '/nutrition';
  const headerField = 'Authorization';
  let headerVal;
  
  before(function() {
    return runServer(TEST_DATABASE_URL, TEST_PORT);
  });

  beforeEach(function() {
    return createUser(username)
    .then(profile => {
      let userId = profile.userId;

      const token = jwt.sign(
        {payload: {username, userId}},
        JWT_SECRET,
        {algorithm: 'HS256', expiresIn: '1h'}
      );
      
      headerVal = `Bearer ${token}`;
    });
  });

  afterEach(function(){
    return clearDocuments(), dropDB();
  });

  after(function() {
    return closeServer();
  });

  describe('/nutrition', function() {
    describe('GET method', function() {
      const ingr = 'eggs'
      beforeEach(function() {
        return nock(
            'https://api.edamam.com/api/food-database/parser'
          )
          .get(url)
          .query({
            app_id: EDAMAM_NUTRITION_ID,
            app_key: EDAMAM_NUTRITION_KEY,
            ingr: ingr
          })
          .reply(200, nutritionRes)
      });

      it('rejects an unauthoried request', function() {
        return chai.request(app)
          .get(url)
          .then(res => {
            expect(res).to.have.status(401);
          })
      });

      // it('successfully fetches data from Edamam', function() {
      //   return chai.request(app)
      //     .get(url)
      //     .query({ingr})
      //     .set(headerField, headerVal)
      //     .then(res => {
      //       console.log(res.body)
      //       expect(res).to.have.status(200);
      //     })
      // });
    });
  });
});