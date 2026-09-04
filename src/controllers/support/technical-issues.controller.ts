import { Request, Response, NextFunction } from 'express';
import { TechnicalIssue } from '../../models/support.model';
import { AppError } from '../../middleware/error.middleware';

export class TechnicalIssuesController {
  getAllTechnicalIssues = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { status, severity, category, companyId } = req.query;

      const filter: any = {};
      if (status && status !== 'all') filter.status = status;
      if (severity) filter.severity = severity;
      if (category) filter.category = category;
      if (companyId) filter.companyId = companyId;

      const issues = await TechnicalIssue.find(filter)
        .populate('reportedBy', 'firstName lastName email employeeId')
        .populate('assignedTo', 'firstName lastName email employeeId')
        .sort({ createdAt: -1 });

      res.status(200).json({
        success: true,
        data: issues,
        message: 'Technical issues retrieved successfully',
      });
    } catch (error) {
      next(error);
    }
  };

  createTechnicalIssue = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const issueId = `TECH${Date.now()}`;
      const issue = await TechnicalIssue.create({
        ...req.body,
        issueId,
      });

      res.status(201).json({
        success: true,
        data: issue,
        message: 'Technical issue created successfully',
      });
    } catch (error) {
      next(error);
    }
  };

  updateIssueStatus = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;
      const updateData: any = { ...req.body };

      if (updateData.status === 'Resolved' && !updateData.resolvedAt) {
        updateData.resolvedAt = new Date();
      }

      const issue = await TechnicalIssue.findByIdAndUpdate(id, updateData, { new: true });

      if (!issue) {
        throw new AppError('Technical issue not found', 404, 'ISSUE_NOT_FOUND');
      }

      res.status(200).json({
        success: true,
        data: issue,
        message: 'Technical issue updated successfully',
      });
    } catch (error) {
      next(error);
    }
  };
}
