// app/api/verify-otp/route.js
import { NextResponse } from 'next/server';
import User from '@/lib/models/User'; 
import Otp from '@/lib/models/Otp'; 
import connectDB from '@/lib/mongodb';
import jwt from 'jsonwebtoken';


const JWT_SECRET = process.env.JWT_SECRET; // Store your secret in .env file
const TOKEN_EXPIRY = '15m'; // Token expiry for security


export async function POST(request) {
  try {
    const { email, otp } = await request.json();
    
    await connectDB();
    console.log("email sent from front end ", email)

    if (!email || !otp) {
      return NextResponse.json({ error: 'Please provide email and OTP' }, { status: 400 });
    }
    
    // Find the most recent OTP for this email
    const otpRecord = await Otp.findOne({ email })
      .sort({ createdAt: -1 }) // Get the most recent
      .limit(1);
    
    if (!otpRecord) {
      return NextResponse.json(
        { success: false, message: 'OTP not found' },
        { status: 400 }
      );
    }
    
    // Check if OTP matches
    if (otpRecord.otp !== otp) {
      return NextResponse.json(
        { success: false, message: 'Invalid OTP' },
        { status: 400 }
      );
    }
    
    
    
    
    
    // Mark OTP as used
    otpRecord.used = true;
    await otpRecord.save();
    
    // Find user by email
    const user = await User.findOne({ email });
    if (!user) {
      return NextResponse.json(
        { success: false, message: 'User not found' },
        { status: 404 }
      );
    }

    const token = jwt.sign({ _id: user._id }, JWT_SECRET, {
      expiresIn: TOKEN_EXPIRY
    });
    
    return NextResponse.json({ 
      success: true,
      message: 'OTP verified successfully',
      token: token
      
    });
    
  } catch (error) {
    console.error('Error verifying OTP:', error);
    return NextResponse.json(
      { success: false, message: 'Server error' },
      { status: 500 }
    );
  }
}