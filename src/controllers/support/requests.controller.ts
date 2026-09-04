import { Request, Response, NextFunction } from 'express';
import { SupportRequest } from '../../models/support.model';
import { AppError } from '../../middleware/error.middleware';

export class RequestsController {
  getAllRequests = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { status, type, priority, companyId } = req.query;

      const filter: any = {};
      if (status && status !== 'all') filter.status = status;
      if (type) filter.type = type;
      if (priority) filter.priority = priority;
      if (companyId) filter.companyId = companyId;

      const requests = await SupportRequest.find(filter)
        .populate('createdBy', 'firstName lastName email employeeId')
        .sort({ createdAt: -1 });

      res.status(200).json({
        success: true,
        data: requests,
        message: 'Requests retrieved successfully',
      });
    } catch (error) {
      next(error);
    }
  };

  createRequest = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const requestId = `REQ${Date.now()}`;
      const request = await SupportRequest.create({
        ...req.body,
        requestId,
      });

      res.status(201).json({
        success: true,
        data: request,
        message: 'Request created successfully',
      });
    } catch (error) {
      next(error);
    }
  };

  updateRequestStatus = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;
      const { status } = req.body;

      const request = await SupportRequest.findByIdAndUpdate(id, { status }, { new: true });

      if (!request) {
        throw new AppError('Request not found', 404, 'REQUEST_NOT_FOUND');
      }

      res.status(200).json({
        success: true,
        data: request,
        message: 'Request status updated successfully',
      });
    } catch (error) {
      next(error);
    }
  };

  deleteRequest = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;
      const request = await SupportRequest.findByIdAndDelete(id);

      if (!request) {
        throw new AppError('Request not found', 404, 'REQUEST_NOT_FOUND');
      }

      res.status(200).json({
        success: true,
        message: 'Request deleted successfully',
      });
    } catch (error) {
      next(error);
    }
  };
}
