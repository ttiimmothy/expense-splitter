import { Router } from 'express';
import { requireAuth } from './middleware/requireAuth';
import {login, logout, register, changePassword} from "./controllers/auth";
import {getMe} from "./controllers/users";
import {
  createGroup, 
  deleteGroupMember, 
  findAvailableUsersEmail, 
  getGroupById, 
  getUserGroups, 
  inviteMultipleMembers, 
  getGroupExpenses, 
  changeGroupOwner,
  deleteGroup,
  editGroup,
  exitGroup
} from "./controllers/groups";
import {createExpense, deleteExpense, editExpense, getExpense, updateExpenseShare} from "./controllers/expenses";
import {createSettlement, getGroupBalances, getGroupSettlements} from "./controllers/settlements";
import {requireGroupOwner} from "./middleware/requireGroupOwner";

const router = Router();

// Auth routes (no auth required)
router.post('/auth/login', login);
router.post('/auth/register', register);
router.post('/auth/logout', logout);
router.put('/auth/change-password', requireAuth, changePassword);

// User routes (auth required)
router.get('/auth/me', requireAuth, getMe);

// Group routes (auth required)
router.post('/groups', requireAuth, createGroup);
router.get('/groups', requireAuth, getUserGroups);
router.get('/groups/:groupId', requireAuth, getGroupById);
router.put('/groups/:groupId', requireAuth, editGroup);
router.post('/groups/:groupId/invite', requireAuth, inviteMultipleMembers);
router.delete("/groups/:groupId/members/me", requireAuth, exitGroup)

// Group routes (auth and group owner required)
router.delete('/groups/:groupId', requireAuth, requireGroupOwner, deleteGroup);
router.delete("/groups/:groupId/members/:memberId", requireAuth, requireGroupOwner, deleteGroupMember)
router.put("/groups/:groupId/members/:memberId/role", requireAuth, requireGroupOwner, changeGroupOwner)

// query don't need to write in the path
router.get("/groups/:groupId/available-users", requireAuth, findAvailableUsersEmail)

router.get('/groups/:groupId/expenses', requireAuth, getGroupExpenses);

// Expense routes (auth required)
router.post('/groups/:groupId/expenses', requireAuth, createExpense);
router.get('/expenses/:expenseId', requireAuth, getExpense);
router.put("/groups/:groupId/expenses/:expenseId/split", requireAuth, updateExpenseShare)
router.put("/groups/:groupId/expenses/:expenseId", requireAuth, editExpense)
router.delete("/groups/:groupId/expenses/:expenseId", requireAuth, deleteExpense)


// Settlement routes (auth required)
router.get('/balances/:groupId', requireAuth, getGroupBalances);
router.get("/settlements/:groupId", requireAuth, getGroupSettlements)
router.post('/settlements/:groupId', requireAuth, createSettlement);

export default router;
