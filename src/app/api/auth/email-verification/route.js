// app/api/verify-otp/route.js
import { NextResponse } from 'next/server';
 
import User from '@/lib/models/User'; 
import Otp from '@/lib/models/Otp'; 
import connectDB from '@/lib/mongodb';

export async function POST(request) {
  try {
    const { email, otp } = await request.json();
    
    await connectDB();
    
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
    
    // Check if OTP is expired (e.g., 10 minutes)
    const now = new Date();
    const otpExpiry = new Date(otpRecord.createdAt.getTime() + 10 * 60 * 1000);
    
    if (now > otpExpiry) {
      return NextResponse.json(
        { success: false, message: 'OTP expired' },
        { status: 400 }
      );
    }
    
    // Mark OTP as used
    otpRecord.used = true;
    await otpRecord.save();
    
    
    
    return NextResponse.json({ 
      success: true,
      message: 'OTP verified successfully',
      
    });
    
  } catch (error) {
    console.error('Error verifying OTP:', error);
    return NextResponse.json(
      { success: false, message: 'Server error' },
      { status: 500 }
    );
  }
}