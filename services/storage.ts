import { User, WithdrawalRequest } from '../types';

const USERS_KEY = 'adbank_users';
const REQUESTS_KEY = 'adbank_withdrawals';
const CURRENT_USER_KEY = 'adbank_current_user_id';

export const getUsers = (): User[] => {
  const data = localStorage.getItem(USERS_KEY);
  return data ? JSON.parse(data) : [];
};

export const saveUsers = (users: User[]) => {
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
};

export const getWithdrawals = (): WithdrawalRequest[] => {
  const data = localStorage.getItem(REQUESTS_KEY);
  return data ? JSON.parse(data) : [];
};

export const saveWithdrawals = (requests: WithdrawalRequest[]) => {
  localStorage.setItem(REQUESTS_KEY, JSON.stringify(requests));
};

export const getCurrentUserId = (): string | null => {
  return localStorage.getItem(CURRENT_USER_KEY);
};

export const setCurrentUserId = (id: string | null) => {
  if (id) {
    localStorage.setItem(CURRENT_USER_KEY, id);
  } else {
    localStorage.removeItem(CURRENT_USER_KEY);
  }
};