import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Image,
  Alert,
  ActivityIndicator,
} from "react-native";
import { useEffect, useState } from "react";
import { useLocalSearchParams } from "expo-router";

import { db, auth } from "../../firebase/firebaseConfig";
import {
  doc,
  getDoc,
  onSnapshot,
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  serverTimestamp,
  query,
  orderBy,
  increment, // 🛠️ IMPORTED INCREMENT FOR COUNT TRACING
} from "firebase/firestore";

import PostCard from "../../components/PostCard";

export default function PostScreen() {
  const localParams = useLocalSearchParams() ?? {};
  const postId = localParams.postId;

  const [post, setPost] = useState<any>(null);
  const [comments, setComments] = useState<any[]>([]);
  const [text, setText] = useState("");
  const [loadingPost, setLoadingPost] = useState(true);
  const [currentUser, setCurrentUser] = useState<any>(null);

  /* 🔥 TRACK USER AUTH SAFELY */
  useEffect(() => {
    if (auth && auth.currentUser) {
      setCurrentUser(auth.currentUser);
    }
  }, []);

  /* 🔥 LOAD POST DIRECTLY FROM FIRESTORE */
  useEffect(() => {
    if (!postId) {
      setLoadingPost(false);
      return;
    }

    try {
      const docRef = doc(db, "posts", String(postId));
      const unsub = onSnapshot(docRef, 
        (snap) => {
          if (snap.exists()) {
            const postData = { id: snap.id, ...snap.data() };
            setPost(postData);
          } else {
            setPost(null);
          }
          setLoadingPost(false);
        },
        (error) => {
          console.error(error);
          setLoadingPost(false);
        }
      );

      return unsub;
    } catch (err: any) {
      setLoadingPost(false);
    }
  }, [postId]);

  /* 🔥 LOAD COMMENTS */
  useEffect(() => {
    if (!postId) return;
    
    try {
      const q = query(
        collection(db, "posts", String(postId), "comments"),
        orderBy("createdAt", "asc")
      );

      return onSnapshot(q, (snap) => {
        setComments(
          snap.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
          }))
        );
      });
    } catch (err: any) {
      console.error(err);
    }
  }, [postId]);

  /* 🔥 ACTIONS WRAPPERS */
  const sendComment = async () => {
    if (!text.trim() || !currentUser?.uid || !postId) return;
    try {
      const userSnap = await getDoc(doc(db, "users", currentUser.uid));
      if (!userSnap.exists()) return;
      const userData: any = userSnap.data();
      
      // 1. Add the comment document into the sub-collection bucket
      await addDoc(collection(db, "posts", String(postId), "comments"), {
        text,
        userId: currentUser.uid,
        userName: userData?.name ?? "Anonymous",
        userAvatar: userData?.avatar ?? "https://placeholder.com",
        username: userData?.username ?? "user",
        likes: 0,
        likedBy: [],
        createdAt: serverTimestamp(),
      });

      // 2. 🛠️ ATOMIC INCREMENT FIX: Safely update both counter naming options simultaneously on the main post document
      const postRef = doc(db, "posts", String(postId));
      await updateDoc(postRef, {
        comments: increment(1),      // Increments your interaction count variable
        commentsCount: increment(1), // Increments your interface variable fallback tracker
      });

      setText("");
    } catch (e) {
      console.log(e);
    }
  };

  const toggleLikeComment = async (comment: any) => {
    if (!currentUser?.uid || !postId || !comment?.id) return;
    const ref = doc(db, "posts", String(postId), "comments", comment.id);
    const liked = comment.likedBy?.includes(currentUser?.uid);
    await updateDoc(ref, {
      likes: liked ? (comment.likes || 1) - 1 : (comment.likes || 0) + 1,
      likedBy: liked
        ? comment.likedBy.filter((id: string) => id !== currentUser?.uid)
        : [...(comment.likedBy || []), currentUser?.uid],
    });
  };

  const editComment = (comment: any) => {
    if (!postId || !comment?.id) return;
    Alert.prompt("Edit Comment", "", async (newText) => {
      if (!newText) return;
      await updateDoc(doc(db, "posts", String(postId), "comments", comment.id), { text: newText });
    });
  };

  const deleteComment = async (comment: any) => {
    if (!postId || !comment?.id) return;
    try {
      // 1. Delete comment document reference
      await deleteDoc(doc(db, "posts", String(postId), "comments", comment.id));

      // 2. 🛠️ DECREMENT COUNTER ON MAIN POST: Keeps database perfectly synchronized
      const postRef = doc(db, "posts", String(postId));
      await updateDoc(postRef, {
        comments: increment(-1),
        commentsCount: increment(-1),
      });
    } catch (e) {
      console.log("Delete verification error: ", e);
    }
  };

  /* 🔁 REPLIES COMPONENT SUB-MODULE */
  const ReplySection = ({ commentId }: any) => {
    const [replies, setReplies] = useState<any[]>([]);
    const [replyText, setReplyText] = useState("");

    useEffect(() => {
      if (!postId || !commentId) return;
      const q = query(
        collection(db, "posts", String(postId), "comments", commentId, "replies"),
        orderBy("createdAt", "asc")
      );
      return onSnapshot(q, (snap) => {
        setReplies(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
      });
    }, [commentId]);

    const sendReply = async () => {
      if (!replyText.trim() || !currentUser?.uid || !postId || !commentId) return;
      try {
        const userSnap = await getDoc(doc(db, "users", currentUser.uid));
        if (!userSnap.exists()) return;
        const userData: any = userSnap.data();
        await addDoc(collection(db, "posts", String(postId), "comments", commentId, "replies"), {
          text: replyText,
          userName: userData?.name ?? "Anonymous",
          userAvatar: userData?.avatar ?? "https://placeholder.com",
          createdAt: serverTimestamp(),
        });
        setReplyText("");
      } catch (e) {
        console.log(e);
      }
    };

    return (
      <View style={{ marginLeft: 40 }}>
        {replies.map((r) => (
          <View key={r.id} style={styles.replyRow}>
            <Image source={{ uri: r.userAvatar || "https://placeholder.com" }} style={styles.replyAvatar} />
            <View style={styles.replyBubble}>
              <Text style={styles.name}>{r.userName || "User"}</Text>
              <Text>{r.text}</Text>
            </View>
          </View>
        ))}
        <View style={styles.replyInputRow}>
          <TextInput placeholder="Reply..." value={replyText} onChangeText={setReplyText} style={styles.replyInput} />
          <TouchableOpacity onPress={sendReply}>
            <Text style={styles.send}>Post</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  /* 💬 COMMENT ROW RENDERING PIPELINE */
  const renderComment = ({ item }: any) => {
    if (!item) return null;
    const isOwner = item?.userId && currentUser?.uid && item.userId === currentUser.uid;

    return (
      <View style={styles.commentRow}>
        <Image source={{ uri: item.userAvatar || "https://placeholder.com" }} style={styles.avatar} />
        <View style={{ flex: 1 }}>
          <View style={styles.bubble}>
            <Text style={styles.name}>{item.userName || "Anonymous"}</Text>
            <Text>{item.text}</Text>
          </View>

          <View style={styles.commentActions}>
            <TouchableOpacity onPress={() => toggleLikeComment(item)}>
              <Text style={styles.action}>Like ({item.likes || 0})</Text>
            </TouchableOpacity>
            {isOwner && (
              <>
                <TouchableOpacity onPress={() => editComment(item)}>
                  <Text style={styles.action}>Edit</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => deleteComment(item)}>
                  <Text style={[styles.action, { color: "red" }]}>Delete</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
          <ReplySection commentId={item.id} />
        </View>
      </View>
    );
  };

  // UI LOADING GATEGUARD LAYER
  if (loadingPost || !post) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#fff" }}>
        <ActivityIndicator size="large" color="#6C2BD9" />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <FlatList
        data={comments}
        keyExtractor={(item) => item?.id ?? Math.random().toString()}
        renderItem={renderComment}
        ListHeaderComponent={() => (post ? <PostCard post={post} /> : null)}
      />

      <View style={styles.inputBar}>
        <TextInput
          placeholder="Write a comment..."
          value={text}
          onChangeText={setText}
          style={styles.input}
        />
        <TouchableOpacity onPress={sendComment}>
          <Text style={styles.send}>Post</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

/* 🎨 ORIGINAL LAYOUT CSS SETTINGS UNTOUCHED */
const styles = StyleSheet.create({
  commentRow: { flexDirection: "row", padding: 10 },
  avatar: { width: 35, height: 35, borderRadius: 20, marginRight: 8 },
  bubble: { backgroundColor: "#E4E6EB", borderRadius: 10, padding: 8 },
  name: { fontWeight: "600" },
  commentActions: { flexDirection: "row", marginTop: 4, gap: 10 },
  action: { fontSize: 12, color: "#65676B" },
  replyRow: { flexDirection: "row", marginTop: 6 },
  replyAvatar: { width: 25, height: 25, borderRadius: 12, marginRight: 6 },
  replyBubble: { backgroundColor: "#F0F2F5", padding: 6, borderRadius: 8 },
  replyInputRow: { flexDirection: "row", marginTop: 5 },
replyInput: { flex: 1, backgroundColor: "#fff", borderRadius: 10, padding: 6 },inputBar: { flexDirection: "row", padding: 10, backgroundColor: "#fff" },input: { flex: 1, backgroundColor: "#F0F2F5", borderRadius: 20, padding: 10, marginRight: 10 },send: { color: "#1877F2", fontWeight: "600" },});