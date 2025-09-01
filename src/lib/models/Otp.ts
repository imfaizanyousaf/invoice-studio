// models/Otp.js
import mongoose from 'mongoose';

const otpSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
  },
  otp: {
    type: String,
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
    expires: 600, // Document expires after 10 minutes (in seconds)
  },
  used: {
    type: Boolean,
    default: false,
  },
});

const Otp = mongoose.models.Otp || mongoose.model('Otp', otpSchema);
export default Otp;