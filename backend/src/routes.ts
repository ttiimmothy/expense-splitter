import { Router } from 'express';
import { requireAuth } from './middleware/requireAuth';
import * as authController from './controllers/auth';
import * as userController from './controllers/users';
import * as groupController from './controllers/groups';
import * as expenseController from './controllers/expenses';
import * as settlementController from './controllers/settlements';

const router = Router();

// Auth routes (no auth required)
router.post('/auth/login', authController.login);
router.post('/auth/register', authController.register);
router.post('/auth/logout', authController.logout);

// User routes (auth required)
router.get('/me', requireAuth, userController.getMe);

// Group routes (auth required)
router.post('/groups', requireAuth, groupController.createGroup);
router.get('/groups', requireAuth, groupController.getUserGroups);
router.get('/groups/:id', requireAuth, groupController.getGroupById);
router.post('/groups/:id/invite', requireAuth, groupController.inviteMember);

// Expense routes (auth required)
router.post('/groups/:id/expenses', requireAuth, expenseController.createExpense);
router.get('/groups/:id/expenses', requireAuth, expenseController.getGroupExpenses);

// Settlement routes (auth required)
router.get('/balances/:groupId', requireAuth, settlementController.getGroupBalances);
router.post('/groups/:id/settlements', requireAuth, settlementController.createSettlement);
router.get('/groups/:id/settlements', requireAuth, settlementController.getGroupSettlements);

export default router;
