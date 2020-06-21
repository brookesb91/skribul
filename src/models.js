const mongoose = require('mongoose');
const randomstring = require('randomstring');

const saveSchema = new mongoose.Schema({
  image: Buffer,
  slug: {
    type: String,
    default: function () {
      return randomstring.generate(8);
    }
  },
  expiresAt: {
    type: Date,
    default: function () {
      const date = new Date();
      date.setMinutes(date.getMinutes() + 60);
      return date;
    }
  }
}, {
  timestamps: true
});

saveSchema.methods.toJSON = function () {
  return {
    image: this.image.toString(),
    slug: this.slug,
    createdAt: this.createdAt
  };
};

const Save = mongoose.model('Save', saveSchema);

module.exports = {
  Save
};