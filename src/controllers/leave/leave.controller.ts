import { Request, Response, NextFunction } from 'express';
import { Leave } from '../../models/leave.model';
import { User } from '../../models/user.model';
import { Attendance } from '../../models/attendance.model';
import { LeaveBalance } from '../../models/leave-balance.model';
import { LeavePolicy } from '../../models/leave-policy.model';
import { Holiday } from '../../models/holiday.model';
import { AppError } from '../../middleware/error.middleware';
import { validationResult } from 'express-validator';
import { sendLeaveApprovalEmail, sendLeaveRequestEmail } from '../../utils/email.utils';


export class LeaveController {
  getAllLeaves = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { employeeId, status, leaveType, departmentId, page = 1, pageSize = 10 } = req.query;
      
      const filter: any = {};
      if (employeeId) filter.employeeId = employeeId;
      if (status) filter.status = status;
      if (leaveType) filter.leaveType = leaveType;

      let query = Leave.find(filter).sort({ createdAt: -1 });
      
      if (departmentId && typeof departmentId === 'string') {
        const employeeIds = await User.find({ departmentId, role: 'employee' }).distinct('_id');
        query = query.where('employeeId').in(employeeIds);
      }

      const skip = (Number(page) - 1) * Number(pageSize);
      const [items, total] = await Promise.all([
        query.skip(skip).limit(Number(pageSize)),
        Leave.countDocuments(filter)
      ]);

      res.status(200).json({
        success: true,
        data: {
          items,
          pagination: {
            page: Number(page),
            pageSize: Number(pageSize),
            total,
            totalPages: Math.ceil(total / Number(pageSize)),
          },
        },
        message: 'Leave requests retrieved successfully',
      });
    } catch (error) {
      next(error);
    }
  };

  getLeaveById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;
      const leave = await Leave.findById(id).populate('employeeId');

      if (!leave) {
        throw new AppError('Leave request not found', 404, 'LEAVE_NOT_FOUND');
      }

      res.status(200).json({
        success: true,
        data: leave,
        message: 'Leave request retrieved successfully',
      });
    } catch (error) {
      next(error);
    }
  };

  createLeave = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        throw new AppError('Validation failed', 400, 'VALIDATION_ERROR', errors.array());
      }

      const { employeeId, leaveType, fromDate, toDate, reason, attachmentUrl } = req.body;
      
      // If employeeId looks like a userId (MongoDB ObjectId), look up the user's employeeId
      let targetEmployeeId = employeeId;
      const user = await User.findById(employeeId);
      if (user && user.employeeId) {
        targetEmployeeId = user.employeeId.toString();
      }
      
      const totalDays = this.calculateDays(fromDate, toDate);

      const leave = await Leave.create({
        employeeId: targetEmployeeId,
        leaveType,
        fromDate: new Date(fromDate),
        toDate: new Date(toDate),
        totalDays,
        reason,
        attachmentUrl,
        status: 'Pending',
      });

      // Send notification email asynchronously
      (async () => {
        try {
          const empUser = (await User.findOne({ employeeId: targetEmployeeId })) || (await User.findById(employeeId));
          const empName = empUser ? `${empUser.firstName} ${empUser.lastName}` : `Employee (${targetEmployeeId})`;
          const managerEmail = process.env.HR_EMAIL || process.env.SMTP_USER || 'hr@coralgroup.com';
          await sendLeaveRequestEmail(
            managerEmail,
            empName,
            leaveType,
            new Date(fromDate).toLocaleDateString('en-IN'),
            new Date(toDate).toLocaleDateString('en-IN')
          );
        } catch (err) {
          console.error('Failed to send leave request email notification:', err);
        }
      })();

      res.status(201).json({
        success: true,
        data: leave,
        message: 'Leave request created successfully',
      });
    } catch (error) {
      next(error);
    }
  };

  updateLeave = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        throw new AppError('Validation failed', 400, 'VALIDATION_ERROR', errors.array());
      }

      const { id } = req.params;
      const { leaveType, fromDate, toDate, reason, attachmentUrl } = req.body;

      const updateData: any = {};
      if (leaveType) updateData.leaveType = leaveType;
      if (fromDate && toDate) {
        updateData.fromDate = new Date(fromDate);
        updateData.toDate = new Date(toDate);
        updateData.totalDays = this.calculateDays(fromDate, toDate);
      }
      if (reason) updateData.reason = reason;
      if (attachmentUrl !== undefined) updateData.attachmentUrl = attachmentUrl;

      const leave = await Leave.findByIdAndUpdate(id, updateData, { new: true });

      if (!leave) {
        throw new AppError('Leave request not found', 404, 'LEAVE_NOT_FOUND');
      }

      res.status(200).json({
        success: true,
        data: leave,
        message: 'Leave request updated successfully',
      });
    } catch (error) {
      next(error);
    }
  };

  approveLeave = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;
      const { approvedBy, managerNotes } = req.body;

      const leave = await Leave.findById(id);
      if (!leave) {
        throw new AppError('Leave request not found', 404, 'LEAVE_NOT_FOUND');
      }

      leave.status = 'Approved';
      leave.approvedBy = approvedBy;
      leave.managerNotes = managerNotes;
      leave.approvedAt = new Date();
      await leave.save();

      // 1. Leave Balance Auto-Update Cascade
      const year = new Date(leave.fromDate).getFullYear();
      let balance = await LeaveBalance.findOne({ employeeId: leave.employeeId, year });
      if (!balance) {
        balance = await LeaveBalance.create({
          employeeId: leave.employeeId,
          year,
          casualLeave: 8,
          sickLeave: 10,
          earnedLeave: 15,
        });
      }

      if (leave.leaveType === 'Casual Leave') {
        balance.casualLeave = Math.max(0, balance.casualLeave - leave.totalDays);
      } else if (leave.leaveType === 'Sick Leave') {
        balance.sickLeave = Math.max(0, balance.sickLeave - leave.totalDays);
      } else if (leave.leaveType === 'Earned Leave') {
        balance.earnedLeave = Math.max(0, balance.earnedLeave - leave.totalDays);
      } else if (leave.leaveType === 'Unpaid Leave') {
        balance.unpaidLeave += leave.totalDays;
      }
      await balance.save();

      // 2. Attendance Auto-Update Cascade for every date in leave range
      const currDate = new Date(leave.fromDate);
      const endDate = new Date(leave.toDate);

      while (currDate <= endDate) {
        const dateStr = new Date(currDate);
        await Attendance.findOneAndUpdate(
          { employeeId: leave.employeeId, date: dateStr },
          {
            status: 'Leave',
            totalHours: 0,
          },
          { upsert: true, new: true }
        );
        currDate.setDate(currDate.getDate() + 1);
      }

      // Send approval notification email asynchronously
      (async () => {
        try {
          const empUser = await User.findOne({ employeeId: leave.employeeId });
          if (empUser && empUser.email) {
            const empName = `${empUser.firstName} ${empUser.lastName}`;
            await sendLeaveApprovalEmail(empUser.email, empName, leave.leaveType, 'Approved', managerNotes);
          }
        } catch (err) {
          console.error('Failed to send leave approval email notification:', err);
        }
      })();

      res.status(200).json({
        success: true,
        data: leave,
        message: 'Leave request approved, balance updated, and attendance logged',
      });
    } catch (error) {
      next(error);
    }
  };

  rejectLeave = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;
      const { approvedBy, managerNotes, rejectionReason } = req.body;

      const leave = await Leave.findByIdAndUpdate(
        id,
        {
          status: 'Rejected',
          approvedBy,
          managerNotes,
          rejectionReason,
        },
        { new: true }
      );

      if (!leave) {
        throw new AppError('Leave request not found', 404, 'LEAVE_NOT_FOUND');
      }

      // Send rejection notification email asynchronously
      (async () => {
        try {
          const empUser = await User.findOne({ employeeId: leave.employeeId });
          if (empUser && empUser.email) {
            const empName = `${empUser.firstName} ${empUser.lastName}`;
            await sendLeaveApprovalEmail(empUser.email, empName, leave.leaveType, 'Rejected', rejectionReason || managerNotes);
          }
        } catch (err) {
          console.error('Failed to send leave rejection email notification:', err);
        }
      })();

      res.status(200).json({
        success: true,
        data: leave,
        message: 'Leave request rejected successfully',
      });
    } catch (error) {
      next(error);
    }
  };


  cancelLeave = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;

      const leave = await Leave.findByIdAndUpdate(
        id,
        { status: 'Cancel Requested' },
        { new: true }
      );

      if (!leave) {
        throw new AppError('Leave request not found', 404, 'LEAVE_NOT_FOUND');
      }

      res.status(200).json({
        success: true,
        data: leave,
        message: 'Leave request cancelled successfully',
      });
    } catch (error) {
      next(error);
    }
  };

  getLeaveBalance = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { employeeId } = req.params;
      const year = new Date().getFullYear();

      // If employeeId looks like a userId (MongoDB ObjectId), look up the user's employeeId
      let targetEmployeeId = employeeId;
      const user = await User.findById(employeeId);
      if (user && user.employeeId) {
        targetEmployeeId = user.employeeId.toString();
      }

      // Read dynamic LeavePolicy configured by SuperAdmin from MongoDB
      let policy = await LeavePolicy.findOne({ isActive: true });
      if (!policy) {
        policy = await LeavePolicy.create({
          casualLeaveDays: 12,
          sickLeaveDays: 8,
          earnedLeaveDays: 15,
          unpaidLeaveDays: 0,
          carryForwardEnabled: true,
          leaveEncashmentEnabled: true,
          isActive: true,
        });
      }

      const annualCL = policy.casualLeaveDays ?? 12;
      const annualPL = policy.earnedLeaveDays ?? 15;
      const annualSL = policy.sickLeaveDays ?? 8;

      let balance = await LeaveBalance.findOne({ employeeId: targetEmployeeId, year });
      if (!balance) {
        balance = await LeaveBalance.create({
          employeeId: targetEmployeeId,
          year,
          casualLeave: annualCL,
          sickLeave: annualSL,
          earnedLeave: annualPL,
          unpaidLeave: 0,
        });
      }

      const approvedLeaves = await Leave.find({
        employeeId: targetEmployeeId,
        status: 'Approved',
        fromDate: { $gte: new Date(`${year}-01-01`) },
        toDate: { $lte: new Date(`${year}-12-31`) },
      });

      const usedMap = approvedLeaves.reduce((acc: any, leave) => {
        acc[leave.leaveType] = (acc[leave.leaveType] || 0) + leave.totalDays;
        return acc;
      }, {});

      const usedCL = usedMap['Casual Leave'] || 0;
      const usedPL = usedMap['Earned Leave'] || 0;
      const usedSL = usedMap['Sick Leave'] || 0;

      res.status(200).json({
        success: true,
        data: {
          annual: {
            CL: annualCL,
            PL: annualPL,
            SL: annualSL,
          },
          available: {
            CL: Math.max(0, annualCL - usedCL),
            PL: Math.max(0, annualPL - usedPL),
            SL: Math.max(0, annualSL - usedSL),
          },
          used: {
            CL: usedCL,
            PL: usedPL,
            SL: usedSL,
            LWP: usedMap['Unpaid Leave'] || 0,
          },
        },
        message: 'Leave balance retrieved successfully',
      });
    } catch (error) {
      next(error);
    }
  };

  getLeaveApprovals = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { departmentId } = req.query;

      let query = Leave.find({ status: 'Pending' }).sort({ createdAt: -1 });

      if (departmentId && typeof departmentId === 'string') {
        const employeeIds = await User.find({ departmentId, role: 'employee' }).distinct('_id');
        query = query.where('employeeId').in(employeeIds);
      }

      const leaves = await query;

      res.status(200).json({
        success: true,
        data: leaves,
        message: 'Leave approvals retrieved successfully',
      });
    } catch (error) {
      next(error);
    }
  };

  // Custom SuperAdmin Setup Policy Endpoints
  getLeavePolicy = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      let policy = await LeavePolicy.findOne({ isActive: true });
      if (!policy) {
        policy = await LeavePolicy.create({
          casualLeaveDays: 8,
          sickLeaveDays: 10,
          earnedLeaveDays: 15,
          unpaidLeaveDays: 0,
          carryForwardEnabled: true,
          leaveEncashmentEnabled: true,
          isActive: true,
        });
      }
      res.status(200).json({ success: true, data: policy });
    } catch (error) {
      next(error);
    }
  };

  updateLeavePolicy = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const updateData = req.body;
      let policy = await LeavePolicy.findOneAndUpdate({ isActive: true }, updateData, { new: true, upsert: true });
      res.status(200).json({ success: true, data: policy, message: 'Leave policy updated successfully' });
    } catch (error) {
      next(error);
    }
  };

  getHolidays = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const year = Number(req.query.year) || new Date().getFullYear();
      const holidays = await Holiday.find({ year }).sort({ date: 1 });
      res.status(200).json({ success: true, data: holidays });
    } catch (error) {
      next(error);
    }
  };

  createHoliday = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { name, date, type } = req.body;
      const holidayDate = new Date(date);
      const holiday = await Holiday.create({
        name,
        date: holidayDate,
        type: type || 'public',
        year: holidayDate.getFullYear(),
      });
      res.status(201).json({ success: true, data: holiday, message: 'Holiday created successfully' });
    } catch (error) {
      next(error);
    }
  };

  getMyLeaveRequests = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = (req as any).userId;
      const user = await User.findById(userId);
      
      if (!user) {
        throw new AppError('User not found', 404, 'USER_NOT_FOUND');
      }

      const leaves = await Leave.find({ employeeId: user.employeeId }).sort({ createdAt: -1 });

      res.status(200).json({
        success: true,
        data: leaves,
        message: 'My leave requests retrieved successfully',
      });
    } catch (error) {
      next(error);
    }
  };

  getMyPendingLeaves = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = (req as any).userId;
      const user = await User.findById(userId);
      
      if (!user) {
        throw new AppError('User not found', 404, 'USER_NOT_FOUND');
      }

      const leaves = await Leave.find({ 
        employeeId: user.employeeId, 
        status: { $in: ['Pending', 'Cancel Requested'] } 
      }).sort({ createdAt: -1 });

      res.status(200).json({
        success: true,
        data: leaves,
        message: 'My pending leaves retrieved successfully',
      });
    } catch (error) {
      next(error);
    }
  };

  private calculateDays(fromDate: string, toDate: string): number {
    const start = new Date(fromDate);
    const end = new Date(toDate);
    const diffTime = Math.abs(end.getTime() - start.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
    return diffDays;
  }
}
