import { NextResponse } from 'next/server';
import nodemailer from 'nodemailer';
import Otp from '@/lib/models/Otp';
import connectDB from '@/lib/mongodb';

export async function POST(request) {
  try {
    const { email } = await request.json();

    if (!email || !email.includes('@')) {
      return NextResponse.json(
        { success: false, message: 'Please provide a valid email' },
        { status: 400 }
      );
    }

    // Generate OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    // Store OTP in DB
    await connectDB();
    await Otp.create({ email, otp });

    // Gmail SMTP Transport
    const transporter = nodemailer.createTransport({
      service: 'gmail', // Use Gmail service
      auth: {
        user: process.env.EMAIL_USER,      // your Gmail address
        pass: process.env.EMAIL_PASSWORD,  // your Gmail App Password
      },
    });

    // Send OTP Email
    await transporter.sendMail({
      from: `"Your App Name" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: 'Your OTP Code',
      text: `Your OTP code is: ${otp}\nThis code expires in 10 minutes.`,
      html: `
        <div>
          <h2>OTP Verification</h2>
          <p>Your verification code is: <strong>${otp}</strong></p>
          <p>This code will expire in 10 minutes.</p>
        </div>
      `
    });

    return NextResponse.json({
      success: true,
      message: 'OTP sent successfully'
    });

  } catch (error) {
    console.error('Error sending OTP:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to send OTP' },
      { status: 500 }
    );
  }
}
