import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.join(__dirname, '../.env') });

const mongoUri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/hrms';

const userSchema = new mongoose.Schema(
  {
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true },
    employeeId: { type: String },
    employeeCode: { type: String, unique: true },
    role: { type: String, enum: ['superadmin', 'hr_manager', 'accounts', 'employee', 'support'], default: 'accounts' },
    isActive: { type: Boolean, default: true },
    firstName: { type: String },
    lastName: { type: String },
    department: { type: String },
    designation: { type: String },
  },
  { timestamps: true }
);

const employeeSchema = new mongoose.Schema(
  {
    employeeId: { type: String, required: true, unique: true },
    firstName: { type: String, required: true },
    lastName: { type: String },
    email: { type: String, required: true, unique: true },
    departmentId: { type: String },
    roleId: { type: String },
    joiningDate: { type: Date },
    status: { type: String, default: 'Active' },
  },
  { timestamps: true }
);

const User = mongoose.models.User || mongoose.model('User', userSchema);
const Employee = mongoose.models.Employee || mongoose.model('Employee', employeeSchema);

async function run() {
  try {
    await mongoose.connect(mongoUri);
    console.log('Connected to MongoDB:', mongoUri);

    const email = 'kishanweb01@gmail.com';
    const rawPassword = 'User@123';
    const role = 'accounts';

    const count = await User.countDocuments();
    const employeeId = `EMP${count + 100}`;
    const employeeCode = `CG-${count + 200}`;

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(rawPassword, salt);

    let existingUser = await User.findOne({ email });

    if (existingUser) {
      existingUser.password = hashedPassword;
      existingUser.role = role;
      existingUser.isActive = true;
      existingUser.firstName = 'Kishan';
      existingUser.lastName = 'Accounts';
      existingUser.department = 'Accounts & Finance';
      existingUser.designation = 'Accounts Specialist';
      await existingUser.save();
      console.log('Updated existing user:', existingUser._id.toString());
    } else {
      const newUser = await User.create({
        email,
        password: hashedPassword,
        employeeId,
        employeeCode,
        role,
        isActive: true,
        firstName: 'Kishan',
        lastName: 'Accounts',
        department: 'Accounts & Finance',
        designation: 'Accounts Specialist',
      });
      console.log('Created new Accounts role user:', newUser._id.toString());

      await Employee.create({
        employeeId,
        firstName: 'Kishan',
        lastName: 'Accounts',
        email,
        departmentId: 'Accounts & Finance',
        roleId: role,
        joiningDate: new Date(),
        status: 'Active',
      });
      console.log('Created Employee record for Accounts role user.');
    }

    const finalUser = await User.findOne({ email }).lean();
    console.log('=== ACCOUNTS USER CREATED SUCCESS ===');
    console.log('User ID:', finalUser._id.toString());
    console.log('Email:', finalUser.email);
    console.log('Role:', finalUser.role);
    console.log('Password:', rawPassword);
    console.log('Employee Code:', finalUser.employeeCode);
    console.log('Is Active:', finalUser.isActive);
    console.log('=====================================');

    await mongoose.disconnect();
    process.exit(0);
  } catch (err) {
    console.error('Error creating accounts user:', err);
    process.exit(1);
  }
}

run();
