import { useState } from "react";
import { useNotifications } from "../../context/NotificationContext";
import { notificationsApi } from "../../services/notificationsApi";

export default function NotificationBell() {
  const { notifications, unreadCount, refresh } = useNotifications();
  const [open, setOpen] = useState(false);

  async function handleMarkAllRead() {
    await notificationsApi.markAllRead();
    refresh();
  }

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        className="relative rounded-full p-2 text-gray-600 hover:bg-gray-100"
        aria-label="Notifications"
      >
        🔔
        {unreadCount > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-danger px-1 text-[10px] text-white">
            {unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 z-20 mt-2 w-80 rounded-card border border-gray-100 bg-white p-2 shadow-lg">
          <div className="flex items-center justify-between px-2 py-1">
            <span className="text-sm font-semibold">Notifications</span>
            {unreadCount > 0 && (
              <button onClick={handleMarkAllRead} className="text-xs text-primary hover:underline">
                Mark all read
              </button>
            )}
          </div>
          <div className="max-h-80 overflow-y-auto">
            {notifications.length === 0 && (
              <p className="px-2 py-6 text-center text-sm text-gray-400">No notifications yet.</p>
            )}
            {notifications.map((n) => (
              <div key={n.id} className={`rounded-lg px-2 py-2 text-sm ${n.readAt ? "" : "bg-primary-light/40"}`}>
                <p className="font-medium text-gray-800">{n.title}</p>
                <p className="text-gray-500">{n.body}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
