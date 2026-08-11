import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { apiFetch } from '../lib/api-client';

interface NotificationItem {
  id: string;
  type: string;
  title: string;
  message: string;
  read: boolean;
  createdAt: string;
}

const POLL_INTERVAL_MS = 30_000;

export function NotificationBell() {
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifications, setNotifications] = useState<NotificationItem[] | null>(null);
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function refreshCount() {
      apiFetch<{ count: number }>('/notifications/unread-count')
        .then(({ count }) => setUnreadCount(count))
        .catch(() => {});
    }

    refreshCount();
    const interval = setInterval(refreshCount, POLL_INTERVAL_MS);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (!open) return;

    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [open]);

  function toggleOpen() {
    const next = !open;
    setOpen(next);
    if (next) {
      apiFetch<NotificationItem[]>('/notifications')
        .then(setNotifications)
        .catch(() => setNotifications([]));
    }
  }

  async function markRead(notification: NotificationItem) {
    if (notification.read) return;
    setNotifications((prev) =>
      prev ? prev.map((n) => (n.id === notification.id ? { ...n, read: true } : n)) : prev,
    );
    setUnreadCount((count) => Math.max(0, count - 1));
    await apiFetch(`/notifications/${notification.id}/read`, { method: 'POST' }).catch(() => {});
  }

  return (
    <div ref={containerRef} className="relative">
      <button
        onClick={toggleOpen}
        aria-label="Notifications"
        className="relative rounded-lg p-2 text-slate-400 transition-colors hover:bg-slate-800/60 hover:text-white"
      >
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="h-5 w-5">
          <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 0 0 5.454-1.31A8.967 8.967 0 0 1 18 9.75V9A6 6 0 0 0 6 9v.75a8.967 8.967 0 0 1-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 0 1-5.714 0m5.714 0a3 3 0 1 1-5.714 0" />
        </svg>
        {unreadCount > 0 && (
          <span className="absolute right-0.5 top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-semibold text-white">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -4, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -4, scale: 0.98 }}
            transition={{ duration: 0.12 }}
            className="absolute right-0 top-full z-20 mt-2 w-80 overflow-hidden rounded-xl border border-slate-800 bg-slate-900/95 shadow-xl backdrop-blur"
          >
            <div className="border-b border-slate-800 px-4 py-2.5 text-sm font-semibold text-white">Notifications</div>
            <div className="max-h-80 overflow-y-auto">
              {notifications === null ? (
                <p className="px-4 py-6 text-center text-sm text-slate-500">Loading…</p>
              ) : notifications.length === 0 ? (
                <p className="px-4 py-6 text-center text-sm text-slate-500">You're all caught up.</p>
              ) : (
                notifications.map((notification) => (
                  <button
                    key={notification.id}
                    onClick={() => markRead(notification)}
                    className={`flex w-full flex-col gap-0.5 border-b border-slate-800/60 px-4 py-3 text-left last:border-0 hover:bg-slate-800/40 ${
                      notification.read ? '' : 'bg-indigo-500/5'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      {!notification.read && <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-indigo-400" />}
                      <span className="text-sm font-medium text-slate-200">{notification.title}</span>
                    </div>
                    <p className="text-xs text-slate-400">{notification.message}</p>
                    <p className="text-[11px] text-slate-600">{new Date(notification.createdAt).toLocaleString()}</p>
                  </button>
                ))
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
