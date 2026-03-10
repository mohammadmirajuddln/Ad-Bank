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
  Sparkles,
  Copy,
  ArrowLeft,
  Share2,
  Facebook,
  MessageCircle
} from 'lucide-react';
import { User, WithdrawalRequest, ADMIN_PASSWORD } from './types';
import { getUsers, saveUsers, getWithdrawals, saveWithdrawals, getCurrentUserId, setCurrentUserId } from './services/storage';

// --- Sound Helper ---
const playClickSound = () => {
  try {
    const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContext) return;
    
    const audioContext = new AudioContext();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();

    // Create a softer "pop" sound
    oscillator.type = 'sine';
    
    // Quick frequency drop for a "bubble" effect
    oscillator.frequency.setValueAtTime(600, audioContext.currentTime);
    oscillator.frequency.exponentialRampToValueAtTime(100, audioContext.currentTime + 0.15);
    
    // Smooth envelope with higher volume
    gainNode.gain.setValueAtTime(0, audioContext.currentTime);
    gainNode.gain.linearRampToValueAtTime(0.5, audioContext.currentTime + 0.02); // Increased from 0.15 to 0.5
    gainNode.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + 0.15); // Decay

    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);

    oscillator.start();
    oscillator.stop(audioContext.currentTime + 0.15);
  } catch (e) {
    console.error("Audio play failed", e);
  }
};

// --- Helper Components ---

const AdPlaceholder = () => (
  <div className="w-full h-24 bg-slate-800/50 rounded-xl border border-dashed border-slate-700 flex flex-col items-center justify-center my-6 relative overflow-hidden group">
    <p className="text-xs text-slate-500 uppercase tracking-widest z-10">Advertisement Space</p>
    <p className="text-[10px] text-slate-600 z-10 mt-1">Google AdSense / Custom Ad</p>
    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -skew-x-12 group-hover:animate-pulse" />
  </div>
);

const Button = ({ children, onClick, variant = 'primary', className = '', disabled = false }: any) => {
  const baseStyle = "px-4 py-3 rounded-xl font-semibold transition-all duration-300 transform active:scale-95 flex items-center justify-center gap-2 shadow-lg";
  const variants = {
    primary: "bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-cyan-500/30 hover:shadow-cyan-500/50",
    danger: "bg-gradient-to-r from-red-500 to-pink-600 text-white shadow-red-500/30",
    glass: "glass text-cyan-400 hover:bg-white/5 border border-cyan-500/30",
    secondary: "bg-slate-800 text-slate-300 hover:bg-slate-700"
  };
  
  const handleClick = (e: any) => {
    playClickSound();
    if (onClick) onClick(e);
  };
  
  return (
    <button 
      onClick={handleClick} 
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
  const [activeTab, setActiveTab] = useState<'home' | 'withdraw' | 'profile' | 'admin' | 'privacy' | 'terms'>('home');
  const [isLoading, setIsLoading] = useState(true);
  const [incomingReferralCode, setIncomingReferralCode] = useState<string | null>(null);
  const [cooldown, setCooldown] = useState(0);

  // Global cooldown timer
  useEffect(() => {
    let timer: any;
    if (cooldown > 0) {
      timer = setInterval(() => {
        setCooldown((prev) => {
          if (prev <= 1) return 0;
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [cooldown]);

  // Load user on mount and check referral
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
    
    // Check for referral code in URL
    const params = new URLSearchParams(window.location.search);
    const ref = params.get('ref');
    if (ref) setIncomingReferralCode(ref);

    setIsLoading(false);
  }, []);

  // Expose setActiveTab for deep links
  useEffect(() => {
    (window as any).setTab = setActiveTab;
  }, []);

  const handleLogin = (username: string) => {
    const users = getUsers();
    let user = users.find(u => u.username === username);
    
    if (!user) {
      // Check for valid referrer
      let referrer = null;
      if (incomingReferralCode) {
        referrer = users.find(u => u.referralCode === incomingReferralCode);
      }

      // Create new user
      user = {
        id: Date.now().toString(),
        username,
        balance: 10, // Sign-up Bonus 10 taka for everyone
        referralCode: Math.random().toString(36).substring(2, 8).toUpperCase(),
        referredBy: referrer ? incomingReferralCode : null,
        referralCount: 0,
        withdrawalCount: 0,
        isBanned: false,
        joinedAt: new Date().toISOString()
      };
      
      // Update referrer count if exists
      if (referrer) {
         const referrerIndex = users.findIndex(u => u.id === referrer!.id);
         if (referrerIndex !== -1) {
             users[referrerIndex] = {
                 ...users[referrerIndex],
                 referralCount: users[referrerIndex].referralCount + 1,
                 balance: users[referrerIndex].balance + 10 // Add 10 taka bonus to referrer
             };
         }
      }

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
        {activeTab === 'home' && (
          <HomeScreen 
            user={currentUser} 
            onUpdateBalance={updateBalance} 
            cooldown={cooldown}
            setCooldown={setCooldown}
          />
        )}
        {activeTab === 'withdraw' && <WithdrawScreen user={currentUser} onUpdateUser={setCurrentUser} />}
        {activeTab === 'profile' && <ProfileScreen user={currentUser} onLogout={handleLogout} onAdminAccess={() => setActiveTab('admin')} />}
        {activeTab === 'admin' && <AdminScreen user={currentUser} onExit={() => setActiveTab('profile')} />}
        {activeTab === 'privacy' && <PrivacyScreen onBack={() => setActiveTab('profile')} />}
        {activeTab === 'terms' && <TermsScreen onBack={() => setActiveTab('profile')} />}
      </main>

      {/* Bottom Navigation */}
      {['home', 'withdraw', 'profile'].includes(activeTab) && (
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
  <button 
    onClick={(e) => {
      playClickSound();
      if (onClick) onClick(e);
    }} 
    className={`flex flex-col items-center gap-1 transition-colors ${active ? 'text-cyan-400' : 'text-slate-500'}`}
  >
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

// --- Static Pages ---

const PrivacyScreen = ({ onBack }: { onBack: () => void }) => (
  <div className="space-y-6 pb-20">
    <div className="flex items-center gap-4">
      <Button onClick={onBack} variant="secondary" className="p-2 rounded-full"><ArrowLeft className="w-5 h-5" /></Button>
      <h2 className="text-xl font-bold">Privacy Policy</h2>
    </div>
    <div className="glass-card p-6 rounded-3xl space-y-4 text-sm text-slate-300">
      <p><strong>Last Updated:</strong> {new Date().toLocaleDateString()}</p>
      <p>Your privacy is important to us. It is Ad Bank's policy to respect your privacy regarding any information we may collect from you across our website and other sites we own and operate.</p>
      <h3 className="font-bold text-white mt-4">1. Information We Collect</h3>
      <p>We only ask for personal information when we truly need it to provide a service to you. We collect it by fair and lawful means, with your knowledge and consent.</p>
      <h3 className="font-bold text-white mt-4">2. How We Use Information</h3>
      <p>We use the collected data to manage your account, process withdrawals, and improve our services. We do not share any personally identifying information publicly or with third-parties, except when required to by law.</p>
      <h3 className="font-bold text-white mt-4">3. Cookies</h3>
      <p>We use cookies to store your preferences and settings. You are free to refuse our request for your personal information, with the understanding that we may be unable to provide you with some of your desired services.</p>
    </div>
  </div>
);

const TermsScreen = ({ onBack }: { onBack: () => void }) => (
  <div className="space-y-6 pb-20">
    <div className="flex items-center gap-4">
      <Button onClick={onBack} variant="secondary" className="p-2 rounded-full"><ArrowLeft className="w-5 h-5" /></Button>
      <h2 className="text-xl font-bold">Terms of Service</h2>
    </div>
    <div className="glass-card p-6 rounded-3xl space-y-4 text-sm text-slate-300">
      <h3 className="font-bold text-white">1. Terms</h3>
      <p>By accessing Ad Bank, you agree to be bound by these terms of service, all applicable laws and regulations, and agree that you are responsible for compliance with any applicable local laws.</p>
      <h3 className="font-bold text-white mt-4">2. Use License</h3>
      <p>Permission is granted to temporarily download one copy of the materials (information or software) on Ad Bank's website for personal, non-commercial transitory viewing only.</p>
      <h3 className="font-bold text-white mt-4">3. Disclaimer</h3>
      <p>The materials on Ad Bank's website are provided on an 'as is' basis. Ad Bank makes no warranties, expressed or implied, and hereby disclaims and negates all other warranties including, without limitation, implied warranties or conditions of merchantability.</p>
      <h3 className="font-bold text-white mt-4">4. Limitations</h3>
      <p>In no event shall Ad Bank or its suppliers be liable for any damages (including, without limitation, damages for loss of data or profit, or due to business interruption) arising out of the use or inability to use the materials on Ad Bank's website.</p>
    </div>
  </div>
);

// --- Home Screen (Scratch Cards) ---

const HomeScreen = ({ user, onUpdateBalance, cooldown, setCooldown }: { user: User, onUpdateBalance: (amount: number) => void, cooldown: number, setCooldown: (val: number) => void }) => {
  const [isScratching, setIsScratching] = useState(false);
  const [scratchedValue, setScratchedValue] = useState<number | null>(null);

  // Reset scratched value when cooldown ends
  useEffect(() => {
    if (cooldown === 0) {
      setScratchedValue(null);
    }
  }, [cooldown]);

  const handleScratch = () => {
    if (isScratching || scratchedValue !== null || cooldown > 0) return;
    
    playClickSound(); // Sound on scratch start
    setIsScratching(true);
    // Simulate API/Random logic
    setTimeout(() => {
      const reward = 1; // Fixed 1 tk
      setScratchedValue(reward);
      onUpdateBalance(reward);
      playClickSound(); // Sound on reveal
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
                <p className="font-bold text-lg">{isScratching ? 'Revealing...' : 'ক্লিক করুন'}</p>
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

      <div className="glass-card p-6 rounded-3xl space-y-4">
        <h3 className="font-bold text-lg text-white">How to Earn?</h3>
        <div className="space-y-3 text-sm text-slate-400">
          <div className="flex gap-3">
            <div className="w-8 h-8 rounded-full bg-cyan-500/20 flex items-center justify-center text-cyan-400 font-bold shrink-0">1</div>
            <div>
              <p className="text-white font-semibold">ক্লিক করুন (Scratch)</p>
              <p>প্রতি ৩০ সেকেন্ড পর পর বক্সে ক্লিক করে জিতে নিন নিশ্চিত টাকা।</p>
            </div>
          </div>
          <div className="flex gap-3">
            <div className="w-8 h-8 rounded-full bg-purple-500/20 flex items-center justify-center text-purple-400 font-bold shrink-0">2</div>
            <div>
              <p className="text-white font-semibold">Invite Friends</p>
              <p>আপনার রেফারেল লিংক শেয়ার করুন। প্রতি সফল রেফারে পাবেন ৳১০ বোনাস!</p>
            </div>
          </div>
          <div className="flex gap-3">
            <div className="w-8 h-8 rounded-full bg-green-500/20 flex items-center justify-center text-green-400 font-bold shrink-0">3</div>
            <div>
              <p className="text-white font-semibold">Withdraw Money</p>
              <p>মিনিমাম ব্যালেন্স (৳২০) হলে সরাসরি বিকাশ, নগদ বা রকেটে টাকা তুলে নিন।</p>
            </div>
          </div>
        </div>
      </div>

      <AdPlaceholder />
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
      if (amt < 20) {
        return alert("First withdrawal minimum is ৳20");
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
          placeholder="Min ৳20 (1st time)"
          value={amount}
          onChange={(e: any) => setAmount(e.target.value)}
        />

        <div className="bg-slate-900/50 p-4 rounded-xl mb-6 text-xs text-slate-400 space-y-1">
          <p>• First withdrawal min: ৳20</p>
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

    // Bonus Logic: Referrer gets 20
    const updatedUsers = users.map(u => {
      if (u.id === user.id) {
        return { ...u, referredBy: referralInput };
      }
      if (u.id === referrer.id) {
        return { ...u, referralCount: u.referralCount + 1, balance: u.balance + 10 };
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

      <div className="glass-card p-6 rounded-3xl border-dashed border-2 border-slate-700 text-center">
        <h3 className="text-sm font-bold mb-3 text-slate-300">Invite Friends & Earn</h3>
        <p className="text-xs text-slate-400 mb-4">Share your link. You get <span className="text-cyan-400 font-bold">৳10</span> per referral!</p>
        <div className="flex flex-col gap-2">
          <div className="bg-black/40 p-3 rounded-lg text-xs text-slate-400 break-all font-mono border border-slate-800">
            {`${window.location.origin}?ref=${user.referralCode}`}
          </div>
          <Button 
            onClick={() => {
              const link = `${window.location.origin}?ref=${user.referralCode}`;
              navigator.clipboard.writeText(link);
              alert("Referral link copied!");
            }} 
            variant="primary" 
            className="w-full py-2 text-sm"
          >
            <Copy className="w-4 h-4" /> Copy Referral Link
          </Button>
        </div>

        <div className="grid grid-cols-4 gap-2 mt-3">
          <button 
            onClick={() => {
              const link = `${window.location.origin}?ref=${user.referralCode}`;
              const text = `নতুন ইনকাম সাইট! সাইন আপ করলেই ১০ টাকা ফ্রি। কোনো ইনভেস্টমেন্ট লাগে না। লিংক:`;
              window.open(`https://wa.me/?text=${encodeURIComponent(text)} ${encodeURIComponent(link)}`, '_blank');
            }}
            className="p-3 bg-[#25D366]/20 text-[#25D366] rounded-xl flex justify-center items-center hover:bg-[#25D366]/30 transition-colors"
          >
            <MessageCircle className="w-5 h-5" />
          </button>
          <button 
            onClick={() => {
              const link = `${window.location.origin}?ref=${user.referralCode}`;
              window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(link)}`, '_blank');
            }}
            className="p-3 bg-[#1877F2]/20 text-[#1877F2] rounded-xl flex justify-center items-center hover:bg-[#1877F2]/30 transition-colors"
          >
            <Facebook className="w-5 h-5" />
          </button>
          <button 
            onClick={() => {
              const link = `${window.location.origin}?ref=${user.referralCode}`;
              const text = `নতুন ইনকাম সাইট! সাইন আপ করলেই ১০ টাকা ফ্রি। কোনো ইনভেস্টমেন্ট লাগে না। লিংক:`;
              window.open(`https://t.me/share/url?url=${encodeURIComponent(link)}&text=${encodeURIComponent(text)}`, '_blank');
            }}
            className="p-3 bg-[#229ED9]/20 text-[#229ED9] rounded-xl flex justify-center items-center hover:bg-[#229ED9]/30 transition-colors"
          >
            <Send className="w-5 h-5" />
          </button>
          <button 
            onClick={() => {
              const link = `${window.location.origin}?ref=${user.referralCode}`;
              const text = `নতুন ইনকাম সাইট! সাইন আপ করলেই ১০ টাকা ফ্রি। কোনো ইনভেস্টমেন্ট লাগে না। লিংক:`;
              if (navigator.share) {
                navigator.share({ title: 'Ad Bank', text: text, url: link });
              } else {
                navigator.clipboard.writeText(link);
                alert('Link copied!');
              }
            }}
            className="p-3 bg-slate-700/50 text-slate-300 rounded-xl flex justify-center items-center hover:bg-slate-700 transition-colors"
          >
            <Share2 className="w-5 h-5" />
          </button>
        </div>
      </div>
      
      <AdPlaceholder />

      <div className="flex justify-center">
        <Button 
          onClick={onAdminAccess} 
          variant="secondary" 
          className="text-xs py-2 px-6 opacity-50 hover:opacity-100"
        >
          <Lock className="w-4 h-4" />
        </Button>
      </div>

      <div className="flex justify-center gap-4 text-xs text-slate-500 pb-4">
        <button onClick={() => (window as any).setTab('privacy')} className="hover:text-cyan-400">Privacy Policy</button>
        <span>•</span>
        <button onClick={() => (window as any).setTab('terms')} className="hover:text-cyan-400">Terms of Service</button>
      </div>
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
        <div className="flex justify-between items-center">
          <h3 className="font-bold text-sm text-slate-500 uppercase">User Management</h3>
          <span className="text-xs bg-slate-800 px-2 py-1 rounded text-cyan-400">Total: {users.length}</span>
        </div>
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
