import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import { useEffect, useState } from "react";
import { useRouter } from "expo-router";

import {
  subscribeToNotifications,
  markNotificationAsRead,
} from "../services/notificationService";

export default function NotificationsScreen() {
  const router = useRouter();

  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  /* 🔥 LOAD NOTIFICATIONS */
  useEffect(() => {
    const unsub = subscribeToNotifications((data: any[]) => {
      // 🔥 SORT NEWEST FIRST
      data.sort((a, b) => {
        const aTime = a.createdAt?.seconds || 0;
        const bTime = b.createdAt?.seconds || 0;
        return bTime - aTime;
      });

      setNotifications(data);
      setLoading(false);
    });

    return unsub;
  }, []);

  /* =========================
     🔁 NAVIGATION BASED ON TYPE
  ========================= */
  const handlePress = async (item: any) => {
    // mark as read
    await markNotificationAsRead(item.id);

    // navigate based on type
    if (item.type === "job" && item.jobId) {
      router.push({
        pathname: "/job/[jobId]",
        params: { jobId: item.jobId },
      });
    }

    if (item.type === "message" && item.chatId) {
      router.push({
        pathname: "/chat/[chatId]",
        params: { chatId: item.chatId },
      });
    }

    if (item.type === "profile" && item.fromUserId) {
      router.push({
        pathname: "/profile/[id]",
        params: { id: item.fromUserId },
      });
    }
  };

  /* =========================
     🧱 RENDER ITEM
  ========================= */
  const renderItem = ({ item }: any) => {
    return (
      <TouchableOpacity
        style={[
          styles.card,
          !item.read && styles.unreadCard,
        ]}
        onPress={() => handlePress(item)}
      >
        {/* 🔵 DOT */}
        {!item.read && <View style={styles.dot} />}

        <View style={{ flex: 1 }}>
          <Text style={styles.text}>
            {item.text || "New notification"}
          </Text>

          <Text style={styles.time}>
            {formatTime(item.createdAt)}
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  /* =========================
     ⏳ LOADING
  ========================= */
  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#6C2BD9" />
      </View>
    );
  }

  /* =========================
     🚫 EMPTY STATE
  ========================= */
  if (!notifications.length) {
    return (
      <View style={styles.center}>
        <Text style={styles.empty}>
          No notifications yet
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* 🔥 HEADER */}
      <View style={styles.header}>
        <Text style={styles.title}>Notifications</Text>

        <TouchableOpacity
          onPress={() => markAllLocal(notifications, setNotifications)}
        >
          <Text style={styles.markAll}>
            Mark all as read
          </Text>
        </TouchableOpacity>
      </View>

      {/* 🔥 LIST */}
      <FlatList
        data={notifications}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={{ padding: 12 }}
      />
    </View>
  );
}

/* =========================
   🧠 MARK ALL (LOCAL UI + FIREBASE)
========================= */
const markAllLocal = async (
  notifications: any[],
  setNotifications: any
) => {
  const updated = notifications.map((n) => ({
    ...n,
    read: true,
  }));

  setNotifications(updated);

  // update firebase
  notifications.forEach(async (n) => {
    await markNotificationAsRead(n.id);
  });
};

/* =========================
   🕒 TIME FORMAT
========================= */
const formatTime = (timestamp: any) => {
  if (!timestamp?.seconds) return "";

  const now = Date.now();
  const time = timestamp.seconds * 1000;
  const diff = (now - time) / 1000;

  if (diff < 60) return "Just now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;

  return `${Math.floor(diff / 86400)}d ago`;
};

/* =========================
   🎨 PREMIUM STYLES
========================= */
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F5F7FB",
  },

  header: {
    padding: 16,
    backgroundColor: "#fff",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    elevation: 2,
  },

  title: {
    fontSize: 18,
    fontWeight: "700",
  },

  markAll: {
    color: "#6C2BD9",
    fontWeight: "600",
  },

  card: {
    flexDirection: "row",
    backgroundColor: "#fff",
    padding: 14,
    borderRadius: 12,
    marginBottom: 10,
    alignItems: "center",
  },

  unreadCard: {
    backgroundColor: "#EEF2FF",
  },

  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#6C2BD9",
    marginRight: 10,
  },

  text: {
    fontSize: 14,
    color: "#111",
  },

  time: {
    fontSize: 12,
    color: "#777",
    marginTop: 4,
  },

  empty: {
    color: "#999",
  },

  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
});