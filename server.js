'use strict';
require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const morgan = require('morgan');
const passport = require('passport');
const cors = require('cors');

const { PORT, DATABASE_URL } = require('./config');
const { router: usersRouter } = require('./users');
const { router: authRouter, jwtAuth } = require('./auth');
const { localStrategy, jwtStrategy } = require('./auth/strategies');
const { router: workoutsRouter } = require('./workouts');
const { router: exercisesRouter } = require('./exercises');
const {router: nutritionRouter} = require('./nutrition/nutritionRouter');
const {router: recipesRouter} = require('./recipes/recipesRouter');

const app = express();

app.use(express.json({limit: '3mb'}));
app.use(morgan('common'));

const corsOptions = {
  methods: 'GET,PUT,POST,PATCH,DELETE',
  allowedHeaders: 'Content-Type,Authorization'
}

app.use(cors(corsOptions));

passport.use(localStrategy);
passport.use(jwtStrategy);

app.get('/', (req, res) => {
  return res.send({message: 'hello world'});
})

app.use('/users', usersRouter);
app.use('/auth', authRouter);
app.use('/users/:userId/workouts', workoutsRouter);
app.use('/users/:userId/workouts/:workoutId/exercises', exercisesRouter);
app.use('/nutrition', nutritionRouter);
app.use('/recipes', recipesRouter);

let server;

const runServer = (databaseUrl, port = PORT) => {
  return new Promise((resolve, reject) => {
    mongoose.connect(databaseUrl, error => {
      if (error) {
        return reject(error);
      };

      server = app.listen(port, () => {
        console.log(`App is listening on port: ${port}`);
        revolve();
      })
      .on('error', error => {
        mongoose.disconnect();
        reject(error);
      });
    });
  });
};

const closeServer = () => {
  return mongoose.disconnect()
    .then(() => {
      return new Promise((resolve, reject) => {
        console.log('Closing server...');
        server.close(error => {
          if (error) {
            reject(error);
          };

          resolve();
        });
      });
    });
};

if (require.main === module) {
  runServer(DATABASE_URL)
    .catch(error => console.error(error));
};

module.exports = { app, runServer, closeServer };