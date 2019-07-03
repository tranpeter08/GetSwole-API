const chai = require('chai');
const chaiHTTP = require('chai-http');
const faker = require('faker');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');

const {app, runServer, closeServer} = require('../server');
const {User, Profile} = require('../users');
const {JWT_SECRET, TEST_DATABASE_URL, TEST_PORT} = require('../config');
const {createUser} = require('./utils-test');

const {expect} = chai;

chai.use(chaiHTTP);

// describe('Exercise endpoints', function() {
//   before(function() {
//     return runServer(TEST_DATABASE_URL, TEST_PORT);
//   });

//   after(function() {
//     return closeServer();
//   });
// });