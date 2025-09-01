
import mongoose from 'mongoose';

const planSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
  },
  subtitle: {
    type: String,
    required: true,
  },
  features: [],
  price: {
    type: Number,
    required: true,
  },
  stripePriceId: {
  type: String,
  required: true,
},
  requests: {
    type: Number,
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

const Plan = mongoose.models.Plan || mongoose.model('Plan', planSchema);

export default Plan;