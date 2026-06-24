import {
  View,
  Text,
  FlatList,
  StyleSheet,
  Image,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import { useEffect, useState } from "react";
import { auth, db } from "../firebase/firebaseConfig";
import { doc, onSnapshot, collection } from "firebase/firestore";
import { useRouter } from "expo-router";

export default function Following() {
  const [following, setFollowing] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const userId = auth.currentUser?.uid;
  const router = useRouter();

  useEffect(() => {
    if (!userId) return;

    const unsubUser = onSnapshot(doc(db, "users", userId), (snap) => {
      const data = snap.data();
      const followingIds: string[] = data?.following || [];

      const unsubUsers = onSnapshot(collection(db, "users"), (snap) => {
        const allUsers = snap.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));

        const matched = allUsers.filter((u) =>
          followingIds.includes(u.id)
        );

        setFollowing(matched);
        setLoading(false);
      });

      return unsubUsers;
    });

    return () => unsubUser();
  }, []);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  if (following.length === 0) {
    return (
      <View style={styles.center}>
        <Text>You are not following anyone</Text>
      </View>
    );
  }

  return (
    <FlatList
      data={following}
      keyExtractor={(item) => item.id}
      contentContainerStyle={{ padding: 12 }}
      renderItem={({ item }) => (
        <TouchableOpacity
          onPress={() =>
            router.push({
              pathname: "/profile/[id]",
              params: { id: item.id },
            })
          }
        >
          <View style={styles.card}>
            <Image
              source={{
                uri:
                  item.avatar ||
                  "https://via.placeholder.com/100",
              }}
              style={styles.avatar}
            />

            <View>
              <Text style={styles.name}>
                {item.name || "User"}
              </Text>
              <Text style={styles.username}>
                @{item.username || "username"}
              </Text>
            </View>
          </View>
        </TouchableOpacity>
      )}
    />
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    backgroundColor: "#fff",
    marginBottom: 10,
    borderRadius: 10,
  },

  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 10,
  },

  name: {
    fontWeight: "700",
  },

  username: {
    color: "#666",
  },

  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
});