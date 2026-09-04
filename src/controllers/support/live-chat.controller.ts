import { Request, Response, NextFunction } from 'express';
import { LiveChat } from '../../models/support.model';
import { AppError } from '../../middleware/error.middleware';

export class LiveChatController {
  getAllLiveChats = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { status } = req.query;

      const filter: any = {};
      if (status) filter.status = status;

      const chats = await LiveChat.find(filter)
        .populate('userId', 'firstName lastName email employeeId')
        .populate('agentId', 'firstName lastName email employeeId')
        .sort({ updatedAt: -1 });

      res.status(200).json({
        success: true,
        data: chats,
        message: 'Live chat sessions retrieved successfully',
      });
    } catch (error) {
      next(error);
    }
  };

  createLiveChat = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const sessionId = `CHAT${Date.now()}`;
      const chat = await LiveChat.create({
        ...req.body,
        sessionId,
      });

      res.status(201).json({
        success: true,
        data: chat,
        message: 'Live chat session created successfully',
      });
    } catch (error) {
      next(error);
    }
  };

  sendMessage = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;
      const { sender, message } = req.body;

      const chat = await LiveChat.findById(id);
      if (!chat) {
        throw new AppError('Live chat session not found', 404, 'SESSION_NOT_FOUND');
      }

      chat.messages.push({
        sender,
        message,
        timestamp: new Date(),
      });

      await chat.save();

      res.status(200).json({
        success: true,
        data: chat,
        message: 'Message sent successfully',
      });
    } catch (error) {
      next(error);
    }
  };

  updateChatStatus = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;
      const { status, agentId } = req.body;

      const updateData: any = { status };
      if (agentId) updateData.agentId = agentId;
      if (status === 'Closed') updateData.endedAt = new Date();

      const chat = await LiveChat.findByIdAndUpdate(id, updateData, { new: true });

      if (!chat) {
        throw new AppError('Live chat session not found', 404, 'SESSION_NOT_FOUND');
      }

      res.status(200).json({
        success: true,
        data: chat,
        message: 'Live chat status updated successfully',
      });
    } catch (error) {
      next(error);
    }
  };
}
