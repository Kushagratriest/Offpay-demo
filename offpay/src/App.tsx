import { useState, useRef, useEffect } from "react";
import {
  IconWallet, IconArrowsRightLeft, IconQrcode, IconUserPlus,
  IconHandStop, IconBuildingBank, IconUsersGroup,
  IconFingerprint, IconShieldLock, IconCurrencyRupee,
  IconReceiptOff, IconBluetoothOff, IconUsersPlus,
} from "@tabler/icons-react";
import {
  Wallet, QrCode, Search, User, ChevronRight, Landmark,
  HelpCircle, BookOpen, X, House, Copy, Plus,
  Settings, ShieldCheck, LifeBuoy, Languages, History,
  UserCog, ArrowLeft, ChevronDown, Delete, CreditCard,
  Umbrella, Share2, Bluetooth, Phone, Zap, Tv2, Droplets,
  Flame, Wifi, CheckCircle2, Moon, Sun, Monitor,
  Clock, XCircle, AlertCircle, WifiOff, Bell, BellOff,
  ShieldAlert, ArrowRightLeft, RefreshCw,
} from "lucide-react";

// ─── Rupee icon — wraps Tabler's IconCurrencyRupee (correct ₹ U+20B9 glyph) ──
function RupeeIcon({ size = 24, color = "currentColor", strokeWidth = 1.75 }: { size?: number; color?: string; strokeWidth?: number }) {
  return <IconCurrencyRupee size={size} color={color} stroke={strokeWidth} />;
}

// ─── User identity (single source of truth) ───────────────────────────────────
const USER_NAME   = "Kush";
const USER_HANDLE = "@kush";

// ─── Palette — all values are CSS custom properties ──────────────────────────
// Themes are defined in src/index.css via :root and .theme-light
const P = {
  bg:           "var(--c-bg)",
  surface:      "var(--c-surface)",
  border:       "var(--c-border)",
  borderStrong: "var(--c-border-str)",
  textPrimary:  "var(--c-text-pri)",
  textSecondary:"var(--c-text-sec)",
  gold:         "var(--c-gold)",
  goldDark:     "var(--c-gold-dark)",
};

// ─── Theme type ───────────────────────────────────────────────────────────────
type Theme = "dark" | "light" | "system";

// ─── Screen type ──────────────────────────────────────────────────────────────
const NAV_TABS = [
  { key: "home",    icon: House, label: "Home" },
  { key: "money",   icon: RupeeIcon, label: "Money" },
  { key: "profile", icon: User,  label: "Profile" },
] as const;
type NavKey = (typeof NAV_TABS)[number]["key"];
type Screen =
  | NavKey
  | "addWallet" | "addWalletSuccess"
  | "sendUPI" | "showQR" | "sendPhone" | "requestMoney"
  | "billsRecharge" | "billForm"
  | "walletCircle" | "settings" | "txDetail" | "notifications";

// ─── Avatar / chip initials palette ──────────────────────────────────────────
// Raw hex values used only where a concrete color is needed (e.g. CircleMember.color stored in state).
// For inline `color:` styles prefer avatarColor() which resolves via CSS vars so light/dark themes apply.
const AVATAR_COLORS = ["#C9A857","#B8785A","#8A9678","#7A8B99","#A67B8B","#B8934A"];
const avatarColor = (i: number) => `var(--av-${i % 6})`;

// ─── Static data ──────────────────────────────────────────────────────────────
const ACTIONS: { icon: React.ElementType; label: string; screen: Screen }[] = [
  { icon: IconWallet,          label: "Add to Wallet",      screen: "addWallet" },
  { icon: IconArrowsRightLeft, label: "Send to Bank / UPI", screen: "sendUPI" },
  { icon: IconQrcode,          label: "Show QR",            screen: "showQR" },
  { icon: IconUserPlus,        label: "Send to Phone",      screen: "sendPhone" },
  { icon: IconHandStop,        label: "Request Money",      screen: "requestMoney" },
  { icon: IconBuildingBank,    label: "Bills & Recharge",   screen: "billsRecharge" },
];

const TIPS: { icon: React.ElementType; text: string; screen: Screen }[] = [
  { icon: IconFingerprint,  text: "Enable biometric login for faster, safer access",    screen: "settings" },
  { icon: IconUsersGroup,   text: "Set a spending limit on your Wallet Circle",          screen: "walletCircle" },
  { icon: IconBuildingBank, text: "Add a backup bank account for seamless transfers",    screen: "settings" },
  { icon: IconShieldLock,   text: "Turn on 2FA for an extra layer of security",          screen: "settings" },
];

const BALANCES = {
  wallet: { label: "Wallet Balance" },
  bank:   { label: "Bank Balance" },
} as const;
type BalanceKey = keyof typeof BALANCES;

const GRID_HEIGHT = 206;

const BANK_ACCOUNTS = [
  { id: "hdfc",  name: "HDFC Bank",  balance: 108340 },
  { id: "icici", name: "ICICI Bank", balance: 32180  },
];
const WALLET_ACCOUNTS_STATIC = [
  { id: "hdfc-w",  name: "HDFC Wallet" },
  { id: "icici-w", name: "ICICI Wallet", balance: 1880 },
];
const MORE_SERVICES = [
  { icon: CreditCard, label: "Personal Loan" },
  { icon: Landmark,   label: "Connect Bank (NBFC Partners)" },
  { icon: Umbrella,   label: "Insurance" },
];
const SETTINGS_ROWS = [
  { icon: Settings,    label: "Settings"        },
  { icon: UserCog,     label: "Manage Account"  },
  { icon: ShieldCheck, label: "Security"        },
  { icon: LifeBuoy,    label: "Get Help"        },
  { icon: Languages,   label: "Language"        },
];

interface TxEntry  { name: string; amount: string; credit: boolean; }
interface TxMonth  { month: string; total: string; transactions: TxEntry[]; }

// ─── Notification data ────────────────────────────────────────────────────────
type NotifType = "payment" | "settled" | "security" | "system";
interface Notif { id: string; type: NotifType; title: string; body: string; time: string; read: boolean; }
const NOTIF_ICONS: Record<NotifType, React.ElementType> = {
  payment:  ArrowRightLeft,
  settled:  CheckCircle2,
  security: ShieldAlert,
  system:   Bell,
};
const NOTIF_COLORS: Record<NotifType, string> = {
  payment:  "#C9A857",
  settled:  "#5B9B6B",
  security: "#C0564A",
  system:   "#7A8B99",
};
const INITIAL_NOTIFS: Notif[] = [
  { id: "n1", type: "payment",  title: "₹2,400 received from Priya Sharma",    body: "Bluetooth transfer settled to your wallet.",             time: "2 min ago",  read: false },
  { id: "n2", type: "settled",  title: "Settlement complete",                  body: "Oct transfer of ₹5,000 to HDFC Bank is settled.",        time: "1 hr ago",   read: false },
  { id: "n3", type: "security", title: "New device login detected",            body: "A new device signed in from Mumbai. Not you? Secure now.", time: "3 hrs ago",  read: false },
  { id: "n4", type: "payment",  title: "₹800 sent to Rahul Mehta",             body: "UPI transfer processed via HDFC Bank.",                  time: "Yesterday",  read: true  },
  { id: "n5", type: "settled",  title: "September statement ready",            body: "Your monthly statement is ready to view.",                time: "2 days ago", read: true  },
  { id: "n6", type: "system",   title: "OffPay updated to v2.4",               body: "New features: Bills & Recharge, Wallet Circle limits.",  time: "3 days ago", read: true  },
];

// ─── Transaction detail data ──────────────────────────────────────────────────
type TxStatus = "Settled" | "Pending" | "Failed";
interface TxDetailData {
  name: string; amount: string; credit: boolean;
  status: TxStatus; datetime: string; txnId: string;
  paymentMethod: string; bankRef?: string;
}
const TX_STATUSES: TxStatus[] = ["Settled","Settled","Settled","Settled","Pending","Failed"];
const TX_TIMES = ["9:14 AM","11:32 AM","2:05 PM","4:47 PM","7:21 PM","10:03 AM","1:18 PM","3:55 PM"];
const TX_ID_CHARS = "ABCDEFGHJKLMNPQRUVWXYZ0123456789";
const makeTxDetail = (tx: TxEntry, month: string, idx: number): TxDetailData => {
  const status = TX_STATUSES[idx % TX_STATUSES.length];
  const day    = String(1 + (idx * 4) % 27).padStart(2, "0");
  const mon    = month.split(" ")[0].slice(0, 3);
  const yr     = month.split(" ")[1];
  const txnId  = "OP" + Array.from({ length: 8 }, (_, k) => TX_ID_CHARS[(idx * 11 + k * 7) % TX_ID_CHARS.length]).join("");
  return {
    name: tx.name, amount: tx.amount, credit: tx.credit, status,
    datetime: `${day} ${mon} ${yr} · ${TX_TIMES[idx % TX_TIMES.length]}`,
    txnId,
    paymentMethod: tx.credit ? "Bluetooth Transfer" : idx % 2 === 0 ? "UPI Transfer" : "Bank Transfer",
    bankRef: status === "Settled" ? "HDFC" + String(9000000000 + idx * 123456789).slice(-9) : undefined,
  };
};

const TX_DATA: TxMonth[] = [
  { month: "September 2026", total: "₹12,450.00", transactions: [
    { name: "Rajesh Kumar",    amount: "₹3,200.00", credit: false },
    { name: "Swiggy",          amount: "₹480.00",   credit: false },
    { name: "Jio Recharge",    amount: "₹299.00",   credit: false },
    { name: "Ananya Sharma",   amount: "₹1,500.00", credit: true  },
  ]},
  { month: "August 2026", total: "₹9,820.00", transactions: [
    { name: "HDFC Bank Transfer", amount: "₹5,000.00", credit: false },
    { name: "Zomato",             amount: "₹640.00",   credit: false },
    { name: "Priya Mehta",        amount: "₹800.00",   credit: true  },
    { name: "BSES Electricity",   amount: "₹1,240.00", credit: false },
  ]},
  { month: "July 2026", total: "₹15,340.00", transactions: [
    { name: "Vikram Nair",    amount: "₹6,000.00", credit: false },
    { name: "Amazon",         amount: "₹2,199.00", credit: false },
    { name: "Airtel Postpaid",amount: "₹749.00",   credit: false },
    { name: "Sunita Rao",     amount: "₹2,500.00", credit: true  },
  ]},
  { month: "June 2026", total: "₹7,200.00", transactions: [
    { name: "Meena Stores", amount: "₹890.00",   credit: false },
    { name: "Ola Cab",      amount: "₹340.00",   credit: false },
    { name: "Ravi Kumar",   amount: "₹1,200.00", credit: true  },
  ]},
];
const SORT_OPTIONS = [
  { key: "recent", label: "Recent"        },
  { key: "last1",  label: "Last Month"    },
  { key: "last3",  label: "Last 3 Months" },
  { key: "high",   label: "Highest Spend" },
  { key: "low",    label: "Lowest Spend"  },
];
const CORRECT_PIN = "1234";
const BILL_CATEGORIES = [
  { icon: Phone,    label: "Mobile Recharge", id: "mobile"      },
  { icon: Zap,      label: "Electricity",     id: "electricity" },
  { icon: Tv2,      label: "DTH / Cable",     id: "dth"         },
  { icon: Droplets, label: "Water",           id: "water"       },
  { icon: Flame,    label: "Gas",             id: "gas"         },
  { icon: Wifi,     label: "Broadband",       id: "broadband"   },
];
const RECENT_CONTACTS = [
  { name: "Rajesh K.", initials: "RK" },
  { name: "Ananya S.", initials: "AS" },
  { name: "Priya M.",  initials: "PM" },
  { name: "Vikram N.", initials: "VN" },
  { name: "Sunita R.", initials: "SR" },
];
const NEARBY_USERS = [
  { name: "Rahul Verma",  device: "iPhone 14",   distance: "~2m" },
  { name: "Divya Pillai", device: "Pixel 8",     distance: "~4m" },
  { name: "Arjun Menon",  device: "Samsung S24", distance: "~7m" },
];
const MOBILE_OPERATORS = ["Jio","Airtel","Vi (Vodafone Idea)","BSNL"];
const FREQUENT_BUSINESSES = [
  { name: "Swiggy",          initials: "SW" },
  { name: "Local Chai Wala", initials: "CW" },
  { name: "Jio Recharge",    initials: "JR" },
  { name: "Zomato",          initials: "ZO" },
  { name: "Metro Card",      initials: "MC" },
];

interface CircleMember { name: string; initials: string; color: string; amount: string; limit?: string; }
const INITIAL_CIRCLE_MEMBERS: CircleMember[] = [];

// ─── Shared primitives ────────────────────────────────────────────────────────

function SectionLabel({ children }: { children: string }) {
  return <div style={{ fontSize: 16, fontWeight: 600, color: P.textPrimary, marginBottom: 12, fontFamily: "'Inter', sans-serif" }}>{children}</div>;
}

function BackHeader({ onBack, title }: { onBack: () => void; title: string }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "16px 16px 0" }}>
      <button onClick={onBack} style={{ width: 36, height: 36, borderRadius: "50%", backgroundColor: P.surface, border: `1px solid ${P.border}`, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", outline: "none", flexShrink: 0 }}>
        <ArrowLeft size={18} color={P.textPrimary as string} strokeWidth={2} />
      </button>
      <span style={{ fontFamily: "'Fraunces', serif", fontSize: 20, fontWeight: 700, color: P.textPrimary }}>{title}</span>
    </div>
  );
}

function TextInput({ label, placeholder, value, onChange, prefix, type = "text" }: { label?: string; placeholder: string; value: string; onChange: (v: string) => void; prefix?: string; type?: string }) {
  return (
    <div style={{ marginBottom: 16 }}>
      {label && <div style={{ fontSize: 13, fontWeight: 500, color: P.textSecondary, marginBottom: 6 }}>{label}</div>}
      <div style={{ display: "flex", alignItems: "center", backgroundColor: P.surface, border: `1px solid ${P.border}`, borderRadius: 12, height: 48, overflow: "hidden" }}>
        {prefix && <div style={{ paddingLeft: 14, paddingRight: 10, fontSize: 15, color: P.textSecondary, fontFamily: "'Inter', sans-serif", whiteSpace: "nowrap" }}>{prefix}</div>}
        <input type={type} placeholder={placeholder} value={value} onChange={(e) => onChange(e.target.value)}
          style={{ flex: 1, background: "transparent", border: "none", outline: "none", fontSize: 15, color: P.textPrimary, fontFamily: "'Inter', sans-serif", paddingLeft: prefix ? 0 : 14, paddingRight: 14, caretColor: P.gold as string }} />
      </div>
    </div>
  );
}

function SelectInput({ label, value, onChange, options }: { label: string; value: string; onChange: (v: string) => void; options: string[] }) {
  return (
    <div style={{ marginBottom: 16 }}>
      <div style={{ fontSize: 13, fontWeight: 500, color: P.textSecondary, marginBottom: 6 }}>{label}</div>
      <div style={{ position: "relative" }}>
        <select value={value} onChange={(e) => onChange(e.target.value)}
          style={{ width: "100%", height: 48, backgroundColor: P.surface, border: `1px solid ${P.border}`, borderRadius: 12, fontSize: 15, color: value ? P.textPrimary : P.textSecondary, fontFamily: "'Inter', sans-serif", paddingLeft: 14, paddingRight: 36, outline: "none", cursor: "pointer", appearance: "none", WebkitAppearance: "none" }}
        >
          <option value="">Select…</option>
          {options.map((o) => <option key={o} value={o}>{o}</option>)}
        </select>
        <ChevronDown size={14} color={P.textSecondary as string} style={{ position: "absolute", right: 14, top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }} />
      </div>
    </div>
  );
}

function GoldButton({ label, disabled, onClick }: { label: string; disabled?: boolean; onClick?: () => void }) {
  const [hov, setHov] = useState(false);
  return (
    <button onClick={onClick} disabled={disabled}
      onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
      style={{ width: "100%", height: 52, backgroundColor: disabled ? P.border : hov ? P.goldDark : P.gold, border: "none", borderRadius: 14, fontSize: 16, fontWeight: 600, color: disabled ? P.textSecondary : P.bg, cursor: disabled ? "not-allowed" : "pointer", fontFamily: "'Inter', sans-serif", transition: "background-color 150ms ease", outline: "none" }}
    >{label}</button>
  );
}

function OutlineBtn({ label, icon: Icon, onClick, fullWidth }: { label: string; icon?: React.ElementType; onClick?: () => void; fullWidth?: boolean }) {
  const [hov, setHov] = useState(false);
  return (
    <button onClick={onClick} onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
      style={{ height: 44, width: fullWidth ? "100%" : "auto", paddingLeft: fullWidth ? 0 : 14, paddingRight: fullWidth ? 0 : 14, backgroundColor: "transparent", border: `1px solid ${hov ? P.gold : P.border}`, borderRadius: 12, fontSize: 14, fontWeight: 500, color: P.textPrimary, cursor: "pointer", fontFamily: "'Inter', sans-serif", display: "flex", alignItems: "center", justifyContent: "center", gap: 8, outline: "none", transition: "border-color 150ms ease" }}
    >
      {Icon && <Icon size={16} color={P.textSecondary as string} strokeWidth={1.75} />}
      {label}
    </button>
  );
}

function SmallOutlineBtn({ label, onClick }: { label: string; onClick?: () => void }) {
  const [hov, setHov] = useState(false);
  return (
    <button onClick={onClick} onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
      style={{ height: 32, paddingLeft: 12, paddingRight: 12, backgroundColor: "transparent", border: `1px solid ${hov ? P.gold : P.border}`, borderRadius: 8, fontSize: 12, fontWeight: 500, color: hov ? P.gold : P.textSecondary, cursor: "pointer", fontFamily: "'Inter', sans-serif", outline: "none", transition: "all 150ms ease", flexShrink: 0 }}
    >{label}</button>
  );
}

// ─── Empty state ─────────────────────────────────────────────────────────────

function EmptyState({ icon: Icon, title, subtitle, action, secondaryAction }: {
  icon: React.ElementType;
  title: string;
  subtitle: string;
  action?: { label: string; onClick: () => void; primary?: boolean };
  secondaryAction?: { label: string; onClick: () => void };
}) {
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "52px 24px", textAlign: "center", gap: 0 }}>
      <Icon size={48} color={P.textSecondary as string} strokeWidth={1.5} style={{ marginBottom: 16, opacity: 0.65 }} />
      <div style={{ fontSize: 16, fontWeight: 600, color: P.textPrimary, fontFamily: "'Inter', sans-serif", marginBottom: 8 }}>{title}</div>
      <div style={{ fontSize: 14, color: P.textSecondary, lineHeight: "20px", maxWidth: 272, fontFamily: "'Inter', sans-serif", marginBottom: action ? 24 : 0 }}>{subtitle}</div>
      {action && (
        action.primary
          ? <GoldButton label={action.label} onClick={action.onClick} />
          : <OutlineBtn label={action.label} onClick={action.onClick} />
      )}
      {secondaryAction && (
        <button onClick={secondaryAction.onClick} style={{ marginTop: 12, background: "none", border: "none", cursor: "pointer", fontSize: 13, color: P.textSecondary, fontFamily: "'Inter', sans-serif", outline: "none" }}>{secondaryAction.label}</button>
      )}
    </div>
  );
}

// ─── Error Banner ─────────────────────────────────────────────────────────────

type BannerVariant = "error" | "warn";
function ErrorBanner({ variant, icon: Icon, text, actionLabel, onAction, onDismiss }: {
  variant: BannerVariant;
  icon: React.ElementType;
  text: string;
  actionLabel?: string;
  onAction?: () => void;
  onDismiss?: () => void;
}) {
  const bg   = variant === "error" ? "rgba(192,86,74,0.10)"  : "rgba(212,162,79,0.10)";
  const bdr  = variant === "error" ? "rgba(192,86,74,0.32)"  : "rgba(212,162,79,0.32)";
  const clr  = variant === "error" ? "#C0564A"               : "#D4A24F";
  return (
    <div style={{ margin: "12px 16px 0", backgroundColor: bg, border: `1px solid ${bdr}`, borderRadius: 10, padding: "10px 12px", display: "flex", alignItems: "flex-start", gap: 10, position: "relative" }}>
      <Icon size={16} color={clr} strokeWidth={2} style={{ flexShrink: 0, marginTop: 1 }} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <span style={{ fontSize: 12, color: P.textPrimary, lineHeight: "18px", fontFamily: "'Inter', sans-serif" }}>{text}</span>
        {actionLabel && onAction && (
          <button onClick={onAction} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 12, fontWeight: 600, color: clr, fontFamily: "'Inter', sans-serif", padding: "0 0 0 6px", outline: "none", display: "inline", lineHeight: "18px" }}>
            {actionLabel}
          </button>
        )}
      </div>
      {onDismiss && (
        <button onClick={onDismiss} style={{ background: "none", border: "none", cursor: "pointer", padding: 0, outline: "none", flexShrink: 0, display: "flex", marginTop: 1 }}>
          <X size={13} color={P.textSecondary as string} strokeWidth={2} />
        </button>
      )}
    </div>
  );
}

// ─── Bluetooth Handshake Overlay ──────────────────────────────────────────────

function BTHandshakeOverlay({ targetName, onDone }: { targetName: string; onDone: () => void }) {
  useEffect(() => {
    const t = setTimeout(onDone, 2800);
    return () => clearTimeout(t);
  }, [onDone]);
  return (
    <div style={{ position: "fixed", inset: 0, backgroundColor: P.bg, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", zIndex: 200, padding: 32 }}>
      <style>{`
        @keyframes btPulseA{0%,100%{transform:scale(1);opacity:.7}50%{transform:scale(1.22);opacity:.3}}
        @keyframes btPulseB{0%,100%{transform:scale(1.22);opacity:.3}50%{transform:scale(1);opacity:.7}}
      `}</style>
      <div style={{ position: "relative", width: 120, height: 120, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 36 }}>
        <div style={{ position: "absolute", width: 120, height: 120, borderRadius: "50%", border: `2.5px solid ${P.gold}`, animation: "btPulseA 1.4s ease-in-out infinite", opacity: 0.55 }} />
        <div style={{ position: "absolute", width: 84, height: 84, borderRadius: "50%", border: `2.5px solid ${P.gold}`, animation: "btPulseB 1.4s ease-in-out infinite", opacity: 0.65 }} />
        <div style={{ width: 52, height: 52, borderRadius: "50%", backgroundColor: P.surface, border: `2px solid ${P.gold}`, display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1 }}>
          <Bluetooth size={24} color={P.gold as string} strokeWidth={1.75} />
        </div>
      </div>
      <div style={{ fontFamily: "'Inter', sans-serif", fontSize: 16, fontWeight: 600, color: P.textPrimary, marginBottom: 8, textAlign: "center" }}>
        Connecting to {targetName}&apos;s device…
      </div>
      <div style={{ fontSize: 14, color: P.textSecondary, textAlign: "center", lineHeight: "20px" }}>
        Keep both devices close and unlocked
      </div>
    </div>
  );
}

function NumericKeypad({ onDigit, onDelete, allowDecimal = false }: { onDigit: (d: string) => void; onDelete: () => void; allowDecimal?: boolean }) {
  const keys = ["1","2","3","4","5","6","7","8","9", allowDecimal ? "." : "", "0", "del"];
  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10 }}>
      {keys.map((k, i) => {
        if (k === "") return <div key={i} />;
        const isDel = k === "del";
        return (
          <button key={k + i} onClick={() => isDel ? onDelete() : onDigit(k)}
            style={{ height: 60, borderRadius: 12, backgroundColor: P.surface, border: `1px solid ${P.border}`, fontSize: isDel ? 13 : 22, fontWeight: 400, color: P.textPrimary, cursor: "pointer", fontFamily: "'Inter', sans-serif", display: "flex", alignItems: "center", justifyContent: "center", outline: "none", transition: "background-color 100ms ease" }}
            onMouseDown={(e) => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = P.border as string; }}
            onMouseUp={(e)   => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = P.surface as string; }}
            onMouseLeave={(e)=> { (e.currentTarget as HTMLButtonElement).style.backgroundColor = P.surface as string; }}
          >
            {isDel ? <Delete size={18} color={P.textSecondary as string} strokeWidth={1.75} /> : k}
          </button>
        );
      })}
    </div>
  );
}

function Toggle({ active, onToggle }: { active: boolean; onToggle: () => void }) {
  return (
    <button onClick={onToggle} style={{ width: 44, height: 26, borderRadius: 13, border: "none", cursor: "pointer", outline: "none", backgroundColor: active ? P.gold : P.border, position: "relative", flexShrink: 0, transition: "background-color 200ms ease" }}>
      <div style={{ position: "absolute", top: 3, left: active ? 21 : 3, width: 20, height: 20, borderRadius: "50%", backgroundColor: active ? P.bg : P.textSecondary, transition: "left 200ms ease, background-color 200ms ease" }} />
    </button>
  );
}

// ─── QR SVG ───────────────────────────────────────────────────────────────────

function QRCodeSVG({ size = 180, light = "#F5F1EA", dark = "#0A0908" }: { size?: number; light?: string; dark?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 160 160" style={{ borderRadius: 4 }}>
      <rect width="160" height="160" fill={light} />
      <rect x="8"   y="8"   width="42" height="42" fill={dark} />
      <rect x="12"  y="12"  width="34" height="34" fill={light} />
      <rect x="16"  y="16"  width="26" height="26" fill={dark} />
      <rect x="110" y="8"   width="42" height="42" fill={dark} />
      <rect x="114" y="12"  width="34" height="34" fill={light} />
      <rect x="118" y="16"  width="26" height="26" fill={dark} />
      <rect x="8"   y="110" width="42" height="42" fill={dark} />
      <rect x="12"  y="114" width="34" height="34" fill={light} />
      <rect x="16"  y="118" width="26" height="26" fill={dark} />
      {[60,66,72,78,84,90,96].map((x)=>[8,14,20,26,32,38,44,50].map((y)=>((x+y)%12<5)?<rect key={`a${x},${y}`} x={x} y={y} width="5" height="5" fill={dark}/>:null))}
      {[8,14,20,26,32,38,44,50].map((x)=>[60,66,72,78,84,90,96,102,108,114,120,126].map((y)=>((x*3+y)%10<4)?<rect key={`b${x},${y}`} x={x} y={y} width="5" height="5" fill={dark}/>:null))}
      {[60,66,72,78,84,90,96,102,108,114,120,126,132,138].map((x)=>[60,66,72,78,84,90,96,102,108,114,120,126].map((y)=>((x+y*2)%9<3)?<rect key={`c${x},${y}`} x={x} y={y} width="5" height="5" fill={dark}/>:null))}
    </svg>
  );
}

// ─── Screen shell ─────────────────────────────────────────────────────────────

function ScreenShell({ children, scrollable = true }: { children: React.ReactNode; scrollable?: boolean }) {
  return (
    <div style={{ width: 375, minHeight: "100vh", backgroundColor: P.bg, fontFamily: "'Inter', sans-serif", paddingBottom: 80, boxSizing: "border-box", overflowY: scrollable ? "auto" : "hidden" }}>
      <div style={{ height: 44 }} />
      {children}
    </div>
  );
}

// ─── Utils ────────────────────────────────────────────────────────────────────

const fmtINR = (n: number) => "₹" + n.toLocaleString("en-IN", { maximumFractionDigits: 2 });
const genTxnId = () => "OP" + Math.random().toString(36).substring(2, 9).toUpperCase();
const genUpiRef = () => Math.floor(Math.random() * 1e12).toString().padStart(12, "0");
const nowDateTime = () => {
  const d = new Date();
  return {
    date: d.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }),
    time: d.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: true }),
  };
};

// ─── Banner tips ──────────────────────────────────────────────────────────────

function BannerTips({ onNavigate }: { onNavigate: (s: Screen) => void }) {
  const [page,    setPage]    = useState(0);
  const [pressed, setPressed] = useState<number | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const CARD_W = 343;

  useEffect(() => {
    const id = setInterval(() => {
      setPage((p) => {
        const next = (p + 1) % TIPS.length;
        scrollRef.current?.scrollTo({ left: next * CARD_W, behavior: "smooth" });
        return next;
      });
    }, 4000);
    return () => clearInterval(id);
  }, []);

  const handleScroll = () => {
    if (!scrollRef.current) return;
    const idx = Math.round(scrollRef.current.scrollLeft / CARD_W);
    setPage(Math.max(0, Math.min(idx, TIPS.length - 1)));
  };

  return (
    <div style={{ width: CARD_W, height: 140, backgroundColor: P.surface, border: `1px solid ${P.border}`, borderRadius: 14, marginLeft: 16, marginTop: 16, overflow: "hidden", position: "relative", flexShrink: 0 }}>
      <div ref={scrollRef} onScroll={handleScroll}
        style={{ display: "flex", overflowX: "auto", scrollSnapType: "x mandatory", scrollbarWidth: "none", height: "100%" }}
      >
        {TIPS.map((tip, i) => {
          const Icon = tip.icon;
          const isPressed = pressed === i;
          return (
            <div key={i}
              onClick={() => onNavigate(tip.screen)}
              onMouseDown={() => setPressed(i)}
              onMouseUp={() => setPressed(null)}
              onMouseLeave={() => setPressed(null)}
              style={{ scrollSnapAlign: "start", flexShrink: 0, width: CARD_W, height: 140, display: "flex", alignItems: "center", gap: 14, padding: "0 16px 24px", boxSizing: "border-box", cursor: "pointer", backgroundColor: isPressed ? P.border : "transparent", transition: "background-color 100ms ease" }}
            >
              <div style={{ width: 44, height: 44, borderRadius: "50%", backgroundColor: "var(--c-badge-bg)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <Icon size={22} color={P.gold} stroke={1.75} />
              </div>
              <span style={{ flex: 1, fontSize: 14, fontWeight: 500, color: P.textPrimary, lineHeight: "20px", fontFamily: "'Inter', sans-serif" }}>
                {tip.text}
              </span>
              <div style={{ width: 32, height: 32, borderRadius: "50%", backgroundColor: "rgba(201,168,87,0.12)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <ChevronRight size={16} color={P.gold as string} strokeWidth={2} />
              </div>
            </div>
          );
        })}
      </div>

      <div style={{ position: "absolute", bottom: 8, left: 0, right: 0, display: "flex", justifyContent: "center", gap: 5, pointerEvents: "none" }}>
        {TIPS.map((_, i) => (
          <div key={i} style={{ width: i === page ? 14 : 5, height: 5, borderRadius: 2.5, backgroundColor: i === page ? P.gold : P.border, transition: "width 200ms ease, background-color 200ms ease" }} />
        ))}
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// QUICK ACTION SCREENS
// ══════════════════════════════════════════════════════════════════════════════

interface TxnInfo { amount: string; txnId: string; upiRef: string; date: string; time: string; label: string; }

// ─── Add to Wallet ────────────────────────────────────────────────────────────

function AddWalletScreen({ onBack, bankBalance, onSuccess }: { onBack: () => void; bankBalance: number; onSuccess: (info: TxnInfo) => void }) {
  const [amount, setAmount] = useState("");
  const [bank,   setBank]   = useState("");

  const handleDigit = (d: string) => {
    setAmount((a) => {
      if (d === ".") return a.includes(".") ? a : a === "" ? "0." : a + ".";
      const [whole, frac] = a.split(".");
      if (frac !== undefined && frac.length >= 2) return a;
      if (!a.includes(".") && whole.length >= 7)  return a;
      return a + d;
    });
  };
  const handleDelete = () => setAmount((a) => a.slice(0, -1));
  const numAmt  = parseFloat(amount || "0");
  const canPay  = numAmt > 0 && bank !== "" && numAmt <= bankBalance;

  const handleAdd = () => {
    const { date, time } = nowDateTime();
    onSuccess({ amount: `₹${numAmt.toLocaleString("en-IN")}`, txnId: genTxnId(), upiRef: genUpiRef(), date, time, label: "Add to Wallet" });
  };

  return (
    <ScreenShell>
      <BackHeader onBack={onBack} title="Add to Wallet" />
      <div style={{ padding: "32px 16px 0" }}>
        <div style={{ textAlign: "center", marginBottom: 6 }}>
          <span style={{ fontFamily: "'Fraunces', serif", fontSize: 48, fontWeight: 700, color: amount ? P.textPrimary : P.border, letterSpacing: "-1px" }}>
            ₹{amount || "0"}
          </span>
        </div>
        <div style={{ textAlign: "center", marginBottom: 20, fontSize: 13, color: P.textSecondary }}>
          Available: {fmtINR(bankBalance)} in {bank || "selected bank"}
        </div>
        <div style={{ display: "flex", gap: 10, marginBottom: 28, justifyContent: "center" }}>
          {["100","500","1000","2000"].map((v) => (
            <button key={v} onClick={() => setAmount(v)}
              style={{ height: 34, paddingLeft: 14, paddingRight: 14, backgroundColor: amount === v ? P.gold : P.surface, border: `1px solid ${amount === v ? P.gold : P.border}`, borderRadius: 20, fontSize: 13, fontWeight: 500, color: amount === v ? P.bg : P.textPrimary, cursor: "pointer", fontFamily: "'Inter', sans-serif", outline: "none", transition: "all 150ms ease" }}
            >₹{v}</button>
          ))}
        </div>
        <SelectInput label="Funding Source" value={bank} onChange={setBank} options={BANK_ACCOUNTS.map((b) => b.name)} />
        <div style={{ marginBottom: 24 }}>
          <NumericKeypad onDigit={handleDigit} onDelete={handleDelete} allowDecimal />
        </div>
        <GoldButton label="Add Money" disabled={!canPay} onClick={handleAdd} />
      </div>
    </ScreenShell>
  );
}

// ─── Add to Wallet — Success ──────────────────────────────────────────────────

function AddWalletSuccessScreen({ info, onDone }: { info: TxnInfo; onDone: () => void }) {
  const [copied, setCopied] = useState<"txn" | "upi" | null>(null);
  const copy = (val: string, key: "txn" | "upi") => {
    navigator.clipboard?.writeText(val).catch(() => {});
    setCopied(key); setTimeout(() => setCopied(null), 1600);
  };
  const rows = [
    { label: "Transaction ID", value: info.txnId.slice(0,4) + "••••" + info.txnId.slice(-3), full: info.txnId, copyKey: "txn" as const },
    { label: "UPI Reference",  value: "••••" + info.upiRef.slice(-6),                         full: info.upiRef, copyKey: "upi" as const },
    { label: "Amount", value: info.amount, full: null, copyKey: null },
    { label: "Date",   value: info.date,   full: null, copyKey: null },
    { label: "Time",   value: info.time,   full: null, copyKey: null },
  ];
  return (
    <ScreenShell>
      <style>{`@keyframes successPop{0%{transform:scale(.55);opacity:0}60%{transform:scale(1.12);opacity:1}100%{transform:scale(1);opacity:1}}`}</style>
      <div style={{ padding: "48px 16px 0", display: "flex", flexDirection: "column", alignItems: "center" }}>
        <div style={{ animation: "successPop 300ms cubic-bezier(.34,1.56,.64,1) forwards", marginBottom: 20 }}>
          <div style={{ width: 80, height: 80, borderRadius: "50%", backgroundColor: "rgba(201,168,87,0.12)", border: `2px solid ${P.gold}`, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <CheckCircle2 size={40} color={P.gold as string} strokeWidth={1.5} />
          </div>
        </div>
        <div style={{ fontFamily: "'Fraunces', serif", fontSize: 22, fontWeight: 700, color: P.textPrimary, marginBottom: 6, textAlign: "center" }}>Money Added Successfully</div>
        <div style={{ fontSize: 14, color: P.textSecondary, marginBottom: 32, textAlign: "center" }}>{info.amount} has been added to your wallet</div>
        <div style={{ width: "100%", backgroundColor: P.surface, border: `1px solid ${P.border}`, borderRadius: 14, overflow: "hidden", marginBottom: 20 }}>
          {rows.map(({ label, value, full, copyKey }, i) => (
            <div key={label} style={{ height: 52, display: "flex", alignItems: "center", justifyContent: "space-between", paddingLeft: 16, paddingRight: 14, borderBottom: i < rows.length - 1 ? `1px solid ${P.border}` : "none", boxSizing: "border-box" }}>
              <span style={{ fontSize: 13, color: P.textSecondary }}>{label}</span>
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <span style={{ fontSize: 14, color: P.textPrimary, fontWeight: 500, fontFamily: copyKey ? "monospace" : "'Inter', sans-serif" }}>{value}</span>
                {copyKey && (
                  <button onClick={() => copy(full!, copyKey)} style={{ background: "none", border: "none", cursor: "pointer", padding: 2, outline: "none", display: "flex", alignItems: "center" }}>
                    <Copy size={13} color={copied === copyKey ? P.gold as string : P.textSecondary as string} strokeWidth={2} />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
        <div style={{ width: "100%", display: "flex", flexDirection: "column", gap: 10 }}>
          <OutlineBtn label="Share Receipt" icon={Share2} fullWidth />
          <GoldButton label="Done" onClick={onDone} />
        </div>
      </div>
    </ScreenShell>
  );
}

// ─── Send to Bank / UPI ───────────────────────────────────────────────────────

function SendUPIScreen({ onBack, walletBalance, bankBalance, onDeduct, bluetoothEnabled, onEnableBluetooth }: { onBack: () => void; walletBalance: number; bankBalance: number; onDeduct: (amount: number, source: "wallet" | "bank") => void; bluetoothEnabled: boolean; onEnableBluetooth: () => void }) {
  const [mode,   setMode]   = useState<"upi"|"bank">("upi");
  const [source, setSource] = useState<"wallet"|"bank">("wallet");
  const [upiId,  setUpiId]  = useState("");
  const [accNo,  setAccNo]  = useState("");
  const [ifsc,   setIfsc]   = useState("");
  const [amount, setAmount] = useState("");
  const [note,   setNote]   = useState("");
  const [sent,   setSent]   = useState(false);
  const [showHandshake, setShowHandshake] = useState(false);

  const target = mode === "upi" ? upiId : accNo;
  const numAmt = parseFloat(amount || "0");
  const available = source === "wallet" ? walletBalance : bankBalance;
  const insufficientFunds = numAmt > 0 && numAmt > available;
  const canSend = target.length > 3 && numAmt > 0 && !insufficientFunds;

  if (sent) return (
    <ScreenShell>
      <BackHeader onBack={onBack} title="Send to Bank / UPI" />
      <div style={{ padding: "80px 16px 0", display: "flex", flexDirection: "column", alignItems: "center" }}>
        <div style={{ width: 72, height: 72, borderRadius: "50%", backgroundColor: "rgba(201,168,87,0.12)", border: `2px solid ${P.gold}`, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 20 }}>
          <CheckCircle2 size={36} color={P.gold as string} strokeWidth={1.5} />
        </div>
        <div style={{ fontFamily: "'Fraunces', serif", fontSize: 22, fontWeight: 700, color: P.textPrimary, marginBottom: 8 }}>Transfer Successful</div>
        <div style={{ fontSize: 14, color: P.textSecondary, textAlign: "center" }}>₹{numAmt.toLocaleString("en-IN")} sent</div>
        <div style={{ marginTop: 40, width: "100%" }}><GoldButton label="Done" onClick={onBack} /></div>
      </div>
    </ScreenShell>
  );

  return (
    <ScreenShell>
      {showHandshake && <BTHandshakeOverlay targetName="Bank" onDone={() => { setShowHandshake(false); onDeduct(numAmt, source); setSent(true); }} />}
      <BackHeader onBack={onBack} title="Send to Bank / UPI" />
      {!bluetoothEnabled && (
        <ErrorBanner variant="warn" icon={Bluetooth} text="Bluetooth is off. Turn it on to send or receive money." actionLabel="Turn On" onAction={onEnableBluetooth} />
      )}
      <div style={{ padding: "24px 16px 0" }}>
        <div style={{ display: "flex", backgroundColor: P.surface, border: `1px solid ${P.border}`, borderRadius: 12, padding: 4, marginBottom: 20, gap: 4 }}>
          {(["upi","bank"] as const).map((m) => (
            <button key={m} onClick={() => setMode(m)}
              style={{ flex: 1, height: 38, borderRadius: 9, backgroundColor: mode === m ? P.gold : "transparent", border: "none", fontSize: 14, fontWeight: 600, color: mode === m ? P.bg : P.textSecondary, cursor: "pointer", fontFamily: "'Inter', sans-serif", outline: "none", transition: "all 150ms ease" }}
            >{m === "upi" ? "UPI ID" : "Bank Account"}</button>
          ))}
        </div>
        {mode === "upi" ? (
          <TextInput label="UPI ID" placeholder="e.g. name@okhdfc" value={upiId} onChange={setUpiId} />
        ) : (
          <>
            <TextInput label="Account Number" placeholder="Enter account number" value={accNo} onChange={setAccNo} type="number" />
            <TextInput label="IFSC Code" placeholder="e.g. HDFC0001234" value={ifsc} onChange={setIfsc} />
          </>
        )}
        <div style={{ marginBottom: 16 }}>
          <div style={{ fontSize: 13, fontWeight: 500, color: P.textSecondary, marginBottom: 6 }}>Pay From</div>
          <div style={{ display: "flex", gap: 8 }}>
            {(["wallet","bank"] as const).map((s) => (
              <button key={s} onClick={() => setSource(s)}
                style={{ flex: 1, height: 44, borderRadius: 10, backgroundColor: source === s ? "rgba(201,168,87,0.1)" : P.surface, border: `1px solid ${source === s ? P.gold : P.border}`, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", cursor: "pointer", outline: "none", gap: 2, transition: "all 150ms ease" }}
              >
                <span style={{ fontSize: 11, color: P.textSecondary, fontFamily: "'Inter', sans-serif" }}>{s === "wallet" ? "Wallet" : "Bank"}</span>
                <span style={{ fontSize: 12, fontWeight: 600, color: source === s ? P.gold : P.textPrimary, fontFamily: "'Inter', sans-serif" }}>{fmtINR(s === "wallet" ? walletBalance : bankBalance)}</span>
              </button>
            ))}
          </div>
        </div>
        <TextInput label="Amount" placeholder="₹0.00" value={amount} onChange={setAmount} prefix="₹" type="number" />
        <TextInput label="Note (optional)" placeholder="What's it for?" value={note} onChange={setNote} />
        {insufficientFunds && (
          <ErrorBanner variant="error" icon={AlertCircle} text="Insufficient balance. Add money to your wallet to continue." actionLabel="Add to Wallet" onAction={onBack} />
        )}
        <div style={{ marginTop: 12 }}>
          <GoldButton label="Send" disabled={!canSend} onClick={() => setShowHandshake(true)} />
        </div>
      </div>
    </ScreenShell>
  );
}

// ─── Show QR ─────────────────────────────────────────────────────────────────

function ShowQRScreen({ onBack }: { onBack: () => void }) {
  return (
    <ScreenShell>
      <BackHeader onBack={onBack} title="My QR Code" />
      <div style={{ padding: "32px 16px 0", display: "flex", flexDirection: "column", alignItems: "center" }}>
        <div style={{ backgroundColor: P.surface, border: `1px solid ${P.border}`, borderRadius: 16, padding: 24, display: "flex", flexDirection: "column", alignItems: "center", gap: 16, width: "100%", boxSizing: "border-box" }}>
          <QRCodeSVG size={200} />
          <div style={{ textAlign: "center" }}>
            <div style={{ fontFamily: "'Fraunces', serif", fontSize: 18, fontWeight: 700, color: P.textPrimary, marginBottom: 4 }}>{USER_NAME}</div>
            <div style={{ fontSize: 13, color: P.textSecondary, letterSpacing: "1.5px" }}>•••• •••• 4521</div>
          </div>
        </div>
        <div style={{ marginTop: 20, width: "100%" }}><OutlineBtn label="Share QR" icon={Share2} fullWidth /></div>
        <div style={{ marginTop: 20, textAlign: "center", fontSize: 13, color: P.textSecondary, lineHeight: "20px", paddingLeft: 8, paddingRight: 8 }}>
          Others can scan this to send you money instantly via Bluetooth or UPI.
        </div>
      </div>
    </ScreenShell>
  );
}

// ─── Send to Phone ────────────────────────────────────────────────────────────

function SendPhoneScreen({ onBack, walletBalance, onDeduct, bluetoothEnabled, onEnableBluetooth }: { onBack: () => void; walletBalance: number; onDeduct: (amount: number) => void; bluetoothEnabled: boolean; onEnableBluetooth: () => void }) {
  const [phone,        setPhone]        = useState("");
  const [amount,       setAmount]       = useState("");
  const [contact,      setContact]      = useState<string | null>(null);
  const [sent,         setSent]         = useState(false);
  const [showHandshake, setShowHandshake] = useState(false);

  const numAmt  = parseFloat(amount || "0");
  const insufficientFunds = numAmt > 0 && numAmt > walletBalance;
  const canSend = (phone.length === 10 || contact) && numAmt > 0 && !insufficientFunds;

  if (sent) return (
    <ScreenShell>
      <BackHeader onBack={onBack} title="Send to Phone" />
      <div style={{ padding: "80px 16px 0", display: "flex", flexDirection: "column", alignItems: "center" }}>
        <div style={{ width: 72, height: 72, borderRadius: "50%", backgroundColor: "rgba(201,168,87,0.12)", border: `2px solid ${P.gold}`, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 20 }}>
          <CheckCircle2 size={36} color={P.gold as string} strokeWidth={1.5} />
        </div>
        <div style={{ fontFamily: "'Fraunces', serif", fontSize: 22, fontWeight: 700, color: P.textPrimary, marginBottom: 8 }}>Sent Successfully</div>
        <div style={{ fontSize: 14, color: P.textSecondary, textAlign: "center" }}>₹{numAmt.toLocaleString("en-IN")} sent from wallet</div>
        <div style={{ marginTop: 40, width: "100%" }}><GoldButton label="Done" onClick={onBack} /></div>
      </div>
    </ScreenShell>
  );

  return (
    <ScreenShell>
      {showHandshake && <BTHandshakeOverlay targetName={contact ?? "User"} onDone={() => { setShowHandshake(false); onDeduct(numAmt); setSent(true); }} />}
      <BackHeader onBack={onBack} title="Send to Phone" />
      {!bluetoothEnabled && (
        <ErrorBanner variant="warn" icon={Bluetooth} text="Bluetooth is off. Turn it on to send or receive money." actionLabel="Turn On" onAction={onEnableBluetooth} />
      )}
      <div style={{ padding: "24px 16px 0" }}>
        <TextInput label="Phone Number" placeholder="Enter 10-digit number" value={phone} onChange={(v) => { setPhone(v); setContact(null); }} prefix="+91" type="number" />
        <div style={{ marginBottom: 20 }}>
          <div style={{ fontSize: 13, fontWeight: 500, color: P.textSecondary, marginBottom: 12 }}>Recent Contacts</div>
          <div style={{ display: "flex", gap: 16, overflowX: "auto", paddingBottom: 4, scrollbarWidth: "none" }}>
            {RECENT_CONTACTS.map((c, idx) => {
              const active = contact === c.name;
              return (
                <div key={c.name} onClick={() => { setContact(active ? null : c.name); setPhone(""); }}
                  style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6, cursor: "pointer", flexShrink: 0 }}
                >
                  <div style={{ width: 48, height: 48, borderRadius: "50%", backgroundColor: active ? P.gold : P.surface, border: `2px solid ${active ? P.gold : P.border}`, display: "flex", alignItems: "center", justifyContent: "center", transition: "all 150ms ease" }}>
                    <span style={{ fontSize: 13, fontWeight: 600, color: active ? P.bg : avatarColor(idx), fontFamily: "'Inter', sans-serif" }}>{c.initials}</span>
                  </div>
                  <span style={{ fontSize: 11, color: active ? P.gold : P.textSecondary, fontFamily: "'Inter', sans-serif", whiteSpace: "nowrap" }}>{c.name}</span>
                </div>
              );
            })}
          </div>
        </div>
        {contact && (
          <div style={{ backgroundColor: P.surface, border: `1px solid ${P.border}`, borderRadius: 10, padding: "10px 14px", marginBottom: 16, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <span style={{ fontSize: 14, color: P.textPrimary }}>Sending to <strong>{contact}</strong></span>
            <button onClick={() => setContact(null)} style={{ background: "none", border: "none", cursor: "pointer", padding: 0, outline: "none" }}>
              <X size={14} color={P.textSecondary as string} />
            </button>
          </div>
        )}
        <div style={{ marginBottom: 12 }}>
          <span style={{ fontSize: 13, color: P.textSecondary }}>Wallet Balance: <span style={{ color: P.gold, fontWeight: 600 }}>{fmtINR(walletBalance)}</span></span>
        </div>
        <TextInput label="Amount" placeholder="₹0.00" value={amount} onChange={setAmount} prefix="₹" type="number" />
        {insufficientFunds && (
          <ErrorBanner variant="error" icon={AlertCircle} text="Insufficient balance. Add money to your wallet to continue." actionLabel="Add to Wallet" onAction={onBack} />
        )}
        <div style={{ marginTop: 12 }}>
          <GoldButton label="Send" disabled={!canSend} onClick={() => setShowHandshake(true)} />
        </div>
      </div>
    </ScreenShell>
  );
}

// ─── Request Money ────────────────────────────────────────────────────────────

function RequestMoneyScreen({ onBack, bluetoothEnabled, onEnableBluetooth }: { onBack: () => void; bluetoothEnabled: boolean; onEnableBluetooth: () => void }) {
  const [requested,  setRequested]  = useState<string[]>([]);
  const [visible,    setVisible]    = useState<typeof NEARBY_USERS>([]);
  const [scanning,   setScanning]   = useState(true);
  const [scanKey,    setScanKey]    = useState(0);

  const startScan = () => {
    setVisible([]); setRequested([]); setScanning(true); setScanKey((k) => k + 1);
  };

  useEffect(() => {
    if (!scanning) return;
    let idx = 0;
    const timers: ReturnType<typeof setTimeout>[] = [];
    NEARBY_USERS.forEach((u, i) => {
      const t = setTimeout(() => {
        setVisible((prev) => [...prev, u]);
        idx++;
        if (idx === NEARBY_USERS.length) setScanning(false);
      }, 1200 + i * 900);
      timers.push(t);
    });
    const stopTimer = setTimeout(() => setScanning(false), 1200 + NEARBY_USERS.length * 900 + 500);
    timers.push(stopTimer);
    return () => timers.forEach(clearTimeout);
  }, [scanKey]);

  return (
    <ScreenShell>
      <style>{`@keyframes ping1{0%{transform:scale(1);opacity:.6}100%{transform:scale(2.2);opacity:0}}@keyframes ping2{0%{transform:scale(1);opacity:.4}100%{transform:scale(2.8);opacity:0}}@keyframes ping3{0%{transform:scale(1);opacity:.25}100%{transform:scale(3.4);opacity:0}}`}</style>
      <BackHeader onBack={onBack} title="Request Money" />
      {!bluetoothEnabled && (
        <ErrorBanner variant="warn" icon={Bluetooth} text="Bluetooth is off. Turn it on to send or receive money." actionLabel="Turn On" onAction={onEnableBluetooth} />
      )}
      <div style={{ padding: "32px 16px 0", display: "flex", flexDirection: "column", alignItems: "center" }}>
        <div style={{ position: "relative", width: 120, height: 120, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 28 }}>
          {scanning && [1,2,3].map((n) => (
            <div key={n} style={{ position: "absolute", width: 120, height: 120, borderRadius: "50%", border: `2px solid ${P.gold}`, animation: `ping${n} 2.4s ${n * 0.6}s ease-out infinite` }} />
          ))}
          <div style={{ width: 56, height: 56, borderRadius: "50%", backgroundColor: P.surface, border: `2px solid ${scanning ? P.gold : P.border}`, display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1, transition: "border-color 400ms ease" }}>
            {scanning
              ? <Bluetooth size={24} color={P.gold as string} strokeWidth={1.75} />
              : <IconBluetoothOff size={24} color={P.textSecondary as string} strokeWidth={1.75} />
            }
          </div>
        </div>
        <div style={{ fontFamily: "'Fraunces', serif", fontSize: 18, fontWeight: 700, color: P.textPrimary, marginBottom: 6, textAlign: "center" }}>
          {scanning ? "Scanning for nearby users" : visible.length > 0 ? "Nearby users found" : "No nearby users found"}
        </div>
        <div style={{ fontSize: 13, color: P.textSecondary, marginBottom: 28, textAlign: "center" }}>
          {scanning ? "Detecting OffPay users via Bluetooth…" : visible.length > 0 ? `${visible.length} user${visible.length > 1 ? "s" : ""} within Bluetooth range` : "No OffPay users detected nearby"}
        </div>

        {visible.length > 0 && (
          <div style={{ width: "100%", border: `1px solid ${P.borderStrong}`, borderRadius: 12, overflow: "hidden", marginBottom: 16 }}>
            {visible.map((u, i) => {
              const sent = requested.includes(u.name);
              return (
                <div key={u.name} style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 16px", borderBottom: i < visible.length - 1 ? `1px solid ${P.border}` : "none" }}>
                  <div style={{ width: 40, height: 40, borderRadius: "50%", backgroundColor: P.surface, border: `1px solid ${P.border}`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    <User size={18} color={P.gold as string} strokeWidth={1.75} />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 14, fontWeight: 500, color: P.textPrimary }}>{u.name}</div>
                    <div style={{ fontSize: 12, color: P.textSecondary }}>{u.device} · {u.distance}</div>
                  </div>
                  <button
                    onClick={() => setRequested((r) => sent ? r.filter((x) => x !== u.name) : [...r, u.name])}
                    style={{ height: 32, paddingLeft: 14, paddingRight: 14, backgroundColor: sent ? P.surface : P.gold, border: `1px solid ${sent ? P.border : P.gold}`, borderRadius: 8, fontSize: 12, fontWeight: 600, color: sent ? P.textSecondary : P.bg, cursor: "pointer", fontFamily: "'Inter', sans-serif", outline: "none", flexShrink: 0, display: "flex", alignItems: "center", gap: 5, transition: "all 150ms ease" }}
                  >
                    {sent && <CheckCircle2 size={12} color={P.gold as string} strokeWidth={2} />}
                    {sent ? "Requested" : "Request"}
                  </button>
                </div>
              );
            })}
          </div>
        )}

        {!scanning && visible.length === 0 && (
          <EmptyState
            icon={IconBluetoothOff}
            title="No nearby users found"
            subtitle="Make sure the other person has OffPay open and Bluetooth enabled within ~10m."
            action={{ label: "Scan Again", primary: false, onClick: startScan }}
          />
        )}

        {!scanning && (
          <div style={{ marginTop: 8 }}><OutlineBtn label="Scan Again" icon={Bluetooth} fullWidth onClick={startScan} /></div>
        )}
        <div style={{ marginTop: 12, fontSize: 12, color: P.textSecondary, textAlign: "center" }}>Bluetooth range: ~10m · No internet needed</div>
      </div>
    </ScreenShell>
  );
}

// ─── Bills & Recharge ─────────────────────────────────────────────────────────

function MobileRechargeForm({ onBack }: { onBack: () => void }) {
  const [operator, setOperator] = useState("");
  const [number,   setNumber]   = useState("");
  const [amount,   setAmount]   = useState("");
  const [paid,     setPaid]     = useState(false);
  const canPay = operator && number.length === 10 && amount.length > 0;

  if (paid) return (
    <ScreenShell>
      <BackHeader onBack={onBack} title="Mobile Recharge" />
      <div style={{ padding: "80px 16px 0", display: "flex", flexDirection: "column", alignItems: "center" }}>
        <div style={{ width: 72, height: 72, borderRadius: "50%", backgroundColor: P.surface, border: `2px solid ${P.gold}`, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 20 }}>
          <CheckCircle2 size={36} color={P.gold as string} strokeWidth={1.5} />
        </div>
        <div style={{ fontFamily: "'Fraunces', serif", fontSize: 22, fontWeight: 700, color: P.textPrimary, marginBottom: 8 }}>Recharge Successful</div>
        <div style={{ fontSize: 14, color: P.textSecondary }}>₹{amount} added to +91 {number}</div>
        <div style={{ marginTop: 40, width: "100%" }}><GoldButton label="Done" onClick={onBack} /></div>
      </div>
    </ScreenShell>
  );

  return (
    <ScreenShell>
      <BackHeader onBack={onBack} title="Mobile Recharge" />
      <div style={{ padding: "24px 16px 0" }}>
        <SelectInput label="Operator" value={operator} onChange={setOperator} options={MOBILE_OPERATORS} />
        <TextInput label="Mobile Number" placeholder="10-digit number" value={number} onChange={setNumber} prefix="+91" type="number" />
        <div style={{ marginBottom: 16 }}>
          <div style={{ fontSize: 13, fontWeight: 500, color: P.textSecondary, marginBottom: 8 }}>Quick Plans</div>
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            {[{v:"149",l:"₹149 · 28d"},{v:"299",l:"₹299 · 84d"},{v:"399",l:"₹399 · 56d"},{v:"599",l:"₹599 · 84d"}].map((p) => (
              <button key={p.v} onClick={() => setAmount(p.v)}
                style={{ height: 36, paddingLeft: 14, paddingRight: 14, backgroundColor: amount === p.v ? P.gold : P.surface, border: `1px solid ${amount === p.v ? P.gold : P.border}`, borderRadius: 20, fontSize: 12, fontWeight: 500, color: amount === p.v ? P.bg : P.textPrimary, cursor: "pointer", fontFamily: "'Inter', sans-serif", outline: "none", transition: "all 150ms ease" }}
              >{p.l}</button>
            ))}
          </div>
        </div>
        <TextInput label="Custom Amount" placeholder="₹0.00" value={amount} onChange={setAmount} prefix="₹" type="number" />
        <div style={{ marginTop: 8 }}><GoldButton label="Pay Now" disabled={!canPay} onClick={() => setPaid(true)} /></div>
      </div>
    </ScreenShell>
  );
}

type BillSubScreen = "grid" | string;

function BillCategoryCard({ icon: Icon, label, onClick }: { icon: React.ElementType; label: string; onClick: () => void }) {
  const [hov, setHov] = useState(false);
  return (
    <button onClick={onClick} onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
      style={{ backgroundColor: P.surface, border: `1px solid ${hov ? P.gold : P.border}`, borderRadius: 14, height: 88, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 10, cursor: "pointer", outline: "none", transition: "border-color 150ms ease", padding: 0 }}
    >
      <Icon size={26} color={hov ? P.gold as string : P.textSecondary as string} strokeWidth={1.75} />
      <span style={{ fontSize: 13, fontWeight: 500, color: hov ? P.textPrimary : P.textSecondary, fontFamily: "'Inter', sans-serif", textAlign: "center", transition: "color 150ms ease" }}>{label}</span>
    </button>
  );
}

function BillsRechargeScreen({ onBack }: { onBack: () => void }) {
  const [sub, setSub] = useState<BillSubScreen>("grid");
  if (sub !== "grid") return <MobileRechargeForm onBack={() => setSub("grid")} />;
  return (
    <ScreenShell>
      <BackHeader onBack={onBack} title="Bills & Recharge" />
      <div style={{ padding: "24px 16px 0" }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          {BILL_CATEGORIES.map(({ icon, label, id }) => (
            <BillCategoryCard key={id} icon={icon} label={label} onClick={() => setSub(id)} />
          ))}
        </div>
      </div>
    </ScreenShell>
  );
}

// ─── Transaction Detail View ──────────────────────────────────────────────────

const TX_STATUS_COLORS: Record<TxStatus, string> = {
  Settled: "#C9A857",
  Pending: "#D4A24F",
  Failed:  "#C0564A",
};
const CREDIT_COLOR = "#5B9B6B";
const DEBIT_COLOR  = "#C0564A";

function TxDetailScreen({ tx, onBack }: { tx: TxDetailData; onBack: () => void }) {
  const [copied,        setCopied]        = useState(false);
  const [liveStatus,    setLiveStatus]    = useState<TxStatus>(tx.status);
  const [settling,      setSettling]      = useState(false);

  useEffect(() => {
    if (tx.status !== "Pending") return;
    const t = setTimeout(() => {
      setSettling(true);
      setTimeout(() => { setLiveStatus("Settled"); setSettling(false); }, 300);
    }, 3200);
    return () => clearTimeout(t);
  }, [tx.status]);

  const statusColor = TX_STATUS_COLORS[liveStatus];
  const amountColor = tx.credit ? CREDIT_COLOR : DEBIT_COLOR;
  const StatusIcon  = liveStatus === "Settled" ? CheckCircle2 : liveStatus === "Pending" ? Clock : XCircle;

  const copyTxId = () => {
    navigator.clipboard?.writeText(tx.txnId).catch(() => {});
    setCopied(true); setTimeout(() => setCopied(false), 1600);
  };

  const rows: { label: string; value: React.ReactNode }[] = [
    { label: tx.credit ? "From" : "To", value: tx.name },
    { label: "Date & Time",             value: tx.datetime },
    {
      label: "Transaction ID",
      value: (
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <span style={{ fontFamily: "monospace", fontSize: 13 }}>{tx.txnId.slice(0,4) + "••••" + tx.txnId.slice(-4)}</span>
          <button onClick={copyTxId} style={{ background: "none", border: "none", cursor: "pointer", padding: 2, outline: "none", display: "flex" }}>
            <Copy size={13} color={copied ? P.gold as string : P.textSecondary as string} strokeWidth={2} />
          </button>
        </div>
      ),
    },
    { label: "Payment Method", value: tx.paymentMethod },
    ...(tx.bankRef ? [{ label: "Bank Reference", value: tx.bankRef }] : []),
  ];

  return (
    <ScreenShell>
      <BackHeader onBack={onBack} title="Transaction Details" />
      <div style={{ padding: "32px 16px 0", display: "flex", flexDirection: "column", alignItems: "center" }}>
        {/* Status icon */}
        <div style={{ width: 72, height: 72, borderRadius: "50%", backgroundColor: `${statusColor}18`, border: `2px solid ${statusColor}`, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 16, transition: "background-color 300ms ease, border-color 300ms ease", opacity: settling ? 0.4 : 1 }}>
          <StatusIcon size={36} color={statusColor} strokeWidth={1.75} style={{ transition: "color 300ms ease" }} />
        </div>

        {/* Amount */}
        <div style={{ fontFamily: "'Fraunces', serif", fontSize: 32, fontWeight: 700, color: amountColor, letterSpacing: "-0.5px", marginBottom: 6 }}>
          {tx.credit ? "+" : "−"}{tx.amount}
        </div>

        {/* Status label */}
        <div style={{ fontSize: 14, fontWeight: 500, color: statusColor, marginBottom: 28, fontFamily: "'Inter', sans-serif", transition: "color 300ms ease" }}>
          {liveStatus}
          {liveStatus === "Pending" && <span style={{ fontSize: 11, color: P.textSecondary, marginLeft: 8 }}>Settling…</span>}
        </div>

        {/* Divider */}
        <div style={{ width: "100%", height: 1, backgroundColor: P.border, marginBottom: 0 }} />

        {/* Detail rows */}
        <div style={{ width: "100%", border: `1px solid ${P.border}`, borderRadius: 14, overflow: "hidden", marginTop: 20 }}>
          {rows.map(({ label, value }, i) => (
            <div key={label} style={{ minHeight: 52, display: "flex", alignItems: "center", justifyContent: "space-between", paddingLeft: 16, paddingRight: 16, paddingTop: 12, paddingBottom: 12, borderBottom: i < rows.length - 1 ? `1px solid ${P.border}` : "none", boxSizing: "border-box", gap: 16 }}>
              <span style={{ fontSize: 13, color: P.textSecondary, fontFamily: "'Inter', sans-serif", flexShrink: 0 }}>{label}</span>
              <div style={{ fontSize: 14, color: P.textPrimary, fontWeight: 500, fontFamily: "'Inter', sans-serif", textAlign: "right" }}>{value}</div>
            </div>
          ))}
        </div>

        {/* CTA buttons */}
        <div style={{ width: "100%", marginTop: 28, display: "flex", flexDirection: "column", gap: 10 }}>
          {liveStatus === "Failed" && (
            <>
              <GoldButton label="Retry Payment" onClick={onBack} />
              <OutlineBtn label="Contact Support" icon={HelpCircle} fullWidth onClick={onBack} />
            </>
          )}
          {liveStatus !== "Failed" && (
            <OutlineBtn label="Report an Issue" icon={HelpCircle} fullWidth />
          )}
        </div>
      </div>
    </ScreenShell>
  );
}

// ─── Wallet Circle ────────────────────────────────────────────────────────────

function WalletCircleScreen({ onBack }: { onBack: () => void }) {
  const [members,     setMembers]     = useState<CircleMember[]>(INITIAL_CIRCLE_MEMBERS);
  const [showForm,    setShowForm]    = useState(false);
  const [formContact, setFormContact] = useState("");
  const [formName,    setFormName]    = useState("");
  const [formAmount,  setFormAmount]  = useState("");
  const [formLimit,   setFormLimit]   = useState("");

  const contactOptions = RECENT_CONTACTS.map((c) => c.name).concat(["Other"]);

  const handleCreate = () => {
    const name = formContact && formContact !== "Other" ? formContact : formName;
    if (!name || !formAmount) return;
    const initials = name.split(" ").map((w) => w[0]).join("").slice(0,2).toUpperCase();
    setMembers((prev) => [...prev, {
      name, initials, color: AVATAR_COLORS[prev.length % AVATAR_COLORS.length],
      amount: `₹${parseInt(formAmount).toLocaleString("en-IN")}`,
      limit: formLimit ? `₹${parseInt(formLimit).toLocaleString("en-IN")}/day` : undefined,
    }]);
    setShowForm(false);
    setFormContact(""); setFormName(""); setFormAmount(""); setFormLimit("");
  };

  if (showForm) return (
    <ScreenShell>
      <BackHeader onBack={() => setShowForm(false)} title="Add Member" />
      <div style={{ padding: "24px 16px 0" }}>
        <SelectInput label="Select Contact" value={formContact} onChange={setFormContact} options={contactOptions} />
        {formContact === "Other" && <TextInput label="Name" placeholder="Enter name" value={formName} onChange={setFormName} />}
        <TextInput label="Allocated Amount" placeholder="e.g. 2000" value={formAmount} onChange={setFormAmount} prefix="₹" type="number" />
        <TextInput label="Daily Spending Limit (optional)" placeholder="e.g. 500" value={formLimit} onChange={setFormLimit} prefix="₹" type="number" />
        <div style={{ marginTop: 8 }}>
          <GoldButton label="Add to Circle" disabled={!(formContact || formName) || !formAmount} onClick={handleCreate} />
        </div>
      </div>
    </ScreenShell>
  );

  return (
    <ScreenShell>
      <BackHeader onBack={onBack} title="Wallet Circle" />
      <div style={{ padding: "24px 16px 0" }}>
        <div style={{ fontSize: 14, color: P.textSecondary, marginBottom: 20, lineHeight: "20px" }}>
          Send pocket money to family members with optional daily spending limits.
        </div>
        {members.length > 0 && (
          <div style={{ border: `1px solid ${P.border}`, borderRadius: 14, overflow: "hidden", marginBottom: 16 }}>
            {members.map((m, i) => (
              <div key={m.name + i} style={{ display: "flex", alignItems: "center", gap: 12, padding: "14px 16px", borderBottom: i < members.length - 1 ? `1px solid ${P.border}` : "none" }}>
                <div style={{ width: 44, height: 44, borderRadius: "50%", backgroundColor: "var(--c-badge-bg)", border: `1.5px solid ${avatarColor(i)}`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <span style={{ fontSize: 14, fontWeight: 700, color: avatarColor(i), fontFamily: "'Inter', sans-serif" }}>{m.initials}</span>
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 15, fontWeight: 500, color: P.textPrimary, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{m.name}</div>
                  {m.limit && <div style={{ fontSize: 12, color: P.textSecondary, marginTop: 2 }}>Limit: {m.limit}</div>}
                </div>
                <span style={{ fontSize: 15, fontWeight: 600, color: P.gold, fontFamily: "'Fraunces', serif", flexShrink: 0 }}>{m.amount}</span>
              </div>
            ))}
          </div>
        )}
        {members.length === 0 && (
          <EmptyState
            icon={IconUsersPlus}
            title="No one in your Wallet Circle yet"
            subtitle="Add family members or trusted contacts to share your wallet and set spending limits."
            action={{ label: "Add Contact", primary: true, onClick: () => setShowForm(true) }}
          />
        )}
        {members.length > 0 && <button onClick={() => setShowForm(true)}
          style={{ width: "100%", height: 52, backgroundColor: "transparent", border: `1.5px dashed ${P.border}`, borderRadius: 14, display: "flex", alignItems: "center", justifyContent: "center", gap: 10, cursor: "pointer", outline: "none", transition: "border-color 150ms ease" }}
          onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.borderColor = P.gold as string; }}
          onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.borderColor = P.border as string; }}
        >
          <Plus size={18} color={P.textSecondary as string} strokeWidth={2} />
          <span style={{ fontSize: 15, fontWeight: 500, color: P.textSecondary, fontFamily: "'Inter', sans-serif" }}>Add Member</span>
        </button>}
        {members.length === 0 && (
          <button onClick={() => setShowForm(true)}
            style={{ width: "100%", height: 52, backgroundColor: "transparent", border: `1.5px dashed ${P.border}`, borderRadius: 14, display: "flex", alignItems: "center", justifyContent: "center", gap: 10, cursor: "pointer", outline: "none", marginTop: 8, transition: "border-color 150ms ease" }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.borderColor = P.gold as string; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.borderColor = P.border as string; }}
          >
            <Plus size={18} color={P.textSecondary as string} strokeWidth={2} />
            <span style={{ fontSize: 15, fontWeight: 500, color: P.textSecondary, fontFamily: "'Inter', sans-serif" }}>Add Member</span>
          </button>
        )}
      </div>
    </ScreenShell>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// SETTINGS SCREEN — sub-screens + main
// ══════════════════════════════════════════════════════════════════════════════

const THEME_OPTIONS: { key: Theme; label: string; icon: React.ElementType }[] = [
  { key: "dark",   label: "Dark",   icon: Moon    },
  { key: "light",  label: "Light",  icon: Sun     },
  { key: "system", label: "System", icon: Monitor },
];

const LANGUAGES = ["English","हिन्दी","தமிழ்","తెలుగు","বাংলা","ಕನ್ನಡ","मराठी","ਪੰਜਾਬੀ"];

const FAQ_ITEMS: { q: string; a: string }[] = [
  { q: "How does Bluetooth transfer work?",        a: "OffPay uses encrypted BLE to transfer money directly between two nearby devices without internet. Both devices need OffPay open and Bluetooth enabled." },
  { q: "What happens if transfer fails?",          a: "Transactions are atomic — if the connection drops mid-transfer, no money moves. You'll see a Failed status and can retry." },
  { q: "How do I add a bank account?",             a: "Go to Settings → Linked Bank Accounts → Add Bank Account. You'll need your account number and IFSC code to link." },
  { q: "Is my data stored on a server?",           a: "Core balances are stored locally on-device. Settlement data syncs to our secure servers only when internet is available." },
  { q: "What is the Wallet Circle?",               a: "Wallet Circle lets you allocate money to family members with optional daily spending caps — useful for kids or household budgets." },
  { q: "How do I change my PIN?",                  a: "Go to Settings → Security → Change PIN. You'll need to verify your current PIN first before setting a new one." },
];

const ISSUE_TYPES = ["Wrong amount deducted","Transfer not received","Transaction stuck Pending","Bluetooth won't connect","App crash or bug","Other"];

// shared bottom sheet wrapper
function BottomSheet({ onClose, title, children }: { onClose: () => void; title: string; children: React.ReactNode }) {
  return (
    <div style={{ position: "fixed", inset: 0, left: "50%", transform: "translateX(-50%)", width: 375, backgroundColor: "rgba(0,0,0,0.65)", zIndex: 300, display: "flex", alignItems: "flex-end" }}
      onClick={onClose}
    >
      <div style={{ width: "100%", backgroundColor: P.surface, borderRadius: "20px 20px 0 0", padding: "24px 16px 48px", border: `1px solid ${P.border}`, maxHeight: "75vh", overflowY: "auto" }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
          <div style={{ fontFamily: "'Fraunces', serif", fontSize: 20, fontWeight: 700, color: P.textPrimary }}>{title}</div>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", padding: 4, outline: "none", display: "flex" }}>
            <X size={18} color={P.textSecondary as string} strokeWidth={2} />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

// shared confirmation modal
function ConfirmModal({ title, body, confirmLabel, confirmDanger, onConfirm, onCancel, children }: {
  title: string; body?: string; confirmLabel: string; confirmDanger?: boolean;
  onConfirm: () => void; onCancel: () => void; children?: React.ReactNode;
}) {
  return (
    <div style={{ position: "fixed", inset: 0, left: "50%", transform: "translateX(-50%)", width: 375, backgroundColor: "rgba(0,0,0,0.72)", zIndex: 400, display: "flex", alignItems: "center", justifyContent: "center", padding: "0 24px", boxSizing: "border-box" }}>
      <div style={{ width: "100%", backgroundColor: P.surface, borderRadius: 20, padding: "28px 20px 20px", border: `1px solid ${P.border}` }}>
        <div style={{ fontFamily: "'Fraunces', serif", fontSize: 20, fontWeight: 700, color: P.textPrimary, marginBottom: 8 }}>{title}</div>
        {body && <div style={{ fontSize: 14, color: P.textSecondary, lineHeight: "20px", marginBottom: 20 }}>{body}</div>}
        {children}
        <div style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: children ? 16 : 0 }}>
          <button onClick={onConfirm} style={{ height: 52, borderRadius: 14, backgroundColor: confirmDanger ? "#C0564A" : P.gold as string, border: "none", cursor: "pointer", fontSize: 15, fontWeight: 600, color: "#fff", fontFamily: "'Inter', sans-serif", outline: "none", transition: "opacity 150ms ease" }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.opacity = "0.85"; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.opacity = "1"; }}
          >{confirmLabel}</button>
          <button onClick={onCancel} style={{ height: 44, borderRadius: 14, backgroundColor: "transparent", border: `1px solid ${P.border}`, cursor: "pointer", fontSize: 15, fontWeight: 500, color: P.textSecondary, fontFamily: "'Inter', sans-serif", outline: "none" }}>Cancel</button>
        </div>
      </div>
    </div>
  );
}

// row renderer used throughout settings groups
function SRow({ icon: Icon, label, right, onClick, danger }: {
  icon: React.ElementType; label: string; right?: React.ReactNode; onClick?: () => void; danger?: boolean;
}) {
  return (
    <div onClick={onClick}
      style={{ minHeight: 56, display: "flex", alignItems: "center", gap: 14, paddingLeft: 16, paddingRight: 16, boxSizing: "border-box", cursor: onClick ? "pointer" : "default", transition: "background-color 120ms ease" }}
      onMouseEnter={(e) => { if (onClick) (e.currentTarget as HTMLDivElement).style.backgroundColor = P.surface as string; }}
      onMouseLeave={(e) => { (e.currentTarget as HTMLDivElement).style.backgroundColor = "transparent"; }}
      onMouseDown={(e)  => { if (onClick) (e.currentTarget as HTMLDivElement).style.backgroundColor = P.border as string; }}
      onMouseUp={(e)    => { if (onClick) (e.currentTarget as HTMLDivElement).style.backgroundColor = P.surface as string; }}
    >
      <Icon size={18} color={danger ? "#C0564A" : P.textSecondary as string} strokeWidth={1.75} />
      <span style={{ flex: 1, fontSize: 15, fontWeight: 500, color: danger ? "#C0564A" : P.textPrimary, fontFamily: "'Inter', sans-serif" }}>{label}</span>
      {right}
    </div>
  );
}

function SGroup({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 28 }}>
      <div style={{ fontSize: 11, fontWeight: 600, color: P.textSecondary, letterSpacing: "0.9px", textTransform: "uppercase", marginBottom: 8, paddingLeft: 4 }}>{title}</div>
      <div style={{ border: `1px solid ${P.border}`, borderRadius: 14, overflow: "hidden" }}>
        {children}
      </div>
    </div>
  );
}

function SDivider() {
  return <div style={{ height: 1, backgroundColor: P.border, marginLeft: 16 }} />;
}

// ── Settings sub-screens ──────────────────────────────────────────────────────

function EditProfileScreen({ userName, onBack, onSave }: { userName: string; onBack: () => void; onSave: (name: string) => void }) {
  const [name,   setName]   = useState(userName);
  const [handle, setHandle] = useState("@" + userName.toLowerCase().replace(/\s+/g, "_"));
  return (
    <ScreenShell>
      <BackHeader onBack={onBack} title="Edit Profile" />
      <div style={{ padding: "32px 16px 0", display: "flex", flexDirection: "column", alignItems: "center" }}>
        {/* Avatar */}
        <div style={{ width: 80, height: 80, borderRadius: "50%", backgroundColor: "var(--c-badge-bg)", border: `2px solid ${P.gold}`, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 8, cursor: "pointer" }}>
          <span style={{ fontSize: 28, fontWeight: 700, color: P.gold, fontFamily: "'Inter', sans-serif" }}>{name.slice(0,1).toUpperCase()}</span>
        </div>
        <button style={{ background: "none", border: "none", cursor: "pointer", fontSize: 13, fontWeight: 500, color: P.gold, fontFamily: "'Inter', sans-serif", marginBottom: 28, outline: "none" }}>Change Photo</button>
        <div style={{ width: "100%" }}>
          <TextInput label="Full Name" placeholder="Your name" value={name} onChange={setName} />
          <TextInput label="Handle" placeholder="@handle" value={handle} onChange={setHandle} />
          <div style={{ marginTop: 8 }}>
            <GoldButton label="Save Changes" disabled={!name.trim()} onClick={() => { onSave(name.trim()); onBack(); }} />
          </div>
        </div>
      </div>
    </ScreenShell>
  );
}

function LinkedAccountsScreen({ title, items, addLabel, onBack }: {
  title: string;
  items: { name: string; last4: string; icon: React.ElementType }[];
  addLabel: string;
  onBack: () => void;
}) {
  const [list, setList] = useState(items);
  const [showAdd, setShowAdd] = useState(false);
  const [newName, setNewName] = useState("");
  const [newNum,  setNewNum]  = useState("");

  if (showAdd) return (
    <ScreenShell>
      <BackHeader onBack={() => setShowAdd(false)} title={addLabel} />
      <div style={{ padding: "24px 16px 0" }}>
        <TextInput label={title.includes("Bank") ? "Bank Name" : "Wallet Name"} placeholder={title.includes("Bank") ? "e.g. Axis Bank" : "e.g. Paytm"} value={newName} onChange={setNewName} />
        <TextInput label={title.includes("Bank") ? "Account Number" : "Phone / ID"} placeholder={title.includes("Bank") ? "Last 4 digits" : "Linked number"} value={newNum} onChange={setNewNum} type="number" />
        {title.includes("Bank") && <TextInput label="IFSC Code" placeholder="e.g. AXIS0001234" value="" onChange={() => {}} />}
        <div style={{ marginTop: 8 }}>
          <GoldButton label="Link Account" disabled={!newName || newNum.length < 4}
            onClick={() => {
              setList((l) => [...l, { name: newName, last4: newNum.slice(-4).padStart(4,"•"), icon: title.includes("Bank") ? Landmark : Wallet }]);
              setShowAdd(false); setNewName(""); setNewNum("");
            }}
          />
        </div>
      </div>
    </ScreenShell>
  );

  return (
    <ScreenShell>
      <BackHeader onBack={onBack} title={title} />
      <div style={{ padding: "24px 16px 0" }}>
        {list.length > 0 && (
          <div style={{ border: `1px solid ${P.border}`, borderRadius: 14, overflow: "hidden", marginBottom: 16 }}>
            {list.map(({ name, last4, icon: Icon }, i) => (
              <div key={name + i} style={{ height: 56, display: "flex", alignItems: "center", gap: 12, paddingLeft: 16, paddingRight: 16, borderBottom: i < list.length - 1 ? `1px solid ${P.border}` : "none", boxSizing: "border-box" }}>
                <div style={{ width: 36, height: 36, borderRadius: 10, backgroundColor: "var(--c-badge-bg)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <Icon size={17} color={P.gold as string} strokeWidth={1.75} />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 14, fontWeight: 500, color: P.textPrimary }}>{name}</div>
                  <div style={{ fontSize: 12, color: P.textSecondary }}>•••• {last4}</div>
                </div>
                <ChevronRight size={15} color={P.border as string} strokeWidth={2} />
              </div>
            ))}
          </div>
        )}
        <button onClick={() => setShowAdd(true)}
          style={{ width: "100%", height: 52, backgroundColor: "transparent", border: `1.5px dashed ${P.border}`, borderRadius: 14, display: "flex", alignItems: "center", justifyContent: "center", gap: 10, cursor: "pointer", outline: "none", transition: "border-color 150ms ease" }}
          onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.borderColor = P.gold as string; }}
          onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.borderColor = P.border as string; }}
        >
          <Plus size={16} color={P.textSecondary as string} strokeWidth={2} />
          <span style={{ fontSize: 14, fontWeight: 500, color: P.textSecondary, fontFamily: "'Inter', sans-serif" }}>{addLabel}</span>
        </button>
      </div>
    </ScreenShell>
  );
}

function ChangePinScreen({ onBack }: { onBack: () => void }) {
  const [step,    setStep]    = useState<"current"|"new"|"confirm">("current");
  const [current, setCurrent] = useState("");
  const [newPin,  setNewPin]  = useState("");
  const [confirm, setConfirm] = useState("");
  const [error,   setError]   = useState("");
  const [done,    setDone]    = useState(false);
  const MAX = 4;

  const active    = step === "current" ? current : step === "new" ? newPin : confirm;
  const setActive = step === "current" ? setCurrent : step === "new" ? setNewPin : setConfirm;

  const handleDigit = (d: string) => {
    if (active.length >= MAX) return;
    const next = active + d;
    setActive(next); setError("");
    if (next.length === MAX) {
      setTimeout(() => {
        if (step === "current") {
          if (next !== CORRECT_PIN) { setError("Incorrect PIN. Try " + CORRECT_PIN + "."); setActive(""); }
          else setStep("new");
        } else if (step === "new") {
          setStep("confirm");
        } else {
          if (next !== newPin) { setError("PINs don't match. Try again."); setConfirm(""); }
          else setDone(true);
        }
      }, 120);
    }
  };

  const STEPS = { current: "Enter current PIN", new: "Enter new PIN", confirm: "Confirm new PIN" };

  if (done) return (
    <ScreenShell>
      <BackHeader onBack={onBack} title="Change PIN" />
      <div style={{ padding: "80px 16px 0", display: "flex", flexDirection: "column", alignItems: "center" }}>
        <div style={{ width: 72, height: 72, borderRadius: "50%", backgroundColor: "rgba(91,155,107,0.12)", border: "2px solid #5B9B6B", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 20 }}>
          <CheckCircle2 size={36} color="#5B9B6B" strokeWidth={1.5} />
        </div>
        <div style={{ fontFamily: "'Fraunces', serif", fontSize: 22, fontWeight: 700, color: P.textPrimary, marginBottom: 8 }}>PIN Changed</div>
        <div style={{ fontSize: 14, color: P.textSecondary, marginBottom: 40 }}>Your PIN has been updated successfully.</div>
        <GoldButton label="Done" onClick={onBack} />
      </div>
    </ScreenShell>
  );

  return (
    <ScreenShell>
      <BackHeader onBack={onBack} title="Change PIN" />
      <div style={{ padding: "40px 16px 0", display: "flex", flexDirection: "column", alignItems: "center" }}>
        <div style={{ display: "flex", gap: 6, marginBottom: 4 }}>
          {(["current","new","confirm"] as const).map((s) => (
            <div key={s} style={{ height: 3, width: 60, borderRadius: 2, backgroundColor: step === s ? P.gold : (["current","new","confirm"].indexOf(step) > ["current","new","confirm"].indexOf(s) ? "#5B9B6B" : P.border), transition: "background-color 300ms ease" }} />
          ))}
        </div>
        <div style={{ fontFamily: "'Fraunces', serif", fontSize: 20, fontWeight: 700, color: P.textPrimary, marginBottom: 6, marginTop: 24, textAlign: "center" }}>{STEPS[step]}</div>
        <div style={{ fontSize: 13, color: P.textSecondary, marginBottom: 36, textAlign: "center" }}>
          {step === "current" ? "Verify your identity before changing" : step === "new" ? "Choose a strong 4-digit PIN" : "Re-enter to confirm"}
        </div>
        <div style={{ display: "flex", gap: 16, marginBottom: 10 }}>
          {Array.from({ length: MAX }).map((_, i) => (
            <div key={i} style={{ width: 18, height: 18, borderRadius: "50%", backgroundColor: i < active.length ? P.gold : "transparent", border: `2px solid ${error ? "#C0564A" : i < active.length ? P.gold : P.border}`, transition: "all 120ms ease" }} />
          ))}
        </div>
        {error && <div style={{ fontSize: 13, color: "#C0564A", marginBottom: 8, textAlign: "center" }}>{error}</div>}
        <div style={{ height: 24 }} />
        <div style={{ width: "100%" }}>
          <NumericKeypad onDigit={handleDigit} onDelete={() => { setActive((p) => p.slice(0,-1)); setError(""); }} />
        </div>
      </div>
    </ScreenShell>
  );
}

function HelpCenterScreen({ onBack }: { onBack: () => void }) {
  const [open, setOpen] = useState<number | null>(null);
  return (
    <ScreenShell>
      <BackHeader onBack={onBack} title="Help Center" />
      <div style={{ padding: "20px 16px 0" }}>
        <div style={{ fontSize: 14, color: P.textSecondary, marginBottom: 20, lineHeight: "20px" }}>Frequently asked questions about OffPay.</div>
        <div style={{ border: `1px solid ${P.border}`, borderRadius: 14, overflow: "hidden" }}>
          {FAQ_ITEMS.map(({ q, a }, i) => {
            const isOpen = open === i;
            return (
              <div key={i} style={{ borderBottom: i < FAQ_ITEMS.length - 1 ? `1px solid ${P.border}` : "none" }}>
                <button onClick={() => setOpen(isOpen ? null : i)}
                  style={{ width: "100%", minHeight: 56, display: "flex", alignItems: "center", gap: 12, paddingLeft: 16, paddingRight: 14, backgroundColor: "transparent", border: "none", cursor: "pointer", outline: "none", textAlign: "left", transition: "background-color 120ms ease", boxSizing: "border-box" }}
                  onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = P.surface as string; }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = "transparent"; }}
                  onMouseDown={(e)  => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = P.border as string; }}
                  onMouseUp={(e)    => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = P.surface as string; }}
                >
                  <span style={{ flex: 1, fontSize: 14, fontWeight: 500, color: P.textPrimary, fontFamily: "'Inter', sans-serif", lineHeight: "20px", paddingTop: 16, paddingBottom: 16 }}>{q}</span>
                  <ChevronDown size={15} color={P.textSecondary as string} strokeWidth={2} style={{ flexShrink: 0, transform: isOpen ? "rotate(180deg)" : "rotate(0deg)", transition: "transform 200ms ease" }} />
                </button>
                {isOpen && (
                  <div style={{ paddingLeft: 16, paddingRight: 16, paddingBottom: 16, fontSize: 13, color: P.textSecondary, lineHeight: "20px" }}>{a}</div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </ScreenShell>
  );
}

function ReportIssueScreen({ onBack }: { onBack: () => void }) {
  const [issueType, setIssueType] = useState("");
  const [desc,      setDesc]      = useState("");
  const [submitted, setSubmitted] = useState(false);

  if (submitted) return (
    <ScreenShell>
      <BackHeader onBack={onBack} title="Report an Issue" />
      <div style={{ padding: "80px 16px 0", display: "flex", flexDirection: "column", alignItems: "center" }}>
        <div style={{ width: 72, height: 72, borderRadius: "50%", backgroundColor: "rgba(201,168,87,0.12)", border: `2px solid ${P.gold}`, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 20 }}>
          <CheckCircle2 size={36} color={P.gold as string} strokeWidth={1.5} />
        </div>
        <div style={{ fontFamily: "'Fraunces', serif", fontSize: 22, fontWeight: 700, color: P.textPrimary, marginBottom: 8 }}>Report Submitted</div>
        <div style={{ fontSize: 14, color: P.textSecondary, textAlign: "center", maxWidth: 280 }}>We'll review your issue and get back to you within 24–48 hours.</div>
        <div style={{ marginTop: 40, width: "100%" }}><GoldButton label="Done" onClick={onBack} /></div>
      </div>
    </ScreenShell>
  );

  return (
    <ScreenShell>
      <BackHeader onBack={onBack} title="Report an Issue" />
      <div style={{ padding: "24px 16px 0" }}>
        <SelectInput label="Issue Type" value={issueType} onChange={setIssueType} options={ISSUE_TYPES} />
        <div style={{ marginBottom: 16 }}>
          <div style={{ fontSize: 13, fontWeight: 500, color: P.textSecondary, marginBottom: 6 }}>Description</div>
          <textarea value={desc} onChange={(e) => setDesc(e.target.value)} placeholder="Describe what happened…"
            style={{ width: "100%", minHeight: 120, backgroundColor: P.surface, border: `1.5px solid ${P.border}`, borderRadius: 12, padding: "12px 14px", fontSize: 14, color: P.textPrimary, fontFamily: "'Inter', sans-serif", outline: "none", resize: "none", boxSizing: "border-box", transition: "border-color 150ms ease", lineHeight: "20px" }}
            onFocus={(e) => { (e.currentTarget as HTMLTextAreaElement).style.borderColor = P.gold as string; }}
            onBlur={(e)  => { (e.currentTarget as HTMLTextAreaElement).style.borderColor = P.border as string; }}
          />
        </div>
        <GoldButton label="Submit Report" disabled={!issueType || desc.length < 10} onClick={() => setSubmitted(true)} />
      </div>
    </ScreenShell>
  );
}

function TermsScreen({ onBack }: { onBack: () => void }) {
  return (
    <ScreenShell>
      <BackHeader onBack={onBack} title="Terms & Privacy" />
      <div style={{ padding: "20px 16px 0" }}>
        {[
          { title: "1. Acceptance of Terms", body: "By using OffPay, you agree to these Terms of Service. If you do not agree to any part of these terms, you may not use our service." },
          { title: "2. Bluetooth Transfer", body: "OffPay uses Bluetooth Low Energy (BLE) to facilitate peer-to-peer transfers. You are responsible for ensuring your device security and keeping your PIN confidential." },
          { title: "3. Data Storage", body: "Transaction data is stored locally on your device. We collect anonymised usage analytics with your consent to improve the product. We do not sell your data to third parties." },
          { title: "4. Privacy Policy", body: "Your personal information (name, phone number) is used solely to identify you within the OffPay network. We use industry-standard encryption for all stored and transmitted data." },
          { title: "5. Liability Limitation", body: "OffPay is not liable for failed transactions due to Bluetooth connectivity issues, device malfunction, or third-party bank delays. Always verify recipient details before sending." },
          { title: "6. Account Termination", body: "We reserve the right to suspend or terminate accounts that violate our terms, including fraudulent activity, abuse of the Wallet Circle feature, or repeated failed authentication attempts." },
        ].map(({ title, body }) => (
          <div key={title} style={{ marginBottom: 24 }}>
            <div style={{ fontSize: 14, fontWeight: 600, color: P.textPrimary, marginBottom: 6, fontFamily: "'Inter', sans-serif" }}>{title}</div>
            <div style={{ fontSize: 13, color: P.textSecondary, lineHeight: "20px" }}>{body}</div>
          </div>
        ))}
        <div style={{ fontSize: 11, color: P.textSecondary, textAlign: "center", paddingBottom: 24 }}>Last updated: September 2026 · OffPay v2.4</div>
      </div>
    </ScreenShell>
  );
}

// ── Main SettingsScreen ───────────────────────────────────────────────────────

type SettingsSub =
  | "main" | "editProfile" | "linkedBanks" | "linkedWallets"
  | "changePin" | "helpCenter" | "reportIssue" | "terms";

function SettingsScreen({ onBack, theme, onThemeChange, userName, onUserNameChange, onLogout }: {
  onBack: () => void; theme: Theme; onThemeChange: (t: Theme) => void;
  userName: string; onUserNameChange: (n: string) => void; onLogout: () => void;
}) {
  const [sub,         setSub]         = useState<SettingsSub>("main");
  const [toggles,     setToggles]     = useState({ notifications: true, biometric: false, twofa: false });
  const [twoFaFlash,  setTwoFaFlash]  = useState(false);
  const [themeOpen,   setThemeOpen]   = useState(false);
  const [langOpen,    setLangOpen]    = useState(false);
  const [language,    setLanguage]    = useState("English");
  const [logoutModal, setLogoutModal] = useState(false);
  const [deleteModal, setDeleteModal] = useState(false);
  const [deleteInput, setDeleteInput] = useState("");

  const toggle = (k: keyof typeof toggles) => {
    const next = !toggles[k];
    setToggles((t) => ({ ...t, [k]: next }));
    if (k === "twofa" && next) { setTwoFaFlash(true); setTimeout(() => setTwoFaFlash(false), 2000); }
  };

  const themeLabel = THEME_OPTIONS.find((o) => o.key === theme)?.label ?? "Dark";

  if (sub === "editProfile")   return <EditProfileScreen userName={userName} onBack={() => setSub("main")} onSave={onUserNameChange} />;
  if (sub === "linkedBanks")   return <LinkedAccountsScreen title="Linked Bank Accounts" items={BANK_ACCOUNTS.map((b) => ({ name: b.name, last4: "4521", icon: Landmark }))} addLabel="Add Bank Account" onBack={() => setSub("main")} />;
  if (sub === "linkedWallets") return <LinkedAccountsScreen title="Linked Wallets" items={WALLET_ACCOUNTS_STATIC.map((w) => ({ name: w.name, last4: "0182", icon: Wallet }))} addLabel="Add Wallet" onBack={() => setSub("main")} />;
  if (sub === "changePin")     return <ChangePinScreen onBack={() => setSub("main")} />;
  if (sub === "helpCenter")    return <HelpCenterScreen onBack={() => setSub("main")} />;
  if (sub === "reportIssue")   return <ReportIssueScreen onBack={() => setSub("main")} />;
  if (sub === "terms")         return <TermsScreen onBack={() => setSub("main")} />;

  const navChevron = <ChevronRight size={16} color={P.border as string} strokeWidth={2} />;

  return (
    <>
      <ScreenShell>
        <BackHeader onBack={onBack} title="Settings" />
        <div style={{ padding: "28px 16px 0" }}>

          <SGroup title="Account">
            <SRow icon={UserCog}  label="Edit Profile"         right={navChevron} onClick={() => setSub("editProfile")} />
            <SDivider />
            <SRow icon={Landmark} label="Linked Bank Accounts" right={navChevron} onClick={() => setSub("linkedBanks")} />
            <SDivider />
            <SRow icon={Wallet}   label="Linked Wallets"       right={navChevron} onClick={() => setSub("linkedWallets")} />
          </SGroup>

          <SGroup title="Preferences">
            <SRow icon={Bell} label="Notifications" right={<Toggle active={toggles.notifications} onToggle={() => toggle("notifications")} />} />
            <SDivider />
            <SRow icon={Languages} label="Language" onClick={() => setLangOpen(true)}
              right={<><span style={{ fontSize: 14, color: P.textSecondary, marginRight: 6 }}>{language}</span>{navChevron}</>}
            />
            <SDivider />
            <SRow icon={Sun} label="Theme" onClick={() => setThemeOpen(true)}
              right={<><span style={{ fontSize: 14, color: P.textSecondary, marginRight: 6 }}>{themeLabel}</span>{navChevron}</>}
            />
          </SGroup>

          <SGroup title="Security">
            <SRow icon={ShieldCheck} label="Change PIN"              right={navChevron} onClick={() => setSub("changePin")} />
            <SDivider />
            <SRow icon={IconFingerprint} label="Biometric Login"     right={<Toggle active={toggles.biometric} onToggle={() => toggle("biometric")} />} />
            <SDivider />
            <SRow icon={ShieldAlert} label="Two-Factor Authentication" right={
              twoFaFlash
                ? <span style={{ fontSize: 12, fontWeight: 600, color: "#5B9B6B", fontFamily: "'Inter', sans-serif" }}>2FA enabled ✓</span>
                : <Toggle active={toggles.twofa} onToggle={() => toggle("twofa")} />
            } />
          </SGroup>

          <SGroup title="Support">
            <SRow icon={LifeBuoy}   label="Help Center"           right={navChevron} onClick={() => setSub("helpCenter")} />
            <SDivider />
            <SRow icon={HelpCircle} label="Report an Issue"       right={navChevron} onClick={() => setSub("reportIssue")} />
            <SDivider />
            <SRow icon={BookOpen}   label="Terms & Privacy Policy" right={navChevron} onClick={() => setSub("terms")} />
          </SGroup>

          {/* Danger zone */}
          <div style={{ paddingTop: 8, borderTop: `1px solid ${P.border}`, marginBottom: 48 }}>
            <button onClick={() => setLogoutModal(true)}
              style={{ width: "100%", height: 52, backgroundColor: "transparent", border: "1px solid #3A2422", borderRadius: 14, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", outline: "none", marginBottom: 12, marginTop: 16, transition: "background-color 150ms ease" }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = "rgba(192,86,74,0.08)"; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = "transparent"; }}
              onMouseDown={(e)  => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = "rgba(192,86,74,0.15)"; }}
              onMouseUp={(e)    => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = "rgba(192,86,74,0.08)"; }}
            >
              <span style={{ fontSize: 15, fontWeight: 600, color: "#C0564A", fontFamily: "'Inter', sans-serif" }}>Log Out</span>
            </button>
            <button onClick={() => setDeleteModal(true)}
              style={{ width: "100%", height: 40, backgroundColor: "transparent", border: "none", cursor: "pointer", outline: "none", display: "flex", alignItems: "center", justifyContent: "center", transition: "opacity 150ms ease" }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.opacity = "0.65"; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.opacity = "1"; }}
            >
              <span style={{ fontSize: 13, color: "#8A4A44", fontFamily: "'Inter', sans-serif" }}>Delete Account</span>
            </button>
          </div>
        </div>
      </ScreenShell>

      {/* Theme sheet */}
      {themeOpen && (
        <BottomSheet title="Choose Theme" onClose={() => setThemeOpen(false)}>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {THEME_OPTIONS.map(({ key, label, icon: Icon }) => {
              const active = theme === key;
              return (
                <button key={key} onClick={() => { onThemeChange(key); setThemeOpen(false); }}
                  style={{ height: 56, display: "flex", alignItems: "center", gap: 14, paddingLeft: 16, paddingRight: 16, backgroundColor: active ? "rgba(201,168,87,0.1)" : "transparent", border: `1px solid ${active ? P.gold : P.border}`, borderRadius: 12, cursor: "pointer", outline: "none", transition: "all 150ms ease" }}
                >
                  <Icon size={20} color={active ? P.gold as string : P.textSecondary as string} strokeWidth={1.75} />
                  <span style={{ flex: 1, fontSize: 16, fontWeight: active ? 600 : 400, color: active ? P.textPrimary : P.textSecondary, fontFamily: "'Inter', sans-serif", textAlign: "left" }}>{label}</span>
                  {active && <CheckCircle2 size={18} color={P.gold as string} strokeWidth={2} />}
                </button>
              );
            })}
          </div>
        </BottomSheet>
      )}

      {/* Language sheet */}
      {langOpen && (
        <BottomSheet title="Choose Language" onClose={() => setLangOpen(false)}>
          <div style={{ border: `1px solid ${P.border}`, borderRadius: 14, overflow: "hidden" }}>
            {LANGUAGES.map((lang, i) => {
              const active = language === lang;
              return (
                <div key={lang} onClick={() => { setLanguage(lang); setLangOpen(false); }}
                  style={{ height: 52, display: "flex", alignItems: "center", paddingLeft: 16, paddingRight: 16, borderBottom: i < LANGUAGES.length - 1 ? `1px solid ${P.border}` : "none", cursor: "pointer", backgroundColor: active ? "rgba(201,168,87,0.07)" : "transparent", transition: "background-color 120ms ease", boxSizing: "border-box" }}
                  onMouseEnter={(e) => { (e.currentTarget as HTMLDivElement).style.backgroundColor = P.surface as string; }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLDivElement).style.backgroundColor = active ? "rgba(201,168,87,0.07)" : "transparent"; }}
                >
                  <span style={{ flex: 1, fontSize: 15, fontWeight: active ? 600 : 400, color: active ? P.textPrimary : P.textSecondary, fontFamily: "'Inter', sans-serif" }}>{lang}</span>
                  {active && <CheckCircle2 size={16} color={P.gold as string} strokeWidth={2} />}
                </div>
              );
            })}
          </div>
        </BottomSheet>
      )}

      {/* Log out confirmation */}
      {logoutModal && (
        <ConfirmModal
          title="Log Out"
          body="You'll need to verify your identity again to access your account."
          confirmLabel="Log Out"
          confirmDanger
          onConfirm={onLogout}
          onCancel={() => setLogoutModal(false)}
        />
      )}

      {/* Delete account confirmation */}
      {deleteModal && (
        <ConfirmModal
          title="Delete Account"
          body='This action cannot be undone. All your data, transaction history, and wallet balances will be permanently erased. Type "DELETE" below to confirm.'
          confirmLabel="Permanently Delete"
          confirmDanger
          onConfirm={() => { if (deleteInput === "DELETE") { setDeleteModal(false); onLogout(); } }}
          onCancel={() => { setDeleteModal(false); setDeleteInput(""); }}
        >
          <div>
            <div style={{ padding: "10px 14px", backgroundColor: "rgba(192,86,74,0.07)", border: "1px solid rgba(192,86,74,0.3)", borderRadius: 10, marginBottom: 4 }}>
              <span style={{ fontSize: 12, color: "#C0564A", fontFamily: "'Inter', sans-serif", lineHeight: "18px" }}>⚠ This will immediately log you out and schedule your account for deletion within 30 days.</span>
            </div>
            <input
              value={deleteInput} onChange={(e) => setDeleteInput(e.target.value)}
              placeholder='Type "DELETE" to confirm'
              style={{ marginTop: 8, width: "100%", height: 48, backgroundColor: P.surface, border: `1.5px solid ${deleteInput === "DELETE" ? "#C0564A" : P.border}`, borderRadius: 12, paddingLeft: 14, paddingRight: 14, fontSize: 14, color: deleteInput === "DELETE" ? "#C0564A" : P.textPrimary, fontFamily: "'Inter', sans-serif", outline: "none", boxSizing: "border-box", transition: "border-color 150ms ease" }}
            />
          </div>
        </ConfirmModal>
      )}
    </>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// MONEY ROOT
// ══════════════════════════════════════════════════════════════════════════════

type MoneySubScreen =
  | { type: "main" }
  | { type: "txHistory" }
  | { type: "pinEntry";    bank: { name: string; balance: number } }
  | { type: "bankBalance"; bank: { name: string; balance: number } };

function PinEntryScreen({ bankName, onSuccess, onBack }: { bankName: string; onSuccess: () => void; onBack: () => void }) {
  const [pin,   setPin]   = useState("");
  const [error, setError] = useState(false);
  const MAX = 4;
  const handleDigit = (d: string) => {
    if (pin.length >= MAX) return;
    const next = pin + d;
    setPin(next); setError(false);
    if (next.length === MAX) {
      setTimeout(() => { if (next === CORRECT_PIN) onSuccess(); else { setError(true); setPin(""); } }, 120);
    }
  };
  return (
    <ScreenShell>
      <BackHeader onBack={onBack} title="Verify PIN" />
      <div style={{ padding: "40px 16px 0", display: "flex", flexDirection: "column", alignItems: "center" }}>
        <div style={{ fontFamily: "'Fraunces', serif", fontSize: 20, fontWeight: 700, color: P.textPrimary, marginBottom: 6, textAlign: "center" }}>Verify to view balance</div>
        <div style={{ fontSize: 14, color: P.textSecondary, marginBottom: 36, textAlign: "center" }}>{bankName}</div>
        <div style={{ display: "flex", gap: 16, marginBottom: 10 }}>
          {Array.from({ length: MAX }).map((_, i) => (
            <div key={i} style={{ width: 18, height: 18, borderRadius: "50%", backgroundColor: i < pin.length ? P.gold : "transparent", border: `2px solid ${error ? "#EF4444" : i < pin.length ? P.gold : P.border}`, transition: "all 120ms ease" }} />
          ))}
        </div>
        {error && <div style={{ fontSize: 13, color: "#EF4444", marginBottom: 8 }}>Incorrect PIN. Try 1234.</div>}
        <div style={{ height: 28 }} />
        <div style={{ width: "100%" }}>
          <NumericKeypad onDigit={handleDigit} onDelete={() => { setPin((p) => p.slice(0, -1)); setError(false); }} />
        </div>
      </div>
    </ScreenShell>
  );
}

function BankBalanceScreen({ bank, onBack }: { bank: { name: string; balance: number }; onBack: () => void }) {
  return (
    <ScreenShell>
      <BackHeader onBack={onBack} title={bank.name} />
      <div style={{ padding: "60px 16px 0", display: "flex", flexDirection: "column", alignItems: "center" }}>
        <div style={{ fontSize: 14, fontWeight: 500, color: P.textSecondary, marginBottom: 12 }}>Available Balance</div>
        <div style={{ fontFamily: "'Fraunces', serif", fontSize: 40, fontWeight: 700, color: P.textPrimary, letterSpacing: "-0.5px", marginBottom: 8 }}>{fmtINR(bank.balance)}</div>
        <div style={{ fontSize: 13, color: P.textSecondary }}>{bank.name} · Savings Account</div>
        <div style={{ marginTop: 48, width: "100%", height: 1, backgroundColor: P.border }} />
        <div style={{ marginTop: 24, fontSize: 12, color: P.textSecondary, textAlign: "center" }}>Balance synced offline via OffPay · Last updated just now</div>
      </div>
    </ScreenShell>
  );
}

function MoneyRoot({ walletBalance, onTxSelect }: { walletBalance: number; onTxSelect?: (tx: TxDetailData) => void }) {
  const [sub,      setSub]      = useState<MoneySubScreen>({ type: "main" });
  const [revealed, setRevealed] = useState<Record<string, boolean>>({});
  const [qrVisible,setQrVisible]= useState(false);
  const [sortKey,  setSortKey]  = useState("recent");
  const [ddOpen,   setDdOpen]   = useState(false);

  if (sub.type === "pinEntry")    return <PinEntryScreen bankName={sub.bank.name} onBack={() => setSub({ type: "main" })} onSuccess={() => setSub({ type: "bankBalance", bank: sub.bank })} />;
  if (sub.type === "bankBalance") return <BankBalanceScreen bank={sub.bank} onBack={() => setSub({ type: "main" })} />;

  if (sub.type === "txHistory") {
    const getSorted = (): TxMonth[] => {
      const d = [...TX_DATA];
      if (sortKey === "last1") return d.slice(0, 1);
      if (sortKey === "last3") return d.slice(0, 3);
      if (sortKey === "high")  return [...d].sort((a, b) => parseFloat(b.total.replace(/[₹,]/g,"")) - parseFloat(a.total.replace(/[₹,]/g,"")));
      if (sortKey === "low")   return [...d].sort((a, b) => parseFloat(a.total.replace(/[₹,]/g,"")) - parseFloat(b.total.replace(/[₹,]/g,"")));
      return d;
    };
    const visible     = getSorted();
    const activeLabel = SORT_OPTIONS.find((o) => o.key === sortKey)?.label ?? "";
    return (
      <ScreenShell>
        <BackHeader onBack={() => setSub({ type: "main" })} title="Transaction History" />
        <div style={{ padding: "20px 16px 0", position: "relative" }}>
          <div style={{ marginBottom: 20, position: "relative" }}>
            <button onClick={() => setDdOpen((v) => !v)}
              style={{ display: "flex", alignItems: "center", gap: 8, height: 40, paddingLeft: 14, paddingRight: 12, backgroundColor: P.surface, border: `1px solid ${ddOpen ? P.gold : P.border}`, borderRadius: 10, cursor: "pointer", outline: "none", transition: "border-color 150ms ease" }}
            >
              <span style={{ fontSize: 13, fontWeight: 500, color: P.textPrimary, fontFamily: "'Inter', sans-serif" }}>{activeLabel}</span>
              <ChevronDown size={14} color={P.textSecondary as string} strokeWidth={2} style={{ transition: "transform 150ms ease", transform: ddOpen ? "rotate(180deg)" : "rotate(0deg)" }} />
            </button>
            {ddOpen && (
              <div style={{ position: "absolute", top: 46, left: 0, zIndex: 50, backgroundColor: P.surface, border: `1px solid ${P.border}`, borderRadius: 10, overflow: "hidden", minWidth: 160, boxShadow: "0 8px 24px rgba(0,0,0,0.4)" }}>
                {SORT_OPTIONS.map((opt, i) => (
                  <button key={opt.key} onClick={() => { setSortKey(opt.key); setDdOpen(false); }}
                    style={{ width: "100%", height: 44, backgroundColor: opt.key === sortKey ? P.border : "transparent", border: "none", borderBottom: i < SORT_OPTIONS.length - 1 ? `1px solid ${P.border}` : "none", display: "flex", alignItems: "center", paddingLeft: 14, cursor: "pointer", outline: "none" }}
                    onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = P.border as string; }}
                    onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = opt.key === sortKey ? P.border as string : "transparent"; }}
                  >
                    <span style={{ fontSize: 13, fontWeight: opt.key === sortKey ? 600 : 400, color: opt.key === sortKey ? P.gold : P.textPrimary, fontFamily: "'Inter', sans-serif" }}>{opt.label}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {visible.map((group) => (
              <div key={group.month} style={{ border: `1px solid ${P.borderStrong}`, borderRadius: 12, overflow: "hidden" }}>
                <div style={{ height: 56, display: "flex", alignItems: "center", justifyContent: "space-between", paddingLeft: 16, paddingRight: 16, borderBottom: `1px solid ${P.borderStrong}`, boxSizing: "border-box" }}>
                  <span style={{ fontSize: 16, fontWeight: 600, color: P.textPrimary }}>{group.month}</span>
                  <span style={{ fontSize: 16, fontWeight: 600, color: P.textPrimary }}>{group.total}</span>
                </div>
                {group.transactions.map((tx, ti) => (
                  <div key={tx.name + ti}
                    onClick={() => onTxSelect?.(makeTxDetail(tx, group.month, ti))}
                    style={{ height: 52, display: "flex", alignItems: "center", justifyContent: "space-between", paddingLeft: 24, paddingRight: 16, borderBottom: ti < group.transactions.length - 1 ? `1px solid ${P.border}` : "none", boxSizing: "border-box", cursor: onTxSelect ? "pointer" : "default", transition: "background-color 120ms ease" }}
                    onMouseEnter={(e) => { if (onTxSelect) (e.currentTarget as HTMLDivElement).style.backgroundColor = P.surface as string; }}
                    onMouseLeave={(e) => { (e.currentTarget as HTMLDivElement).style.backgroundColor = "transparent"; }}
                  >
                    <span style={{ fontSize: 14, color: P.textSecondary }}>{tx.name}</span>
                    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      <span style={{ fontSize: 14, fontWeight: 500, color: tx.credit ? P.gold : P.textPrimary }}>{tx.credit ? "+" : "−"}{tx.amount}</span>
                      {onTxSelect && <ChevronRight size={13} color={P.border as string} strokeWidth={2} />}
                    </div>
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>
      </ScreenShell>
    );
  }

  const liveWallets = WALLET_ACCOUNTS_STATIC.map((w, i) => ({ ...w, balance: i === 0 ? walletBalance : w.balance ?? 0 }));

  return (
    <ScreenShell>
      <div style={{ padding: "24px 16px 0" }}>
        <div style={{ fontFamily: "'Fraunces', serif", fontSize: 28, fontWeight: 700, color: P.textPrimary, marginBottom: 20 }}>Money</div>
        <OutlineBtn label="Transaction History" icon={History} fullWidth onClick={() => setSub({ type: "txHistory" })} />
        <div style={{ marginTop: 28 }}>
          <SectionLabel>Bank Accounts</SectionLabel>
          <div style={{ border: `1px solid ${P.border}`, borderRadius: 12, overflow: "hidden" }}>
            {BANK_ACCOUNTS.map((bank, i) => (
              <div key={bank.id} style={{ height: 56, display: "flex", alignItems: "center", justifyContent: "space-between", paddingLeft: 16, paddingRight: 16, borderBottom: i < BANK_ACCOUNTS.length - 1 ? `1px solid ${P.border}` : "none", boxSizing: "border-box" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <Landmark size={18} color={P.textSecondary as string} strokeWidth={1.75} />
                  <span style={{ fontSize: 15, fontWeight: 500, color: P.textPrimary }}>{bank.name}</span>
                </div>
                <SmallOutlineBtn label="Check Balance" onClick={() => setSub({ type: "pinEntry", bank })} />
              </div>
            ))}
          </div>
        </div>
        <div style={{ marginTop: 24 }}>
          <SectionLabel>Wallet Accounts</SectionLabel>
          <div style={{ border: `1px solid ${P.border}`, borderRadius: 12, padding: "10px 12px", display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
            {liveWallets.map((w) => {
              const rev = !!revealed[w.id];
              return (
                <div key={w.id} style={{ display: "flex", alignItems: "center", gap: 8, backgroundColor: P.surface, border: `1px solid ${P.border}`, borderRadius: 20, paddingLeft: 12, paddingRight: rev ? 12 : 4, height: 36, transition: "padding 150ms ease" }}>
                  <Wallet size={13} color={P.gold as string} strokeWidth={2} />
                  <span style={{ fontSize: 12, fontWeight: 500, color: P.textPrimary }}>{w.name}</span>
                  {rev ? (
                    <span style={{ fontSize: 12, fontWeight: 600, color: P.gold, marginLeft: 2 }}>{fmtINR(w.balance)}</span>
                  ) : (
                    <SmallOutlineBtn label="Check Balance" onClick={() => setRevealed((p) => ({ ...p, [w.id]: true }))} />
                  )}
                </div>
              );
            })}
            <button style={{ width: 34, height: 34, borderRadius: "50%", backgroundColor: "transparent", border: `1px solid ${P.border}`, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", outline: "none", marginLeft: "auto", flexShrink: 0, transition: "border-color 150ms ease" }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.borderColor = P.gold as string; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.borderColor = P.border as string; }}
            >
              <Plus size={16} color={P.textSecondary as string} strokeWidth={2} />
            </button>
          </div>
        </div>
        <div style={{ marginTop: 24 }}>
          <OutlineBtn label={qrVisible ? "Hide QR Code" : "Display QR Code"} icon={QrCode} fullWidth onClick={() => setQrVisible((v) => !v)} />
          {qrVisible && (
            <>
              <div style={{ marginTop: 12, backgroundColor: P.surface, border: `1px solid ${P.border}`, borderRadius: 12, padding: 20, display: "flex", justifyContent: "center" }}>
                <QRCodeSVG size={160} />
              </div>
              <div style={{ marginTop: 8, textAlign: "center", fontSize: 12, color: P.textSecondary }}>Show this to receive payments via OffPay Bluetooth</div>
            </>
          )}
        </div>
        <div style={{ marginTop: 24 }}>
          <SectionLabel>More Services</SectionLabel>
          <div style={{ border: `1px solid ${P.border}`, borderRadius: 12, overflow: "hidden" }}>
            {MORE_SERVICES.map(({ icon: Icon, label }, i) => (
              <button key={label}
                style={{ width: "100%", height: 56, backgroundColor: "transparent", border: "none", borderBottom: i < MORE_SERVICES.length - 1 ? `1px solid ${P.border}` : "none", display: "flex", alignItems: "center", gap: 14, paddingLeft: 16, paddingRight: 16, cursor: "pointer", outline: "none", transition: "background-color 120ms ease", boxSizing: "border-box" }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = P.surface as string; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = "transparent"; }}
              >
                <Icon size={18} color={P.textSecondary as string} strokeWidth={1.75} />
                <span style={{ flex: 1, fontSize: 15, fontWeight: 500, color: P.textPrimary, textAlign: "left" }}>{label}</span>
                <ChevronRight size={16} color={P.border as string} strokeWidth={2} />
              </button>
            ))}
          </div>
        </div>
      </div>
    </ScreenShell>
  );
}

// ─── Profile Screen ───────────────────────────────────────────────────────────

function ProfileScreen({ onNavigate }: { onNavigate: (s: Screen) => void }) {
  const [vanCopied, setVanCopied] = useState(false);
  const copyVAN = () => { setVanCopied(true); setTimeout(() => setVanCopied(false), 1800); };
  const rowTargets: Record<string, Screen> = { "Settings": "settings" };
  return (
    <ScreenShell>
      <div style={{ padding: "24px 16px 0" }}>
        <div style={{ marginBottom: 24 }}>
          <div style={{ fontFamily: "'Fraunces', serif", fontSize: 24, fontWeight: 700, color: P.textPrimary, lineHeight: "30px", marginBottom: 4 }}>{USER_NAME}</div>
          <div style={{ fontSize: 14, color: P.textSecondary, marginBottom: 10 }}>{USER_HANDLE} · OffPay ID</div>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
            <span style={{ fontSize: 14, fontWeight: 500, color: P.textPrimary, letterSpacing: "1px" }}>•••• •••• 4521</span>
            <button onClick={copyVAN} style={{ background: "none", border: "none", cursor: "pointer", padding: 4, display: "flex", alignItems: "center", outline: "none" }}>
              <Copy size={14} strokeWidth={2} color={vanCopied ? P.gold as string : P.textSecondary as string} />
            </button>
            {vanCopied && <span style={{ fontSize: 11, color: P.gold, fontWeight: 500 }}>Copied!</span>}
          </div>
          <div style={{ fontSize: 13, color: P.textSecondary }}>+91 98••• ••210</div>
        </div>
        <div style={{ border: `1px solid ${P.border}`, borderRadius: 12, overflow: "hidden" }}>
          {SETTINGS_ROWS.map(({ icon: Icon, label }, i) => (
            <button key={label} onClick={() => { const t = rowTargets[label]; if (t) onNavigate(t); }}
              style={{ width: "100%", height: 56, backgroundColor: "transparent", border: "none", borderBottom: i < SETTINGS_ROWS.length - 1 ? `1px solid ${P.border}` : "none", display: "flex", alignItems: "center", gap: 14, paddingLeft: 16, paddingRight: 16, cursor: "pointer", outline: "none", transition: "background-color 120ms ease", boxSizing: "border-box" }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = P.surface as string; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = "transparent"; }}
            >
              <Icon size={18} color={P.textSecondary as string} strokeWidth={1.75} />
              <span style={{ flex: 1, fontSize: 15, fontWeight: 500, color: P.textPrimary, textAlign: "left" }}>{label}</span>
              <ChevronRight size={16} color={P.border as string} strokeWidth={2} />
            </button>
          ))}
        </div>
      </div>
    </ScreenShell>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// ONBOARDING FLOW
// ══════════════════════════════════════════════════════════════════════════════

type OnboardStep = 1 | 2 | 3;

function OffPayLogo() {
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", marginBottom: 40 }}>
      <div style={{ width: 56, height: 56, borderRadius: 16, backgroundColor: "var(--c-badge-bg)", border: `1.5px solid ${P.gold}`, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 12 }}>
        <Bluetooth size={28} color={P.gold as string} strokeWidth={1.75} />
      </div>
      <span style={{ fontFamily: "'Fraunces', serif", fontSize: 28, fontWeight: 700, color: P.textPrimary, letterSpacing: "-0.5px" }}>OffPay</span>
      <span style={{ fontSize: 12, color: P.textSecondary, marginTop: 4, fontFamily: "'Inter', sans-serif", letterSpacing: "0.4px" }}>Offline Payments · Peer-to-Peer</span>
    </div>
  );
}

function OnboardProgressDots({ step }: { step: OnboardStep }) {
  return (
    <div style={{ display: "flex", justifyContent: "center", gap: 6, marginBottom: 36 }}>
      {([1, 2, 3] as OnboardStep[]).map((i) => {
        const isCurrent  = i === step;
        const isPast     = i < step;
        return (
          <div key={i} style={{
            height: 6, borderRadius: 3,
            width: isCurrent ? 22 : 6,
            backgroundColor: (isCurrent || isPast) ? P.gold : P.border,
            transition: "width 250ms cubic-bezier(.34,1.56,.64,1), background-color 200ms ease",
          }} />
        );
      })}
    </div>
  );
}

// ── Screen 1: Phone Entry ─────────────────────────────────────────────────────

function PhoneEntryScreen({ onNext }: { onNext: (phone: string) => void }) {
  const [phone,   setPhone]   = useState("");
  const [focused, setFocused] = useState(false);
  const isValid = phone.length === 10;

  return (
    <div style={{ padding: "0 24px", display: "flex", flexDirection: "column" }}>
      <OffPayLogo />
      <OnboardProgressDots step={1} />

      <div style={{ fontFamily: "'Fraunces', serif", fontSize: 24, fontWeight: 700, color: P.textPrimary, marginBottom: 24, lineHeight: "30px" }}>
        Enter your phone number
      </div>

      {/* Phone input */}
      <div style={{ display: "flex", alignItems: "center", height: 52, backgroundColor: P.surface, borderRadius: 14, border: `1.5px solid ${focused ? P.gold : P.border}`, overflow: "hidden", marginBottom: 12, transition: "border-color 150ms ease" }}>
        <div style={{ paddingLeft: 14, paddingRight: 10, fontSize: 16, fontWeight: 600, color: P.textSecondary, fontFamily: "'Inter', sans-serif", whiteSpace: "nowrap", borderRight: `1px solid ${P.border}`, height: "100%", display: "flex", alignItems: "center" }}>+91</div>
        <input
          type="tel" inputMode="numeric" placeholder="10-digit mobile number"
          value={phone}
          onChange={(e) => setPhone(e.target.value.replace(/\D/g, "").slice(0, 10))}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          autoFocus
          style={{ flex: 1, background: "transparent", border: "none", outline: "none", fontSize: 16, color: P.textPrimary, fontFamily: "'Inter', sans-serif", paddingLeft: 14, paddingRight: 14, letterSpacing: "1.5px", caretColor: P.gold as string }}
        />
      </div>

      <div style={{ fontSize: 14, color: P.textSecondary, marginBottom: 32, fontFamily: "'Inter', sans-serif" }}>
        {"We'll send you a one-time code"}
      </div>

      <GoldButton label="Continue" disabled={!isValid} onClick={() => onNext(phone)} />
    </div>
  );
}

// ── Screen 2: OTP Verification ────────────────────────────────────────────────

const OTP_LENGTH = 6;

function OTPVerifyScreen({ phone, onNext, onBack }: { phone: string; onNext: () => void; onBack: () => void }) {
  const [digits,     setDigits]     = useState<string[]>(Array(OTP_LENGTH).fill(""));
  const [countdown,  setCountdown]  = useState(30);
  const [focusedIdx, setFocusedIdx] = useState(0);
  const inputRefs = useRef<(HTMLInputElement | null)[]>(Array(OTP_LENGTH).fill(null));

  useEffect(() => {
    inputRefs.current[0]?.focus();
  }, []);

  useEffect(() => {
    if (countdown <= 0) return;
    const id = setInterval(() => setCountdown((c) => c - 1), 1000);
    return () => clearInterval(id);
  }, [countdown]);

  const handleChange = (idx: number, val: string) => {
    const digit = val.replace(/\D/g, "").slice(-1);
    const next = [...digits];
    next[idx] = digit;
    setDigits(next);
    if (digit && idx < OTP_LENGTH - 1) {
      inputRefs.current[idx + 1]?.focus();
      setFocusedIdx(idx + 1);
    }
  };

  const handleKeyDown = (idx: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace") {
      if (digits[idx]) {
        const next = [...digits]; next[idx] = ""; setDigits(next);
      } else if (idx > 0) {
        const next = [...digits]; next[idx - 1] = ""; setDigits(next);
        inputRefs.current[idx - 1]?.focus();
        setFocusedIdx(idx - 1);
      }
    } else if (e.key === "ArrowLeft" && idx > 0) {
      inputRefs.current[idx - 1]?.focus(); setFocusedIdx(idx - 1);
    } else if (e.key === "ArrowRight" && idx < OTP_LENGTH - 1) {
      inputRefs.current[idx + 1]?.focus(); setFocusedIdx(idx + 1);
    }
  };

  const isComplete  = digits.every((d) => d !== "");
  const maskedPhone = `+91 XXXXX ${phone.slice(-4)}`;
  const mins = 0;
  const secs = countdown < 10 ? `0${countdown}` : `${countdown}`;

  return (
    <div style={{ padding: "0 24px", display: "flex", flexDirection: "column" }}>
      <div style={{ display: "flex", alignItems: "center", marginBottom: 32 }}>
        <button onClick={onBack} style={{ width: 36, height: 36, borderRadius: "50%", backgroundColor: P.surface, border: `1px solid ${P.border}`, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", outline: "none", flexShrink: 0 }}>
          <ArrowLeft size={18} color={P.textPrimary as string} strokeWidth={2} />
        </button>
      </div>
      <OnboardProgressDots step={2} />

      <div style={{ fontFamily: "'Fraunces', serif", fontSize: 24, fontWeight: 700, color: P.textPrimary, marginBottom: 10, lineHeight: "30px" }}>
        Verify your number
      </div>
      <div style={{ fontSize: 14, color: P.textSecondary, marginBottom: 32, fontFamily: "'Inter', sans-serif", lineHeight: "20px" }}>
        Enter the 6-digit code sent to <span style={{ color: P.textPrimary, fontWeight: 500 }}>{maskedPhone}</span>
      </div>

      {/* OTP boxes */}
      <div style={{ display: "flex", gap: 10, marginBottom: 24, justifyContent: "space-between" }}>
        {digits.map((d, i) => {
          const isActive = focusedIdx === i;
          const isFilled = d !== "";
          return (
            <input
              key={i}
              ref={(el) => { inputRefs.current[i] = el; }}
              type="tel" inputMode="numeric"
              maxLength={1}
              value={d}
              onChange={(e) => handleChange(i, e.target.value)}
              onKeyDown={(e) => handleKeyDown(i, e)}
              onFocus={() => setFocusedIdx(i)}
              style={{
                width: 44, height: 54, borderRadius: 12, textAlign: "center",
                fontSize: 22, fontWeight: 600, color: P.textPrimary,
                fontFamily: "'Fraunces', serif",
                backgroundColor: isFilled ? "var(--c-badge-bg)" : P.surface,
                border: `1.5px solid ${isActive || isFilled ? P.gold : P.border}`,
                outline: "none", cursor: "pointer",
                caretColor: P.gold as string,
                transition: "border-color 150ms ease, background-color 150ms ease",
              }}
            />
          );
        })}
      </div>

      {/* Countdown / resend */}
      <div style={{ marginBottom: 32, textAlign: "center" }}>
        {countdown > 0 ? (
          <span style={{ fontSize: 14, color: P.textSecondary, fontFamily: "'Inter', sans-serif" }}>
            Resend code in <span style={{ fontWeight: 600 }}>{mins}:{secs}</span>
          </span>
        ) : (
          <button onClick={() => { setCountdown(30); setDigits(Array(OTP_LENGTH).fill("")); inputRefs.current[0]?.focus(); setFocusedIdx(0); }}
            style={{ background: "none", border: "none", cursor: "pointer", fontSize: 14, fontWeight: 600, color: P.gold, fontFamily: "'Inter', sans-serif", outline: "none", padding: 0, transition: "opacity 150ms ease" }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.opacity = "0.75"; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.opacity = "1"; }}
          >Resend code</button>
        )}
      </div>

      <GoldButton label="Verify" disabled={!isComplete} onClick={onNext} />
    </div>
  );
}

// ── Screen 3: Name Entry ──────────────────────────────────────────────────────

function NameEntryScreen({ onComplete }: { onComplete: (name: string) => void }) {
  const [name,    setName]    = useState("");
  const [focused, setFocused] = useState(false);
  const isValid = name.trim().length > 0;

  return (
    <div style={{ padding: "0 24px", display: "flex", flexDirection: "column" }}>
      <div style={{ height: 68 }} />
      <OnboardProgressDots step={3} />

      <div style={{ fontFamily: "'Fraunces', serif", fontSize: 24, fontWeight: 700, color: P.textPrimary, marginBottom: 10, lineHeight: "30px" }}>
        {"What should we call you?"}
      </div>
      <div style={{ fontSize: 14, color: P.textSecondary, marginBottom: 28, fontFamily: "'Inter', sans-serif", lineHeight: "20px" }}>
        {"This is how you'll appear to other OffPay users."}
      </div>

      <div style={{ display: "flex", alignItems: "center", height: 52, backgroundColor: P.surface, borderRadius: 14, border: `1.5px solid ${focused ? P.gold : P.border}`, overflow: "hidden", marginBottom: 32, transition: "border-color 150ms ease" }}>
        <input
          type="text" placeholder="Your name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          autoFocus
          style={{ flex: 1, background: "transparent", border: "none", outline: "none", fontSize: 16, color: P.textPrimary, fontFamily: "'Inter', sans-serif", paddingLeft: 16, paddingRight: 16, caretColor: P.gold as string }}
        />
      </div>

      <GoldButton label="Get Started" disabled={!isValid} onClick={() => onComplete(name.trim())} />
    </div>
  );
}

// ── Splash Screen ────────────────────────────────────────────────────────────

function SplashScreen({ onDone }: { onDone: () => void }) {
  useEffect(() => {
    const id = setTimeout(onDone, 1800);
    return () => clearTimeout(id);
  }, [onDone]);

  return (
    <div style={{ width: 375, minHeight: "100vh", backgroundColor: "#0A0908", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
      <style>{`
        @keyframes splashFadeIn {
          from { opacity: 0; transform: scale(0.86); }
          to   { opacity: 1; transform: scale(1); }
        }
        .splash-mark { animation: splashFadeIn 300ms cubic-bezier(.25,.46,.45,.94) both; }
      `}</style>
      <div className="splash-mark" style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
        <div style={{ width: 72, height: 72, borderRadius: 20, backgroundColor: "var(--c-badge-bg)", border: "1.5px solid var(--c-gold)", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 18 }}>
          <Bluetooth size={34} color="var(--c-gold)" strokeWidth={1.75} />
        </div>
        <span style={{ fontFamily: "'Fraunces', serif", fontSize: 32, fontWeight: 700, color: "var(--c-text-pri)", letterSpacing: "-0.5px", marginBottom: 8 }}>OffPay</span>
        <span style={{ fontSize: 14, color: "var(--c-text-sec)", fontFamily: "'Inter', sans-serif", letterSpacing: "0.3px" }}>Offline Payments · Peer-to-Peer</span>
      </div>
    </div>
  );
}

// ── Biometric Lock Screen ────────────────────────────────────────────────────

function BiometricLockScreen({ onAuth }: { onAuth: () => void }) {
  const [mode,    setMode]    = useState<"biometric" | "pin">("biometric");
  const [pin,     setPin]     = useState("");
  const [error,   setError]   = useState(false);
  const [success, setSuccess] = useState(false);

  const handleBioTap = () => {
    if (success) return;
    setSuccess(true);
    setTimeout(onAuth, 680);
  };

  const handlePinDigit = (d: string) => {
    if (pin.length >= 4) return;
    const next = pin + d;
    setPin(next); setError(false);
    if (next.length === 4) {
      setTimeout(() => {
        if (next === CORRECT_PIN) { onAuth(); }
        else { setError(true); setPin(""); }
      }, 120);
    }
  };

  if (mode === "pin") return (
    <ScreenShell>
      <div style={{ padding: "24px 24px 0" }}>
        <button onClick={() => { setMode("biometric"); setPin(""); setError(false); }}
          style={{ width: 36, height: 36, borderRadius: "50%", backgroundColor: P.surface, border: `1px solid ${P.border}`, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", outline: "none", marginBottom: 40 }}>
          <ArrowLeft size={18} color={P.textPrimary as string} strokeWidth={2} />
        </button>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", marginBottom: 44 }}>
          <div style={{ fontFamily: "'Fraunces', serif", fontSize: 22, fontWeight: 700, color: P.textPrimary, marginBottom: 8 }}>Enter your PIN</div>
          <div style={{ fontSize: 14, color: P.textSecondary }}>4-digit PIN to unlock OffPay</div>
        </div>
        <div style={{ display: "flex", gap: 20, justifyContent: "center", marginBottom: 10 }}>
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} style={{ width: 18, height: 18, borderRadius: "50%", backgroundColor: i < pin.length ? P.gold : "transparent", border: `2px solid ${error ? "#EF4444" : i < pin.length ? P.gold : P.border}`, transition: "all 120ms ease" }} />
          ))}
        </div>
        {error && <div style={{ textAlign: "center", fontSize: 13, color: "#EF4444", marginBottom: 6 }}>Incorrect PIN. Try 1234.</div>}
        <div style={{ height: 28 }} />
        <NumericKeypad onDigit={handlePinDigit} onDelete={() => { setPin((p) => p.slice(0, -1)); setError(false); }} />
      </div>
    </ScreenShell>
  );

  return (
    <ScreenShell>
      <style>{`
        @keyframes bioPulse{0%,100%{transform:scale(1);opacity:1}50%{transform:scale(1.06);opacity:.82}}
        @keyframes bioSuccess{0%{transform:scale(1)}35%{transform:scale(1.22)}70%{transform:scale(.96)}100%{transform:scale(1)}}
        .bio-idle{animation:bioPulse 1.5s ease-in-out infinite}
        .bio-ok{animation:bioSuccess 640ms cubic-bezier(.34,1.56,.64,1) forwards}
      `}</style>
      <div style={{ minHeight: "82vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "0 24px" }}>
        <button onClick={handleBioTap} style={{ background: "none", border: "none", cursor: success ? "default" : "pointer", outline: "none", marginBottom: 28 }}>
          <div className={success ? "bio-ok" : "bio-idle"}
            style={{ width: 88, height: 88, borderRadius: 24, backgroundColor: success ? "rgba(201,168,87,0.18)" : "var(--c-badge-bg)", border: `1.5px solid ${success ? P.gold : P.border}`, display: "flex", alignItems: "center", justifyContent: "center", transition: "border-color 200ms ease, background-color 200ms ease" }}
          >
            <IconFingerprint size={46} color={P.gold as string} stroke={1.5} />
          </div>
        </button>

        <div style={{ fontFamily: "'Fraunces', serif", fontSize: 22, fontWeight: 700, color: P.textPrimary, marginBottom: 8, textAlign: "center" }}>
          Unlock OffPay
        </div>
        <div style={{ fontSize: 14, color: P.textSecondary, textAlign: "center", marginBottom: 52, minHeight: 20, transition: "opacity 200ms ease" }}>
          {success ? "Verified…" : "Tap to unlock with biometric"}
        </div>

        {!success && (
          <button onClick={() => setMode("pin")}
            style={{ background: "none", border: "none", cursor: "pointer", fontSize: 14, fontWeight: 600, color: P.gold, fontFamily: "'Inter', sans-serif", outline: "none", padding: "8px 0", transition: "opacity 150ms ease" }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.opacity = "0.65"; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.opacity = "1"; }}
          >Use PIN instead</button>
        )}
      </div>
    </ScreenShell>
  );
}

// ── Bluetooth Permission Screen ───────────────────────────────────────────────

function BluetoothPermissionScreen({ onEnable, onSkip }: { onEnable: () => void; onSkip: () => void }) {
  const [enabling, setEnabling] = useState(false);
  return (
    <ScreenShell>
      <div style={{ minHeight: "82vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "0 24px" }}>
        <div style={{ width: 72, height: 72, borderRadius: 20, backgroundColor: "var(--c-badge-bg)", border: `1.5px solid ${P.gold}`, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 24 }}>
          <Bluetooth size={34} color={P.gold as string} strokeWidth={1.75} />
        </div>

        <div style={{ fontFamily: "'Fraunces', serif", fontSize: 22, fontWeight: 700, color: P.textPrimary, marginBottom: 14, textAlign: "center" }}>
          OffPay needs Bluetooth
        </div>
        <div style={{ fontSize: 15, color: P.textSecondary, textAlign: "center", maxWidth: 280, lineHeight: "22px", marginBottom: 44 }}>
          We use Bluetooth to send and receive money offline — no internet required. Your data stays on your device.
        </div>

        <div style={{ width: "100%", display: "flex", flexDirection: "column", alignItems: "center", gap: 16 }}>
          <GoldButton label={enabling ? "Enabling…" : "Enable Bluetooth"} disabled={enabling}
            onClick={() => { setEnabling(true); setTimeout(onEnable, 500); }} />
          <button onClick={onSkip}
            style={{ background: "none", border: "none", cursor: "pointer", fontSize: 13, fontWeight: 500, color: P.textSecondary, fontFamily: "'Inter', sans-serif", outline: "none", padding: "6px 0", transition: "color 150ms ease" }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.color = P.textPrimary as string; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.color = P.textSecondary as string; }}
          >Not now</button>
        </div>
      </div>
    </ScreenShell>
  );
}

// ── Onboarding container ──────────────────────────────────────────────────────

function OnboardingFlow({ onComplete }: { onComplete: (name: string) => void }) {
  const [step,  setStep]  = useState<OnboardStep>(1);
  const [phone, setPhone] = useState("");

  return (
    <div style={{ width: 375, minHeight: "100vh", backgroundColor: P.bg, fontFamily: "'Inter', sans-serif" }}>
      <style>{`
        @keyframes slideInRight{from{opacity:0;transform:translateX(28px)}to{opacity:1;transform:translateX(0)}}
        @keyframes slideInLeft{from{opacity:0;transform:translateX(-28px)}to{opacity:1;transform:translateX(0)}}
        .obStep{animation:slideInRight 260ms cubic-bezier(.25,.46,.45,.94) forwards}
        .obBack{animation:slideInLeft  260ms cubic-bezier(.25,.46,.45,.94) forwards}
      `}</style>
      <div style={{ height: 64 }} />
      <div key={step} className="obStep">
        {step === 1 && <PhoneEntryScreen onNext={(p) => { setPhone(p); setStep(2); }} />}
        {step === 2 && <OTPVerifyScreen phone={phone} onNext={() => setStep(3)} onBack={() => setStep(1)} />}
        {step === 3 && <NameEntryScreen onComplete={onComplete} />}
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// HOME SCREEN COMPONENTS
// ══════════════════════════════════════════════════════════════════════════════

function ActionButton({ icon: Icon, label, onClick }: { icon: React.ElementType; label: string; onClick: () => void }) {
  const [pressed, setPressed] = useState(false);
  const [hovered, setHovered] = useState(false);
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8, cursor: "pointer" }}
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => { setHovered(false); setPressed(false); }}
      onMouseDown={() => setPressed(true)}
      onMouseUp={() => setPressed(false)}
    >
      <div style={{ width: 72, height: 72, borderRadius: 20, backgroundColor: pressed ? "var(--c-badge-bg)" : P.surface, border: `1.5px solid ${hovered || pressed ? P.gold : "transparent"}`, display: "flex", alignItems: "center", justifyContent: "center", transition: "background-color 150ms ease, border-color 150ms ease", transform: pressed ? "scale(0.94)" : "scale(1)" }}>
        <div style={{ width: 56, height: 56, borderRadius: "50%", backgroundColor: "var(--c-badge-bg)", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <Icon size={28} color={P.gold} stroke={1.75} />
        </div>
      </div>
      <span style={{ fontSize: 12, fontWeight: 500, color: hovered ? P.textPrimary : P.textSecondary, textAlign: "center", lineHeight: "16px", maxWidth: 90, fontFamily: "'Inter', sans-serif", transition: "color 150ms ease" }}>{label}</span>
    </div>
  );
}

function ActionsCarousel({ onPageChange, onAction, walletBalance, bankBalance }: { onPageChange: (p: number) => void; onAction: (s: Screen) => void; walletBalance: number; bankBalance: number }) {
  const [page,        setPage]        = useState(0);
  const [balanceView, setBalanceView] = useState<BalanceKey | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  const handleScroll = () => {
    if (!scrollRef.current) return;
    const idx = Math.round(scrollRef.current.scrollLeft / 343);
    const c = Math.max(0, Math.min(idx, 1));
    setPage(c); onPageChange(c);
  };
  const scrollTo = (idx: number) => {
    scrollRef.current?.scrollTo({ left: idx * 343, behavior: "smooth" });
    setPage(idx); onPageChange(idx);
  };

  const page2H  = balanceView !== null ? 140 : GRID_HEIGHT;
  const trackH  = page === 0 ? GRID_HEIGHT : page2H;
  const liveAmt = { wallet: walletBalance, bank: bankBalance };

  return (
    <div style={{ marginTop: 24, marginLeft: 16, width: 343 }}>
      <div ref={scrollRef} onScroll={handleScroll}
        style={{ display: "flex", overflowX: "auto", scrollSnapType: "x mandatory", scrollbarWidth: "none", height: trackH, transition: "height 250ms ease" }}
      >
        <div style={{ scrollSnapAlign: "start", flexShrink: 0, width: 343, display: "grid", gridTemplateColumns: "repeat(3, calc((343px - 32px) / 3))", gridTemplateRows: "95px 95px", gap: 16, alignContent: "start", height: GRID_HEIGHT }}>
          {ACTIONS.map((a) => <ActionButton key={a.label} icon={a.icon} label={a.label} onClick={() => onAction(a.screen)} />)}
        </div>
        <div style={{ scrollSnapAlign: "start", flexShrink: 0, width: 343, height: page2H, display: "flex", alignItems: "center", justifyContent: "center", transition: "height 250ms ease" }}>
          {balanceView === null ? (
            <div style={{ display: "flex", gap: 12, width: "100%" }}>
              {(["wallet","bank"] as BalanceKey[]).map((key) => (
                <button key={key} onClick={() => setBalanceView(key)}
                  style={{ flex: 1, height: 44, backgroundColor: P.gold, border: "none", borderRadius: 12, fontSize: 13, fontWeight: 600, color: P.bg, cursor: "pointer", fontFamily: "'Inter', sans-serif", transition: "background-color 150ms ease", outline: "none" }}
                  onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = P.goldDark as string; }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = P.gold as string; }}
                >{key === "wallet" ? "View Wallet Balance" : "View Bank Balance"}</button>
              ))}
            </div>
          ) : (
            <div style={{ width: "100%", height: 140, backgroundColor: P.surface, border: `1px solid ${P.border}`, borderRadius: 12, padding: "16px 16px 14px", boxSizing: "border-box", display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
              <span style={{ fontSize: 14, fontWeight: 500, color: P.textSecondary }}>{BALANCES[balanceView].label}</span>
              <div style={{ textAlign: "center" }}>
                <span style={{ fontFamily: "'Fraunces', serif", fontSize: 34, fontWeight: 700, color: P.textPrimary, letterSpacing: "-0.5px" }}>{fmtINR(liveAmt[balanceView])}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "flex-end" }}>
                <button onClick={() => setBalanceView(null)} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 13, fontWeight: 500, color: P.gold, fontFamily: "'Inter', sans-serif", padding: 0, outline: "none" }}>Hide</button>
              </div>
            </div>
          )}
        </div>
      </div>
      <div style={{ display: "flex", justifyContent: "center", gap: 6, marginTop: 12 }}>
        {[0,1].map((i) => (
          <button key={i} onClick={() => scrollTo(i)} style={{ width: i === page ? 18 : 6, height: 6, borderRadius: 3, backgroundColor: i === page ? P.gold : P.border, border: "none", padding: 0, cursor: "pointer", transition: "width 200ms ease, background-color 200ms ease", outline: "none" }} />
        ))}
      </div>
    </div>
  );
}

// ── Search results pool ───────────────────────────────────────────────────────
const SEARCH_POOL = [
  { label: "Rajesh Kumar",    sub: "Sent ₹3,200 · Sep 2026",    screen: "sendPhone"    as Screen },
  { label: "Swiggy",          sub: "Paid ₹480 · Sep 2026",      screen: "sendPhone"    as Screen },
  { label: "Jio Recharge",    sub: "Bill ₹299 · Sep 2026",      screen: "billsRecharge" as Screen },
  { label: "Ananya Sharma",   sub: "Received ₹1,500 · Sep 2026",screen: "sendPhone"    as Screen },
  { label: "HDFC Transfer",   sub: "Sent ₹5,000 · Aug 2026",    screen: "sendUPI"      as Screen },
  { label: "Zomato",          sub: "Paid ₹640 · Aug 2026",      screen: "billsRecharge" as Screen },
  { label: "BSES Electricity",sub: "Bill ₹1,240 · Aug 2026",    screen: "billsRecharge" as Screen },
  { label: "Priya Mehta",     sub: "Received ₹800 · Aug 2026",  screen: "sendPhone"    as Screen },
];

// ── HomeScreen ─────────────────────────────────────────────────────────────────

function HomeScreen({ onNavigate, onTabSwitch, walletBalance, bankBalance, userName, bluetoothEnabled, onEnableBluetooth, onTxSelect, onNotifOpen, unreadCount, offlineBanner, onDismissOffline }: {
  onNavigate: (s: Screen) => void;
  onTabSwitch: (t: NavKey) => void;
  walletBalance: number;
  bankBalance: number;
  userName: string;
  bluetoothEnabled: boolean;
  onEnableBluetooth: () => void;
  onTxSelect?: (tx: TxDetailData) => void;
  onNotifOpen?: () => void;
  unreadCount?: number;
  offlineBanner?: boolean;
  onDismissOffline?: () => void;
}) {
  const [carouselPage,   setCarouselPage]   = useState(0);
  const [searchQuery,    setSearchQuery]    = useState("");
  const [searchFocused,  setSearchFocused]  = useState(false);
  const [pressedBiz,     setPressedBiz]     = useState<number | null>(null);
  const [pressedCircle,  setPressedCircle]  = useState(false);

  const navTip = (s: Screen) => {
    onNavigate(s);
    if (s === "profile" || s === "settings") onTabSwitch("profile");
  };

  const searchResults = searchQuery.trim().length > 0
    ? SEARCH_POOL.filter((r) =>
        r.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.sub.toLowerCase().includes(searchQuery.toLowerCase())
      ).slice(0, 4)
    : [];

  return (
    <div style={{ width: 375, minHeight: "100vh", backgroundColor: P.bg, fontFamily: "'Inter', sans-serif" }}>
      {/* Sticky header */}
      <div style={{ position: "sticky", top: 0, zIndex: 50, backgroundColor: P.bg, paddingTop: 44 }}>
        <div style={{ margin: "16px 16px 0", display: "flex", alignItems: "center", gap: 12, position: "relative" }}>
          {/* Search bar */}
          <div style={{ flex: 1, height: 44, backgroundColor: P.surface, borderRadius: 12, border: `1.5px solid ${searchFocused ? P.gold : P.border}`, display: "flex", alignItems: "center", paddingLeft: 12, paddingRight: 12, gap: 8, transition: "border-color 150ms ease", position: "relative" }}>
            <Search size={16} color={searchFocused ? P.gold as string : P.textSecondary as string} strokeWidth={2} style={{ flexShrink: 0, transition: "color 150ms ease" }} />
            <input
              type="text"
              placeholder="Search transactions, contacts…"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={() => setSearchFocused(true)}
              onBlur={() => setTimeout(() => setSearchFocused(false), 150)}
              style={{ flex: 1, background: "transparent", border: "none", outline: "none", fontSize: 14, color: P.textPrimary, fontFamily: "'Inter', sans-serif", caretColor: P.gold as string }}
            />
            {searchQuery && (
              <button onClick={() => setSearchQuery("")} style={{ background: "none", border: "none", cursor: "pointer", padding: 2, outline: "none", display: "flex", alignItems: "center", flexShrink: 0 }}>
                <X size={14} color={P.textSecondary as string} strokeWidth={2} />
              </button>
            )}
          </div>
          {/* Bell / notifications */}
          <button onClick={onNotifOpen}
            style={{ width: 44, height: 44, borderRadius: "50%", backgroundColor: P.surface, border: `1px solid ${P.border}`, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", flexShrink: 0, outline: "none", transition: "box-shadow 150ms ease", position: "relative" }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.boxShadow = `0 0 0 2px ${P.gold}`; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.boxShadow = "none"; }}
          >
            <Bell size={18} color={P.textSecondary as string} strokeWidth={1.75} />
            {(unreadCount ?? 0) > 0 && (
              <span style={{ position: "absolute", top: 8, right: 8, width: 8, height: 8, borderRadius: "50%", backgroundColor: P.gold as string, border: `1.5px solid ${P.bg}` }} />
            )}
          </button>
          {/* Profile avatar */}
          <button onClick={() => { onTabSwitch("profile"); onNavigate("profile"); }}
            style={{ width: 44, height: 44, borderRadius: "50%", backgroundColor: P.surface, border: `1px solid ${P.border}`, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", flexShrink: 0, outline: "none", transition: "box-shadow 150ms ease" }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.boxShadow = `0 0 0 2px ${P.gold}`; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.boxShadow = "none"; }}
          >
            <User size={20} color={P.gold as string} strokeWidth={1.75} />
          </button>

          {/* Search results dropdown */}
          {searchFocused && searchQuery.trim().length > 0 && (
            <div style={{ position: "absolute", top: 50, left: 0, right: 52, backgroundColor: P.surface, border: `1px solid ${P.border}`, borderRadius: 12, overflow: "hidden", zIndex: 100, boxShadow: "0 8px 24px rgba(0,0,0,0.3)" }}>
              {searchResults.length === 0 ? (
                <div style={{ padding: "14px 16px", fontSize: 13, color: P.textSecondary }}>No results for "{searchQuery}"</div>
              ) : searchResults.map((r, i) => (
                <button key={r.label + i}
                  onMouseDown={() => { setSearchQuery(""); onNavigate(r.screen); }}
                  style={{ width: "100%", height: 54, backgroundColor: "transparent", border: "none", borderBottom: i < searchResults.length - 1 ? `1px solid ${P.border}` : "none", display: "flex", flexDirection: "column", justifyContent: "center", paddingLeft: 16, paddingRight: 16, cursor: "pointer", outline: "none", textAlign: "left", transition: "background-color 100ms ease", boxSizing: "border-box" }}
                  onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = P.border as string; }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = "transparent"; }}
                >
                  <span style={{ fontSize: 14, fontWeight: 500, color: P.textPrimary, fontFamily: "'Inter', sans-serif" }}>{r.label}</span>
                  <span style={{ fontSize: 12, color: P.textSecondary, fontFamily: "'Inter', sans-serif", marginTop: 2 }}>{r.sub}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Scrollable body */}
      <div style={{ overflowY: "auto", paddingBottom: 80 }}>
        <BannerTips onNavigate={navTip} />

        {/* Offline banner */}
        {offlineBanner && (
          <ErrorBanner
            variant="warn"
            icon={WifiOff}
            text="You're offline. Balance and settlement status may be outdated."
            onDismiss={onDismissOffline}
          />
        )}

        {/* Bluetooth off warning strip */}
        {!bluetoothEnabled && (
          <div style={{ margin: "12px 16px 0", backgroundColor: "rgba(201,168,87,0.07)", border: `1px solid rgba(201,168,87,0.22)`, borderRadius: 10, padding: "10px 14px", display: "flex", alignItems: "center", gap: 10 }}>
            <Bluetooth size={15} color={P.gold as string} strokeWidth={2} style={{ flexShrink: 0 }} />
            <span style={{ flex: 1, fontSize: 12, color: P.textSecondary, fontFamily: "'Inter', sans-serif", lineHeight: "16px" }}>
              Bluetooth off · Send & Request features disabled
            </span>
            <button onClick={onEnableBluetooth}
              style={{ background: "none", border: "none", cursor: "pointer", fontSize: 12, fontWeight: 600, color: P.gold, fontFamily: "'Inter', sans-serif", outline: "none", padding: 0, flexShrink: 0, transition: "opacity 150ms ease" }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.opacity = "0.65"; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.opacity = "1"; }}
            >Enable</button>
          </div>
        )}

        <div style={{ marginTop: 24, marginLeft: carouselPage === 0 ? 16 : 0, paddingRight: carouselPage === 1 ? 16 : undefined, fontSize: 24, fontWeight: 700, fontFamily: "'Fraunces', serif", color: P.textPrimary, lineHeight: "30px", letterSpacing: "-0.3px", textAlign: carouselPage === 1 ? "center" : "left", transition: "text-align 200ms ease", width: carouselPage === 1 ? 375 : undefined }}>
          {carouselPage === 0 ? `Hello, ${userName}` : "Your Money"}
        </div>

        <ActionsCarousel onPageChange={setCarouselPage} onAction={onNavigate} walletBalance={walletBalance} bankBalance={bankBalance} />

        {/* Wallet Circle card */}
        <div style={{ marginTop: 20, marginLeft: 16, marginRight: 16 }}>
          <button
            onClick={() => onNavigate("walletCircle")}
            onMouseDown={() => setPressedCircle(true)}
            onMouseUp={() => setPressedCircle(false)}
            onMouseLeave={() => setPressedCircle(false)}
            style={{ width: "100%", height: 80, backgroundColor: pressedCircle ? "var(--c-badge-bg)" : P.surface, border: `1px solid ${pressedCircle ? P.gold : P.border}`, borderRadius: 16, display: "flex", alignItems: "center", gap: 14, paddingLeft: 16, paddingRight: 16, cursor: "pointer", outline: "none", transition: "all 150ms ease", boxSizing: "border-box", transform: pressedCircle ? "scale(0.98)" : "scale(1)" }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.borderColor = P.gold as string; }}
          >
            <div style={{ width: 44, height: 44, borderRadius: "50%", backgroundColor: "var(--c-badge-bg)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <IconUsersGroup size={22} color={P.gold} stroke={1.75} />
            </div>
            <div style={{ flex: 1, textAlign: "left" }}>
              <div style={{ fontSize: 16, fontWeight: 600, color: P.textPrimary, fontFamily: "'Inter', sans-serif", marginBottom: 3 }}>Wallet Circle</div>
              <div style={{ fontSize: 12, color: P.textSecondary, fontFamily: "'Inter', sans-serif", lineHeight: "16px" }}>Send pocket money to family members with spending limits.</div>
            </div>
            <ChevronRight size={16} color={P.textSecondary as string} strokeWidth={2} />
          </button>
        </div>

        {/* Frequently Paid */}
        <div style={{ marginTop: 24, marginLeft: 16, marginRight: 16 }}>
          <div style={{ fontSize: 16, fontWeight: 600, color: P.textPrimary, fontFamily: "'Inter', sans-serif", marginBottom: 14 }}>Frequently Paid</div>
          <div style={{ display: "flex", gap: 12, overflowX: "auto", paddingBottom: 4, scrollbarWidth: "none" }}>
            {FREQUENT_BUSINESSES.map((b, idx) => {
              const isPressed = pressedBiz === idx;
              return (
                <div key={b.name}
                  onClick={() => onNavigate("sendPhone")}
                  onMouseDown={() => setPressedBiz(idx)}
                  onMouseUp={() => setPressedBiz(null)}
                  onMouseLeave={() => setPressedBiz(null)}
                  style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8, flexShrink: 0, cursor: "pointer", transform: isPressed ? "scale(0.90)" : "scale(1)", transition: "transform 120ms ease" }}
                >
                  <div style={{ width: 52, height: 52, borderRadius: "50%", backgroundColor: isPressed ? "var(--c-badge-bg)" : P.surface, border: `1.5px solid ${isPressed ? P.gold : P.border}`, display: "flex", alignItems: "center", justifyContent: "center", transition: "all 120ms ease" }}>
                    <span style={{ fontSize: 14, fontWeight: 700, color: avatarColor(idx), fontFamily: "'Inter', sans-serif" }}>{b.initials}</span>
                  </div>
                  <span style={{ fontSize: 11, fontWeight: 500, color: isPressed ? P.textPrimary : P.textSecondary, fontFamily: "'Inter', sans-serif", textAlign: "center", maxWidth: 64, lineHeight: "14px", transition: "color 120ms ease" }}>{b.name}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Recent Transactions */}
        {onTxSelect && (
          <div style={{ marginTop: 24, marginLeft: 16, marginRight: 16 }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
              <div style={{ fontSize: 16, fontWeight: 600, color: P.textPrimary, fontFamily: "'Inter', sans-serif" }}>Recent Transactions</div>
              <button onClick={() => onTabSwitch("money")} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 12, fontWeight: 500, color: P.gold, fontFamily: "'Inter', sans-serif", padding: 0, outline: "none" }}>See all</button>
            </div>
            {TX_DATA[0] && TX_DATA[0].transactions.length > 0 ? (
              <div style={{ border: `1px solid ${P.border}`, borderRadius: 12, overflow: "hidden" }}>
                {TX_DATA[0].transactions.slice(0, 3).map((tx, ti) => (
                  <div key={tx.name + ti}
                    onClick={() => onTxSelect(makeTxDetail(tx, TX_DATA[0].month, ti))}
                    style={{ height: 52, display: "flex", alignItems: "center", justifyContent: "space-between", paddingLeft: 16, paddingRight: 12, borderBottom: ti < 2 ? `1px solid ${P.border}` : "none", boxSizing: "border-box", cursor: "pointer", transition: "background-color 120ms ease" }}
                    onMouseEnter={(e) => { (e.currentTarget as HTMLDivElement).style.backgroundColor = P.surface as string; }}
                    onMouseLeave={(e) => { (e.currentTarget as HTMLDivElement).style.backgroundColor = "transparent"; }}
                  >
                    <span style={{ fontSize: 14, color: P.textSecondary }}>{tx.name}</span>
                    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      <span style={{ fontSize: 14, fontWeight: 500, color: tx.credit ? P.gold : P.textPrimary }}>{tx.credit ? "+" : "−"}{tx.amount}</span>
                      <ChevronRight size={13} color={P.border as string} strokeWidth={2} />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <EmptyState icon={IconReceiptOff} title="No transactions yet" subtitle="Your recent activity will appear here once you make or receive a payment." />
            )}
          </div>
        )}

        <div style={{ height: 24 }} />
      </div>
    </div>
  );
}

// ─── Notifications Screen ─────────────────────────────────────────────────────

function NotificationsScreen({ notifs, onMarkRead, onBack }: {
  notifs: Notif[];
  onMarkRead: (id: string) => void;
  onBack: () => void;
}) {
  return (
    <ScreenShell>
      <BackHeader onBack={onBack} title="Notifications" />
      <div style={{ padding: "20px 16px 0" }}>
        {notifs.length === 0 ? (
          <EmptyState icon={BellOff} title="You're all caught up" subtitle="New activity will show up here." />
        ) : (
          <div style={{ border: `1px solid ${P.border}`, borderRadius: 14, overflow: "hidden" }}>
            {notifs.map((n, i) => {
              const NIcon = NOTIF_ICONS[n.type];
              const nColor = NOTIF_COLORS[n.type];
              return (
                <div key={n.id}
                  onClick={() => onMarkRead(n.id)}
                  style={{ display: "flex", alignItems: "flex-start", gap: 12, padding: "14px 16px", borderBottom: i < notifs.length - 1 ? `1px solid ${P.border}` : "none", cursor: "pointer", transition: "background-color 120ms ease", backgroundColor: n.read ? "transparent" : `${nColor}07`, boxSizing: "border-box" }}
                  onMouseEnter={(e) => { (e.currentTarget as HTMLDivElement).style.backgroundColor = P.surface as string; }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLDivElement).style.backgroundColor = n.read ? "transparent" : `${nColor}07`; }}
                >
                  {/* unread dot */}
                  <div style={{ width: 7, height: 7, borderRadius: "50%", backgroundColor: n.read ? "transparent" : nColor, flexShrink: 0, marginTop: 6 }} />
                  {/* icon badge */}
                  <div style={{ width: 36, height: 36, borderRadius: "50%", backgroundColor: `${nColor}18`, border: `1px solid ${nColor}40`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    <NIcon size={17} color={nColor} strokeWidth={1.75} />
                  </div>
                  {/* text */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 14, fontWeight: n.read ? 500 : 600, color: P.textPrimary, fontFamily: "'Inter', sans-serif", marginBottom: 2, lineHeight: "18px" }}>{n.title}</div>
                    <div style={{ fontSize: 13, color: P.textSecondary, lineHeight: "18px" }}>{n.body}</div>
                  </div>
                  {/* timestamp */}
                  <div style={{ fontSize: 11, color: P.textSecondary, flexShrink: 0, paddingTop: 2, whiteSpace: "nowrap", fontFamily: "'Inter', sans-serif" }}>{n.time}</div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </ScreenShell>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// APP ROOT
// ══════════════════════════════════════════════════════════════════════════════

type AppPhase = "splash" | "biometric" | "onboarding" | "bluetooth" | "app";

function AppInner() {
  const [phase,            setPhase]            = useState<AppPhase>("splash");
  const [onboardingDone,   setOnboardingDone]   = useState(false);
  const [bluetoothEnabled, setBluetoothEnabled] = useState(false);
  const [userName,         setUserName]         = useState(USER_NAME);
  const [activeTab,     setActiveTab]     = useState<NavKey>("home");
  const [screen,        setScreen]        = useState<Screen>("home");
  const [walletBalance, setWalletBalance] = useState(4210);
  const [bankBalance,   setBankBalance]   = useState(108340);
  const [lastTxn,       setLastTxn]       = useState<TxnInfo | null>(null);
  const [theme,         setTheme]         = useState<Theme>("dark");
  const [selectedTx,    setSelectedTx]    = useState<TxDetailData | null>(null);
  const [txReturnTo,    setTxReturnTo]    = useState<Screen>("money");
  const [notifs,        setNotifs]        = useState<Notif[]>(INITIAL_NOTIFS);
  const [offlineBanner, setOfflineBanner] = useState(true);
  const markNotifRead = (id: string) => setNotifs((ns) => ns.map((n) => n.id === id ? { ...n, read: true } : n));
  const unreadCount = notifs.filter((n) => !n.read).length;

  const [sysDark, setSysDark] = useState(() => window.matchMedia?.("(prefers-color-scheme: dark)").matches ?? true);
  useEffect(() => {
    const mq = window.matchMedia?.("(prefers-color-scheme: dark)");
    if (!mq) return;
    const h = (e: MediaQueryListEvent) => setSysDark(e.matches);
    mq.addEventListener("change", h);
    return () => mq.removeEventListener("change", h);
  }, []);
  const effectiveTheme = theme === "system" ? (sysDark ? "dark" : "light") : theme;

  const switchTab = (key: NavKey) => { setActiveTab(key); setScreen(key); };
  const goHome    = () => { setActiveTab("home"); setScreen("home"); };

  const handleAddWalletSuccess = (info: TxnInfo) => {
    const amt = parseFloat(info.amount.replace(/[₹,]/g, ""));
    setWalletBalance((w) => w + amt);
    setBankBalance((b) => b - amt);
    setLastTxn(info);
    setScreen("addWalletSuccess");
  };

  const navBar = (
    <div style={{ position: "fixed", bottom: 0, left: "50%", transform: "translateX(-50%)", width: 375, height: 60, backgroundColor: P.surface, borderTop: `1px solid ${P.border}`, display: "flex", alignItems: "center", zIndex: 100 }}>
      {NAV_TABS.map(({ key, icon: Icon, label }) => {
        const active = activeTab === key;
        return (
          <button key={key} onClick={() => switchTab(key)}
            style={{ flex: 1, height: "100%", background: "none", border: "none", cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 4, outline: "none" }}
          >
            <Icon size={22} color={active ? P.gold as string : P.textSecondary as string} strokeWidth={active ? 2 : 1.75} />
            <span style={{ fontSize: 10, fontWeight: 500, fontFamily: "'Inter', sans-serif", color: active ? P.gold : P.textSecondary, transition: "color 150ms ease" }}>{label}</span>
          </button>
        );
      })}
    </div>
  );

  const wrap = (child: React.ReactNode) => (
    <div className={effectiveTheme === "light" ? "theme-light" : ""}
      style={{ width: 375, margin: "0 auto", position: "relative", minHeight: "100vh", backgroundColor: P.bg }}
    >{child}</div>
  );

  if (phase === "splash")
    return wrap(<SplashScreen onDone={() => setPhase("biometric")} />);

  if (phase === "biometric")
    return wrap(
      <BiometricLockScreen onAuth={() => setPhase(onboardingDone ? "app" : "onboarding")} />
    );

  if (phase === "onboarding")
    return wrap(
      <OnboardingFlow onComplete={(name) => { setUserName(name); setOnboardingDone(true); setPhase("bluetooth"); }} />
    );

  if (phase === "bluetooth")
    return wrap(
      <BluetoothPermissionScreen
        onEnable={() => { setBluetoothEnabled(true); setPhase("app"); }}
        onSkip={() => { setBluetoothEnabled(false); setPhase("app"); }}
      />
    );

  const content = (() => {
    if (screen === "addWallet")
      return <AddWalletScreen onBack={goHome} bankBalance={bankBalance} onSuccess={handleAddWalletSuccess} />;
    if (screen === "addWalletSuccess")
      return <AddWalletSuccessScreen info={lastTxn!} onDone={goHome} />;
    if (screen === "sendUPI")
      return <SendUPIScreen onBack={goHome} walletBalance={walletBalance} bankBalance={bankBalance} bluetoothEnabled={bluetoothEnabled} onEnableBluetooth={() => setPhase("bluetooth")} onDeduct={(amt, src) => { if (src === "wallet") setWalletBalance((w) => Math.max(0, w - amt)); else setBankBalance((b) => Math.max(0, b - amt)); }} />;
    if (screen === "showQR")
      return <ShowQRScreen onBack={goHome} />;
    if (screen === "sendPhone")
      return <SendPhoneScreen onBack={goHome} walletBalance={walletBalance} bluetoothEnabled={bluetoothEnabled} onEnableBluetooth={() => setPhase("bluetooth")} onDeduct={(amt) => setWalletBalance((w) => Math.max(0, w - amt))} />;
    if (screen === "requestMoney")
      return <RequestMoneyScreen onBack={goHome} bluetoothEnabled={bluetoothEnabled} onEnableBluetooth={() => setPhase("bluetooth")} />;
    if (screen === "billsRecharge")
      return <BillsRechargeScreen onBack={goHome} />;
    if (screen === "walletCircle")
      return <WalletCircleScreen onBack={goHome} />;
    if (screen === "settings")
      return <SettingsScreen
        onBack={() => setScreen("profile")} theme={theme} onThemeChange={setTheme}
        userName={userName} onUserNameChange={(n) => setUserName(n)}
        onLogout={() => { setOnboardingDone(false); setPhase("splash"); setScreen("home"); setActiveTab("home"); }}
      />;
    if (screen === "notifications")
      return <NotificationsScreen notifs={notifs} onMarkRead={markNotifRead} onBack={() => setScreen("home")} />;
    if (screen === "txDetail" && selectedTx)
      return <TxDetailScreen tx={selectedTx} onBack={() => setScreen(txReturnTo)} />;
    if (screen === "money")
      return <MoneyRoot walletBalance={walletBalance} onTxSelect={(tx) => { setSelectedTx(tx); setTxReturnTo("money"); setScreen("txDetail"); }} />;
    if (screen === "profile")
      return <ProfileScreen onNavigate={(s) => setScreen(s)} />;

    return (
      <HomeScreen
        onNavigate={(s) => setScreen(s)}
        onTabSwitch={switchTab}
        walletBalance={walletBalance}
        bankBalance={bankBalance}
        userName={userName}
        bluetoothEnabled={bluetoothEnabled}
        onEnableBluetooth={() => setPhase("bluetooth")}
        onTxSelect={(tx) => { setSelectedTx(tx); setTxReturnTo("home"); setScreen("txDetail"); }}
        onNotifOpen={() => setScreen("notifications")}
        unreadCount={unreadCount}
        offlineBanner={offlineBanner}
        onDismissOffline={() => setOfflineBanner(false)}
      />
    );
  })();

  return (
    <div className={effectiveTheme === "light" ? "theme-light" : ""}
      style={{ width: 375, margin: "0 auto", position: "relative", minHeight: "100vh", backgroundColor: P.bg }}
    >
      {content}
      {navBar}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// ACCESS GATE — founders-only lock, wraps the real app
// ══════════════════════════════════════════════════════════════════════════════

const ACCESS_CODE = "OFFPAY777";       // change this to whatever code you 3 agree on
const GATE_STORAGE_KEY = "offpay_gate_unlocked_v1";

export default function App() {
  const [unlocked, setUnlocked] = useState<boolean>(() => {
    try { return sessionStorage.getItem(GATE_STORAGE_KEY) === "1"; } catch { return false; }
  });
  const [code, setCode] = useState("");
  const [error, setError] = useState(false);

  if (unlocked) return <AppInner />;

  const tryUnlock = () => {
    if (code.trim().toUpperCase() === ACCESS_CODE) {
      try { sessionStorage.setItem(GATE_STORAGE_KEY, "1"); } catch {}
      setUnlocked(true);
    } else {
      setError(true);
      setCode("");
      setTimeout(() => setError(false), 1500);
    }
  };

  return (
    <div style={{
      minHeight: "100vh", width: "100%", background: "#0A0908",
      display: "flex", flexDirection: "column", alignItems: "center",
      justifyContent: "center", padding: 24, fontFamily: "system-ui, sans-serif",
    }}>
      <div style={{
        width: 56, height: 56, borderRadius: 16, background: "#1A1714",
        border: "1px solid #C9A857", display: "flex", alignItems: "center",
        justifyContent: "center", marginBottom: 20,
      }}>
        <span style={{ color: "#C9A857", fontSize: 24 }}>🔒</span>
      </div>
      <div style={{ color: "#F5F1EA", fontSize: 20, fontWeight: 700, marginBottom: 6 }}>
        OffPay — Founders Preview
      </div>
      <div style={{ color: "#A39B8B", fontSize: 13, marginBottom: 24, textAlign: "center" }}>
        This build is private. Enter the access code shared with the team.
      </div>
      <input
        type="password"
        value={code}
        onChange={(e) => setCode(e.target.value)}
        onKeyDown={(e) => e.key === "Enter" && tryUnlock()}
        placeholder="Access code"
        autoFocus
        style={{
          width: "100%", maxWidth: 280, height: 48, borderRadius: 12,
          border: `1.5px solid ${error ? "#EF4444" : "#334155"}`,
          background: "#1A1714", color: "#F5F1EA", fontSize: 16,
          textAlign: "center", marginBottom: 16, outline: "none",
        }}
      />
      {error && (
        <div style={{ color: "#EF4444", fontSize: 13, marginBottom: 12 }}>
          Wrong code — try again
        </div>
      )}
      <button
        onClick={tryUnlock}
        style={{
          width: "100%", maxWidth: 280, height: 48, borderRadius: 12,
          background: "#C9A857", color: "#0A0908", fontSize: 16, fontWeight: 600,
          border: "none", cursor: "pointer",
        }}
      >
        Unlock
      </button>
    </div>
  );
}
