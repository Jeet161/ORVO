'use client';

import { useEffect, useState } from 'react';
import { notificationsApi, Notification } from '@/lib/api';
import { useAuth } from '@/context/auth-context';

export default function NotificationsPage() {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) notificationsApi.getAll().then(setNotifications).finally(() => setLoading(false));
    else setLoading(false);
  }, [user]);

  const markAllRead = async () => {
    await notificationsApi.markAllRead();
    setNotifications((n) => n.map((item) => ({ ...item, isRead: true })));
  };

  const markRead = async (id: string) => {
    await notificationsApi.markRead(id);
    setNotifications((n) => n.map((item) => item.id === id ? { ...item, isRead: true } : item));
  };

  return (
    <div className="container" style={{ paddingTop: 40, paddingBottom: 80, maxWidth: 680 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 28 }}>
        <h1 className="font-display" style={{ fontSize: 28, fontWeight: 700 }}>🔔 Notifications</h1>
        {notifications.some((n) => !n.isRead) && (
          <button onClick={markAllRead} className="btn btn-secondary btn-sm">Mark all as read</button>
        )}
      </div>

      {loading ? (
        [...Array(5)].map((_, i) => <div key={i} className="skeleton" style={{ height: 72, borderRadius: 12, marginBottom: 10 }} />)
      ) : notifications.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '80px 0', color: 'var(--orvo-text-muted)' }}>
          <div style={{ fontSize: 56, marginBottom: 12 }}>🔕</div>
          <p>No notifications yet.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {notifications.map((notif) => (
            <div key={notif.id}
              onClick={() => !notif.isRead && markRead(notif.id)}
              style={{
                padding: '14px 18px', borderRadius: 12, cursor: !notif.isRead ? 'pointer' : 'default',
                background: notif.isRead ? 'var(--orvo-surface)' : 'rgba(88,101,242,0.06)',
                border: `1px solid ${notif.isRead ? 'var(--orvo-border)' : 'rgba(88,101,242,0.2)'}`,
                display: 'flex', gap: 12, alignItems: 'flex-start', transition: 'all 0.2s',
              }}>
              {!notif.isRead && (
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--orvo-primary)', marginTop: 6, flexShrink: 0 }} />
              )}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 3 }}>{notif.title}</div>
                <div style={{ fontSize: 13, color: 'var(--orvo-text-muted)', lineHeight: 1.5 }}>{notif.message}</div>
                <div style={{ fontSize: 11, color: 'var(--orvo-text-faint)', marginTop: 6 }}>
                  {new Date(notif.createdAt).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
