import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.join(__dirname, '../.env') });

import { connectDatabase } from '../src/config/database.config';
import { User } from '../src/models/user.model';

async function debug() {
  await connectDatabase();
  const users = await User.find({});
  console.log('Total users in DB:', users.length);
  users.forEach(u => console.log('User:', u.email, '| ID:', u._id, '| role:', u.role, '| isActive:', u.isActive));
  process.exit(0);
}

debug();
