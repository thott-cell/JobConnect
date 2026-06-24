import {
  View,
  Text,
  FlatList,
  Image,
  StyleSheet,
  ActivityIndicator,
  Dimensions,
  TouchableOpacity,
} from "react-native";
import { useEffect, useState } from "react";
import { useLocalSearchParams, useRouter } from "expo-router";

import { db } from "../firebase/firebaseConfig";
import {
  collection,
  query,
  where,
  onSnapshot,
} from "firebase/firestore";

const screenWidth = Dimensions.get("window").width;
const imageSize = screenWidth / 3;

export default function UserPosts() {
  const { userId } = useLocalSearchParams();
  const router = useRouter();

  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  /* 🔥 LOAD USER POSTS */
  useEffect(() => {
    if (!userId) return;

    const q = query(
      collection(db, "posts"),
      where("userId", "==", userId)
    );

    const unsub = onSnapshot(q, (snap) => {
      const data = snap.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      setPosts(data);
      setLoading(false);
    });

    return unsub;
  }, [userId]);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  /* 📸 RENDER POST */
  const renderItem = ({ item }: any) => (
    <TouchableOpacity
      onPress={() =>
        router.push({
          pathname: "/post/[postId]", // optional detail page
          params: { postId: item.id },
        })
      }
    >
      <Image
        source={{ uri: item.mediaUrl }}
        style={styles.image}
      />
    </TouchableOpacity>
  );

  return (
    <View style={{ flex: 1, backgroundColor: "#fff" }}>
      <Text style={styles.title}>Posts</Text>

      <FlatList
        data={posts}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        numColumns={3}
        contentContainerStyle={{ paddingBottom: 20 }}
        ListEmptyComponent={
          <Text style={styles.empty}>
            No posts yet
          </Text>
        }
      />
    </View>
  );
}

/* 🎨 STYLE */
const styles = StyleSheet.create({
  title: {
    fontSize: 18,
    fontWeight: "700",
    padding: 15,
  },

  image: {
    width: imageSize,
    height: imageSize,
  },

  empty: {
    textAlign: "center",
    marginTop: 40,
    color: "#777",
  },

  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
});