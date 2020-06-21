const mongoose = require('mongoose');
const randomstring = require('randomstring');

const dbUri = process.env.MONGODB_URI || 'mongodb://localhost/skribul';

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

const connectDB = async () => {
  await mongoose.connect(dbUri, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    useCreateIndex: true,
  });
};

module.exports = {
  Save,
  connectDB
};