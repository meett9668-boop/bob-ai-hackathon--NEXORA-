// appStore.ts — Centralized reactive state for the NEXORA enterprise UI
// All state lives here so Equipment, Dashboard, Map, Reports, and Search stay in sync.

import { createContext, useContext, useState, useCallback } from "react";
import type { ReactNode } from "react";
import React from "react";

// ─── Types ────────────────────────────────────────────────────────────────────
export interface Equipment {
  id: string;
  name: string;
  type: string;
  location: string;
  status: "Healthy" | "Warning" | "Critical";
  lastCheck: string;
  risk: number;
  manufacturer?: string;
  model?: string;
  installDate?: string;
  capacity?: string;
  // India map coordinates (SVG space 0-680 x 0-460)
  mapX?: number;
  mapY?: number;
  region?: string;
}

export interface AppNotification {
  id: string;
  severity: "Critical" | "Warning" | "Info";
  title: string;
  desc: string;
  time: string;
  read: boolean;
  link?: string;
}

export interface Report {
  id: string;
  title: string;
  type: string;
  generatedAt: string;
  format: "PDF" | "CSV";
  size: string;
  data?: string; // CSV string for CSV reports
}

export interface UserProfile {
  name: string;
  email: string;
  phone: string;
  jobTitle: string;
  organization: string;
  location: string;
}

// ─── Seed data ────────────────────────────────────────────────────────────────
const SEED_EQUIPMENT: Equipment[] = [
  { id: "T-104", name: "Transformer T-104", type: "Power Transformer", location: "Substation A, Gujarat", status: "Critical", lastCheck: "2h ago", risk: 78, manufacturer: "Siemens", model: "TX-220", installDate: "2019-03-12", capacity: "220/66 kV", mapX: 200, mapY: 220, region: "Gujarat" },
  { id: "CB-23", name: "Circuit Breaker CB-23", type: "Circuit Breaker", location: "North Grid, Delhi", status: "Warning", lastCheck: "4h ago", risk: 45, manufacturer: "ABB", model: "CB-500", installDate: "2020-07-15", capacity: "500 kV", mapX: 330, mapY: 140, region: "Delhi" },
  { id: "T-87", name: "Transformer T-87", type: "Power Transformer", location: "East Zone, West Bengal", status: "Warning", lastCheck: "6h ago", risk: 38, manufacturer: "BHEL", model: "TX-132", installDate: "2018-11-20", capacity: "132/33 kV", mapX: 500, mapY: 210, region: "West Bengal" },
  { id: "G-12", name: "Generator G-12", type: "Generator", location: "West Plant, Rajasthan", status: "Healthy", lastCheck: "1d ago", risk: 12, manufacturer: "GE", model: "GEN-100", installDate: "2021-01-10", capacity: "100 MW", mapX: 155, mapY: 175, region: "Rajasthan" },
  { id: "CB-56", name: "Circuit Breaker CB-56", type: "Circuit Breaker", location: "South Grid, Tamil Nadu", status: "Healthy", lastCheck: "3h ago", risk: 8, manufacturer: "Schneider", model: "CB-220", installDate: "2022-04-05", capacity: "220 kV", mapX: 340, mapY: 370, region: "Tamil Nadu" },
  { id: "T-91", name: "Transformer T-91", type: "Power Transformer", location: "Central Hub, Madhya Pradesh", status: "Healthy", lastCheck: "2d ago", risk: 15, manufacturer: "BHEL", model: "TX-400", installDate: "2017-06-30", capacity: "400/220 kV", mapX: 320, mapY: 245, region: "Madhya Pradesh" },
  { id: "F-14", name: "Feeder F-14", type: "Feeder", location: "Industrial Sector, Maharashtra", status: "Warning", lastCheck: "5h ago", risk: 42, manufacturer: "L&T", model: "FDR-11", installDate: "2019-09-18", capacity: "11 kV", mapX: 250, mapY: 285, region: "Maharashtra" },
  { id: "S-07", name: "Substation S-07", type: "Substation", location: "Midtown, Karnataka", status: "Healthy", lastCheck: "1d ago", risk: 9, manufacturer: "Siemens", model: "SS-132", installDate: "2016-12-01", capacity: "132 kV", mapX: 300, mapY: 340, region: "Karnataka" },
  { id: "G-05", name: "Generator G-05", type: "Generator", location: "North Plant, Uttar Pradesh", status: "Healthy", lastCheck: "2d ago", risk: 11, manufacturer: "GE", model: "GEN-200", installDate: "2020-03-22", capacity: "200 MW", mapX: 370, mapY: 165, region: "Uttar Pradesh" },
  { id: "CB-44", name: "Circuit Breaker CB-44", type: "Circuit Breaker", location: "West Grid, Gujarat", status: "Critical", lastCheck: "1h ago", risk: 82, manufacturer: "ABB", model: "CB-400", installDate: "2015-08-14", capacity: "400 kV", mapX: 170, mapY: 255, region: "Gujarat" },
];

const SEED_NOTIFICATIONS: AppNotification[] = [
  { id: "n1", severity: "Critical", title: "Critical: Transformer T-104", desc: "Transformer T-104 has 78% failure probability. Immediate inspection required.", time: "2 min ago", read: false, link: "/equipment/T-104" },
  { id: "n2", severity: "Warning", title: "Warning: CB-23 Vibration", desc: "Circuit Breaker CB-23 vibration levels are 3× above baseline threshold.", time: "18 min ago", read: false, link: "/equipment/CB-23" },
  { id: "n3", severity: "Critical", title: "Critical: CB-44 Contact Resistance", desc: "CB-44 contact resistance 40% above nominal. Risk of arc flash.", time: "1 hr ago", read: false, link: "/equipment/CB-44" },
  { id: "n4", severity: "Warning", title: "Warning: Transformer T-87", desc: "Oil quality degradation detected on T-87. Schedule oil quality test.", time: "3 hr ago", read: true, link: "/equipment/T-87" },
  { id: "n5", severity: "Info", title: "Maintenance report generated", desc: "Monthly equipment health report has been generated successfully.", time: "5 hr ago", read: true, link: "/reports" },
];

const SEED_REPORTS: Report[] = [
  { id: "r1", title: "Equipment Health Report", type: "Equipment Health", generatedAt: "Sep 14, 2025", format: "PDF", size: "2.4 MB" },
  { id: "r2", title: "Prediction Summary", type: "Prediction Summary", generatedAt: "Sep 15, 2025", format: "PDF", size: "1.8 MB" },
  { id: "r3", title: "Maintenance Schedule", type: "Maintenance Schedule", generatedAt: "Sep 10, 2025", format: "CSV", size: "1.2 MB" },
  { id: "r4", title: "Outage Analysis", type: "Outage Analysis", generatedAt: "Sep 12, 2025", format: "PDF", size: "3.1 MB" },
];

const SEED_PROFILE: UserProfile = {
  name: "Aarav Mehta",
  email: "admin@nexora.com",
  phone: "+91 98765 43210",
  jobTitle: "Utility Manager",
  organization: "India Power Grid Authority",
  location: "Mumbai, Maharashtra",
};

// ─── Context shape ─────────────────────────────────────────────────────────────
interface AppStoreContextValue {
  equipment: Equipment[];
  addEquipment: (eq: Omit<Equipment, "lastCheck" | "risk">) => void;
  updateEquipment: (id: string, patch: Partial<Equipment>) => void;
  deleteEquipment: (id: string) => void;

  notifications: AppNotification[];
  markNotifRead: (id: string) => void;
  markAllNotifsRead: () => void;
  unreadCount: number;

  reports: Report[];
  addReport: (r: Report) => void;

  profile: UserProfile;
  updateProfile: (patch: Partial<UserProfile>) => void;

  toast: { message: string; type: "success" | "error" | "info" } | null;
  showToast: (message: string, type?: "success" | "error" | "info") => void;
}

// ─── Context ───────────────────────────────────────────────────────────────────
export const AppStoreContext = createContext<AppStoreContextValue | null>(null);

export function AppStoreProvider({ children }: { children: ReactNode }) {
  const [equipment, setEquipment] = useState<Equipment[]>(SEED_EQUIPMENT);
  const [notifications, setNotifications] = useState<AppNotification[]>(SEED_NOTIFICATIONS);
  const [reports, setReports] = useState<Report[]>(SEED_REPORTS);
  const [profile, setProfile] = useState<UserProfile>(SEED_PROFILE);
  const [toast, setToast] = useState<AppStoreContextValue["toast"]>(null);

  const showToast = useCallback((message: string, type: "success" | "error" | "info" = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3200);
  }, []);

  const addEquipment = useCallback((eq: Omit<Equipment, "lastCheck" | "risk">) => {
    const newEq: Equipment = { ...eq, lastCheck: "Just now", risk: 5 };
    setEquipment(prev => [newEq, ...prev]);
  }, []);

  const updateEquipment = useCallback((id: string, patch: Partial<Equipment>) => {
    setEquipment(prev => prev.map(e => e.id === id ? { ...e, ...patch } : e));
  }, []);

  const deleteEquipment = useCallback((id: string) => {
    setEquipment(prev => prev.filter(e => e.id !== id));
  }, []);

  const markNotifRead = useCallback((id: string) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
  }, []);

  const markAllNotifsRead = useCallback(() => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  }, []);

  const addReport = useCallback((r: Report) => {
    setReports(prev => [r, ...prev]);
  }, []);

  const updateProfile = useCallback((patch: Partial<UserProfile>) => {
    setProfile(prev => ({ ...prev, ...patch }));
  }, []);

  const unreadCount = notifications.filter(n => !n.read).length;

  const value: AppStoreContextValue = {
    equipment, addEquipment, updateEquipment, deleteEquipment,
    notifications, markNotifRead, markAllNotifsRead, unreadCount,
    reports, addReport,
    profile, updateProfile,
    toast, showToast,
  };

  return React.createElement(AppStoreContext.Provider, { value }, children);
}

export function useAppStore(): AppStoreContextValue {
  const ctx = useContext(AppStoreContext);
  if (!ctx) throw new Error("useAppStore must be inside AppStoreProvider");
  return ctx;
}
