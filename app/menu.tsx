import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Dimensions,
  Image,
  ScrollView,
} from "react-native";

import { useEffect, useRef, useState } from "react";

import { Ionicons } from "@expo/vector-icons";

import { useRouter } from "expo-router";

import { auth, db } from "../firebase/firebaseConfig";

import {
  doc,
  onSnapshot,
} from "firebase/firestore";

const { width } = Dimensions.get("window");

export default function MenuScreen() {
  const router = useRouter();

  const [userData, setUserData] = useState<any>(null);

  /* 🔥 ANIMATIONS */
  const slideAnim = useRef(
    new Animated.Value(-width)
  ).current;

  const overlayAnim = useRef(
    new Animated.Value(0)
  ).current;

  /* 🔥 OPEN MENU */
  useEffect(() => {
    Animated.parallel([
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 280,
        useNativeDriver: true,
      }),

      Animated.timing(overlayAnim, {
        toValue: 1,
        duration: 280,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  /* 🔥 REALTIME USER */
  useEffect(() => {
    const user = auth.currentUser;

    if (!user) return;

    const unsub = onSnapshot(
      doc(db, "users", user.uid),

      (snap) => {
        if (snap.exists()) {
          setUserData(snap.data());
        }
      },

      (error) => {
        console.log("MENU ERROR:", error);
      }
    );

    return unsub;
  }, []);

  /* 🔥 CLOSE MENU */
  const closeMenu = () => {
    Animated.parallel([
      Animated.timing(slideAnim, {
        toValue: -width,
        duration: 250,
        useNativeDriver: true,
      }),

      Animated.timing(overlayAnim, {
        toValue: 0,
        duration: 250,
        useNativeDriver: true,
      }),
    ]).start(() => {
      router.back();
    });
  };

  /* 🔥 NAVIGATE */
  const navigate = (path: any) => {
    closeMenu();

    setTimeout(() => {
      router.push(path);
    }, 250);
  };

  /* 🔥 LOGOUT */
  const handleLogout = async () => {
    await auth.signOut();

    router.replace("/welcome");
  };

  return (
    <View style={styles.container}>
      {/* 🔥 OVERLAY */}
      <Animated.View
        style={[
          styles.overlay,
          {
            opacity: overlayAnim,
          },
        ]}
      >
        <TouchableOpacity
          style={{ flex: 1 }}
          activeOpacity={1}
          onPress={closeMenu}
        />
      </Animated.View>

      {/* 🔥 MENU PANEL */}
      <Animated.View
        style={[
          styles.menu,
          {
            transform: [
              {
                translateX: slideAnim,
              },
            ],
          },
        ]}
      >
        <ScrollView
          showsVerticalScrollIndicator={false}
        >
          {/* 🔥 PROFILE */}
          <View style={styles.header}>
            <Image
              source={{
                uri:
                  userData?.avatar ??
                  "https://via.placeholder.com/100",
              }}
              style={styles.avatar}
            />

            <Text style={styles.name}>
              {userData?.name ?? "User"}
            </Text>

            <Text style={styles.username}>
              @{userData?.username ?? "username"}
            </Text>

            {!!userData?.headline && (
              <Text style={styles.headline}>
                {userData.headline}
              </Text>
            )}

            {/* 🔥 STATS */}
            <View style={styles.statsRow}>
              <TouchableOpacity
                style={styles.statBox}
                onPress={() =>
                  navigate("/posts")
                }
              >
                <Text style={styles.statNumber}>
                  {userData?.postsCount || 0}
                </Text>

                <Text style={styles.statLabel}>
                  Posts
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.statBox}
                onPress={() =>
                  navigate("/followers")
                }
              >
                <Text style={styles.statNumber}>
                  {Array.isArray(
                    userData?.followers
                  )
                    ? userData.followers.length
                    : 0}
                </Text>

                <Text style={styles.statLabel}>
                  Followers
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.statBox}
                onPress={() =>
                  navigate("/following")
                }
              >
                <Text style={styles.statNumber}>
                  {Array.isArray(
                    userData?.following
                  )
                    ? userData.following.length
                    : 0}
                </Text>

                <Text style={styles.statLabel}>
                  Following
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* 🔥 MENU ITEMS */}
          <MenuItem
            icon="person-outline"
            label="My Profile"
            onPress={() =>
              navigate("/profile")
            }
          />

          <MenuItem
            icon="people-outline"
            label="Network"
            onPress={() =>
              navigate("/(tabs)/network")
            }
          />

          <MenuItem
            icon="briefcase-outline"
            label="Jobs"
            onPress={() =>
              navigate("/(tabs)/jobs")
            }
          />

          <MenuItem
  icon="document-text-outline"
  label="My Applications"
  onPress={() =>
    navigate("/myApplications")
  }
/>

<MenuItem
  icon="people-circle-outline"
  label="My Applicants"
  onPress={() =>
    navigate("/myApplicants")
  }
/> 

          <MenuItem
            icon="chatbubble-outline"
            label="Messages"
            onPress={() =>
              navigate("/messages")
            }
          />

          <MenuItem
            icon="settings-outline"
            label="Settings"
            onPress={() =>
              navigate("/settings")
            }
          />

          <MenuItem
            icon="log-out-outline"
            label="Logout"
            danger
            onPress={handleLogout}
          />
        </ScrollView>
      </Animated.View>
    </View>
  );
}

/* 🔹 MENU ITEM */
function MenuItem({
  icon,
  label,
  onPress,
  danger,
}: any) {
  return (
    <TouchableOpacity
      style={styles.item}
      activeOpacity={0.7}
      onPress={onPress}
    >
      <Ionicons
        name={icon}
        size={22}
        color={danger ? "#EF4444" : "#333"}
      />

      <Text
        style={[
          styles.itemText,

          danger && {
            color: "#EF4444",
          },
        ]}
      >
        {label}
      </Text>
    </TouchableOpacity>
  );
}

/* 🎨 STYLES */
const styles = StyleSheet.create({
  container: {
    flex: 1,
    flexDirection: "row",
  },

  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.45)",
  },

  menu: {
    width: "78%",
    backgroundColor: "#fff",
    paddingTop: 60,
    paddingHorizontal: 20,

    elevation: 20,

    shadowColor: "#000",
    shadowOpacity: 0.15,
    shadowRadius: 20,

    shadowOffset: {
      width: 0,
      height: 0,
    },
  },

  header: {
    alignItems: "center",
    marginBottom: 30,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#F1F5F9",
  },

  avatar: {
    width: 90,
    height: 90,
    borderRadius: 50,
    marginBottom: 12,
  },

  name: {
    fontSize: 18,
    fontWeight: "700",
    color: "#111827",
  },

  username: {
    marginTop: 3,
    fontSize: 13,
    color: "#6B7280",
  },

  headline: {
    marginTop: 8,
    color: "#555",
    textAlign: "center",
    fontSize: 12,
    paddingHorizontal: 10,
  },

  statsRow: {
    flexDirection: "row",
    marginTop: 20,
    gap: 24,
  },

  statBox: {
    alignItems: "center",
  },

  statNumber: {
    fontSize: 16,
    fontWeight: "700",
    color: "#111827",
  },

  statLabel: {
    marginTop: 2,
    fontSize: 12,
    color: "#6B7280",
  },

  item: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 16,
  },

  itemText: {
    marginLeft: 14,
    fontSize: 15,
    fontWeight: "500",
    color: "#111827",
  },
});