import dotenv from 'dotenv';
import path from 'path';

// MUST load environment variables BEFORE importing database config
dotenv.config({ path: path.join(__dirname, '../.env') });

import axios from 'axios';

async function runTest() {
  console.log('=== TESTING UNIFIED RESET PASSWORD FLOW (POST /reset-password) ===');
  console.log('ENV MONGODB_URI:', process.env.MONGODB_URI);

  const { connectDatabase } = await import('../src/config/database.config');
  const { User } = await import('../src/models/user.model');
  const { OTP } = await import('../src/models/otp.model');
  const { hashPassword, comparePassword } = await import('../src/utils/password.util');

  const TEST_EMAIL = 'gunnikij1665@gmail.com';
  const NEW_PASSWORD = 'NewPassword@2026';
  const BACKEND_URL = 'http://localhost:3333/api/v1/auth';

  const connected = await connectDatabase();
  if (!connected) {
    console.error('❌ Failed to connect to MongoDB');
    process.exit(1);
  }

  // 1. Ensure User Exists
  let user = await User.findOne({ email: TEST_EMAIL });
  if (!user) {
    console.log(`Creating test user ${TEST_EMAIL}...`);
    const initialHashedPassword = await hashPassword('OldPassword@123');
    user = await User.create({
      email: TEST_EMAIL,
      password: initialHashedPassword,
      employeeId: 'EMP-TEST-999',
      role: 'employee',
      isActive: true,
      firstName: 'Gunni',
      lastName: 'Kishan',
    });
    console.log('✅ Created test user:', TEST_EMAIL);
  } else {
    console.log('✅ Found user:', user.email, '| ID:', user._id);
  }

  // 2. Step 1: Request Password Reset OTP via POST /reset-password with only email
  console.log('\n1. Calling POST /api/v1/auth/reset-password with { email } to request OTP...');
  try {
    const requestOtpRes = await axios.post(`${BACKEND_URL}/reset-password`, {
      email: TEST_EMAIL,
    });
    console.log('   Response:', requestOtpRes.data);
  } catch (err: any) {
    console.error('❌ Request OTP Error:', err.response?.data || err.message);
    process.exit(1);
  }

  // 3. Inspect OTP generated in MongoDB
  console.log('\n2. Retrieving generated OTP from MongoDB...');
  const otpRecord = await OTP.findOne({
    userId: user._id,
    type: 'password_reset',
  }).sort({ createdAt: -1 });

  if (!otpRecord) {
    console.error('❌ No active OTP record found in MongoDB for user:', user._id);
    process.exit(1);
  }

  console.log('✅ OTP Generated Successfully:');
  console.log('   OTP Code:', otpRecord.otp);
  console.log('   Expires At:', otpRecord.expiresAt);
  console.log('   Is Verified:', otpRecord.isVerified);

  // 4. Step 2: Perform Reset Password via POST /reset-password with OTP & New Password
  console.log('\n3. Calling POST /api/v1/auth/reset-password with OTP:', otpRecord.otp);
  try {
    const resetRes = await axios.post(`${BACKEND_URL}/reset-password`, {
      email: TEST_EMAIL,
      otp: otpRecord.otp,
      newPassword: NEW_PASSWORD,
      confirmPassword: NEW_PASSWORD,
    });
    console.log('   Response:', resetRes.data);
  } catch (err: any) {
    console.error('❌ Reset Password API Error:', err.response?.data || err.message);
    process.exit(1);
  }

  // 5. Step 3: Verify Password Changed in DB & Test Login API
  console.log('\n4. Verifying Password Change in DB & Testing Login API...');
  const updatedUser = await User.findById(user._id);
  if (!updatedUser) {
    console.error('❌ User document not found');
    process.exit(1);
  }

  const isMatch = await comparePassword(NEW_PASSWORD, updatedUser.password);
  console.log('   Password Hash Verified in MongoDB:', isMatch);

  try {
    const loginRes = await axios.post(`${BACKEND_URL}/login`, {
      email: TEST_EMAIL,
      password: NEW_PASSWORD,
    });
    console.log('✅ Login API Response:', loginRes.data.message);
    console.log('   AccessToken Issued:', !!loginRes.data.data?.accessToken);
  } catch (err: any) {
    console.error('❌ Login API Failed:', err.response?.data || err.message);
    process.exit(1);
  }

  console.log('\n🎉 SUCCESS: UNIFIED /reset-password API WORKFLOW IS WORKING PERFECTLY! 🎉');
  process.exit(0);
}

runTest();
