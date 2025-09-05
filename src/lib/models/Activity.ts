// models/ActivityLog.js
import mongoose from 'mongoose';

// Individual activity entry schema
const ActivityEntrySchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
  },
  label: {
    type: String,
    required: true,
    trim: true
  },
  timestamp: {
    type: Number,
    required: true,
    index: true // Index for sorting by time
  },
  excelFileDataUri: {
    type: String,
    required: false
  }
});
const Activity = mongoose.models.Activity ||
  mongoose.model("Activity", ActivityEntrySchema);

export default Activity;

// // Main activity log schema - one document per user per date
// const ActivityLogSchema = new mongoose.Schema({
//   userId: {
//     type: String, // or mongoose.Schema.Types.ObjectId if you're using MongoDB ObjectIds
//     required: true,
//     index: true // Index for user queries
//   },
//   date: {
//     type: String,
//     required: true,
//     match: /^\d{4}-\d{2}-\d{2}$/, // Validate YYYY-MM-DD format
//     index: true // Index for date queries
//   },
//   entries: [ActivityEntrySchema]
// }, {
//   timestamps: true, // Adds createdAt and updatedAt
//   collection: 'activitylogs'
// });

// // Compound index for efficient user + date queries
// ActivityLogSchema.index({ userId: 1, date: -1 });

// // Instance method to add a new activity entry
// ActivityLogSchema.methods.addEntry = function(entry) {
//   // Ensure the entry has required fields
//   if (!entry.id || !entry.label || !entry.timestamp) {
//     throw new Error('Activity entry must have id, label, and timestamp');
//   }
  
//   this.entries.push(entry);
//   this.entries.sort((a, b) => b.timestamp - a.timestamp); // Sort by timestamp desc
//   return this.save();
// };

// // Static method to log activity for a user
// ActivityLogSchema.statics.logActivity = async function(userId, entry) {
//   const date = new Date(entry.timestamp).toISOString().split('T')[0]; // Convert to YYYY-MM-DD
  
//   // Find or create document for this user and date
//   let activityLog = await this.findOne({ userId, date });
  
//   if (!activityLog) {
//     activityLog = new this({
//       userId,
//       date,
//       entries: [entry]
//     });
//   } else {
//     await activityLog.addEntry(entry);
//     return activityLog;
//   }
  
//   return activityLog.save();
// };

// // Static method to get user's activity log (similar to your current structure)
// ActivityLogSchema.statics.getUserActivityLog = async function(userId, limit = 30) {
//   const activities = await this.find({ userId })
//     .sort({ date: -1 })
//     .limit(limit)
//     .lean(); // Use lean() for better performance when you don't need mongoose docs
  
//   // Transform to match your ActivityLog type
//   return activities.map(activity => ({
//     date: activity.date,
//     entries: activity.entries.sort((a, b) => b.timestamp - a.timestamp)
//   }));
// };

// // Static method to get activity for a specific date range
// ActivityLogSchema.statics.getUserActivityByDateRange = async function(userId: string, startDate: string, endDate: string): Promise<IActivityLog[]> {
//   return this.find({
//     userId,
//     date: {
//       $gte: startDate,
//       $lte: endDate
//     }
//   }).sort({ date: -1 });
// };

// export default mongoose.models.ActivityLog || mongoose.model<IActivityLog, IActivityLogModel>('ActivityLog', ActivityLogSchema);