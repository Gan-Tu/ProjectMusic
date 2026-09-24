import { Drawer } from "../ui/Modal";
import NotificationList from "../NotificationList";
import { useStore } from "../../lib/store";

export default function NotificationsDrawer({ open, onClose }) {
  const { state, actions } = useStore();
  const unread = state.notifications.some((n) => !n.read);
  return (
    <Drawer
      open={open}
      onClose={onClose}
      title="Notifications"
      footer={
        <div className="flex items-center justify-between gap-4">
          <button
            type="button"
            disabled={!unread}
            onClick={actions.markNotificationsRead}
            className="text-xs font-bold uppercase tracking-wider text-pmred disabled:text-neutral-300"
          >
            Mark all as read
          </button>
          <button
            type="button"
            disabled={!state.notifications.length}
            onClick={actions.clearNotifications}
            className="text-xs font-bold uppercase tracking-wider text-neutral-500 hover:text-pmred disabled:text-neutral-300"
          >
            Clear all
          </button>
        </div>
      }
    >
      <NotificationList onNavigate={onClose} />
    </Drawer>
  );
}
