'use scrict';
const bcrypt = require('bcryptjs');
const mongoose = require('mongoose');

mongoose.Promise = global.Promise;

const UserSchema = mongoose.Schema({
  username: {
    type: String,
    unique: true,
    required: true
  },
  password: {
    type: String,
    required: true
  },
  email: {
    type: String,
    required: true,
    unique: true
  }
});

UserSchema.methods.serialize = function() {
  return {
    username: this.username,
    userId: this._id,
  };
};

const ProfileSchema = mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User',
    required: true
  },
  firstName: {
    type: String,
    default: ''
  },
  lastName: {
    type: String,
    default: ''
  },
  height: {
    type: Number,
  },
  heightUnit: {
    type: String,
    default: 'ft'
  },
  inches: {
    type: Number,
  },
  weight: {
    type: Number,
  },
  weightUnit: {
    type: String,
    default: 'lb'
  },
  bodyFat: {
    type: Number,
  },
  workouts: [
    {
      type: mongoose.Schema.Types.ObjectId, 
      ref: 'Workout'
    }
  ]
});

ProfileSchema.virtual('fullName').get(function() {
  
  return (this.firstName + ' ' + this.lastName).trim();
});

ProfileSchema.virtual('fullHeight').get(function() {
  if(!this.height) {
    return '';
  }

  let inches = '';
  if(this.inches) {
    inches = ` ${this.inches}''`
  };

  const fullHeight = this.heightUnit === 'ft' ? `${this.height}'${inches}` :
    `${this.height} ${this.heightUnit}`;

  return fullHeight;
})

ProfileSchema.virtual('fullWeight').get(function() {
  if (!this.weight) {
    return '';
  };

  return `${this.weight} ${this.weightUnit}`
});

ProfileSchema.methods.serialize = function() {

  return {
    userId: this.userId,
    name: this.fullName,
    height: this.fullHeight,
    weight: this.fullWeight,
    bodyFat: this.bodyFat,
    workouts: this.workouts
  };
};

UserSchema.methods.validatePassword = function(password) {
  return bcrypt.compare(password, this.password);
};

UserSchema.statics.hashPassword = function(password) {
  return bcrypt.hash(password, 10);
}

const User = mongoose.model('User', UserSchema);
const Profile = mongoose.model('Profile', ProfileSchema);

module.exports = { User, Profile };