import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { InAppNotification } from '../types/index.ts';
import { useOrg } from './OrgContext.tsx';
import { useAuth } from './AuthContext.tsx';

interface NotificationContextType {
  notifications: InAppNotification[];
  unreadCount: number;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  clearNotification: (id: string) => void;
  addNotification: (notif: Omit<InAppNotification, 'id' | 'createdAt' | 'isRead'>) => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

function safeParse(raw: string | null): InAppNotification[] {
  if (!raw) return [];
  try {
    const value = JSON.parse(raw);
    return Array.isArray(value) ? value : [];
  } catch {
    return [];
  }
}

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { currentOrg, invoices } = useOrg();
  const { currentUser, isDemo } = useAuth();
  const storageKey = useMemo(
    () => currentUser && currentOrg ? `lp_notifications_${currentUser.uid}_${currentOrg.id}` : null,
    [currentUser?.uid, currentOrg?.id],
  );
  const [notifications, setNotifications] = useState<InAppNotification[]>([]);

  useEffect(() => {
    setNotifications(storageKey ? safeParse(localStorage.getItem(storageKey)) : []);
  }, [storageKey]);

  useEffect(() => {
    if (!storageKey) return;
    localStorage.setItem(storageKey, JSON.stringify(notifications));
  }, [storageKey, notifications]);

  useEffect(() => {
    if (!currentOrg || !currentUser || !invoices.length) return;
    const today = new Date().toISOString().split('T')[0];
    const overdueNotifications = invoices
      .filter((invoice) => invoice.balanceDue > 0 && invoice.status !== 'cancelled' && invoice.dueDate < today)
      .map<InAppNotification>((invoice) => ({
        id: `notif_overdue_${invoice.id}`,
        orgId: currentOrg.id,
        userId: currentUser.uid,
        title: `Invoice ${invoice.invoiceNumber} is Overdue`,
        message: `${invoice.customerName} has an overdue balance of ${currentOrg.currency} ${invoice.balanceDue.toFixed(2)} (Due: ${invoice.dueDate}).`,
        type: 'invoice_overdue',
        isRead: false,
        link: `/?invoice=${encodeURIComponent(invoice.id)}`,
        createdAt: new Date().toISOString(),
      }));

    setNotifications((prev) => {
      const seen = new Set(prev.map((item) => item.id));
      const missing = overdueNotifications.filter((item) => !seen.has(item.id));
      return missing.length ? [...missing, ...prev] : prev;
    });
  }, [currentOrg, currentUser, invoices, isDemo]);

  const addNotification = (notif: Omit<InAppNotification, 'id' | 'createdAt' | 'isRead'>) => {
    const notification: InAppNotification = {
      ...notif,
      userId: notif.userId || currentUser?.uid,
      id: `notif_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      isRead: false,
      createdAt: new Date().toISOString(),
    };
    setNotifications((prev) => [notification, ...prev]);
  };

  const markAsRead = (id: string) => setNotifications((prev) => prev.map((item) => item.id === id ? { ...item, isRead: true } : item));
  const markAllAsRead = () => setNotifications((prev) => prev.map((item) => ({ ...item, isRead: true })));
  const clearNotification = (id: string) => setNotifications((prev) => prev.filter((item) => item.id !== id));
  const unreadCount = notifications.filter((item) => !item.isRead).length;

  return (
    <NotificationContext.Provider value={{ notifications, unreadCount, markAsRead, markAllAsRead, clearNotification, addNotification }}>
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) throw new Error('useNotifications must be used within a NotificationProvider');
  return context;
};
