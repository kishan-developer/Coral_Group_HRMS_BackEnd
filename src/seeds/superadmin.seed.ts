import dotenv from 'dotenv';
import { User } from '../models/user.model';
import { Employee } from '../models/employee.model';
import { hashPassword } from '../utils/password.util';
import { connectDatabase } from '../config/database.config';

dotenv.config();

const SUPERADMIN_EMAIL = 'adminit@coral-group.in';
const DEFAULT_PASSWORD = process.env.SUPERADMIN_PASSWORD || 'SuperAdmin@2026';

const seedSuperAdmin = async () => {
  try {
    const connected = await connectDatabase();
    if (!connected) {
      console.error('Failed to connect to database. Aborting superadmin seed.');
      process.exit(1);
    }

    // Check if superadmin already exists
    let user = await User.findOne({ email: SUPERADMIN_EMAIL });

    const hashedPassword = await hashPassword(DEFAULT_PASSWORD);

    if (user) {
      console.log(`User ${SUPERADMIN_EMAIL} already exists. Updating role to 'superadmin' and resetting status...`);
      user.role = 'superadmin';
      user.isActive = true;
      user.password = hashedPassword;
      await user.save();
      console.log(`✅ Superadmin updated successfully.`);
    } else {
      console.log(`Creating new superadmin account for ${SUPERADMIN_EMAIL}...`);
      
      const employeeId = 'EMP-SUPERADMIN';
      const employeeCode = 'CG-001';

      user = await User.create({
        email: SUPERADMIN_EMAIL,
        password: hashedPassword,
        role: 'superadmin',
        isActive: true,
        employeeId,
        employeeCode,
        firstName: 'Super',
        lastName: 'Admin',
        designation: 'IT Super Admin',
        department: 'IT',
      });

      // Ensure employee record exists
      const existingEmployee = await Employee.findOne({ employeeId });
      if (!existingEmployee) {
        await Employee.create({
          employeeId,
          firstName: 'Super',
          lastName: 'Admin',
          email: SUPERADMIN_EMAIL,
          phone: '',
          joiningDate: new Date(),
          status: 'Active',
          workType: 'Office',
        });
      }

      console.log(`✅ Superadmin user created successfully.`);
    }

    console.log('\n=============================================');
    console.log(`Email:    ${SUPERADMIN_EMAIL}`);
    console.log(`Role:     superadmin`);
    console.log(`Password: ${DEFAULT_PASSWORD}`);
    console.log('=============================================\n');

    process.exit(0);
  } catch (error) {
    console.error('Error seeding superadmin:', error);
    process.exit(1);
  }
};

seedSuperAdmin();
