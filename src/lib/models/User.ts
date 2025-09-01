import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true, 
    },
    email: {
        type: String,
        required: true, 
        unique: true, 
    },
    password: {
        type: String,
        required: function () {
            return this.provider === "email";
        },
    },
    role:{
        type: String,
        enum: ["admin", "viewer", "user"],
        default: "user",
    },
    status:{
        type: String,
        enum: ["active", "suspended", "invited"],
        default: "active",
    },

    image: {
        type: String,
        default: "", // Image is optional (Google/Apple provides it, email/password may not)
    },
    provider: {
        type: String,
        required: true,
        enum: ["email", "google", "apple"], // Track the registration provider
        default: "email", // Default to email/password registration
    },
    googleId: {
        type: String,
        unique: true,
        sparse: true, // Allow null values for non-Google users
    },
    appleId: {
        type: String,
        unique: true,
        sparse: true, // Allow null values for non-Apple users
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

// Check if the model already exists
const User = mongoose.models.User || mongoose.model("User", userSchema);

export default User;