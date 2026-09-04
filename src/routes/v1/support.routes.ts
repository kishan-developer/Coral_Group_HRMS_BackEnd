import { Router } from 'express';
import { DashboardController } from '../../controllers/support/dashboard.controller';
import { TicketsController } from '../../controllers/support/tickets.controller';
import { RequestsController } from '../../controllers/support/requests.controller';
import { KnowledgeBaseController } from '../../controllers/support/knowledge-base.controller';
import { AnnouncementsController } from '../../controllers/support/announcements.controller';
import { TechnicalIssuesController } from '../../controllers/support/technical-issues.controller';
import { LiveChatController } from '../../controllers/support/live-chat.controller';
import { ReportsController } from '../../controllers/support/reports.controller';
import { authMiddleware } from '../../middleware/auth.middleware';

const router = Router();
const dashboardController = new DashboardController();
const ticketsController = new TicketsController();
const requestsController = new RequestsController();
const knowledgeBaseController = new KnowledgeBaseController();
const announcementsController = new AnnouncementsController();
const technicalIssuesController = new TechnicalIssuesController();
const liveChatController = new LiveChatController();
const reportsController = new ReportsController();

// Dashboard
router.get('/dashboard', authMiddleware, dashboardController.getDashboardStats);

// Support Tickets
router.get('/tickets', authMiddleware, ticketsController.getAllTickets);
router.get('/tickets/:id', authMiddleware, ticketsController.getTicketById);
router.post('/tickets', authMiddleware, ticketsController.createTicket);
router.put('/tickets/:id', authMiddleware, ticketsController.updateTicket);
router.delete('/tickets/:id', authMiddleware, ticketsController.deleteTicket);

// Support Requests
router.get('/requests', authMiddleware, requestsController.getAllRequests);
router.post('/requests', authMiddleware, requestsController.createRequest);
router.put('/requests/:id/status', authMiddleware, requestsController.updateRequestStatus);
router.delete('/requests/:id', authMiddleware, requestsController.deleteRequest);

// Technical Issues
router.get('/technical-issues', authMiddleware, technicalIssuesController.getAllTechnicalIssues);
router.post('/technical-issues', authMiddleware, technicalIssuesController.createTechnicalIssue);
router.put('/technical-issues/:id/status', authMiddleware, technicalIssuesController.updateIssueStatus);

// Knowledge Base
router.get('/knowledge-base', authMiddleware, knowledgeBaseController.getAllKnowledgeBase);
router.post('/knowledge-base', authMiddleware, knowledgeBaseController.createKnowledgeArticle);
router.put('/knowledge-base/:id', authMiddleware, knowledgeBaseController.updateKnowledgeArticle);
router.delete('/knowledge-base/:id', authMiddleware, knowledgeBaseController.deleteKnowledgeArticle);

// Announcements
router.get('/announcements', authMiddleware, announcementsController.getAllAnnouncements);
router.post('/announcements', authMiddleware, announcementsController.createAnnouncement);
router.put('/announcements/:id', authMiddleware, announcementsController.updateAnnouncement);
router.delete('/announcements/:id', authMiddleware, announcementsController.deleteAnnouncement);

// Live Chat
router.get('/live-chat', authMiddleware, liveChatController.getAllLiveChats);
router.post('/live-chat', authMiddleware, liveChatController.createLiveChat);
router.post('/live-chat/:id/messages', authMiddleware, liveChatController.sendMessage);
router.put('/live-chat/:id/status', authMiddleware, liveChatController.updateChatStatus);

// Reports
router.get('/reports', authMiddleware, reportsController.getReports);

export default router;
