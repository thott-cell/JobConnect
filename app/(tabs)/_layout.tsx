import { Tabs, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Text,
} from "react-native";
import { useEffect, useState } from "react";

import { subscribeToNotifications } from "../../services/notificationService";


export default function TabsLayout() {
  const router = useRouter();

  const COLORS = {
    primary: "#6C2BD9",
    gray: "#9CA3AF",
    white: "#FFFFFF",
  };

  const [count, setCount] = useState(0);

  /* 🔥 REALTIME NOTIFICATION COUNT */
  useEffect(() => {
    const unsub = subscribeToNotifications((notifications: any[]) => {
      const unread = notifications.filter((n) => !n.read).length;
      setCount(unread);
    });

    return unsub;
  }, []);

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: COLORS.primary,
        tabBarInactiveTintColor: COLORS.gray,

        /* 🔥 HEADER */
        headerStyle: {
          backgroundColor: "#fff",
          elevation: 3,
        },

        headerTitle: () => (
          <Text style={styles.logo}>JobConnect</Text>
        ),

        /* 🍔 LEFT (HAMBURGER) */
        headerLeft: () => (
          <TouchableOpacity
            style={styles.iconBtn}
            onPress={() => router.push("/menu")}
          >
            <Ionicons name="menu" size={24} color="#333" />
          </TouchableOpacity>
        ),

        /* 🔔 RIGHT (NOTIFICATION) */
        headerRight: () => (
          <View style={styles.rightIcons}>
            <TouchableOpacity
              style={styles.iconBtn}
              onPress={() => router.push("/notifications")}
            >
              <Ionicons
                name="notifications-outline"
                size={24}
                color="#333"
              />

              {/* 🔥 BADGE */}
              {count > 0 && (
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>
                    {count > 9 ? "9+" : count}
                  </Text>
                </View>
              )}
            </TouchableOpacity>
          </View>
        ),

        /* 🔥 TAB STYLE */
        tabBarStyle: {
          backgroundColor: COLORS.white,
          height: 70,
          borderTopWidth: 0,
          elevation: 10,
          paddingBottom: 8,
        },

        tabBarLabelStyle: {
          fontSize: 11,
          marginTop: -4,
        },
      }}
    >
      {/* HOME */}
      <Tabs.Screen
        name="feed"
        options={{
          title: "Home",
          tabBarIcon: ({ color }) => (
            <Ionicons name="home-outline" size={22} color={color} />
          ),
        }}
      />

      {/* JOBS */}
      <Tabs.Screen
        name="jobs"
        options={{
          title: "Jobs",
          tabBarIcon: ({ color }) => (
            <Ionicons name="briefcase-outline" size={22} color={color} />
          ),
        }}
      />

      {/* CENTER BUTTON */}
      <Tabs.Screen
        name="create-post"
        options={{
          title: "",
          tabBarIcon: () => (
            <View style={styles.fab}>
              <Ionicons name="add" size={28} color="#fff" />
            </View>
          ),
        }}
      />

      {/* NETWORK */}
      <Tabs.Screen
        name="network"
        options={{
          title: "Network",
          tabBarIcon: ({ color }) => (
            <Ionicons name="people-outline" size={22} color={color} />
          ),
        }}
      />

      {/* PROFILE */}
      <Tabs.Screen
        name="profile"
        options={{
          title: "Profile",
          tabBarIcon: ({ color }) => (
            <Ionicons name="person-outline" size={22} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}

/* 🎨 STYLES */
const styles = StyleSheet.create({
  logo: {
    fontSize: 18,
    fontWeight: "700",
    color: "#6C2BD9",
  },

  iconBtn: {
    padding: 10,
  },

  rightIcons: {
    flexDirection: "row",
    marginRight: 10,
  },

  badge: {
    position: "absolute",
    right: 5,
    top: 5,
    backgroundColor: "#EF4444",
    borderRadius: 10,
    paddingHorizontal: 5,
    paddingVertical: 1,
    minWidth: 18,
    alignItems: "center",
  },

  badgeText: {
    color: "#fff",
    fontSize: 10,
    fontWeight: "700",
  },

  fab: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "#6C2BD9",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: -18,
    elevation: 8,
  },
});