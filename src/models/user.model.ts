import mongoose, { Document, Schema } from 'mongoose';

export interface IUser extends Document {
  email: string;
  password: string;
<<<<<<< HEAD
  employeeId: string;
  role: 'superadmin' | 'hr_manager' | 'accounts' | 'employee' | 'support';
  isActive: boolean;
  lastLogin?: Date;
  
  // Personal Information
  firstName: string;
  lastName: string;
  middleName?: string;
  displayName?: string;
  phone?: string;
  dateOfBirth?: Date;
  gender?: 'male' | 'female' | 'other';
  maritalStatus?: 'single' | 'married' | 'divorced' | 'widowed';
  bloodGroup?: string;
  nationality?: string;
  religion?: string;
  fatherName?: string;
  motherName?: string;
  spouseName?: string;
  emergencyContactName?: string;
  emergencyContactPhone?: string;
  emergencyContactRelation?: string;
  panNumber?: string;
  aadharNumber?: string;
  passportNumber?: string;
  
  // Contact Information
=======
  employeeId?: string;
  employeeCode?: string;
  role: 'superadmin' | 'hr_manager' | 'accounts' | 'employee' | 'support';
  isActive: boolean;
  lastLogin?: Date;
  firstName?: string;
  lastName?: string;
  dateOfBirth?: Date;
  gender?: string;
  maritalStatus?: string;
  bloodGroup?: string;
>>>>>>> 2eb72eb (Initial commit)
  mobile?: string;
  alternativeMobile?: string;
  currentAddress?: string;
  permanentAddress?: string;
<<<<<<< HEAD
  city?: string;
  state?: string;
  country?: string;
  zipCode?: string;
  permanentCity?: string;
  permanentState?: string;
  permanentCountry?: string;
  permanentZipCode?: string;
  
  // Work Information
  joiningDate?: Date;
  departmentId?: string;
  roleId?: string;
  shiftId?: string;
  employeeStatus: 'Active' | 'Inactive' | 'On Leave' | 'Probation';
  workType: 'Office' | 'Remote' | 'On Field';
  photoUrl?: string;
  designation?: string;
  department?: string;
  branch?: string;
  employmentType?: 'full-time' | 'part-time' | 'contract' | 'intern';
  company?: string;
  reportingManagerId?: string;
  teamLeadId?: string;
  workLocation?: string;
  probationEndDate?: Date;
  contractEndDate?: Date;
  salary?: number;
  salaryCurrency?: string;
  bankName?: string;
  bankAccountNumber?: string;
  bankIfscCode?: string;
  pfNumber?: string;
  esiNumber?: string;
  uanNumber?: string;
  
  // Education
  highestQualification?: string;
  collegeName?: string;
  passingYear?: string;
  education?: Array<{
    degree: string;
    institution: string;
    university: string;
    specialization: string;
    startDate: Date;
    endDate: Date;
    grade?: string;
    percentage?: number;
    isCompleted: boolean;
  }>;
  
  // Documents
  documents?: Array<{
    name: string;
    url: string;
    type: string;
    category: 'identity' | 'education' | 'experience' | 'other';
    size: number;
    uploadedAt: Date;
    expiryDate?: Date;
    isVerified: boolean;
  }>;
  
  // Experience
  experience?: Array<{
    company: string;
    designation: string;
    startDate: Date;
    endDate?: Date;
    isCurrentlyWorking: boolean;
    description?: string;
  }>;
  
  // Skills
  skills?: string[];
  languages?: Array<{
    name: string;
    proficiency: 'basic' | 'intermediate' | 'advanced' | 'fluent';
  }>;
  
=======
  designation?: string;
  department?: string;
  branch?: string;
  employmentType?: string;
  highestQualification?: string;
  collegeName?: string;
  passingYear?: string;
>>>>>>> 2eb72eb (Initial commit)
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateUserInput {
<<<<<<< HEAD
  employeeId?: string;
  email: string;
  password: string;
  role: 'superadmin' | 'hr_manager' | 'accounts' | 'employee' | 'support';
  firstName?: string;
  lastName?: string;
  phone?: string;
  dateOfBirth?: string;
  joiningDate?: string;
  departmentId?: string;
  roleId?: string;
  shiftId?: string;
  employeeStatus?: 'Active' | 'Inactive' | 'On Leave' | 'Probation';
  workType?: 'Office' | 'Remote' | 'On Field';
  photoUrl?: string;
  address?: string;
  designation?: string;
  company?: string;
=======
  employeeId: string;
  email: string;
  password: string;
  role: 'superadmin' | 'hr_manager' | 'accounts' | 'employee' | 'support';
>>>>>>> 2eb72eb (Initial commit)
}

const userSchema = new Schema<IUser>(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      required: true,
    },
    employeeId: {
      type: String,
<<<<<<< HEAD
      required: true,
=======
      ref: 'Employee',
    },
    employeeCode: {
      type: String,
>>>>>>> 2eb72eb (Initial commit)
      unique: true,
    },
    role: {
      type: String,
      enum: ['superadmin', 'hr_manager', 'accounts', 'employee', 'support'],
      default: 'support',
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    lastLogin: {
      type: Date,
    },
<<<<<<< HEAD
    
    // Personal Information
    firstName: {
      type: String,
      default: '',
    },
    lastName: {
      type: String,
      default: '',
    },
    middleName: {
      type: String,
    },
    displayName: {
      type: String,
    },
    phone: {
      type: String,
=======
    firstName: {
      type: String,
    },
    lastName: {
      type: String,
>>>>>>> 2eb72eb (Initial commit)
    },
    dateOfBirth: {
      type: Date,
    },
    gender: {
      type: String,
<<<<<<< HEAD
      enum: ['male', 'female', 'other'],
    },
    maritalStatus: {
      type: String,
      enum: ['single', 'married', 'divorced', 'widowed'],
=======
    },
    maritalStatus: {
      type: String,
>>>>>>> 2eb72eb (Initial commit)
    },
    bloodGroup: {
      type: String,
    },
<<<<<<< HEAD
    nationality: {
      type: String,
    },
    religion: {
      type: String,
    },
    fatherName: {
      type: String,
    },
    motherName: {
      type: String,
    },
    spouseName: {
      type: String,
    },
    emergencyContactName: {
      type: String,
    },
    emergencyContactPhone: {
      type: String,
    },
    emergencyContactRelation: {
      type: String,
    },
    panNumber: {
      type: String,
    },
    aadharNumber: {
      type: String,
    },
    passportNumber: {
      type: String,
    },
    
    // Contact Information
=======
>>>>>>> 2eb72eb (Initial commit)
    mobile: {
      type: String,
    },
    alternativeMobile: {
      type: String,
    },
    currentAddress: {
      type: String,
    },
    permanentAddress: {
      type: String,
    },
<<<<<<< HEAD
    city: {
      type: String,
    },
    state: {
      type: String,
    },
    country: {
      type: String,
    },
    zipCode: {
      type: String,
    },
    permanentCity: {
      type: String,
    },
    permanentState: {
      type: String,
    },
    permanentCountry: {
      type: String,
    },
    permanentZipCode: {
      type: String,
    },
    
    // Work Information
    joiningDate: {
      type: Date,
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
    employeeStatus: {
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
    designation: {
      type: String,
      default: '',
=======
    designation: {
      type: String,
>>>>>>> 2eb72eb (Initial commit)
    },
    department: {
      type: String,
    },
    branch: {
      type: String,
    },
    employmentType: {
      type: String,
<<<<<<< HEAD
      enum: ['full-time', 'part-time', 'contract', 'intern'],
    },
    company: {
      type: String,
      default: '',
    },
    reportingManagerId: {
      type: String,
      ref: 'User',
    },
    teamLeadId: {
      type: String,
      ref: 'User',
    },
    workLocation: {
      type: String,
    },
    probationEndDate: {
      type: Date,
    },
    contractEndDate: {
      type: Date,
    },
    salary: {
      type: Number,
    },
    salaryCurrency: {
      type: String,
      default: 'INR',
    },
    bankName: {
      type: String,
    },
    bankAccountNumber: {
      type: String,
    },
    bankIfscCode: {
      type: String,
    },
    pfNumber: {
      type: String,
    },
    esiNumber: {
      type: String,
    },
    uanNumber: {
      type: String,
    },
    
    // Education
=======
    },
>>>>>>> 2eb72eb (Initial commit)
    highestQualification: {
      type: String,
    },
    collegeName: {
      type: String,
    },
    passingYear: {
      type: String,
    },
<<<<<<< HEAD
    education: [{
      degree: {
        type: String,
        required: true,
      },
      institution: {
        type: String,
        required: true,
      },
      university: {
        type: String,
        required: true,
      },
      specialization: {
        type: String,
      },
      startDate: {
        type: Date,
        required: true,
      },
      endDate: {
        type: Date,
        required: true,
      },
      grade: {
        type: String,
      },
      percentage: {
        type: Number,
      },
      isCompleted: {
        type: Boolean,
        default: true,
      },
    }],
    
    // Documents
    documents: [{
      name: {
        type: String,
        required: true,
      },
      url: {
        type: String,
        required: true,
      },
      type: {
        type: String,
        required: true,
      },
      category: {
        type: String,
        enum: ['identity', 'education', 'experience', 'other'],
        default: 'other',
      },
      size: {
        type: Number,
        required: true,
      },
      uploadedAt: {
        type: Date,
        default: Date.now,
      },
      expiryDate: {
        type: Date,
      },
      isVerified: {
        type: Boolean,
        default: false,
      },
    }],
    
    // Experience
    experience: [{
      company: {
        type: String,
        required: true,
      },
      designation: {
        type: String,
        required: true,
      },
      startDate: {
        type: Date,
        required: true,
      },
      endDate: {
        type: Date,
      },
      isCurrentlyWorking: {
        type: Boolean,
        default: false,
      },
      description: {
        type: String,
      },
    }],
    
    // Skills
    skills: [{
      type: String,
    }],
    languages: [{
      name: {
        type: String,
        required: true,
      },
      proficiency: {
        type: String,
        enum: ['basic', 'intermediate', 'advanced', 'fluent'],
        default: 'basic',
      },
    }],
=======
>>>>>>> 2eb72eb (Initial commit)
  },
  {
    timestamps: true,
  }
);

<<<<<<< HEAD
// Pre-save hook to auto-generate employeeId if not provided
userSchema.pre<IUser>('save', async function () {
  if (!this.employeeId) {
    // Generate employeeId format: CG-EMP-XXX (sequential number)
    // Find the highest existing employeeId with CG-EMP prefix
    const lastUser = await User.findOne({ employeeId: /^CG-EMP-/ })
      .sort({ employeeId: -1 })
      .select('employeeId')
      .lean();
    
    let nextNumber = 1;
    if (lastUser && lastUser.employeeId) {
      const lastNumber = parseInt(lastUser.employeeId.replace('CG-EMP-', ''), 10);
      if (!isNaN(lastNumber)) {
        nextNumber = lastNumber + 1;
      }
    }
    
    // Format with leading zeros (e.g., 001, 002, etc.)
    const paddedNumber = nextNumber.toString().padStart(3, '0');
    this.employeeId = `CG-EMP-${paddedNumber}`;
  }
});

=======
>>>>>>> 2eb72eb (Initial commit)
export const User = mongoose.model<IUser>('User', userSchema);
