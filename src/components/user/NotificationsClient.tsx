"use client";

import { useState } from "react";
import toast from "react-hot-toast";
import { Bell, CheckCheck, Trash2 } from "lucide-react";
import { Notification } from "@/types";
import { formatRelativeTime, cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";

const TYPE_STYLES = {
  info: "border-l-blue-400 bg-blue-50/50",
  success: "border-l-green-400 bg-green-50/50",
  warning: "border-l-yellow-400 bg-yellow-50/50",
  error: "border-l-red-400 bg-red-50/50",
};

const TYPE_DOT = {
  info: "bg-blue-400",
  success: "bg-green-400",
  warning: "bg-yellow-400",
  error: "bg-red-400",
};

interface Props {
  notifications: Notification[];
  userId: string;
}

export function NotificationsClient({ notifications, userId }: Props) {
  const [items, setItems] = useState(notifications);

  const markAsRead = async (id: string) => {
    const supabase = createClient();
    await supabase.from("notifications").update({ is_read: true }).eq("id", id);
    setItems((prev) => prev.map((n) => n.id === id ? { ...n, is_read: true } : n));
  };

  const markAllAsRead = async () => {
    const supabase = createClient();
    await supabase
      .from("notifications")
      .update({ is_read: true })
      .eq("user_id", userId)
      .eq("is_read", false);
    setItems((prev) => prev.map((n) => ({ ...n, is_read: true })));
    toast.success("All notifications marked as read");
  };

  const deleteNotification = async (id: string) => {
    const supabase = createClient();
    await supabase.from("notifications").delete().eq("id", id);
    setItems((prev) => prev.filter((n) => n.id !== id));
  };

  const unreadCount = items.filter((n) => !n.is_read).length;

  return (
    <div className="space-y-4">
      {/* Header actions */}
      {unreadCount > 0 && (
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-500">{unreadCount} unread</span>
          <button
            onClick={markAllAsRead}
            className="flex items-center gap-1.5 text-sm text-gold hover:text-gold-dark font-medium transition-colors"
          >
            <CheckCheck className="w-4 h-4" />
            Mark all as read
          </button>
        </div>
      )}

      {items.length === 0 ? (
        <div className="luxury-card p-16 text-center">
          <div className="w-14 h-14 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4">
            <Bell className="w-7 h-7 text-gray-300" />
          </div>
          <h3 className="font-serif text-lg font-semibold text-gray-500">No notifications yet</h3>
          <p className="text-gray-400 text-sm mt-1">
            We&apos;ll notify you when something important happens.
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {items.map((notif) => (
            <div
              key={notif.id}
              className={cn(
                "luxury-card p-4 border-l-4 transition-all duration-200",
                TYPE_STYLES[notif.type] || TYPE_STYLES.info,
                !notif.is_read && "shadow-card"
              )}
              onClick={() => !notif.is_read && markAsRead(notif.id)}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-3 flex-1">
                  <div className={cn("w-2 h-2 rounded-full mt-2 flex-shrink-0", TYPE_DOT[notif.type] || TYPE_DOT.info, notif.is_read && "opacity-0")} />
                  <div className="flex-1">
                    <p className={cn("text-sm font-semibold", notif.is_read ? "text-gray-600" : "text-navy-dark")}>
                      {notif.title}
                    </p>
                    <p className="text-sm text-gray-500 mt-0.5 leading-relaxed">{notif.message}</p>
                    <p className="text-xs text-gray-400 mt-1.5">{formatRelativeTime(notif.created_at)}</p>
                    {notif.action_url && (
                      <a
                        href={notif.action_url}
                        className="text-xs text-gold hover:text-gold-dark font-medium mt-1 inline-block"
                        onClick={(e) => e.stopPropagation()}
                      >
                        View →
                      </a>
                    )}
                  </div>
                </div>
                <button
                  onClick={(e) => { e.stopPropagation(); deleteNotification(notif.id); }}
                  className="p-1.5 hover:bg-red-50 rounded-lg text-gray-300 hover:text-red-400 transition-colors flex-shrink-0"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}