import {
  View,
  FlatList,
  SafeAreaView,
  StyleSheet,
  TextInput,
  Text,
  ScrollView,
  TouchableOpacity,
  Image,
} from "react-native";
import { useEffect, useState, useMemo } from "react";
import { db } from "../../firebase/firebaseConfig";
import { collection, onSnapshot } from "firebase/firestore";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import PostCard from "../../components/PostCard";

/* ======================================================
   🔥 WHATSAPP STYLE SEGMENTED AVATAR BORDER COMPONENT
====================================================== */
function SegmentedStoryAvatar({ count, avatarUrl }: { count: number; avatarUrl: string }) {
  // If a user has only 1 status, show a single continuous circular border ring
  if (count <= 1) {
    return (
      <View style={[styles.avatarRingWrapper, { borderColor: "#075E54", borderWidth: count === 1 ? 2.5 : 0 }]}>
        <Image source={{ uri: avatarUrl || "https://placeholder.com" }} style={styles.avatarInnerImage} />
      </View>
    );
  }

  // If a user has multiple stories, build WhatsApp dash segment slices via absolutely positioned border overlays
  return (
    <View style={styles.avatarRingWrapper}>
      <Image source={{ uri: avatarUrl || "https://placeholder.com" }} style={styles.avatarInnerImage} />
      
      {Array.from({ length: count }).map((_, index) => {
        const rotationAngle = (360 / count) * index;
        const arcSize = 360 / count - 4; // Subtraction forces a distinct WhatsApp gap stroke between segment bars

        return (
          <View
            key={index}
            style={[
              styles.segmentSliceOverlay,
              {
                transform: [{ rotate: `${rotationAngle}deg` }],
                borderTopColor: "#075E54", // WhatsApp signature green ring color
                borderRightColor: arcSize > 90 ? "#075E54" : "transparent",
                borderBottomColor: arcSize > 180 ? "#075E54" : "transparent",
                borderLeftColor: arcSize > 270 ? "#075E54" : "transparent",
              },
            ]}
          />
        );
      })}
    </View>
  );
}

export default function Feed() {
  const router = useRouter();

  const [posts, setPosts] = useState<any[]>([]);
  const [filteredPosts, setFilteredPosts] = useState<any[]>([]);
  const [stories, setStories] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState<"For you" | "Following">("For you");
    /* 🔥 LOAD POSTS WITH SAFE CHRONOLOGICAL SORT */
  useEffect(() => {
    const unsub = onSnapshot(collection(db, "posts"), (snap) => {
      let data = snap.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      data.sort((a: any, b: any) => {
        const aTime = a.createdAt?.seconds || 0;
        const bTime = b.createdAt?.seconds || 0;
        return bTime - aTime;
      });

      setPosts(data);
      setFilteredPosts(data);
    });

    return unsub;
  }, []);

  /* 🔥 LOAD STORIES INSTANCES ROOT NODE STREAMS */
  useEffect(() => {
    const unsub = onSnapshot(collection(db, "stories"), (snap) => {
      const data = snap.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      setStories(data);
    });

    return unsub;
  }, []);

  /* 👥 WHATSAPP STATUS GROUPING PIPELINE MATRIX */
  const groupedStories = useMemo(() => {
    const userGroups: { [key: string]: any[] } = {};

    // Group each raw status entry by user identification codes
    stories.forEach((story) => {
      if (!story.userId) return;
      if (!userGroups[story.userId]) {
        userGroups[story.userId] = [];
      }
      userGroups[story.userId].push(story);
    });

    // Transform dictionary mappings back into a clean chronological list view
    return Object.keys(userGroups).map((userId) => {
      const userStoriesList = userGroups[userId];
      
      // Sort this individual user's stories chronologically
      userStoriesList.sort((a: any, b: any) => {
        const aTime = a.createdAt?.seconds || 0;
        const bTime = b.createdAt?.seconds || 0;
        return aTime - bTime;
      });

      // Grab the earliest unviewed status entry to use as the navigation launchpad link anchor
      const targetStoryItem = userStoriesList[0];

      return {
        id: targetStoryItem.id, // Passes down target list entry ID parameter keys
        userId: userId,
        userName: targetStoryItem.userName || "User",
        userAvatar: targetStoryItem.userAvatar || "",
        totalStoriesCount: userStoriesList.length, // Dictates how many dash segments to draw
      };
    });
  }, [stories]);

  /* 🔍 FILTER ENGINE LOGIC */
  useEffect(() => {
    let data = [...posts];

    if (search.trim()) {
      data = data.filter((item) =>
        item?.text?.toLowerCase().includes(search.toLowerCase())
      );
    }

    if (activeTab === "Following") {
      data = data.slice(0, 5);
    }

    setFilteredPosts(data);
  }, [search, activeTab, posts]);
  return (
    <SafeAreaView style={styles.container}>
      <FlatList
        data={filteredPosts}
        keyExtractor={(item) => item?.id ?? Math.random().toString()}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 120 }}

        /* 🔥 HEADER ROW SLOTS */
        ListHeaderComponent={
          <View>
            {/* 🔍 SEARCH FIELDS */}
            <View style={styles.searchRow}>
              <View style={styles.searchBox}>
                <Ionicons name="search" size={18} color="#999" />
                <TextInput
                  placeholder="Search..."
                  placeholderTextColor="#999"
                  value={search}
                  onChangeText={setSearch}
                  style={styles.input}
                />
              </View>

              <TouchableOpacity style={styles.filterBtn}>
                <Ionicons name="options-outline" size={20} color="#6C2BD9" />
              </TouchableOpacity>
            </View>

            {/* 👤 WHATSAPP STORIES PANEL */}
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.stories}
            >
              {/* ➕ CREATE STORY TRIGGER */}
              <TouchableOpacity
                style={styles.storyItem}
                onPress={() => router.push("/(tabs)/create-post")}
              >
                <View style={[styles.myStoryAvatar, styles.myStoryBg]}>
                  <Text style={styles.plus}>+</Text>
                </View>
                <Text style={styles.storyText}>Your status</Text>
              </TouchableOpacity>

              {/* 🔥 REAL GROUPED STORIES WITH SEGMENTED ROUND BORDERS */}
              {groupedStories.map((group: any) => {
                if (!group?.id) return null;
                
                return (
                  <TouchableOpacity
                    key={group.userId}
                    style={styles.storyItem}
                    onPress={() =>
                      router.push({
                        pathname: "/story/[id]",
                        params: { id: group.id },
                      })
                    }
                  >
                    {/* INJECT WHATSAPP MATHEMATICAL DASH BORDER CALCULATOR */}
                    <SegmentedStoryAvatar 
                      count={group.totalStoriesCount} 
                      avatarUrl={group.userAvatar} 
                    />
                    <Text style={styles.storyText} numberOfLines={1}>
                      {group.userName || "User"}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            {/* 🔥 FEED NAVIGATION TABS */}
            <View style={styles.tabs}>
              {["For you", "Following"].map((tab) => (
                <TouchableOpacity
                  key={tab}
                  onPress={() => setActiveTab(tab as any)}
                  style={[
                    styles.tabBtn,
                    activeTab === tab && styles.activeTab,
                  ]}
                >
                  <Text
                    style={[
                      styles.tabText,
                      activeTab === tab && styles.activeText,
                    ]}
                  >
                    {tab}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        }

        /* 🔥 RENDER POST LAYOUT CHANNELS */
        renderItem={({ item }) => {
          if (!item || !item.id || !item.userId) return null;
          return <PostCard post={item} />;
        }}
      />
    </SafeAreaView>
  );
}

/* 🎨 PREMIUM WHATSAPP DASH SEGMENT STYLE SHEET */
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  searchRow: {
    flexDirection: "row",
    paddingHorizontal: 15,
    marginTop: 12,
    alignItems: "center",
  },
  searchBox: {
    flex: 1,
    flexDirection: "row",
    backgroundColor: "#F5F5F7",
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 14,
    alignItems: "center",
  },
  input: {
    marginLeft: 8,
    flex: 1,
    fontSize: 14,
  },
  filterBtn: {
    marginLeft: 10,
    backgroundColor: "#F3E8FF",
    padding: 10,
    borderRadius: 12,
  },
  stories: {
    marginTop: 18,
    paddingLeft: 15,
  },
  storyItem: {
    alignItems: "center",
    marginRight: 16,
    width: 68, // Fixed width prevents labels from overlapping row segments
  },
  
  /* WHATSAPP AVATAR LAYOUT WRAPPER MATRIX RULES */
  avatarRingWrapper: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 6,
    position: "relative",
  },
  avatarInnerImage: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: "#eee",
    zIndex: 2, // Layer profile photo over background boundary ring structures
  },
  segmentSliceOverlay: {
    position: "absolute",
    width: 58,
    height: 58,
    borderRadius: 29,
    borderWidth: 2.5, // Thickness of WhatsApp border line segments
    backgroundColor: "#6C2BD9",
    zIndex: 1,
  },

  /* CREATE MY STORY ICON LAYOUT CONTEXTS */
  myStoryAvatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    marginBottom: 8,
    marginTop: 2, // Alignment adjustment layer
  },
  myStoryBg: {
    backgroundColor: "#6C2BD9", // WhatsApp signature base color
    justifyContent: "center",
    alignItems: "center",
    borderRadius:"100%"
  },
  plus: {
    color: "#fff",
    fontSize: 22,
    fontWeight: "bold",
  },
  storyText: {
    fontSize: 12,
    color: "#444",
    textAlign: "center",
    width: "100%",
  },
  tabs: {
    flexDirection: "row",
    marginTop: 18,
    paddingHorizontal: 15,
  },
  tabBtn: {
    marginRight: 10,
    paddingVertical: 7,
    paddingHorizontal: 14,
    borderRadius: 20,
    backgroundColor: "#F3F4F6",
  },
  activeTab: {
    backgroundColor: "#6C2BD9",
  },
  tabText: {
    fontSize: 13,
    color: "#666",
  },
  activeText: {
    color: "#fff",
    fontWeight: "600",
  },
});

