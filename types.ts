export interface User {
  id: string;
  username: string;
  balance: number;
  referralCode: string;
  referredBy: string | null;
  referralCount: number;
  withdrawalCount: number;
  isBanned: boolean;
  joinedAt: string;
}

export interface WithdrawalRequest {
  id: string;
  userId: string;
  username: string;
  method: 'bKash' | 'Nagad' | 'Rocket';
  number: string;
  amount: number;
  status: 'pending' | 'approved' | 'rejected';
  date: string;
}

export interface ScratchCard {
  id: string;
  value: number;
  isScratched: boolean;
  color: string;
}

export const ADMIN_PASSWORD = 'mdmiraj%';