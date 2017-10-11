const mongoose = require('mongoose');

let userSchema = new mongoose.Schema({
  url: String,
  dateCrawled: Date
});

let User = mongoose.model('User', userSchema);

module.exports = User;