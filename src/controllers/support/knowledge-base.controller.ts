import { Request, Response, NextFunction } from 'express';
import { KnowledgeBase } from '../../models/support.model';
import { AppError } from '../../middleware/error.middleware';

export class KnowledgeBaseController {
  getAllKnowledgeBase = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { category, search, companyId } = req.query;

      const filter: any = {};
      if (category && category !== 'All') filter.category = category;
      if (companyId) filter.companyId = companyId;
      if (search) {
        filter.$or = [
          { title: { $regex: search, $options: 'i' } },
          { content: { $regex: search, $options: 'i' } },
        ];
      }

      const articles = await KnowledgeBase.find(filter)
        .populate('author', 'firstName lastName email employeeId')
        .sort({ createdAt: -1 });

      res.status(200).json({
        success: true,
        data: articles,
        message: 'Knowledge base articles retrieved successfully',
      });
    } catch (error) {
      next(error);
    }
  };

  createKnowledgeArticle = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const articleId = `KB${Date.now()}`;
      const article = await KnowledgeBase.create({
        ...req.body,
        articleId,
      });

      res.status(201).json({
        success: true,
        data: article,
        message: 'Knowledge base article created successfully',
      });
    } catch (error) {
      next(error);
    }
  };

  updateKnowledgeArticle = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;
      const article = await KnowledgeBase.findByIdAndUpdate(id, req.body, { new: true });

      if (!article) {
        throw new AppError('Knowledge base article not found', 404, 'ARTICLE_NOT_FOUND');
      }

      res.status(200).json({
        success: true,
        data: article,
        message: 'Knowledge base article updated successfully',
      });
    } catch (error) {
      next(error);
    }
  };

  deleteKnowledgeArticle = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;
      const article = await KnowledgeBase.findByIdAndDelete(id);

      if (!article) {
        throw new AppError('Knowledge base article not found', 404, 'ARTICLE_NOT_FOUND');
      }

      res.status(200).json({
        success: true,
        message: 'Knowledge base article deleted successfully',
      });
    } catch (error) {
      next(error);
    }
  };
}
