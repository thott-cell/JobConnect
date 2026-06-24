import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Image,
  TextInput,
} from "react-native";
import { useEffect, useState } from "react";
import { auth } from "../../firebase/firebaseConfig";
import { useRouter } from "expo-router";

import {
  subscribeToUsers,
  sendConnection,
  acceptConnection,
  followUser,
  unfollowUser,
  getMutualConnections,
} from "../../services/networkService";

/* ✅ TYPE FIXED */
type UserType = {
  id: string;
  name?: string;
  avatar?: string;
  headline?: string;
  connections?: string[];
  followers?: string[];
  following?: string[]; // 🔥 IMPORTANT FIX
  requestsSent?: string[];
  requestsReceived?: string[];
};

export default function Network() {
  const [users, setUsers] = useState<UserType[]>([]);
  const [tab, setTab] = useState("discover");
  const [search, setSearch] = useState("");

  const currentUserId = auth.currentUser?.uid;
  const router = useRouter();

  /* 🔥 LOAD USERS */
  useEffect(() => {
    const unsub = subscribeToUsers(setUsers);
    return unsub;
  }, []);

  /* 🔥 CURRENT USER */
  const me = users.find((u) => u.id === currentUserId);

  /* 🔧 SAFE ARRAY */
  const safeArray = (arr: any): string[] =>
    Array.isArray(arr) ? arr : [];

  /* 🔍 SEARCH FILTER */
  const filtered = users.filter((u) =>
    (u.name || "").toLowerCase().includes(search.toLowerCase())
  );

  /* 🔍 DISCOVER */
  const discover = filtered.filter((u) => {
    return (
      u.id !== currentUserId &&
      !safeArray(u.connections).includes(currentUserId || "") &&
      !safeArray(u.requestsReceived).includes(currentUserId || "")
    );
  });

  /* 🔍 INVITES */
  const invites = filtered.filter((u) =>
    safeArray(u.requestsSent).includes(currentUserId || "")
  );

  /* 🔍 NETWORK */
  const network = filtered.filter((u) =>
    safeArray(u.connections).includes(currentUserId || "")
  );

  const getData = () => {
    if (tab === "discover") return discover;
    if (tab === "invites") return invites;
    return network;
  };

  /* 👤 USER CARD */
  const renderUser = ({ item }: { item: UserType }) => {
    const mutuals = getMutualConnections(
      safeArray(me?.connections),
      safeArray(item.connections)
    );

    const isFollowing =
      !!currentUserId &&
      safeArray(me?.following).includes(item.id);

    return (
      <TouchableOpacity
        onPress={() =>
          router.push({
            pathname: "/profile/[id]",
            params: { id: item.id },
          })
        }
      >
        <View style={styles.card}>
          <View style={styles.row}>
            <Image
              source={{
                uri:
                  item.avatar ||
                  "https://via.placeholder.com/100",
              }}
              style={styles.avatar}
            />

            <View style={{ flex: 1 }}>
              <Text style={styles.name}>
                {item.name || "User"}
              </Text>

              <Text style={styles.headline}>
                {item.headline || "Professional"}
              </Text>

              {mutuals.length > 0 && (
                <Text style={styles.mutual}>
                  {mutuals.length} mutual connections
                </Text>
              )}
            </View>
          </View>

          {/* 🔥 ACTIONS */}
          <View style={styles.actions}>
            {tab === "discover" && (
              <TouchableOpacity
                style={styles.connectBtn}
                onPress={() => sendConnection(item.id)}
              >
                <Text style={styles.btnText}>Connect</Text>
              </TouchableOpacity>
            )}

            {tab === "invites" && (
              <TouchableOpacity
                style={styles.acceptBtn}
                onPress={() => acceptConnection(item.id)}
              >
                <Text style={styles.btnText}>Accept</Text>
              </TouchableOpacity>
            )}

            {/* FOLLOW */}
            {!isFollowing ? (
              <TouchableOpacity
                style={styles.followBtn}
                onPress={() => followUser(item.id)}
              >
                <Text style={styles.btnText}>Follow</Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                style={styles.followingBtn}
                onPress={() => unfollowUser(item.id)}
              >
                <Text style={styles.btnText}>Following</Text>
              </TouchableOpacity>
            )}

            {/* MESSAGE */}
            {tab === "network" && (
              <TouchableOpacity
                style={styles.msgBtn}
                onPress={() =>
                  router.push({
                    pathname: "/chat/[chatId]",
                    params: { chatId: item.id },
                  })
                }
              >
                <Text style={styles.btnText}>Message</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={{ flex: 1 }}>
      {/* 🔍 SEARCH */}
      <View style={styles.searchBox}>
        <TextInput
          placeholder="Search people..."
          value={search}
          onChangeText={setSearch}
          style={styles.input}
        />
      </View>

      {/* 🔘 TABS */}
      <View style={styles.tabs}>
        {["discover", "invites", "network"].map((t) => (
          <TouchableOpacity
            key={t}
            onPress={() => setTab(t)}
            style={[
              styles.tab,
              tab === t && styles.activeTab,
            ]}
          >
            <Text
              style={[
                styles.tabText,
                tab === t && styles.activeText,
              ]}
            >
              {t.toUpperCase()}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* 📋 LIST */}
      <FlatList
        data={getData()}
        keyExtractor={(i) => i.id}
        renderItem={renderUser}
        contentContainerStyle={{ padding: 12 }}
      />
    </View>
  );
}

/* 🎨 STYLE (UNCHANGED) */
const styles = StyleSheet.create({
  searchBox: {
    padding: 12,
    backgroundColor: "#fff",
  },

  input: {
    backgroundColor: "#F1F5F9",
    padding: 10,
    borderRadius: 10,
  },

  tabs: {
    flexDirection: "row",
    padding: 10,
    backgroundColor: "#fff",
  },

  tab: {
    marginRight: 10,
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: 20,
    backgroundColor: "#E5E7EB",
  },

  activeTab: {
    backgroundColor: "#6C2BD9",
  },

  tabText: {
    fontSize: 12,
    color: "#555",
  },

  activeText: {
    color: "#fff",
    fontWeight: "600",
  },

  card: {
    backgroundColor: "#fff",
    padding: 15,
    borderRadius: 12,
    marginBottom: 12,
  },

  row: {
    flexDirection: "row",
    alignItems: "center",
  },

  avatar: {
    width: 55,
    height: 55,
    borderRadius: 30,
    marginRight: 10,
  },

  name: {
    fontWeight: "700",
    fontSize: 15,
  },

  headline: {
    color: "#666",
  },

  mutual: {
    fontSize: 12,
    color: "#888",
    marginTop: 4,
  },

  actions: {
    marginTop: 12,
    gap: 8,
  },

  connectBtn: {
    backgroundColor: "#0A66C2",
    padding: 10,
    borderRadius: 8,
    alignItems: "center",
  },

  acceptBtn: {
    backgroundColor: "#16A34A",
    padding: 10,
    borderRadius: 8,
    alignItems: "center",
  },

  followBtn: {
    backgroundColor: "#111",
    padding: 10,
    borderRadius: 8,
    alignItems: "center",
  },

  followingBtn: {
    backgroundColor: "#9CA3AF",
    padding: 10,
    borderRadius: 8,
    alignItems: "center",
  },

  msgBtn: {
    backgroundColor: "#6C2BD9",
    padding: 10,
    borderRadius: 8,
    alignItems: "center",
  },

  btnText: {
    color: "#fff",
    fontWeight: "600",
  },
});