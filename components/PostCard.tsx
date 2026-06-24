import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  Share,
} from "react-native";
import { useState, useRef, useEffect } from "react";
import { Video, ResizeMode } from "expo-av";
import { FontAwesome } from "@expo/vector-icons";
import { useRouter } from "expo-router";

import { toggleLike, addShare } from "../services/interactionService";
import { auth, db } from "../firebase/firebaseConfig";
import { doc, onSnapshot } from "firebase/firestore";

/* ======================================================
   GLOBAL ACTIVE VIDEO PLAYER TRACE PERSISTENCE
====================================================== */
let activeVideoRef: any = null;

export default function PostCard({ post, isVisible }: any) {
  const router = useRouter();
  const videoRef = useRef<Video>(null);
  const userId = auth.currentUser?.uid;

  /* 🔥 UI SYSTEM REACTION STATES */
  const [liked, setLiked] = useState(false);
  const [likesCount, setLikesCount] = useState(0);
  const [commentsCount, setCommentsCount] = useState(0);
  const [sharesCount, setSharesCount] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [userData, setUserData] = useState<any>(null);

  /* 🔥 REALTIME POST SNAPSHOT MATRIX SYNCHRONIZATION */
  useEffect(() => {
    if (!post?.id) return;

    const ref = doc(db, "posts", post.id);
    const unsub = onSnapshot(ref, (snap) => {
      if (!snap.exists()) return;

      const data: any = snap.data();
      setLikesCount(data.likes || 0);
      
      // FIXING STAGNANT DATA LOOKUP: Listen to both 'comments' and 'commentsCount' 
      setCommentsCount(data.comments || data.commentsCount || 0);
      
      setSharesCount(data.shares || 0);
      setLiked(!!data.likedBy?.includes(userId));
    });

    return unsub;
  }, [post?.id, userId]);

  /* 🔥 REALTIME PROFILE SCHEMA LOADER */
  useEffect(() => {
    if (!post?.userId) return;

    const ref = doc(db, "users", post.userId);
    const unsub = onSnapshot(ref, (snap) => {
      if (snap.exists()) {
        setUserData(snap.data());
      }
    });

    return unsub;
  }, [post?.userId]);
  /* ======================================================
     🔥 AUTO PLAY / AUTO PAUSE VIDEO ENGAGEMENT
  ====================================================== */
  useEffect(() => {
    if (post?.mediaType !== "video") return;

    const controlVideo = async () => {
      try {
        if (!videoRef.current) return;

        /* 🔥 IF VISIBLE PLAY */
        if (isVisible) {
          /* ⛔ STOP PREVIOUS VIDEO PLAYERS */
          if (activeVideoRef && activeVideoRef !== videoRef.current) {
            try {
              await activeVideoRef.pauseAsync();
            } catch {}
          }

          activeVideoRef = videoRef.current;
          await videoRef.current.playAsync();
          setIsPlaying(true);
        }
        /* 🔥 IF NOT VISIBLE PAUSE */
        else {
          await videoRef.current.pauseAsync();
          setIsPlaying(false);
        }
      } catch (e) {
        console.log("Video automation management fault:", e);
      }
    };

    controlVideo();
  }, [isVisible, post?.mediaType]);

  /* ======================================================
     ⏱ TIMESTAMPS
  ====================================================== */
  const formatTime = (timestamp: any) => {
    if (!timestamp) return "Just now";

    const date = timestamp.toDate();
    const diff = (Date.now() - date.getTime()) / 1000;

    if (diff < 60) return "Just now";
    if (diff < 3600) return `${Math.floor(diff / 60)}m`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h`;
    return `${Math.floor(diff / 86400)}d`;
  };

  /* ======================================================
     ❤️ LIKE HANDLER
  ===================================================== */
  const handleLike = async () => {
    if (!post?.id) return;
    await toggleLike(post.id, liked);
  };

  /* ======================================================
     💬 COMMENTS NAVIGATOR
  ====================================================== */
  const openComments = () => {
    if (!post?.id) return;
    router.push({
      pathname: "/comments/[postId]",
      params: { postId: post.id },
    });
  };

  /* ======================================================
     🔁 SHARE UTILITY
  ====================================================== */
  const handleShare = async () => {
    if (!post?.id) return;
    try {
      await Share.share({
        message: post.text || "Check this out 🚀",
      });
      await addShare(post.id);
    } catch (e) {
      console.log("Share dispatch error:", e);
    }
  };

  /* ======================================================
     📄 OPEN POST (REELS REDIRECT)
  ====================================================== */
  const openPost = () => {
    if (!post?.id) return;
    router.push({
      pathname: "/reels",
      params: { postId: post.id },
    });
  };

  /* ======================================================
     🎥 MANUAL VIDEO CONTROLLER TRICK ACTIONS
  ====================================================== */
  const toggleVideo = async () => {
    try {
      if (!videoRef.current) return;

      if (isPlaying) {
        await videoRef.current.pauseAsync();
        setIsPlaying(false);
      } else {
        if (activeVideoRef && activeVideoRef !== videoRef.current) {
          await activeVideoRef.pauseAsync();
        }
        activeVideoRef = videoRef.current;
        await videoRef.current.playAsync();
        setIsPlaying(true);
      }
    } catch (e) {
      console.log("Manual video controller failure:", e);
    }
  };
  if (!post) return null;

  return (
    <TouchableOpacity
      activeOpacity={0.95}
      onPress={openPost}
    >
      <View style={styles.wrapper}>
        <View style={styles.card}>
          
          {/* HEADER ROW TOP */}
          <View style={styles.header}>
            <Image
              source={{
                uri:
                  userData?.avatar ||
                  "https://placeholder.com",
              }}
              style={styles.avatar}
            />

            <View style={{ flex: 1 }}>
              <Text style={styles.name}>
                {userData?.name || "Anonymous"}
              </Text>

              <Text style={styles.meta}>
                {formatTime(post.createdAt)}
              </Text>
            </View>
          </View>

          {/* CAPTION TEXT */}
          {!!post.text && (
            <Text style={styles.text}>
              {post.text}
            </Text>
          )}

          {/* IMAGE CONTAINER LAYOUT */}
          {post.mediaType === "image" && (
            <Image
              source={{ uri: post.mediaUrl }}
              style={styles.media}
            />
          )}

          {/* PREMIUM VIDEO BLOCK (WITHOUT DARK BAR NATIVE CONTROLS) */}
          {post.mediaType === "video" && (
            <TouchableOpacity
              activeOpacity={1}
              onPress={toggleVideo}
              style={styles.videoContainer}
            >
              <Video
                ref={videoRef}
                source={{ uri: post.mediaUrl }}
                style={styles.mediaVideo}
                resizeMode={ResizeMode.COVER}
                isLooping
                shouldPlay={false}
                useNativeControls={false} // Clean premium player view
              />

              {!isPlaying && (
                <View style={styles.playOverlay}>
                  <View style={styles.playCircle}>
                    <FontAwesome
                      name="play"
                      size={24}
                      color="#fff"
                      style={{ marginLeft: 4 }}
                    />
                  </View>
                </View>
              )}
            </TouchableOpacity>
          )}

          {/* FACEBOOK VIDEO STYLE INLINE BUTTON ACTIONS BAR WITH NUMBERS AT FRONT */}
          <View style={styles.actionTrayDivider} />
          <View style={styles.statsRow}>
            
            {/* LIKE BUTTON + COUNT IN FRONT */}
            <TouchableOpacity style={styles.likesRow} onPress={handleLike}>
              <FontAwesome
                name={liked ? "thumbs-up" : "thumbs-o-up"}
                size={22}
                color={liked ? "#1877F2" : "#65676B"}
              />
              <Text style={[styles.statsText, liked && { color: "#1877F2" }]}>
                {likesCount > 0 ? `${likesCount} Like` : "Like"}
              </Text>
            </TouchableOpacity>

            {/* COMMENT BUTTON + COUNT IN FRONT */}
            <TouchableOpacity style={styles.likesRow} onPress={openComments}>
              <FontAwesome name="comment-o" size={22} color="#65676B" />
              <Text style={styles.statsText}>
                {commentsCount > 0 ? `${commentsCount} Comment` : "Comment"}
              </Text>
            </TouchableOpacity>

            {/* SHARE BUTTON + COUNT IN FRONT */}
            <TouchableOpacity style={styles.likesRow} onPress={handleShare}>
              <FontAwesome name="share" size={22} color="#65676B" />
              <Text style={styles.statsText}>
                {sharesCount > 0 ? `${sharesCount} Share` : "Share"}
              </Text>
            </TouchableOpacity>

          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
}

/* 🎨 PREMIUM FACEBOOK INLINE ROW DESIGN CSS HOOKS */
const styles = StyleSheet.create({
  wrapper: {
    paddingHorizontal: 0,
    paddingVertical: 4,
    backgroundColor: "#E9EBEE", 
  },
  card: {
    backgroundColor: "#fff",
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderTopWidth: 0.5,
    borderBottomWidth: 0.5,
    borderColor: "#dddfe2",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 10,
    backgroundColor: "#ddd",
  },
  name: {
    fontWeight: "700",
    fontSize: 15,
    color: "#1c1e21",
  },
  meta: {
    color: "#616770",
    fontSize: 12,
    marginTop: 2,
  },
  text: {
    fontSize: 15,
    color: "#1c1e21",
    lineHeight: 20,
    marginBottom: 10,
    paddingHorizontal: 2,
  },
  media: {
    width: "100%",
    height: 260,
    borderRadius: 4,
    backgroundColor: "#000",
    marginBottom: 10,
  },
  videoContainer: {
    width: "100%",
    height: 260,
    borderRadius: 4,
    backgroundColor: "#000",
    marginBottom: 10,
    overflow: "hidden",
    justifyContent: "center",
    alignItems: "center",
  },
  mediaVideo: {
    width: "100%",
    height: "100%",
  },
  playOverlay: {
    position: "absolute",
    justifyContent: "center",
    alignItems: "center",
    width: "100%",
    height: "100%",
    backgroundColor: "rgba(0, 0, 0, 0.2)",
  },
  playCircle: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: "rgba(0, 0, 0, 0.6)",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.3)",
  },
  actionTrayDivider: {
    height: 0.5,
    backgroundColor: "#dadde1",
    marginTop: 6,
    marginBottom: 4,
  },
  statsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: 2,
  },
  likesRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8, 
    flex: 1,
    paddingVertical: 10,
    justifyContent: "center",
  },
  statsText: {
    color: "#606770",
    fontSize: 14,
    fontWeight: "600",
  },
});
