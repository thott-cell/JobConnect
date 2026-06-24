import {
  View,
  TextInput,
  TouchableOpacity,
  Text,
  StyleSheet,
  Image,
  Alert,
  ActivityIndicator,
} from "react-native";
import { useState, useEffect } from "react";
import * as ImagePicker from "expo-image-picker";
import { SafeAreaView } from "react-native-safe-area-context";
import { Video, ResizeMode } from "expo-av";

import { createPost } from "../../services/postService";
import { uploadToCloudinary } from "../../services/uploadService";
import { db, auth } from "../../firebase/firebaseConfig";
import {
  addDoc,
  collection,
  serverTimestamp,
  doc,
  getDoc,
} from "firebase/firestore";

export default function CreatePost() {
  const [text, setText] = useState("");
  const [media, setMedia] = useState<any>(null);
  const [mediaType, setMediaType] = useState<"image" | "video" | null>(null);
  const [loading, setLoading] = useState(false);

  const [user, setUser] = useState<any>(null);

  /* 🔥 LOAD USER PROFILE */
  useEffect(() => {
    const loadUser = async () => {
      const current = auth.currentUser;
      if (!current) return;

      const snap = await getDoc(doc(db, "users", current.uid));
      if (snap.exists()) {
        setUser(snap.data());
      }
    };

    loadUser();
  }, []);

  /* 📸 PICK MEDIA */
  const pickMedia = async (type: "image" | "video") => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes:
        type === "image"
          ? ImagePicker.MediaTypeOptions.Images
          : ImagePicker.MediaTypeOptions.Videos,
      quality: 1,
    });

    if (!result.canceled) {
      setMedia(result.assets[0]);
      setMediaType(type);
    }
  };

  /* ☁️ UPLOAD MEDIA */
  const uploadMedia = async () => {
    if (!media || !mediaType) return { url: "", type: "none" };

    const file = {
      uri: media.uri,
      type: mediaType === "video" ? "video/mp4" : "image/jpeg",
      name: mediaType === "video" ? "video.mp4" : "image.jpg",
    };

    const res = await uploadToCloudinary(file, mediaType);

    if (!res?.url) throw new Error("Upload failed");

    return res;
  };

  /* 📝 CREATE POST */
  const handlePost = async () => {
    if (!text && !media) {
      Alert.alert("Error", "Write something or add media.");
      return;
    }

    try {
      setLoading(true);

      const upload = await uploadMedia();

      await createPost(text, upload.url, upload.type);

      reset();
      Alert.alert("Success", "Post created 🚀");
    } catch (e: any) {
      Alert.alert("Error", e.message);
    } finally {
      setLoading(false);
    }
  };

  /* 🔥 CREATE STORY (WITH USER DATA) */
  const handleStory = async () => {
    if (!media) {
      Alert.alert("Select media first");
      return;
    }

    try {
      setLoading(true);

      const upload = await uploadMedia();

      const current = auth.currentUser;

      await addDoc(collection(db, "stories"), {
        mediaUrl: upload.url,
        mediaType: upload.type,

        userId: current?.uid,
        userName: `${user?.firstName || ""} ${user?.lastName || ""}`,
        userAvatar: user?.avatar || "",

        createdAt: serverTimestamp(),
      });

      reset();
      Alert.alert("Story uploaded 🔥");
    } catch (e: any) {
      Alert.alert("Error", e.message);
    } finally {
      setLoading(false);
    }
  };

  /* 🔄 RESET */
  const reset = () => {
    setText("");
    setMedia(null);
    setMediaType(null);
  };

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>
        {/* 👤 USER HEADER */}
        <View style={styles.userRow}>
          {user?.avatar ? (
            <Image source={{ uri: user.avatar }} style={styles.avatar} />
          ) : (
            <View style={styles.avatarPlaceholder} />
          )}

          <Text style={styles.name}>
            {user
              ? `${user.firstName} ${user.lastName}`
              : "Loading..."}
          </Text>
        </View>

        {/* INPUT */}
        <TextInput
          placeholder="What's on your mind?"
          placeholderTextColor="#9CA3AF"
          value={text}
          onChangeText={setText}
          style={styles.input}
          multiline
        />

        {/* PREVIEW */}
        {media && (
          <View style={styles.previewWrapper}>
            {mediaType === "image" ? (
              <Image source={{ uri: media.uri }} style={styles.preview} />
            ) : (
              <Video
                source={{ uri: media.uri }}
                style={styles.preview}
                resizeMode={ResizeMode.COVER}
                useNativeControls
              />
            )}

            <TouchableOpacity
              style={styles.removeBtn}
              onPress={reset}
            >
              <Text style={{ color: "#fff" }}>✕</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* MEDIA BUTTONS */}
        <View style={styles.row}>
          <TouchableOpacity
            style={styles.btn}
            onPress={() => pickMedia("image")}
          >
            <Text style={styles.btnText}>🖼 Photo</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.btn}
            onPress={() => pickMedia("video")}
          >
            <Text style={styles.btnText}>🎥 Video</Text>
          </TouchableOpacity>
        </View>

        {/* POST BUTTON */}
        <TouchableOpacity
          style={[styles.postBtn, loading && { opacity: 0.6 }]}
          onPress={handlePost}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.postText}>Post</Text>
          )}
        </TouchableOpacity>

        {/* STORY BUTTON */}
        <TouchableOpacity
          style={[styles.storyBtn, loading && { opacity: 0.6 }]}
          onPress={handleStory}
          disabled={loading}
        >
          <Text style={styles.postText}>Add to Story</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

/* 🎨 PREMIUM UI */
const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: "#fff",
  },

  container: {
    padding: 16,
  },

  userRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
  },

  avatar: {
    width: 45,
    height: 45,
    borderRadius: 22,
    marginRight: 10,
  },

  avatarPlaceholder: {
    width: 45,
    height: 45,
    borderRadius: 22,
    backgroundColor: "#ddd",
    marginRight: 10,
  },

  name: {
    fontSize: 16,
    fontWeight: "600",
  },

  input: {
    backgroundColor: "#F0F2F5",
    padding: 14,
    borderRadius: 20,
    minHeight: 50,
    textAlignVertical: "top",
  },

  previewWrapper: {
    marginTop: 12,
  },

  preview: {
    width: "100%",
    height: 140,
    borderRadius: 12,
  },

  removeBtn: {
    position: "absolute",
    top: 10,
    right: 10,
    backgroundColor: "#00000088",
    padding: 6,
    borderRadius: 20,
  },

  row: {
    flexDirection: "row",
    marginTop: 15,
  },

  btn: {
    flex: 1,
    marginHorizontal: 5,
    padding: 12,
    backgroundColor: "#E4E6EB",
    alignItems: "center",
    borderRadius: 10,
  },

  btnText: {
    fontWeight: "500",
  },

  postBtn: {
    marginTop: 20,
    backgroundColor: "#1877F2",
    padding: 14,
    borderRadius: 10,
    alignItems: "center",
  },

  storyBtn: {
    marginTop: 10,
    backgroundColor: "#42B72A",
    padding: 14,
    borderRadius: 10,
    alignItems: "center",
  },

  postText: {
    color: "#fff",
    fontWeight: "600",
  },
});