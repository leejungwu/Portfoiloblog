var mongoose = require('mongoose');

// schema
var thirdSchema = mongoose.Schema({
    title:{type:String, required:[true,'Title is required!']},
    body:{type:String, required:[true,'Body is required!']},
    author:{type:mongoose.Schema.Types.ObjectId, ref:'user', required:true},
    createdAt:{type:Date, default:Date.now},
    updatedAt:{type:Date},
});

// model & export
var Third = mongoose.model('third', thirdSchema);
module.exports = Third;