import { create } from "zustand";
import { persist } from "zustand/middleware";
import { AppUser, Notification } from "@/types";

// ─── Auth Store ───────────────────────────────────────────────

interface AuthState {
  user: AppUser | null;
  isLoading: boolean;
  setUser: (user: AppUser | null) => void;
  setLoading: (loading: boolean) => void;
  clearUser: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      isLoading: true,
      setUser: (user) => set({ user, isLoading: false }),
      setLoading: (isLoading) => set({ isLoading }),
      clearUser: () => set({ user: null, isLoading: false }),
    }),
    {
      name: "saptapadi-auth",
      partialize: (state) => ({ user: state.user }),
    }
  )
);

// ─── UI Store ─────────────────────────────────────────────────

interface UIState {
  sidebarOpen: boolean;
  activeSection: string;
  toggleSidebar: () => void;
  setSidebarOpen: (open: boolean) => void;
  setActiveSection: (section: string) => void;
}

export const useUIStore = create<UIState>()((set) => ({
  sidebarOpen: true,
  activeSection: "dashboard",
  toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),
  setSidebarOpen: (sidebarOpen) => set({ sidebarOpen }),
  setActiveSection: (activeSection) => set({ activeSection }),
}));

// ─── Notification Store ───────────────────────────────────────

interface NotificationState {
  notifications: Notification[];
  unreadCount: number;
  setNotifications: (notifications: Notification[]) => void;
  addNotification: (notification: Notification) => void;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  removeNotification: (id: string) => void;
}

export const useNotificationStore = create<NotificationState>()((set) => ({
  notifications: [],
  unreadCount: 0,
  setNotifications: (notifications) =>
    set({
      notifications,
      unreadCount: notifications.filter((n) => !n.is_read).length,
    }),
  addNotification: (notification) =>
    set((s) => ({
      notifications: [notification, ...s.notifications],
      unreadCount: s.unreadCount + (notification.is_read ? 0 : 1),
    })),
  markAsRead: (id) =>
    set((s) => ({
      notifications: s.notifications.map((n) =>
        n.id === id ? { ...n, is_read: true } : n
      ),
      unreadCount: Math.max(0, s.unreadCount - 1),
    })),
  markAllAsRead: () =>
    set((s) => ({
      notifications: s.notifications.map((n) => ({ ...n, is_read: true })),
      unreadCount: 0,
    })),
  removeNotification: (id) =>
    set((s) => {
      const notification = s.notifications.find((n) => n.id === id);
      return {
        notifications: s.notifications.filter((n) => n.id !== id),
        unreadCount: notification && !notification.is_read
          ? Math.max(0, s.unreadCount - 1)
          : s.unreadCount,
      };
    }),
}));

// ─── Profile Filter Store ─────────────────────────────────────

interface ProfileFilterState {
  filters: Record<string, unknown>;
  setFilter: (key: string, value: unknown) => void;
  setFilters: (filters: Record<string, unknown>) => void;
  clearFilters: () => void;
}

export const useProfileFilterStore = create<ProfileFilterState>()((set) => ({
  filters: {},
  setFilter: (key, value) =>
    set((s) => ({ filters: { ...s.filters, [key]: value } })),
  setFilters: (filters) => set({ filters }),
  clearFilters: () => set({ filters: {} }),
}));
