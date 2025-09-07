import { Router } from 'express';
import { requireAuth } from './middleware/requireAuth';
import {login, logout, register} from "./controllers/auth";
import {getMe} from "./controllers/users";
import {createGroup, getGroupById, getUserGroups, inviteMember} from "./controllers/groups";
import {createExpense, getExpense, getGroupExpenses} from "./controllers/expenses";
import {createSettlement, getGroupBalances, getGroupSettlements} from "./controllers/settlements";

const router = Router();

// Auth routes (no auth required)
router.post('/auth/login', login);
router.post('/auth/register', register);
router.post('/auth/logout', logout);

// User routes (auth required)
router.get('/me', requireAuth, getMe);

// Group routes (auth required)
router.post('/groups', requireAuth, createGroup);
router.get('/groups', requireAuth, getUserGroups);
router.get('/groups/:id', requireAuth, getGroupById);
router.post('/groups/:id/invite', requireAuth, inviteMember);

// Expense routes (auth required)
router.post('/groups/:id/expenses', requireAuth, createExpense);
router.get('/groups/:id/expenses', requireAuth, getGroupExpenses);
router.get('/groups/:id/expenses/:expenseId', requireAuth, getExpense);

// Settlement routes (auth required)
router.get('/balances/:groupId', requireAuth, getGroupBalances);
router.post('/groups/:id/settlements', requireAuth, createSettlement);
router.get('/groups/:id/settlements', requireAuth, getGroupSettlements);

export default router;
