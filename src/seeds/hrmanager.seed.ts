import dotenv from 'dotenv';
import { User } from '../models/user.model';
import { Employee } from '../models/employee.model';
import { hashPassword } from '../utils/password.util';
import { connectDatabase } from '../config/database.config';

dotenv.config();

const HRMANAGER_EMAIL = 'admin@coral-group.in';
const DEFAULT_PASSWORD = process.env.HRMANAGER_PASSWORD || 'HrManager@2026';

const seedHRManager = async () => {
  try {
    const connected = await connectDatabase();
    if (!connected) {
      console.error('Failed to connect to database. Aborting HR Manager seed.');
      process.exit(1);
    }

    let user = await User.findOne({ email: HRMANAGER_EMAIL });
    const hashedPassword = await hashPassword(DEFAULT_PASSWORD);

    if (user) {
      console.log(`User ${HRMANAGER_EMAIL} already exists. Updating role to 'hr_manager' and resetting status...`);
      user.role = 'hr_manager';
      user.isActive = true;
      user.password = hashedPassword;
      await user.save();
      console.log(`✅ HR Manager updated successfully.`);
    } else {
      console.log(`Creating new HR Manager account for ${HRMANAGER_EMAIL}...`);
      
      const count = await User.countDocuments();
      const employeeId = `EMP-HR-${count + 100}`;
      const employeeCode = `CG-HR-${count + 200}`;

      user = await User.create({
        email: HRMANAGER_EMAIL,
        password: hashedPassword,
        role: 'hr_manager',
        isActive: true,
        employeeId,
        employeeCode,
        firstName: 'Admin',
        lastName: 'HR',
        designation: 'HR Manager',
        department: 'Human Resources',
      });

      const existingEmployee = await Employee.findOne({ email: HRMANAGER_EMAIL });
      if (!existingEmployee) {
        await Employee.create({
          employeeId,
          firstName: 'Admin',
          lastName: 'HR',
          email: HRMANAGER_EMAIL,
          phone: '',
          joiningDate: new Date(),
          status: 'Active',
          workType: 'Office',
        });
      }

      console.log(`✅ HR Manager user created successfully.`);
    }

    console.log('\n=============================================');
    console.log('🎉 HR MANAGER ACCOUNT READY');
    console.log(`Email:    ${HRMANAGER_EMAIL}`);
    console.log(`Role:     hr_manager`);
    console.log(`Password: ${DEFAULT_PASSWORD}`);
    console.log('=============================================\n');

    process.exit(0);
  } catch (error) {
    console.error('Error seeding HR Manager:', error);
    process.exit(1);
  }
};

seedHRManager();
