import mongoose, { Document, Schema } from 'mongoose';

export interface IAttendance extends Document {
<<<<<<< HEAD
  userId: string;
=======
>>>>>>> 2eb72eb (Initial commit)
  employeeId: string;
  date: Date;
  punchInTime?: string;
  punchOutTime?: string;
<<<<<<< HEAD
  punchInLocation?: {
    latitude: number;
    longitude: number;
    address?: string;
  };
  punchOutLocation?: {
    latitude: number;
    longitude: number;
    address?: string;
  };
  punchInSelfie?: string;
  punchOutSelfie?: string;
  deviceInfo?: {
    deviceId: string;
    mobileModel: string;
    ipAddress: string;
    osVersion: string;
  };
  biometricInfo?: {
    biometricDeviceId: string;
    biometricUserId: string;
    verifyMode: string;
    ioMode: string;
    workCode: number;
  };
  totalHours?: number;
  overtimeHours?: number;
  status: 'Present' | 'Absent' | 'Leave' | 'Late' | 'Half-Day';
  isLate?: boolean;
  breaks: Array<{
    startTime: Date;
    endTime?: Date;
    duration?: number;
  }>;
  totalBreakTime: number;
  shiftId?: string;
  shiftStartTime?: string;
  shiftEndTime?: string;
  notes?: string;
=======
  punchInLocation?: string;
  punchOutLocation?: string;
  totalHours?: number;
  overtimeHours?: number;
  status: 'Present' | 'Absent' | 'Leave' | 'Late';
>>>>>>> 2eb72eb (Initial commit)
  createdAt: Date;
  updatedAt: Date;
}

const attendanceSchema = new Schema<IAttendance>(
  {
<<<<<<< HEAD
    userId: {
      type: String,
      required: true,
      ref: 'User',
    },
=======
>>>>>>> 2eb72eb (Initial commit)
    employeeId: {
      type: String,
      required: true,
      ref: 'Employee',
    },
    date: {
      type: Date,
      required: true,
    },
    punchInTime: {
      type: String,
    },
    punchOutTime: {
      type: String,
    },
    punchInLocation: {
<<<<<<< HEAD
      latitude: Number,
      longitude: Number,
      address: String,
    },
    punchOutLocation: {
      latitude: Number,
      longitude: Number,
      address: String,
    },
    punchInSelfie: {
      type: String,
    },
    punchOutSelfie: {
      type: String,
    },
    deviceInfo: {
      deviceId: String,
      mobileModel: String,
      ipAddress: String,
      osVersion: String,
    },
    biometricInfo: {
      biometricDeviceId: String,
      biometricUserId: String,
      verifyMode: String,
      ioMode: String,
      workCode: Number,
    },
=======
      type: String,
    },
    punchOutLocation: {
      type: String,
    },
>>>>>>> 2eb72eb (Initial commit)
    totalHours: {
      type: Number,
      default: 0,
    },
    overtimeHours: {
      type: Number,
      default: 0,
    },
    status: {
      type: String,
<<<<<<< HEAD
      enum: ['Present', 'Absent', 'Leave', 'Late', 'Half-Day'],
      default: 'Present',
    },
    isLate: {
      type: Boolean,
      default: false,
    },
    breaks: [{
      startTime: {
        type: Date,
        required: true,
      },
      endTime: {
        type: Date,
      },
      duration: {
        type: Number,
      },
    }],
    totalBreakTime: {
      type: Number,
      default: 0,
    },
    shiftId: {
      type: String,
      ref: 'Shift',
    },
    shiftStartTime: {
      type: String,
    },
    shiftEndTime: {
      type: String,
    },
    notes: {
      type: String,
    },
=======
      enum: ['Present', 'Absent', 'Leave', 'Late'],
      default: 'Present',
    },
>>>>>>> 2eb72eb (Initial commit)
  },
  {
    timestamps: true,
  }
);

<<<<<<< HEAD
// Compound index for unique attendance per user per day
attendanceSchema.index({ userId: 1, date: 1 }, { unique: true });

=======
>>>>>>> 2eb72eb (Initial commit)
export const Attendance = mongoose.model<IAttendance>('Attendance', attendanceSchema);
