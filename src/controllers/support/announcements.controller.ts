import { Request, Response, NextFunction } from 'express';
import { Announcement } from '../../models/support.model';
import { AppError } from '../../middleware/error.middleware';

export class AnnouncementsController {
  getAllAnnouncements = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { type, targetAudience, companyId } = req.query;

      const filter: any = {};
      if (type) filter.type = type;
      if (targetAudience) filter.targetAudience = targetAudience;
      if (companyId) filter.companyId = companyId;

      const announcements = await Announcement.find(filter)
        .populate('createdBy', 'firstName lastName email employeeId')
        .sort({ createdAt: -1 });

      res.status(200).json({
        success: true,
        data: announcements,
        message: 'Announcements retrieved successfully',
      });
    } catch (error) {
      next(error);
    }
  };

  createAnnouncement = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const announcementId = `ANN${Date.now()}`;
      const announcement = await Announcement.create({
        ...req.body,
        announcementId,
      });

      res.status(201).json({
        success: true,
        data: announcement,
        message: 'Announcement created successfully',
      });
    } catch (error) {
      next(error);
    }
  };

  updateAnnouncement = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;
      const announcement = await Announcement.findByIdAndUpdate(id, req.body, { new: true });

      if (!announcement) {
        throw new AppError('Announcement not found', 404, 'ANNOUNCEMENT_NOT_FOUND');
      }

      res.status(200).json({
        success: true,
        data: announcement,
        message: 'Announcement updated successfully',
      });
    } catch (error) {
      next(error);
    }
  };

  deleteAnnouncement = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;
      const announcement = await Announcement.findByIdAndDelete(id);

      if (!announcement) {
        throw new AppError('Announcement not found', 404, 'ANNOUNCEMENT_NOT_FOUND');
      }

      res.status(200).json({
        success: true,
        message: 'Announcement deleted successfully',
      });
    } catch (error) {
      next(error);
    }
  };
}
