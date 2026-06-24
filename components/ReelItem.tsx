import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  Image,
  StatusBar,
  Animated,
} from "react-native";

import {
  ResizeMode,
  Video,
} from "expo-av";

import {
  useRef,
  useState,
  useEffect,
} from "react";

import {
  FontAwesome,
  Ionicons,
  Feather,
} from "@expo/vector-icons";

import {
  LinearGradient,
} from "expo-linear-gradient";

import {
  toggleLike,
  addShare,
} from "../services/interactionService";

import {
  db,
  auth,
} from "../firebase/firebaseConfig";

import {
  doc,
  onSnapshot,
} from "firebase/firestore";

const { height, width } =
  Dimensions.get("window");

export default function ReelItem({
  post,
  isActive,
}: any) {
  const videoRef = useRef<Video>(null);

  const scaleAnim = useRef(
    new Animated.Value(0)
  ).current;

  const heartAnim = useRef(
    new Animated.Value(0)
  ).current;

  const userId =
    auth.currentUser?.uid;

  const [liked, setLiked] =
    useState(false);

  const [likes, setLikes] =
    useState(0);

  const [comments, setComments] =
    useState(0);

  const [shares, setShares] =
    useState(0);

  const [playing, setPlaying] =
    useState(false);

  const [muted, setMuted] =
    useState(false);

  const [userData, setUserData] =
    useState<any>(null);

  const [showPlayIcon, setShowPlayIcon] =
    useState(false);

  /* ======================================================
     🛑 SAFETY
  ====================================================== */

  if (!post || !post.mediaUrl)
    return null;

  /* ======================================================
     🔥 AUTO PLAY / PAUSE
  ====================================================== */

  useEffect(() => {
    const controlVideo = async () => {
      try {
        if (!videoRef.current)
          return;

        if (isActive) {
          await videoRef.current.playAsync();

          setPlaying(true);
        } else {
          await videoRef.current.pauseAsync();

          await videoRef.current.setPositionAsync(
            0
          );

          setPlaying(false);
        }
      } catch (e) {
        console.log(e);
      }
    };

    controlVideo();
  }, [isActive]);

  /* ======================================================
     🔥 REALTIME POST
  ====================================================== */

  useEffect(() => {
    if (!post?.id) return;

    const ref = doc(
      db,
      "posts",
      post.id
    );

    const unsub = onSnapshot(
      ref,
      (snap) => {
        if (!snap.exists()) return;

        const data: any =
          snap.data();

        setLikes(data?.likes || 0);

        setComments(
          data?.commentsCount || 0
        );

        setShares(data?.shares || 0);

        setLiked(
          data?.likedBy?.includes(
            userId
          )
        );
      }
    );

    return unsub;
  }, [post?.id]);

  /* ======================================================
     🔥 REALTIME USER
  ====================================================== */

  useEffect(() => {
    if (!post?.userId) return;

    const ref = doc(
      db,
      "users",
      post.userId
    );

    const unsub = onSnapshot(
      ref,
      (snap) => {
        if (snap.exists()) {
          setUserData(snap.data());
        }
      }
    );

    return unsub;
  }, [post?.userId]);

  /* ======================================================
     ❤️ LIKE
  ====================================================== */

  const handleLike = async () => {
    if (!post?.id) return;

    Animated.sequence([
      Animated.spring(
        scaleAnim,
        {
          toValue: 1.2,
          useNativeDriver: true,
        }
      ),

      Animated.spring(
        scaleAnim,
        {
          toValue: 1,
          useNativeDriver: true,
        }
      ),
    ]).start();

    await toggleLike(
      post.id,
      liked
    );
  };

  /* ======================================================
     💥 DOUBLE TAP
  ====================================================== */

  let lastTap = 0;

  const handleDoubleTap = () => {
    const now = Date.now();

    if (now - lastTap < 300) {
      handleLike();

      Animated.sequence([
        Animated.timing(
          heartAnim,
          {
            toValue: 1,
            duration: 200,
            useNativeDriver: true,
          }
        ),

        Animated.timing(
          heartAnim,
          {
            toValue: 0,
            duration: 400,
            useNativeDriver: true,
          }
        ),
      ]).start();
    }

    lastTap = now;
  };

  /* ======================================================
     🔁 SHARE
  ====================================================== */

  const handleShare = async () => {
    if (!post?.id) return;

    await addShare(post.id);
  };

  /* ======================================================
     ▶️ PLAY / PAUSE
  ====================================================== */

  const toggleVideo = async () => {
    try {
      if (!videoRef.current)
        return;

      if (playing) {
        await videoRef.current.pauseAsync();

        setPlaying(false);

        setShowPlayIcon(true);
      } else {
        await videoRef.current.playAsync();

        setPlaying(true);

        setShowPlayIcon(false);
      }

      setTimeout(() => {
        setShowPlayIcon(false);
      }, 700);
    } catch (e) {
      console.log(e);
    }
  };

  /* ======================================================
     🔇 MUTE
  ====================================================== */

  const toggleMute = async () => {
    if (!videoRef.current) return;

    await videoRef.current.setIsMutedAsync(
      !muted
    );

    setMuted(!muted);
  };

  return (
    <TouchableOpacity
      activeOpacity={1}
      onPress={toggleVideo}
      onLongPress={
        handleDoubleTap
      }
    >
      <StatusBar hidden />

      <View style={styles.container}>
        {/* 🎥 VIDEO */}
        <Video
          ref={videoRef}
          source={{
            uri: post.mediaUrl,
          }}
          style={styles.video}
          resizeMode={
            ResizeMode.COVER
          }
          shouldPlay={false}
          isLooping
        />

        {/* 🌑 PREMIUM OVERLAY */}
        <LinearGradient
          colors={[
            "rgba(0,0,0,0.15)",
            "transparent",
            "rgba(0,0,0,0.75)",
          ]}
          style={styles.overlay}
        />

        {/* ❤️ DOUBLE TAP HEART */}
        <Animated.View
          style={[
            styles.bigHeart,
            {
              opacity:
                heartAnim,
              transform: [
                {
                  scale:
                    heartAnim.interpolate(
                      {
                        inputRange: [
                          0,
                          1,
                        ],
                        outputRange:
                          [0.5, 1.4],
                      }
                    ),
                },
              ],
            },
          ]}
        >
          <Ionicons
            name="heart"
            size={120}
            color="#fff"
          />
        </Animated.View>

        {/* ▶️ PLAY ICON */}
        {showPlayIcon && (
          <View
            style={
              styles.playOverlay
            }
          >
            <Ionicons
              name={
                playing
                  ? "pause"
                  : "play"
              }
              size={70}
              color="#fff"
            />
          </View>
        )}

        {/* 🔇 SOUND BUTTON */}
        <TouchableOpacity
          style={styles.soundBtn}
          onPress={toggleMute}
        >
          <Ionicons
            name={
              muted
                ? "volume-mute"
                : "volume-high"
            }
            size={20}
            color="#fff"
          />
        </TouchableOpacity>

        {/* 👉 RIGHT ACTIONS */}
        <View style={styles.actions}>
          {/* ❤️ LIKE */}
          <TouchableOpacity
            style={
              styles.actionBtn
            }
            onPress={
              handleLike
            }
          >
            <Animated.View
              style={{
                transform: [
                  {
                    scale:
                      scaleAnim,
                  },
                ],
              }}
            >
              <Ionicons
                name={
                  liked
                    ? "heart"
                    : "heart-outline"
                }
                size={34}
                color={
                  liked
                    ? "#FF3040"
                    : "#fff"
                }
              />
            </Animated.View>

            <Text
              style={
                styles.count
              }
            >
              {likes}
            </Text>
          </TouchableOpacity>

          {/* 💬 COMMENT */}
          <TouchableOpacity
            style={
              styles.actionBtn
            }
          >
            <Ionicons
              name="chatbubble-outline"
              size={32}
              color="#fff"
            />

            <Text
              style={
                styles.count
              }
            >
              {comments}
            </Text>
          </TouchableOpacity>

          {/* 🔁 SHARE */}
          <TouchableOpacity
            style={
              styles.actionBtn
            }
            onPress={
              handleShare
            }
          >
            <Feather
              name="send"
              size={28}
              color="#fff"
            />

            <Text
              style={
                styles.count
              }
            >
              {shares}
            </Text>
          </TouchableOpacity>

          {/* 👤 PROFILE */}
          <TouchableOpacity
            style={
              styles.profileRing
            }
          >
            <Image
              source={{
                uri:
                  userData?.avatar ||
                  "https://via.placeholder.com/100",
              }}
              style={
                styles.profilePic
              }
            />
          </TouchableOpacity>
        </View>

        {/* 👇 BOTTOM */}
        <View style={styles.bottom}>
          <View
            style={
              styles.userRow
            }
          >
            <Image
              source={{
                uri:
                  userData?.avatar ||
                  "https://via.placeholder.com/100",
              }}
              style={
                styles.avatar
              }
            />

            <View
              style={{
                flex: 1,
              }}
            >
              <View
                style={
                  styles.nameRow
                }
              >
                <Text
                  style={
                    styles.username
                  }
                >
                  {userData?.username ||
                    userData?.name ||
                    "user"}
                </Text>

                <Ionicons
                  name="checkmark-circle"
                  size={16}
                  color="#3EA6FF"
                />
              </View>

              <Text
                style={
                  styles.audioText
                }
              >
                🎵 Original Audio
              </Text>
            </View>

            <TouchableOpacity
              style={
                styles.followBtn
              }
            >
              <Text
                style={
                  styles.followText
                }
              >
                Follow
              </Text>
            </TouchableOpacity>
          </View>

          {!!post.text && (
            <Text
              style={
                styles.caption
              }
              numberOfLines={3}
            >
              {post.text}
            </Text>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
}

/* ======================================================
   🎨 STYLES
====================================================== */

const styles =
  StyleSheet.create({
    container: {
      width,
      height,
      backgroundColor:
        "#000",
    },

    video: {
      width: "100%",
      height: "100%",
      position:
        "absolute",
    },

    overlay: {
      position:
        "absolute",
      width: "100%",
      height: "100%",
    },

    playOverlay: {
      position:
        "absolute",
      top: "45%",
      alignSelf: "center",
      zIndex: 10,
    },

    bigHeart: {
      position:
        "absolute",
      top: "40%",
      alignSelf: "center",
      zIndex: 20,
    },

    soundBtn: {
      position:
        "absolute",
      top: 60,
      right: 20,
      backgroundColor:
        "rgba(0,0,0,0.35)",
      width: 42,
      height: 42,
      borderRadius: 21,
      justifyContent:
        "center",
      alignItems:
        "center",
    },

    actions: {
      position:
        "absolute",
      right: 12,
      bottom: 130,
      alignItems:
        "center",
    },

    actionBtn: {
      alignItems:
        "center",
      marginBottom: 24,
    },

    count: {
      color: "#fff",
      fontSize: 13,
      fontWeight: "700",
      marginTop: 6,
    },

    profileRing: {
      width: 50,
      height: 50,
      borderRadius: 25,
      borderWidth: 2,
      borderColor:
        "#fff",
      padding: 2,
    },

    profilePic: {
      width: "100%",
      height: "100%",
      borderRadius: 25,
    },

    bottom: {
      position:
        "absolute",
      bottom: 45,
      left: 14,
      right: 80,
    },

    userRow: {
      flexDirection: "row",
      alignItems:
        "center",
      marginBottom: 10,
    },

    avatar: {
      width: 42,
      height: 42,
      borderRadius: 21,
      marginRight: 12,
      borderWidth: 2,
      borderColor:
        "#fff",
    },

    nameRow: {
      flexDirection: "row",
      alignItems:
        "center",
      gap: 5,
    },

    username: {
      color: "#fff",
      fontWeight: "800",
      fontSize: 15,
    },

    audioText: {
      color:
        "rgba(255,255,255,0.75)",
      fontSize: 12,
      marginTop: 2,
    },

    followBtn: {
      borderWidth: 1,
      borderColor:
        "#fff",
      paddingHorizontal: 16,
      paddingVertical: 7,
      borderRadius: 10,
    },

    followText: {
      color: "#fff",
      fontWeight: "700",
      fontSize: 13,
    },

    caption: {
      color: "#fff",
      fontSize: 14,
      lineHeight: 21,
      marginTop: 5,
    },
  });