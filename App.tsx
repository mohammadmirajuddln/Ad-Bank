import React, { useState, useEffect, useCallback } from 'react';
import { 
  Home, 
  Wallet, 
  User as UserIcon, 
  LogOut, 
  CreditCard, 
  Send, 
  ShieldAlert, 
  Trash2, 
  CheckCircle,
  XCircle,
  Lock,
  Menu,
  Sparkles
} from 'lucide-react';
import { User, WithdrawalRequest, ADMIN_PASSWORD } from './types';
import { getUsers, saveUsers, getWithdrawals, saveWithdrawals, getCurrentUserId, setCurrentUserId } from './services/storage';

// --- Helper Components ---

const Button = ({ children, onClick, variant = 'primary', className = '', disabled = false }: any) => {
  const baseStyle = "px-4 py-3 rounded-xl font-semibold transition-all duration-300 transform active:scale-95 flex items-center justify-center gap-2 shadow-lg";
  const variants = {
    primary: "bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-cyan-500/30 hover:shadow-cyan-500/50",
    danger: "bg-gradient-to-r from-red-500 to-pink-600 text-white shadow-red-500/30",
    glass: "glass text-cyan-400 hover:bg-white/5 border border-cyan-500/30",
    secondary: "bg-slate-800 text-slate-300 hover:bg-slate-700"
  };
  
  return (
    <button 
      onClick={onClick} 
      disabled={disabled}
      className={`${baseStyle} ${variants[variant as keyof typeof variants]} ${disabled ? 'opacity-50 cursor-not-allowed' : ''} ${className}`}
    >
      {children}
    </button>
  );
};

const Input = ({ label, ...props }: any) => (
  <div className="mb-4">
    <label className="block text-xs font-medium text-cyan-400 mb-1 ml-1 tracking-wider uppercase">{label}</label>
    <input 
      {...props}
      className="w-full bg-black/40 border border-cyan-500/30 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 transition-all placeholder-slate-600"
    />
  </div>
);

// --- Particle Effect Background ---
const Particles = () => {
  return (
    <div className="fixed inset-0 pointer-events-none z-[-1] overflow-hidden">
      {[...Array(20)].map((_, i) => (
        <div
          key={i}
          className="absolute rounded-full bg-cyan-500/10 blur-xl animate-pulse-slow"
          style={{
            top: `${Math.random() * 100}%`,
            left: `${Math.random() * 100}%`,
            width: `${Math.random() * 300 + 50}px`,
            height: `${Math.random() * 300 + 50}px`,
            animationDelay: `${Math.random() * 5}s`,
            transform: `scale(${Math.random() * 1.5})`,
          }}
        />
      ))}
    </div>
  );
};

// --- Main App Component ---

export default function App() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [activeTab, setActiveTab] = useState<'home' | 'withdraw' | 'profile' | 'admin'>('home');
  const [isLoading, setIsLoading] = useState(true);

  // Load user on mount
  useEffect(() => {
    const userId = getCurrentUserId();
    if (userId) {
      const users = getUsers();
      const user = users.find(u => u.id === userId);
      if (user && !user.isBanned) {
        setCurrentUser(user);
      } else {
        setCurrentUserId(null);
      }
    }
    setIsLoading(false);
  }, []);

  const handleLogin = (username: string) => {
    const users = getUsers();
    let user = users.find(u => u.username === username);
    
    if (!user) {
      // Create new user
      user = {
        id: Date.now().toString(),
        username,
        balance: 0,
        referralCode: Math.random().toString(36).substring(2, 8).toUpperCase(),
        referredBy: null,
        referralCount: 0,
        withdrawalCount: 0,
        isBanned: false,
        joinedAt: new Date().toISOString()
      };
      users.push(user);
      saveUsers(users);
    }

    if (user.isBanned) {
      alert("This account has been banned.");
      return;
    }

    setCurrentUser(user);
    setCurrentUserId(user.id);
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setCurrentUserId(null);
    setActiveTab('home');
  };

  const updateBalance = (amount: number) => {
    if (!currentUser) return;
    const users = getUsers();
    const updatedUsers = users.map(u => {
      if (u.id === currentUser.id) {
        return { ...u, balance: u.balance + amount };
      }
      return u;
    });
    saveUsers(updatedUsers);
    setCurrentUser(updatedUsers.find(u => u.id === currentUser.id) || null);
  };

  if (isLoading) return <div className="min-h-screen flex items-center justify-center bg-black text-cyan-500">Loading...</div>;

  if (!currentUser) {
    return <AuthScreen onLogin={handleLogin} />;
  }

  return (
    <div className="min-h-screen relative font-sans text-white pb-24">
      <Particles />
      
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-40 glass px-6 py-4 flex justify-between items-center">
        <h1 className="text-2xl font-bold bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent flex items-center gap-2">
          <Sparkles className="w-6 h-6 text-cyan-400" />
          Ad Bank
        </h1>
        <div className="flex items-center gap-3">
          <div className="bg-slate-900/50 px-3 py-1 rounded-full border border-cyan-500/20 text-sm font-mono text-cyan-400">
            ৳ {currentUser.balance.toFixed(2)}
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="pt-24 px-6 max-w-md mx-auto">
        {activeTab === 'home' && <HomeScreen user={currentUser} onUpdateBalance={updateBalance} />}
        {activeTab === 'withdraw' && <WithdrawScreen user={currentUser} onUpdateUser={setCurrentUser} />}
        {activeTab === 'profile' && <ProfileScreen user={currentUser} onLogout={handleLogout} onAdminAccess={() => setActiveTab('admin')} />}
        {activeTab === 'admin' && <AdminScreen user={currentUser} onExit={() => setActiveTab('profile')} />}
      </main>

      {/* Bottom Navigation */}
      {activeTab !== 'admin' && (
        <nav className="fixed bottom-0 left-0 right-0 glass px-6 py-4 z-50 rounded-t-3xl border-t border-cyan-500/20">
          <div className="flex justify-around items-center max-w-md mx-auto">
            <NavButton icon={<Home />} label="Home" active={activeTab === 'home'} onClick={() => setActiveTab('home')} />
            <div className="relative -top-8">
              <button 
                onClick={() => setActiveTab('withdraw')}
                className={`w-16 h-16 rounded-full flex items-center justify-center shadow-lg shadow-cyan-500/40 transition-transform hover:scale-105 ${activeTab === 'withdraw' ? 'bg-gradient-to-r from-cyan-400 to-blue-500 text-white' : 'glass text-cyan-400'}`}
              >
                <Wallet className="w-8 h-8" />
              </button>
            </div>
            <NavButton icon={<UserIcon />} label="Profile" active={activeTab === 'profile'} onClick={() => setActiveTab('profile')} />
          </div>
        </nav>
      )}
    </div>
  );
}

const NavButton = ({ icon, label, active, onClick }: any) => (
  <button onClick={onClick} className={`flex flex-col items-center gap-1 transition-colors ${active ? 'text-cyan-400' : 'text-slate-500'}`}>
    {React.cloneElement(icon, { size: 24 })}
    <span className="text-[10px] font-medium tracking-wide">{label}</span>
  </button>
);

// --- Auth Screen ---

const AuthScreen = ({ onLogin }: { onLogin: (username: string) => void }) => {
  const [username, setUsername] = useState('');

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 relative overflow-hidden">
      <Particles />
      <div className="glass-card w-full max-w-sm p-8 rounded-3xl relative z-10">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-gradient-to-tr from-cyan-500 to-blue-600 rounded-2xl mx-auto flex items-center justify-center shadow-lg shadow-cyan-500/40 mb-4 transform rotate-3">
            <Sparkles className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold mb-2">Welcome to Ad Bank</h1>
          <p className="text-slate-400 text-sm">Earn rewards and withdraw instantly</p>
        </div>
        <Input 
          label="Username" 
          placeholder="Enter your username" 
          value={username} 
          onChange={(e: any) => setUsername(e.target.value)} 
        />
        <Button onClick={() => username && onLogin(username)} className="w-full">
          Get Started
        </Button>
      </div>
    </div>
  );
};

// --- Home Screen (Scratch Cards) ---

const HomeScreen = ({ user, onUpdateBalance }: { user: User, onUpdateBalance: (amount: number) => void }) => {
  const [isScratching, setIsScratching] = useState(false);
  const [scratchedValue, setScratchedValue] = useState<number | null>(null);
  const [cooldown, setCooldown] = useState(0);

  useEffect(() => {
    let timer: any;
    if (cooldown > 0) {
      timer = setInterval(() => {
        setCooldown((prev) => {
          if (prev <= 1) {
            setScratchedValue(null);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [cooldown]);

  const handleScratch = () => {
    if (isScratching || scratchedValue !== null || cooldown > 0) return;
    
    setIsScratching(true);
    // Simulate API/Random logic
    setTimeout(() => {
      const reward = 1; // Fixed 1 tk
      setScratchedValue(reward);
      onUpdateBalance(reward);
      setCooldown(30);
      setIsScratching(false);
    }, 1500);
  };

  return (
    <div className="space-y-6">
      <div className="glass-card p-6 rounded-3xl text-center relative overflow-hidden">
        
        <div className="relative h-48 w-full bg-slate-800 rounded-2xl overflow-hidden flex items-center justify-center cursor-pointer group" onClick={handleScratch}>
          {scratchedValue !== null ? (
            <div className="text-center animate-bounce">
              <p className="text-slate-400 text-sm mb-1">You Won</p>
              <h3 className="text-4xl font-bold text-cyan-400">৳{scratchedValue}</h3>
            </div>
          ) : (
            <>
              <div className={`absolute inset-0 bg-gradient-to-br from-cyan-600 to-blue-700 transition-opacity duration-700 ${isScratching ? 'opacity-0' : 'opacity-100'}`} />
              <div className="relative z-10 flex flex-col items-center">
                <Sparkles className={`w-10 h-10 text-white mb-2 ${isScratching ? 'animate-spin' : 'animate-pulse'}`} />
                <p className="font-bold text-lg">{isScratching ? 'Revealing...' : 'Tap to Scratch'}</p>
              </div>
            </>
          )}
        </div>
        
        {cooldown > 0 && (
           <div className="mt-4 text-cyan-400 font-mono text-sm">
             Next scratch in {cooldown}s
           </div>
        )}
      </div>
    </div>
  );
};

// --- Withdraw Screen ---

const WithdrawScreen = ({ user, onUpdateUser }: { user: User, onUpdateUser: (u: User) => void }) => {
  const [amount, setAmount] = useState('');
  const [method, setMethod] = useState<'bKash' | 'Nagad' | 'Rocket'>('bKash');
  const [number, setNumber] = useState('');
  
  const handleWithdraw = () => {
    const amt = parseFloat(amount);
    if (isNaN(amt) || amt <= 0) return alert("Invalid amount");
    if (user.balance < amt) return alert("Insufficient balance");
    if (!number) return alert("Enter account number");

    // Logic from requirements
    if (user.withdrawalCount === 0) {
      // First time rules
      if (amt < 10) {
        return alert("First withdrawal minimum is ৳10");
      }
    } else {
      // Subsequent rules
      if (amt < 500) {
        return alert("Minimum withdrawal is ৳500 for subsequent requests");
      }
      if (user.referralCount < 3) {
        return alert(`You need 3 referrals for subsequent withdrawals. Current: ${user.referralCount}`);
      }
    }

    // Process Withdrawal
    const newRequest: WithdrawalRequest = {
      id: Date.now().toString(),
      userId: user.id,
      username: user.username,
      method,
      number,
      amount: amt,
      status: 'pending',
      date: new Date().toLocaleDateString()
    };

    const existingRequests = getWithdrawals();
    saveWithdrawals([newRequest, ...existingRequests]);

    // Update User
    const users = getUsers();
    const updatedUser = { 
      ...user, 
      balance: user.balance - amt,
      withdrawalCount: user.withdrawalCount + 1 
    };
    
    const updatedUsers = users.map(u => u.id === user.id ? updatedUser : u);
    saveUsers(updatedUsers);
    onUpdateUser(updatedUser);

    // Mock Telegram Notification
    console.log(`TELEGRAM SENT: New Withdrawal Request from ${user.username} for ৳${amt} via ${method}`);
    alert("Withdrawal request submitted successfully!");
    setAmount('');
  };

  return (
    <div className="space-y-6">
      <div className="glass-card p-6 rounded-3xl">
        <h2 className="text-xl font-bold mb-6 text-center">Withdraw Funds</h2>
        
        <div className="grid grid-cols-3 gap-3 mb-6">
          {['bKash', 'Nagad', 'Rocket'].map((m) => (
            <button
              key={m}
              onClick={() => setMethod(m as any)}
              className={`py-3 rounded-xl text-sm font-semibold border ${
                method === m 
                  ? 'bg-cyan-500/20 border-cyan-500 text-cyan-400' 
                  : 'border-slate-700 text-slate-500 hover:border-slate-600'
              }`}
            >
              {m}
            </button>
          ))}
        </div>

        <Input 
          label="Account Number" 
          placeholder={`Enter ${method} number`}
          value={number}
          onChange={(e: any) => setNumber(e.target.value)}
        />
        
        <Input 
          label="Amount" 
          type="number" 
          placeholder="Min ৳10 (1st time)"
          value={amount}
          onChange={(e: any) => setAmount(e.target.value)}
        />

        <div className="bg-slate-900/50 p-4 rounded-xl mb-6 text-xs text-slate-400 space-y-1">
          <p>• First withdrawal min: ৳10</p>
          <p>• Subsequent: Min ৳500 + 3 Referrals</p>
        </div>

        <Button onClick={handleWithdraw} className="w-full">
          Withdraw Request
        </Button>
      </div>
    </div>
  );
};

// --- Profile Screen ---

const ProfileScreen = ({ user, onLogout, onAdminAccess }: any) => {
  const [referralInput, setReferralInput] = useState('');

  const handleClaimReferral = () => {
    if (user.referredBy) return alert("Already claimed referral bonus");
    if (referralInput === user.referralCode) return alert("Cannot use your own code");

    const users = getUsers();
    const referrer = users.find(u => u.referralCode === referralInput);

    if (!referrer) return alert("Invalid referral code");

    // Bonus Logic: User gets 5, Referrer gets credit
    const updatedUsers = users.map(u => {
      if (u.id === user.id) {
        return { ...u, balance: u.balance + 5, referredBy: referralInput };
      }
      if (u.id === referrer.id) {
        return { ...u, referralCount: u.referralCount + 1 };
      }
      return u;
    });

    saveUsers(updatedUsers);
    window.location.reload(); // Simple reload to refresh state for demo
  };

  return (
    <div className="space-y-6">
      <div className="text-center pt-4">
        <div className="w-20 h-20 bg-slate-800 rounded-full mx-auto flex items-center justify-center border-2 border-cyan-500 relative">
          <UserIcon className="w-10 h-10 text-slate-300" />
          {/* Secret Admin Trigger */}
          <button 
            onClick={onAdminAccess} 
            className="absolute -top-1 -right-1 w-6 h-6 bg-transparent rounded-full"
            aria-label="Secret Admin"
          />
        </div>
        <h2 className="text-2xl font-bold mt-3">{user.username}</h2>
        <p className="text-cyan-400 font-mono tracking-wider">CODE: {user.referralCode}</p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="glass-card p-4 rounded-2xl text-center">
          <p className="text-xs text-slate-400 uppercase">Referrals</p>
          <p className="text-2xl font-bold">{user.referralCount}</p>
        </div>
        <div className="glass-card p-4 rounded-2xl text-center">
          <p className="text-xs text-slate-400 uppercase">Withdrawn</p>
          <p className="text-2xl font-bold">{user.withdrawalCount}</p>
        </div>
      </div>

      {!user.referredBy && (
        <div className="glass-card p-6 rounded-3xl border-dashed border-2 border-slate-700">
          <h3 className="text-sm font-bold mb-3 text-slate-300">Have a referral code?</h3>
          <div className="flex gap-2">
            <input 
              value={referralInput}
              onChange={(e) => setReferralInput(e.target.value)}
              placeholder="Enter code"
              className="flex-1 bg-black/40 border border-slate-700 rounded-lg px-3 text-sm focus:outline-none focus:border-cyan-500"
            />
            <Button onClick={handleClaimReferral} variant="secondary" className="py-2 text-sm">
              Claim ৳5
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

// --- Admin Screen ---

const AdminScreen = ({ user, onExit }: any) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  const [users, setUsers] = useState<User[]>([]);
  const [requests, setRequests] = useState<WithdrawalRequest[]>([]);

  useEffect(() => {
    if (isAuthenticated) {
      setUsers(getUsers());
      setRequests(getWithdrawals());
    }
  }, [isAuthenticated]);

  const handleLogin = () => {
    if (password === ADMIN_PASSWORD) {
      setIsAuthenticated(true);
    } else {
      alert("Access Denied");
    }
  };

  const handleBan = (targetId: string) => {
    const updated = users.map(u => u.id === targetId ? { ...u, isBanned: !u.isBanned } : u);
    setUsers(updated);
    saveUsers(updated);
  };

  const handleDeleteRequest = (reqId: string) => {
    const updated = requests.filter(r => r.id !== reqId);
    setRequests(updated);
    saveWithdrawals(updated);
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center">
        <div className="glass-card p-8 rounded-3xl w-full">
          <div className="flex justify-center mb-6">
             <Lock className="w-12 h-12 text-red-500" />
          </div>
          <Input 
            type="password" 
            label="Admin Password" 
            value={password} 
            onChange={(e: any) => setPassword(e.target.value)} 
          />
          <div className="flex gap-3">
            <Button onClick={onExit} variant="secondary" className="flex-1">Back</Button>
            <Button onClick={handleLogin} className="flex-1">Unlock</Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-20">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-red-400">Admin Panel</h2>
        <Button onClick={onExit} variant="secondary" className="py-1 px-3 text-xs">Exit</Button>
      </div>

      <div className="space-y-4">
        <h3 className="font-bold text-sm text-slate-500 uppercase">Withdrawal Requests</h3>
        {requests.length === 0 ? <p className="text-slate-600 text-sm">No pending requests</p> : (
          requests.map(req => (
            <div key={req.id} className="glass-card p-4 rounded-xl flex justify-between items-center">
              <div>
                <p className="font-bold text-sm text-white">{req.username}</p>
                <p className="text-xs text-cyan-400">{req.method}: {req.number}</p>
                <p className="text-lg font-bold">৳{req.amount}</p>
              </div>
              <button onClick={() => handleDeleteRequest(req.id)} className="p-2 bg-red-500/10 text-red-500 rounded-lg hover:bg-red-500/20">
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))
        )}
      </div>

      <div className="space-y-4">
        <h3 className="font-bold text-sm text-slate-500 uppercase">User Management</h3>
        {users.map(u => (
          <div key={u.id} className="glass-card p-4 rounded-xl flex justify-between items-center">
            <div>
              <p className="font-bold text-sm">{u.username}</p>
              <p className="text-xs text-slate-400">Bal: ৳{u.balance} | Refs: {u.referralCount}</p>
            </div>
            <button 
              onClick={() => handleBan(u.id)} 
              className={`px-3 py-1 rounded text-xs font-bold ${u.isBanned ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}
            >
              {u.isBanned ? 'Unban' : 'Ban'}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};
