import {
  View,
  Text,
  FlatList,
  StyleSheet,
  Image,
  ActivityIndicator,
} from "react-native";
import { useEffect, useState } from "react";
import { db } from "../firebase/firebaseConfig";
import { doc, getDoc } from "firebase/firestore";
import { useLocalSearchParams } from "expo-router";

export default function Viewers() {
  const { postId, storyId, type } = useLocalSearchParams();

  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadViewers();
  }, []);

  const loadViewers = async () => {
    try {
      setLoading(true);

      // 🔥 Decide source (post or story)
      const collectionName = type === "story" ? "stories" : "posts";
      const id = type === "story" ? storyId : postId;

      if (!id) return;

      // 🔥 Get post/story document
      const snap = await getDoc(doc(db, collectionName, id as string));

      if (!snap.exists()) return;

      const data = snap.data();

      // 🔥 Get viewers array
      const viewerIds =
        data.viewedBy || data.viewers || [];

      if (viewerIds.length === 0) {
        setUsers([]);
        return;
      }

      // 🔥 Fetch users
      const results = await Promise.all(
        viewerIds.map(async (uid: string) => {
          const userSnap = await getDoc(doc(db, "users", uid));

          if (!userSnap.exists()) return null;

          return {
            id: uid,
            ...userSnap.data(),
          };
        })
      );

      setUsers(results.filter(Boolean));
    } catch (error) {
      console.log("VIEWERS ERROR:", error);
    } finally {
      setLoading(false);
    }
  };

  /* 🔥 LOADING STATE */
  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#6C2BD9" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>
        Viewers ({users.length})
      </Text>

      {users.length === 0 ? (
        <View style={styles.center}>
          <Text style={styles.empty}>
            No viewers yet 👀
          </Text>
        </View>
      ) : (
        <FlatList
          data={users}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <View style={styles.row}>
              {item.avatar ? (
                <Image
                  source={{ uri: item.avatar }}
                  style={styles.avatar}
                />
              ) : (
                <View style={styles.placeholder} />
              )}

              <View>
                <Text style={styles.name}>
                  {item.name || "User"}
                </Text>
                <Text style={styles.sub}>
                  @{item.username || "unknown"}
                </Text>
              </View>
            </View>
          )}
          contentContainerStyle={{ paddingBottom: 40 }}
          showsVerticalScrollIndicator={false}
        />
      )}
    </View>
  );
}

/* 🔥 STYLES */
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    padding: 20,
  },

  title: {
    fontSize: 20,
    fontWeight: "700",
    marginBottom: 15,
    color: "#111",
  },

  row: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 14,
  },

  avatar: {
    width: 45,
    height: 45,
    borderRadius: 22,
    marginRight: 12,
  },

  placeholder: {
    width: 45,
    height: 45,
    borderRadius: 22,
    backgroundColor: "#E5E7EB",
    marginRight: 12,
  },

  name: {
    fontSize: 15,
    fontWeight: "600",
    color: "#111",
  },

  sub: {
    fontSize: 12,
    color: "#9CA3AF",
  },

  empty: {
    color: "#9CA3AF",
    fontSize: 14,
  },

  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
});