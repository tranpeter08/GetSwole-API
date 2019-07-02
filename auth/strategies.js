'use strict';
const {Strategy: LocalStrategy} = require('passport-local');
const {Strategy: JwtStrategy, ExtractJwt} = require('passport-jwt');

const {User} = require('../users/model');

const {JWT_SECRET, JWT_EXPIRY} = require('../config');

const localStrategy = new LocalStrategy((username, password, done) => {
  let user;
  User.findOne({username})
    .then(_user => {
      user = _user;
      if (!user) {
        return Promise.reject({
          reason: 'LoginError',
          message: `* No account associated with that username`,
          location: 'username'
        });
      }
      return user.validatePassword(password);
    })
    .then(isValid => {
      if (!isValid) {
        return Promise.reject({
          reason: 'LoginError',
          message: '* Incorrect password or username',
          location: 'password'
        })
      }
      return done(null, user);
    })
    .catch(err => {
      if (err.reason === 'LoginError') {
        console.error('LOGIN ERROR\n', err)
        return done(null, false, err);
      }
      return done(err, false);
    });
});

const jwtStrategy = new JwtStrategy(
  {
    secretOrKey: JWT_SECRET,
    jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
    algorithms: ['HS256']
  },
  (payload, done) => {
    done(null, payload);
  }
);

module.exports = {localStrategy, jwtStrategy};