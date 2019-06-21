const mongoose = require('mongoose');

const Schema = mongoose.Schema;
mongoose.Promise = global.Promise;

const string_req = {type: String, required: true};
const number_req = {type: Number, required: true};

const subDigestSchema = new Schema({
  label: string_req,
  total: number_req,
  unit: string_req,
  daily: number_req,
  _id: false
})

const digestSchema = new Schema({
  label: string_req,
  total: number_req,
  unit: string_req,
  daily: number_req,
  sub:{type: [subDigestSchema], default: undefined},
  _id: false
});

const RecipeSchema = new Schema(
  {
    username: string_req,
    uri: string_req,
    label: string_req,
    image: string_req,
    source: string_req,
    url: string_req,
    yield: number_req,
    dietLabels: [string_req],
    healthLabels: [string_req],
    ingredientLines: [string_req],
    calories: number_req,
    digest: {type: [digestSchema], required:true, default: undefined}
  },
  {timestamps: true}
);

const Recipe = mongoose.model('Recipe', RecipeSchema);

module.exports = {Recipe};