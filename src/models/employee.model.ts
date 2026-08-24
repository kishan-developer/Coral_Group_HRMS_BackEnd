import mongoose, { Document, Schema } from 'mongoose';

export interface IEmployee extends Document {
  employeeId: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  dateOfBirth?: Date;
  joiningDate: Date;
  departmentId?: string;
  roleId?: string;
  shiftId?: string;
  status: 'Active' | 'Inactive' | 'On Leave' | 'Probation';
  workType: 'Office' | 'Remote' | 'On Field';
  photoUrl?: string;
  address?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateEmployeeInput {
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  dateOfBirth?: string;
  joiningDate: string;
  departmentId?: string;
  roleId?: string;
  shiftId?: string;
  status?: 'Active' | 'Inactive' | 'On Leave' | 'Probation';
  workType?: 'Office' | 'Remote' | 'On Field';
  address?: string;
}

export interface UpdateEmployeeInput {
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  dateOfBirth?: string;
  departmentId?: string;
  roleId?: string;
  shiftId?: string;
  status?: 'Active' | 'Inactive' | 'On Leave' | 'Probation';
  workType?: 'Office' | 'Remote' | 'On Field';
  photoUrl?: string;
  address?: string;
}

const employeeSchema = new Schema<IEmployee>(
  {
    employeeId: {
      type: String,
      required: true,
      unique: true,
    },
    firstName: {
      type: String,
      required: true,
    },
    lastName: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
    },
    phone: {
      type: String,
    },
    dateOfBirth: {
      type: Date,
    },
    joiningDate: {
      type: Date,
      required: true,
    },
    departmentId: {
      type: String,
      ref: 'Department',
    },
    roleId: {
      type: String,
      ref: 'Role',
    },
    shiftId: {
      type: String,
      ref: 'Shift',
    },
    status: {
      type: String,
      enum: ['Active', 'Inactive', 'On Leave', 'Probation'],
      default: 'Active',
    },
    workType: {
      type: String,
      enum: ['Office', 'Remote', 'On Field'],
      default: 'Office',
    },
    photoUrl: {
      type: String,
    },
    address: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);

export const Employee = mongoose.model<IEmployee>('Employee', employeeSchema);
