const mongoose = require('mongoose');

const energySchema = mongoose.Schema({
  date: { type: Number, required: true },
  energy: { type: String, required: true },
});

module.exports = mongoose.model('Energy', energySchema);