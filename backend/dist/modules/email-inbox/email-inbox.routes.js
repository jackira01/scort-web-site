"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.emailInboxRoutes = void 0;
const express_1 = require("express");
const email_inbox_controller_1 = require("./email-inbox.controller");
const auth_middleware_1 = require("../../middlewares/auth.middleware");
const admin_middleware_1 = require("../../middlewares/admin.middleware");
const router = (0, express_1.Router)();
exports.emailInboxRoutes = router;
router.use('/webhook', (req, res, next) => {
    next();
});
router.use((req, res, next) => {
    if (req.path === '/webhook') {
        return next();
    }
    (0, auth_middleware_1.authenticateToken)(req, res, next);
});
router.use((req, res, next) => {
    if (req.path === '/webhook') {
        return next();
    }
    (0, admin_middleware_1.adminMiddleware)(req, res, next);
});
router.use((req, res, next) => {
    if (req.path === '/webhook') {
        return next();
    }
    (0, auth_middleware_1.authenticateToken)(req, res, next);
});
router.get('/', email_inbox_controller_1.EmailInboxController.getInboxEmails);
router.get('/stats', email_inbox_controller_1.EmailInboxController.getInboxStats);
router.get('/:id', email_inbox_controller_1.EmailInboxController.getEmailById);
router.patch('/mark-read', email_inbox_controller_1.EmailInboxController.markAsRead);
router.patch('/mark-unread', email_inbox_controller_1.EmailInboxController.markAsUnread);
router.delete('/', email_inbox_controller_1.EmailInboxController.deleteEmails);
router.post('/webhook', email_inbox_controller_1.EmailInboxController.receiveEmailWebhook);
router.post('/test-receive', email_inbox_controller_1.EmailInboxController.testReceiveEmail);
