const crypto = require('crypto');
const mongoose = require('mongoose');
const validator = require('validator');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please tell us your name!']
  },
  email: {
    type: String,
    required: [true, 'Please provide your email!'],
    unique: true,
    lowercase: true, // il transforma in litere mici
    validate: [validator.isEmail, 'Please provide a valid email!']
  },
  photo: {
    type: String
  },
  role: {
    type: String,
    default: 'user',
    enum: ['user', 'guide', 'lead-guide', 'admin']
  },
  password: {
    type: String,
    required: [true, 'Please provide a password!'],
    minlength: 8,
    select: false // astfel parola nu va aparea in niciun ouput sau response
  },
  passwordConfirm: {
    type: String,
    required: [true, 'Please confirm your password!'],
    validate: {
      // THIS ONLY WORKS ON CREATE AND SAVE!
      validator: function(el) {
        return el === this.password;
      },
      message: 'Passwords do not match!'
    }
  },
  passwordChangedAt: Date,
  passwordResetToken: String,
  passwordResetExpires: Date
});

userSchema.pre('save', async function(next) {
  // ONLY RUN THIS FUNCTION IF PASSWORD WAS ACTUALLY MODIFIED
  if (!this.isModified('password')) return next();

  // HASH THE PASSWORD WITH COST OF 12
  this.password = await bcrypt.hash(this.password, 12);
  // DELETE THE PASSWORDCONFRIM FIELD
  this.passwordConfirm = undefined;

  next();
});

// prettier-ignore
userSchema.methods.correctPassword = async function (canditatePassword, userPassword) {
  return await bcrypt.compare(canditatePassword, userPassword);
};

userSchema.methods.changedPasswordAfter = function(JWTTimestamp) {
  if (this.passwordChangedAt) {
    // prettier-ignore
    const changedTimestamp = parseInt(this.passwordChangedAt.getTime() / 1000, 10);

    console.log(changedTimestamp, JWTTimestamp);

    return JWTTimestamp < changedTimestamp;
  }

  // FALSE MEANS NOT CHANGED
  return false;
};

userSchema.methods.createPasswordResetToken = function() {
  const resetToken = crypto.randomBytes(32).toString('hex');

  // prettier-ignore
  this.passwordResetToken = crypto.createHash('sha256').update(resetToken).digest('hex');
  console.log({ resetToken }, this.password.resetToken);
  this.passwordResetExpires = Date.now() + 10 * 60 * 1000;

  return resetToken;
};

const User = mongoose.model('User', userSchema);

module.exports = User;
