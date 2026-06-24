import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
} from "react-native";
import { useEffect, useState } from "react";
import { doc, onSnapshot } from "firebase/firestore";
import { db, auth } from "../firebase/firebaseConfig";
import { toggleCommentLike, deleteComment } from "../services/commentService";
import { FontAwesome } from "@expo/vector-icons";

export default function CommentItem({ comment, postId, onReply }: any) {
  const userId = auth.currentUser?.uid;

  const [user, setUser] = useState<any>(null);
  const [liked, setLiked] = useState(false);
  const [likes, setLikes] = useState(comment.likes || 0);

  /* 🔥 USER DATA */
  useEffect(() => {
    const ref = doc(db, "users", comment.userId);
    const unsub = onSnapshot(ref, snap => {
      if (snap.exists()) setUser(snap.data());
    });
    return unsub;
  }, []);

  /* 🔥 LIKE STATE */
  useEffect(() => {
    setLiked(comment.likedBy?.includes(userId));
  }, []);

  const handleLike = async () => {
    await toggleCommentLike(postId, comment, liked);
    setLiked(!liked);
    setLikes((prev: number) => liked ? prev - 1 : prev + 1);
  };

  return (
    <View style={styles.wrapper}>
      <Image
        source={{ uri: user?.avatar || "https://via.placeholder.com/100" }}
        style={styles.avatar}
      />

      <View style={{ flex: 1 }}>
        <View style={styles.bubble}>
          <Text style={styles.name}>{user?.name || "User"}</Text>
          <Text>{comment.text}</Text>
        </View>

        {/* ACTIONS */}
        <View style={styles.actions}>
          <TouchableOpacity onPress={handleLike}>
            <Text style={styles.action}>
              Like {likes > 0 ? `(${likes})` : ""}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={() => onReply(comment)}>
            <Text style={styles.action}>Reply</Text>
          </TouchableOpacity>

          {comment.userId === userId && (
            <TouchableOpacity
              onPress={() => deleteComment(postId, comment.id)}
            >
              <Text style={styles.action}>Delete</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { flexDirection: "row", marginVertical: 8 },

  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    marginRight: 8,
  },

  bubble: {
    backgroundColor: "#F0F2F5",
    borderRadius: 12,
    padding: 10,
  },

  name: { fontWeight: "600", marginBottom: 2 },

  actions: {
    flexDirection: "row",
    marginTop: 4,
  },

  action: {
    marginRight: 15,
    fontSize: 12,
    color: "#65676B",
  },
});