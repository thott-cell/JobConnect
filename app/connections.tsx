import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Image,
  ActivityIndicator,
} from "react-native";

import { useEffect, useState } from "react";

import { useLocalSearchParams, useRouter } from "expo-router";

import { db } from "../firebase/firebaseConfig";

import {
  doc,
  getDoc,
  collection,
  onSnapshot,
} from "firebase/firestore";

type UserType = {
  id: string;
  name?: string;
  username?: string;
  avatar?: string;
  headline?: string;
  connections?: string[];
};

export default function ConnectionsPage() {
  const { userId } = useLocalSearchParams();

  const router = useRouter();

  const [allUsers, setAllUsers] = useState<UserType[]>([]);
  const [connections, setConnections] = useState<UserType[]>(
    []
  );

  const [loading, setLoading] = useState(true);

  /* 🔥 LOAD ALL USERS */
  useEffect(() => {
    const unsub = onSnapshot(
      collection(db, "users"),
      (snap) => {
        const users = snap.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as UserType[];

        setAllUsers(users);
      }
    );

    return unsub;
  }, []);

  /* 🔥 LOAD USER CONNECTIONS */
  useEffect(() => {
    const loadConnections = async () => {
      if (!userId) return;

      try {
        const userRef = doc(
          db,
          "users",
          String(userId)
        );

        const snap = await getDoc(userRef);

        if (!snap.exists()) {
          setLoading(false);
          return;
        }

        const data = snap.data();

        const connectionIds = Array.isArray(
          data.connections
        )
          ? data.connections
          : [];

        const matchedUsers = allUsers.filter((u) =>
          connectionIds.includes(u.id)
        );

        setConnections(matchedUsers);
      } catch (error) {
        console.log(error);
      }

      setLoading(false);
    };

    loadConnections();
  }, [userId, allUsers]);

  /* 🔥 LOADING */
  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* 🔷 HEADER */}
      <View style={styles.header}>
        <Text style={styles.title}>
          Connections
        </Text>

        <Text style={styles.count}>
          {connections.length} connections
        </Text>
      </View>

      {/* 🔷 EMPTY */}
      {connections.length === 0 ? (
        <View style={styles.emptyBox}>
          <Text style={styles.emptyText}>
            No connections yet
          </Text>
        </View>
      ) : (
        <FlatList
          data={connections}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{
            padding: 14,
          }}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.card}
              onPress={() =>
                router.push({
                  pathname: "/profile/[id]",
                  params: { id: item.id },
                })
              }
            >
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

                <Text style={styles.username}>
                  @{item.username || "username"}
                </Text>

                <Text style={styles.headline}>
                  {item.headline ||
                    "Professional"}
                </Text>
              </View>
            </TouchableOpacity>
          )}
        />
      )}
    </View>
  );
}

/* 🎨 STYLES */
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F5F7FB",
  },

  header: {
    backgroundColor: "#fff",
    paddingTop: 60,
    paddingBottom: 20,
    paddingHorizontal: 20,
  },

  title: {
    fontSize: 24,
    fontWeight: "700",
  },

  count: {
    color: "#666",
    marginTop: 4,
  },

  card: {
    backgroundColor: "#fff",
    padding: 14,
    borderRadius: 14,
    marginBottom: 12,
    flexDirection: "row",
    alignItems: "center",
  },

  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    marginRight: 12,
  },

  name: {
    fontSize: 16,
    fontWeight: "700",
  },

  username: {
    color: "#666",
    marginTop: 2,
  },

  headline: {
    color: "#444",
    marginTop: 4,
  },

  emptyBox: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },

  emptyText: {
    fontSize: 16,
    color: "#777",
  },

  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
});