import { Request, Response, NextFunction } from 'express';
<<<<<<< HEAD
import { User } from '../../models/user.model';
=======
import { Employee } from '../../models/employee.model';
>>>>>>> 2eb72eb (Initial commit)
import { AppError } from '../../middleware/error.middleware';
import { validationResult } from 'express-validator';

export class EmployeeController {
  getAllEmployees = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { departmentId, roleId, shiftId, status, workType, search } = req.query;
<<<<<<< HEAD

=======
      
>>>>>>> 2eb72eb (Initial commit)
      const filter: any = {};
      if (departmentId) filter.departmentId = departmentId;
      if (roleId) filter.roleId = roleId;
      if (shiftId) filter.shiftId = shiftId;
<<<<<<< HEAD
      if (status) filter.employeeStatus = status;
=======
      if (status) filter.status = status;
>>>>>>> 2eb72eb (Initial commit)
      if (workType) filter.workType = workType;
      if (search) {
        filter.$or = [
          { firstName: { $regex: search, $options: 'i' } },
          { lastName: { $regex: search, $options: 'i' } },
          { email: { $regex: search, $options: 'i' } },
          { employeeId: { $regex: search, $options: 'i' } },
        ];
      }

<<<<<<< HEAD
      const employees = await User.find(filter).sort({ createdAt: -1 });
=======
      const employees = await Employee.find(filter).sort({ createdAt: -1 });
>>>>>>> 2eb72eb (Initial commit)

      res.status(200).json({
        success: true,
        data: employees,
        message: 'Employees retrieved successfully',
      });
    } catch (error) {
    return;
      next(error);
    }
  };

  getEmployeeById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;
<<<<<<< HEAD
      const employee = await User.findById(id);
=======
      const employee = await Employee.findById(id);
>>>>>>> 2eb72eb (Initial commit)

      if (!employee) {
        throw new AppError('Employee not found', 404, 'EMPLOYEE_NOT_FOUND');
      }

      res.status(200).json({
        success: true,
        data: employee,
        message: 'Employee retrieved successfully',
      });
    } catch (error) {
    return;
      next(error);
    }
  };

  getEmployeeByEmployeeId = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { employeeId } = req.params;
<<<<<<< HEAD
      const employee = await User.findOne({ employeeId });
=======
      const employee = await Employee.findOne({ employeeId });
>>>>>>> 2eb72eb (Initial commit)

      if (!employee) {
        throw new AppError('Employee not found', 404, 'EMPLOYEE_NOT_FOUND');
      }

      res.status(200).json({
        success: true,
        data: employee,
        message: 'Employee retrieved successfully',
      });
    } catch (error) {
    return;
      next(error);
    }
  };

  createEmployee = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        throw new AppError('Validation failed', 400, 'VALIDATION_ERROR', errors.array());
      }

<<<<<<< HEAD
      // Generate employee ID in CG-XXXX format - find next available
      const existingEmployees = await User.find({
        employeeId: { $regex: /^CG-\d{4}$/ },
        role: 'employee'
      }).select('employeeId').sort({ employeeId: 1 });

      const existingNumbers = new Set(
        existingEmployees
          .map(e => parseInt(e.employeeId.split('-')[1]))
          .filter(n => !isNaN(n))
      );

      let nextNumber = 1;
      while (existingNumbers.has(nextNumber)) {
        nextNumber++;
      }

      const employeeId = `CG-${nextNumber.toString().padStart(4, '0')}`;
      
      const employee = await User.create({
        ...req.body,
        employeeId,
        role: 'employee',
=======
      const employeeId = `EMP${Date.now()}`;
      const employee = await Employee.create({
        ...req.body,
        employeeId,
>>>>>>> 2eb72eb (Initial commit)
      });

      res.status(201).json({
        success: true,
        data: employee,
        message: 'Employee created successfully',
      });
    } catch (error) {
    return;
      next(error);
    }
  };

  updateEmployee = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        throw new AppError('Validation failed', 400, 'VALIDATION_ERROR', errors.array());
      }

      const { id } = req.params;
<<<<<<< HEAD
      const employee = await User.findByIdAndUpdate(id, req.body, { new: true });
=======
      const employee = await Employee.findByIdAndUpdate(id, req.body, { new: true });
>>>>>>> 2eb72eb (Initial commit)

      if (!employee) {
        throw new AppError('Employee not found', 404, 'EMPLOYEE_NOT_FOUND');
      }

      res.status(200).json({
        success: true,
        data: employee,
        message: 'Employee updated successfully',
      });
    } catch (error) {
    return;
      next(error);
    }
  };

  deleteEmployee = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;
<<<<<<< HEAD
      const employee = await User.findByIdAndDelete(id);
=======
      const employee = await Employee.findByIdAndDelete(id);
>>>>>>> 2eb72eb (Initial commit)

      if (!employee) {
        throw new AppError('Employee not found', 404, 'EMPLOYEE_NOT_FOUND');
      }

      res.status(200).json({
        success: true,
        message: 'Employee deleted successfully',
      });
    } catch (error) {
    return;
      next(error);
    }
  };

  getDepartmentEmployees = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { departmentId } = req.params;
<<<<<<< HEAD
      const employees = await User.find({ departmentId, role: 'employee' }).sort({ firstName: 1, lastName: 1 });
=======
      const employees = await Employee.find({ departmentId }).sort({ firstName: 1, lastName: 1 });
>>>>>>> 2eb72eb (Initial commit)

      res.status(200).json({
        success: true,
        data: employees,
        message: 'Department employees retrieved successfully',
      });
    } catch (error) {
    return;
      next(error);
    }
  };

  getShiftEmployees = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { shiftId } = req.params;
<<<<<<< HEAD
      const employees = await User.find({ shiftId, role: 'employee' }).sort({ firstName: 1, lastName: 1 });
=======
      const employees = await Employee.find({ shiftId }).sort({ firstName: 1, lastName: 1 });
>>>>>>> 2eb72eb (Initial commit)

      res.status(200).json({
        success: true,
        data: employees,
        message: 'Shift employees retrieved successfully',
      });
    } catch (error) {
    return;
      next(error);
    }
  };
}
