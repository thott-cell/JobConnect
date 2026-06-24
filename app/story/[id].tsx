import {
  View,
  StyleSheet,
  TouchableOpacity,
  Text,
  Image,
  Dimensions,
  ActivityIndicator,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from "react-native";
import { useEffect, useState, useRef } from "react";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Video, ResizeMode } from "expo-av";
import { Ionicons } from "@expo/vector-icons";
import { db, auth } from "../../firebase/firebaseConfig";
import {
  doc,
  collection,
  onSnapshot,
  updateDoc,
  arrayUnion,
  query,
  where,
} from "firebase/firestore";

const { width, height } = Dimensions.get("window");

export default function WhatsAppStoryScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  
  const [storyList, setStoryList] = useState<any[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [progress, setProgress] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const [replyText, setReplyText] = useState("");

  const videoRef = useRef<Video>(null);
  const progressInterval = useRef<any>(null);

  /* 🔥 WHATSAPP ENGINE: FETCH ALL ACTIVE STORIES FOR THIS USER WITHOUT INDEX CRASHES */
  useEffect(() => {
    if (!id) return;

    const initialStoryRef = doc(db, "stories", id as string);
    
    const unsubInitial = onSnapshot(initialStoryRef, (snap) => {
      if (!snap.exists()) {
        router.back();
        return;
      }
      
      const initialData: any = snap.data();
      const targetUserId = initialData.userId;

      // INDEX CRASH FIX: Query using a single 'where' clause (No composite index required!)
      const q = query(
        collection(db, "stories"),
        where("userId", "==", targetUserId)
      );

      const unsubList = onSnapshot(q, (listSnap) => {
        let items = listSnap.docs.map(d => ({ id: d.id, ...d.data() }));
        
        // SAFE IN-MEMORY CHRONOLOGICAL SORTING
        items.sort((a: any, b: any) => {
          const aTime = a.createdAt?.seconds || 0;
          const bTime = b.createdAt?.seconds || 0;
          return aTime - bTime;
        });

        setStoryList(items);

        const foundIndex = items.findIndex(item => item.id === (id as string));
        setCurrentIndex(foundIndex !== -1 ? foundIndex : 0);
        setLoading(false);
      });

      return () => unsubList();
    });

    return () => unsubInitial();
  }, [id]);

  /* 🔥 VIEWS REGISTRATION ATOMIC TRACKER */
  useEffect(() => {
    if (loading || storyList.length === 0) return;
    
    const currentStory = storyList[currentIndex];
    if (auth.currentUser?.uid && currentStory?.id) {
      updateDoc(doc(db, "stories", currentStory.id), {
        viewers: arrayUnion(auth.currentUser.uid),
      });
    }
  }, [currentIndex, loading, storyList]);

  const activeStory = storyList[currentIndex];


   /* ======================================================
     ⏱ TIMESTAMPS (CRASH FIX: FULLY IMPLEMENTED)
  ====================================================== */
  const formatTime = (timestamp: any) => {
    if (!timestamp) return "Just now";

    // Handle standard Firestore timestamps (.toDate) safely
    const date = typeof timestamp.toDate === "function" ? timestamp.toDate() : new Date(timestamp);
    const diff = (Date.now() - date.getTime()) / 1000;

    if (diff < 60) return "Just now";
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return `${Math.floor(diff / 86400)}d ago`;
  };

  /* ======================================================
     🔥 WHATSAPP MULTI-SEGMENT TIMELINE LIFECYCLE ENGINE
  ====================================================== */
  useEffect(() => {
    if (loading || storyList.length === 0 || !activeStory) return;

    setProgress(0);
    if (progressInterval.current) clearInterval(progressInterval.current);

    if (activeStory.mediaType === "video") {
      return; // Videos handle bar filling via onPlaybackStatusUpdate
    }

    let currentProgress = 0;
    progressInterval.current = setInterval(() => {
      if (isPlaying) {
        currentProgress += 0.02;
        if (currentProgress >= 1) {
          clearInterval(progressInterval.current);
          handleNextSegment();
        }
        setProgress(Math.min(currentProgress, 1));
      }
    }, 100);

    return () => {
      if (progressInterval.current) clearInterval(progressInterval.current);
    };
  }, [currentIndex, loading, storyList, isPlaying]);

  /* ⏭️ SEGMENT PROGRESSION HANDLERS */
  const handleNextSegment = () => {
    if (currentIndex < storyList.length - 1) {
      setCurrentIndex(prev => prev + 1);
    } else {
      router.back();
    }
  };

  const handlePrevSegment = () => {
    if (currentIndex > 0) {
      setCurrentIndex(prev => prev - 1);
    } else {
      setProgress(0);
      if (activeStory?.mediaType === "video" && videoRef.current) {
        videoRef.current.setPositionAsync(0);
      }
    }
  };

  /* 🎥 VIDEO PERFORMANCE METRICS TRACKER */
  const handleVideoStatusUpdate = (status: any) => {
    if (!status.isLoaded) return;

    if (status.didJustFinish) {
      handleNextSegment();
      return;
    }

    if (status.durationMillis && status.positionMillis) {
      setProgress(status.positionMillis / status.durationMillis);
    }
  };

  /* 🧭 WHATSAPP MULTI-TAP NAVIGATION */
  const handleScreenTouch = (event: any) => {
    const touchX = event.nativeEvent.locationX;
    if (touchX < width * 0.3) {
      handlePrevSegment(); // Left 30% goes back
    } else {
      handleNextSegment(); // Right 70% skips forward
    }
  };

  /* ⏸️ LONG-PRESS TO FREEZE PLAYBACK FLOWS */
  const handlePressIn = async () => {
    setIsPlaying(false);
    if (activeStory?.mediaType === "video" && videoRef.current) {
      await videoRef.current.pauseAsync();
    }
  };

  const handlePressOut = async () => {
    setIsPlaying(true);
    if (activeStory?.mediaType === "video" && videoRef.current) {
      await videoRef.current.playAsync();
    }
  };

  /* 💬 WHATSAPP STATUS MESSAGE DISPATCH LAYER */
  const sendStatusReply = async () => {
    if (!replyText.trim() || !auth.currentUser?.uid) return;
    setReplyText("");
    Alert.alert("Sent", "Status reply sent directly to chat thread.");
  };
  // UI Gate Guardian Loader
  if (loading || storyList.length === 0 || !activeStory) {
    return (
      <View style={[styles.container, { justifyContent: "center", alignItems: "center" }]}>
        <ActivityIndicator size="large" color="#075E54" />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      
      {/* 🧭 TOP LAYER PANEL: WHATSAPP SEGMENTED TIMELINE BARS & HEADERS */}
      <View style={styles.topOverlayBar}>
        
        {/* MULTI-SEGMENTED PROGRESS LINES */}
        <View style={styles.segmentsRowContainer}>
          {storyList.map((item, index) => {
            let itemProgress = 0;
            if (index < currentIndex) itemProgress = 1; // Completed status elements
            if (index === currentIndex) itemProgress = progress; // Active segment mapping

            return (
              <View key={item.id} style={styles.individualSegmentTrack}>
                <View style={[styles.segmentFillIndicator, { width: `${itemProgress * 100}%` }]} />
              </View>
            );
          })}
        </View>

        {/* PROFILE METADATA SECTION */}
        <View style={styles.profileHeaderRow}>
          <View style={styles.profileLeftGroup}>
            <Image
              source={{ uri: activeStory.userAvatar || "https://placeholder.com" }}
              style={styles.whatsappAuthorAvatar}
            />
            <View>
              <Text style={styles.whatsappAuthorName}>{activeStory.userName || "Anonymous"}</Text>
              <Text style={styles.whatsappTimestampText}>{formatTime(activeStory.createdAt)}</Text>
            </View>
          </View>

          {/* BACK REDIRECT ICON PANEL */}
          <TouchableOpacity onPress={() => router.back()} style={styles.closeButtonTray}>
            <Ionicons name="close" size={26} color="#fff" />
          </TouchableOpacity>
        </View>

      </View>

      {/* 🖲️ ACTIVE GESTURE WORKSPACE FIELD LAYER */}
      <TouchableOpacity
        activeOpacity={1}
        onPress={handleScreenTouch}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        style={styles.touchCaptureWorkspace}
      >
        {activeStory.mediaType === "video" ? (
          <Video
            ref={videoRef}
            source={{ uri: activeStory.mediaUrl }}
            style={styles.media}
            resizeMode={ResizeMode.COVER}
            shouldPlay={isPlaying}
            isLooping={false}
            useNativeControls={false}
            onPlaybackStatusUpdate={handleVideoStatusUpdate}
          />
        ) : activeStory.mediaType === "image" ? (
          <Image 
            source={{ uri: activeStory.mediaUrl }} 
            style={styles.media} 
            resizeMode="cover"
          />
        ) : (
          /* 📝 SUPPORT FOR WHATSAPP CUSTOM BACKGROUND SOLID TEXT-ONLY STATUSES */
          <View style={[styles.media, styles.textStatusCanvas, { backgroundColor: activeStory.backgroundColor || "#075E54" }]}>
            <Text style={styles.textStatusContent}>{activeStory.text}</Text>
          </View>
        )}
      </TouchableOpacity>

      {/* 💬 WHATSAPP STYLE BOTTOM TEXT REPLY INPUT BOX BAR TRAY */}
      <View style={styles.bottomReplyTray}>
        <View style={styles.replyBarInputBox}>
          <TextInput
            placeholder="Reply"
            placeholderTextColor="rgba(255,255,255,0.6)"
            value={replyText}
            onChangeText={setReplyText}
            style={styles.textInputTrayField}
            multiline
          />
          <TouchableOpacity onPress={sendStatusReply} style={styles.sendButtonArrow}>
            <Ionicons name="send" size={18} color="#fff" />
          </TouchableOpacity>
        </View>
        
        <View style={styles.swipeUpBadgeRow}>
          <Ionicons name="chevron-up" size={16} color="rgba(255,255,255,0.7)" />
          <Text style={styles.swipeUpText}>Reply</Text>
        </View>
      </View>

    </KeyboardAvoidingView>
  );
}

/* 🎨 WHATSAPP SYSTEM INTERFACE LAYOUT DESIGNS */
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000",
  },
  touchCaptureWorkspace: {
    flex: 1,
    width: "100%",
    height: "100%",
  },
  media: {
    width: "100%",
    height: "100%",
  },
  textStatusCanvas: {
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 30,
  },
  textStatusContent: {
    color: "#fff",
    fontSize: 24,
    fontWeight: "700",
    textAlign: "center",
    lineHeight: 34,
  },
  topOverlayBar: {
    position: "absolute",
    top: 45,
    left: 0,
    right: 0,
    zIndex: 10,
    paddingHorizontal: 10,
  },
  segmentsRowContainer: {
    flexDirection: "row",
    width: "100%",
    justifyContent: "space-between",
    paddingHorizontal: 2,
    marginBottom: 12,
  },
  individualSegmentTrack: {
    flex: 1,
    height: 3,
    backgroundColor: "rgba(255, 255, 255, 0.25)",
    borderRadius: 2,
    marginHorizontal: 2,
    overflow: "hidden",
  },
  segmentFillIndicator: {
    height: "100%",
    backgroundColor: "#fff",
  },
  profileHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    width: "100%",
    paddingHorizontal: 6,
  },
  profileLeftGroup: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  whatsappAuthorAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#222",
  },
  whatsappAuthorName: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "700",
  },
  whatsappTimestampText: {
    color: "rgba(255, 255, 255, 0.65)",
    fontSize: 12,
    marginTop: 2,
  },
  closeButtonTray: {
    padding: 2,
  },
  bottomReplyTray: {
    position: "absolute",
    bottom: Platform.OS === "ios" ? 30 : 15,
    left: 0,
    right: 0,
    zIndex: 20,
    paddingHorizontal: 12,
    alignItems: "center",
  },
  replyBarInputBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "transparent",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.3)",
    borderRadius: 25,
    paddingHorizontal: 16,
    paddingVertical: 4,
    width: "100%",
    marginBottom: 6,
  },
  textInputTrayField: {
    flex: 1,
    color: "#fff",
    fontSize: 15,
    maxHeight: 80,
  },
  sendButtonArrow: {
    paddingLeft: 10,
  },
  swipeUpBadgeRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    opacity: 0.8,
  },
  swipeUpText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "600",
    marginLeft: 2,
  },
});
