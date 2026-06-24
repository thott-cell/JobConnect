import {
  View,
  FlatList,
  Dimensions,
  StyleSheet,
  StatusBar,
} from "react-native";
import { useEffect, useState, useRef } from "react";
import { db } from "../firebase/firebaseConfig";
import {
  collection,
  onSnapshot,
  query,
  orderBy,
} from "firebase/firestore";

import ReelItem from "../components/ReelItem";

const { height } = Dimensions.get("window");

export default function Reels() {
  const [reels, setReels] = useState<any[]>([]);
  const [activeIndex, setActiveIndex] = useState(0);

  const viewConfigRef = useRef({
    viewAreaCoveragePercentThreshold: 80,
  });

  const onViewRef = useRef(({ viewableItems }: any) => {
    if (viewableItems.length > 0) {
      setActiveIndex(viewableItems[0].index);
    }
  });

  /* 🔥 LOAD REELS (VIDEOS ONLY) */
  useEffect(() => {
    const q = query(
      collection(db, "posts"),
      orderBy("createdAt", "desc")
    );

    const unsub = onSnapshot(q, (snap) => {
      const data: any[] = [];

      snap.forEach((doc) => {
        const d = doc.data();

        // ✅ ONLY POSTS WITH VIDEO
        if (d?.mediaType === "video" && d?.mediaUrl) {
          data.push({
            id: doc.id, // 🔥 REQUIRED
            ...d,
          });
        }
      });

      console.log("REELS:", data); // DEBUG

      setReels(data);
    });

    return unsub;
  }, []);

  return (
    <View style={styles.container}>
      <StatusBar hidden />

      <FlatList
        data={reels}
        keyExtractor={(item) => item.id}
        pagingEnabled
        showsVerticalScrollIndicator={false}
        snapToAlignment="start"
        decelerationRate="fast"

        /* 🔥 AUTO PLAY CONTROL */
        onViewableItemsChanged={onViewRef.current}
        viewabilityConfig={viewConfigRef.current}

        renderItem={({ item, index }) => (
          <View style={{ height }}>
            <ReelItem
              post={item}
              isActive={index === activeIndex}
            />
          </View>
        )}
      />
    </View>
  );
}

/* 🎨 STYLE */
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000",
  },
});