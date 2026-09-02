import { Request, Response, NextFunction } from 'express';
import { LeaveBalance } from '../../models/leave-balance.model';
import { LeavePolicy } from '../../models/leave-policy.model';
import { User } from '../../models/user.model';
import { AppError } from '../../middleware/error.middleware';
import { validationResult } from 'express-validator';

export class LeaveBalanceController {
  getAllLeaveBalances = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { departmentId, year } = req.query;
      
      const filter: any = {};
      if (year) filter.year = Number(year);
      else filter.year = new Date().getFullYear();

      let query = LeaveBalance.find(filter).populate('employeeId');

      if (departmentId) {
        query = query.populate({
          path: 'employeeId',
          match: { departmentId }
        });
      }

      const balances = await query;

      res.status(200).json({
        success: true,
        data: balances,
        message: 'Leave balances retrieved successfully',
      });
    } catch (error) {
      return;
      next(error);
    }
  };

  getLeaveBalanceByEmployeeId = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { employeeId } = req.params;
      const year = new Date().getFullYear();

      let balance = await LeaveBalance.findOne({ employeeId, year }).populate('employeeId');

      if (!balance) {
        balance = await LeaveBalance.create({
          userId: employeeId,
          employeeId,
          year,
          casualLeave: 12,
          sickLeave: 8,
          earnedLeave: 15,
          maternityLeave: 180,
          paternityLeave: 15,
          unpaidLeave: 0,
        });
        balance = await LeaveBalance.findById(balance._id).populate('employeeId');
      }

      res.status(200).json({
        success: true,
        data: balance,
        message: 'Leave balance retrieved successfully',
      });
    } catch (error) {
      return;
      next(error);
    }
  };

  updateLeaveBalance = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        throw new AppError('Validation failed', 400, 'VALIDATION_ERROR', errors.array());
      }

      const { employeeId } = req.params;
      const { casualLeave, sickLeave, earnedLeave, maternityLeave, paternityLeave, unpaidLeave } = req.body;

      const updateData: any = {};
      if (casualLeave !== undefined) updateData.casualLeave = casualLeave;
      if (sickLeave !== undefined) updateData.sickLeave = sickLeave;
      if (earnedLeave !== undefined) updateData.earnedLeave = earnedLeave;
      if (maternityLeave !== undefined) updateData.maternityLeave = maternityLeave;
      if (paternityLeave !== undefined) updateData.paternityLeave = paternityLeave;
      if (unpaidLeave !== undefined) updateData.unpaidLeave = unpaidLeave;

      const balance = await LeaveBalance.findOneAndUpdate(
        { employeeId, year: new Date().getFullYear() },
        updateData,
        { new: true, upsert: true }
      ).populate('employeeId');

      res.status(200).json({
        success: true,
        data: balance,
        message: 'Leave balance updated successfully',
      });
    } catch (error) {
      return;
      next(error);
    }
  };

  runMonthlyAccrual = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const year = new Date().getFullYear();
      let policy = await LeavePolicy.findOne({ isActive: true });
      if (!policy) {
        policy = await LeavePolicy.create({});
      }

      const monthlyCL = policy.monthlyCLAccrual ?? 1.0;
      const monthlyPL = policy.monthlyPLAccrual ?? 1.25;
      const probationThresholdMonths = policy.probationMonthsForPL ?? 6;

      const users = await User.find({ role: 'employee' });
      let processedCount = 0;
      const results = [];

      for (const user of users) {
        const empId = user.employeeId || user._id.toString();
        const joiningDate = user.createdAt || new Date();
        const monthsServed = Math.floor(
          (new Date().getTime() - new Date(joiningDate).getTime()) / (1000 * 60 * 60 * 24 * 30.44)
        );

        const isProbation = monthsServed < probationThresholdMonths;

        let balance = await LeaveBalance.findOne({ employeeId: empId, year });
        if (!balance) {
          balance = new LeaveBalance({
            userId: user._id.toString(),
            employeeId: empId,
            year,
            casualLeave: 0,
            earnedLeave: 0,
            sickLeave: 6,
            unpaidLeave: 0,
          });
        }

        // Rule: Before 6 months -> Only CL accrued. After 6 months -> Both CL and PL accrued.
        balance.casualLeave += monthlyCL;
        if (!isProbation) {
          balance.earnedLeave += monthlyPL;
        }

        await balance.save();
        processedCount++;
        const userName = `${user.firstName || ''} ${user.lastName || ''}`.trim() || empId;
        results.push({
          employee: userName,
          monthsServed,
          isProbation,
          clAdded: monthlyCL,
          plAdded: isProbation ? 0 : monthlyPL,
          newCL: balance.casualLeave,
          newPL: balance.earnedLeave,
        });
      }

      res.status(200).json({
        success: true,
        data: { processedCount, details: results },
        message: `Monthly leave accrual processed successfully for ${processedCount} employees.`,
      });
    } catch (error) {
      next(error);
    }
  };

  convertAbsenceToLeave = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { employeeId, daysCount = 1, targetLeaveType = 'AUTO', notes } = req.body;
      const year = new Date().getFullYear();

      if (!employeeId) {
        throw new AppError('Employee ID is required', 400, 'MISSING_EMPLOYEE_ID');
      }

      let balance = await LeaveBalance.findOne({ employeeId, year });
      if (!balance) {
        balance = await LeaveBalance.create({
          userId: employeeId,
          employeeId,
          year,
          casualLeave: 12,
          earnedLeave: 15,
          sickLeave: 8,
          unpaidLeave: 0,
        });
      }

      let remainingToDeduct = Number(daysCount);
      let clDeducted = 0;
      let plDeducted = 0;
      let lwpAdded = 0;

      if (targetLeaveType === 'CL') {
        clDeducted = Math.min(balance.casualLeave, remainingToDeduct);
        balance.casualLeave = Math.max(0, balance.casualLeave - remainingToDeduct);
      } else if (targetLeaveType === 'PL') {
        plDeducted = Math.min(balance.earnedLeave, remainingToDeduct);
        balance.earnedLeave = Math.max(0, balance.earnedLeave - remainingToDeduct);
      } else {
        // AUTO Priority Deduction: 1st CL -> 2nd PL -> 3rd LWP
        if (balance.casualLeave > 0) {
          clDeducted = Math.min(balance.casualLeave, remainingToDeduct);
          balance.casualLeave -= clDeducted;
          remainingToDeduct -= clDeducted;
        }

        if (remainingToDeduct > 0 && balance.earnedLeave > 0) {
          plDeducted = Math.min(balance.earnedLeave, remainingToDeduct);
          balance.earnedLeave -= plDeducted;
          remainingToDeduct -= plDeducted;
        }

        if (remainingToDeduct > 0) {
          lwpAdded = remainingToDeduct;
          balance.unpaidLeave += lwpAdded;
        }
      }

      await balance.save();

      res.status(200).json({
        success: true,
        data: {
          employeeId,
          daysRequested: daysCount,
          clDeducted,
          plDeducted,
          lwpAdded,
          updatedBalances: {
            casualLeave: balance.casualLeave,
            earnedLeave: balance.earnedLeave,
            unpaidLeave: balance.unpaidLeave,
          },
          notes,
        },
        message: `Absence of ${daysCount} day(s) converted into leave balances successfully! (CL: -${clDeducted}, PL: -${plDeducted}, LWP: +${lwpAdded})`,
      });
    } catch (error) {
      next(error);
    }
  };
}
