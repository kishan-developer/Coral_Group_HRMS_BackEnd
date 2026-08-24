import dotenv from 'dotenv';
import { User } from '../models/user.model';
import { Employee } from '../models/employee.model';
import { hashPassword } from '../utils/password.util';
import { connectDatabase } from '../config/database.config';

dotenv.config();

const SUPPORT_EMAIL = 'bhardwajk852@gmail.com';
const SUPPORT_PASSWORD = process.env.SUPPORT_USER_PASSWORD || 'SupportUser@2026';

const seedSupportUser = async () => {
  try {
    const connected = await connectDatabase();
    if (!connected) {
      console.error('Failed to connect to database. Aborting support user creation.');
      process.exit(1);
    }

    let user = await User.findOne({ email: SUPPORT_EMAIL });
    const hashedPassword = await hashPassword(SUPPORT_PASSWORD);

    if (user) {
      console.log(`User ${SUPPORT_EMAIL} already exists. Updating role to 'support' and activating account...`);
      user.role = 'support';
      user.isActive = true;
      user.password = hashedPassword;
      await user.save();
      console.log(`✅ Support user updated successfully.`);
    } else {
      console.log(`Creating new support role account for ${SUPPORT_EMAIL}...`);
      
      const employeeId = 'EMP-SUPPORT-852';
      const employeeCode = 'CG-SUP-852';

      user = await User.create({
        email: SUPPORT_EMAIL,
        password: hashedPassword,
        role: 'support',
        isActive: true,
        employeeId,
        employeeCode,
        firstName: 'Bhardwaj',
        lastName: 'Kishan',
        designation: 'Support Engineer / Helpdesk Specialist',
        department: 'Support',
      });

      const existingEmployee = await Employee.findOne({ email: SUPPORT_EMAIL });
      if (!existingEmployee) {
        await Employee.create({
          employeeId,
          firstName: 'Bhardwaj',
          lastName: 'Kishan',
          email: SUPPORT_EMAIL,
          phone: '',
          joiningDate: new Date(),
          status: 'Active',
          workType: 'Office',
        });
      }

      console.log(`✅ Support role user created successfully.`);
    }

    console.log('\n=============================================');
    console.log('🎉 SUPPORT ACCOUNT CREATED SUCCESSFULLY');
    console.log(`Email:    ${SUPPORT_EMAIL}`);
    console.log(`Role:     support`);
    console.log(`Password: ${SUPPORT_PASSWORD}`);
    console.log('=============================================\n');

    process.exit(0);
  } catch (error) {
    console.error('Error creating support user:', error);
    process.exit(1);
  }
};

seedSupportUser();
