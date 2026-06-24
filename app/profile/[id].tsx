import {
  View,
  Text,
  StyleSheet,
  Image,
  FlatList,
  ActivityIndicator,
  TouchableOpacity,
} from "react-native";
import { useEffect, useState } from "react";
import { useLocalSearchParams, useRouter } from "expo-router";

import { db, auth } from "../../firebase/firebaseConfig";
import {
  doc,
  getDoc,
  collection,
  query,
  where,
  onSnapshot,
} from "firebase/firestore";

export default function PublicProfile() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const currentUser = auth.currentUser;

  const [userData, setUserData] = useState<any>(null);
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  /* 🔥 LOAD USER */
  useEffect(() => {
    const loadUser = async () => {
      if (!id) return;

      const ref = doc(db, "users", id as string);
      const snap = await getDoc(ref);

      if (snap.exists()) {
        setUserData(snap.data());
      }

      setLoading(false);
    };

    loadUser();
  }, [id]);

  /* 🔥 LOAD POSTS */
  useEffect(() => {
    if (!id) return;

    const q = query(
      collection(db, "posts"),
      where("userId", "==", id)
    );

    const unsub = onSnapshot(q, (snap) => {
      const data = snap.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      setPosts(data);
    });

    return unsub;
  }, [id]);

  /* 🔥 START CHAT */
  const startChat = () => {
    if (!id) return;

    router.push({
      pathname: "/chat/[chatId]",
      params: { chatId: id },
    });
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <FlatList
      data={posts}
      keyExtractor={(item) => item.id}
      numColumns={3}
      contentContainerStyle={{ paddingBottom: 80 }}
      ListHeaderComponent={
        <View>
          {/* HEADER */}
          <View style={styles.header}>
            <Image
              source={{
                uri:
                  userData?.avatar ||
                  "https://via.placeholder.com/100",
              }}
              style={styles.avatar}
            />

            <Text style={styles.name}>
              {userData?.name || "User"}
            </Text>

            <Text style={styles.username}>
              @{userData?.username}
            </Text>

            <Text style={styles.headline}>
              {userData?.headline || "No headline"}
            </Text>

            {!!userData?.location && (
              <Text style={styles.location}>
                {userData.location}
              </Text>
            )}

            {/* ACTION BUTTONS */}
            {currentUser?.uid !== id && (
              <View style={styles.actions}>
                <TouchableOpacity
                  style={styles.connectBtn}
                >
                  <Text style={{ color: "#6C2BD9" }}>
                    Connect
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.messageBtn}
                  onPress={startChat}
                >
                  <Text style={{ color: "#fff" }}>
                    Message
                  </Text>
                </TouchableOpacity>
              </View>
            )}
          </View>

          {/* ABOUT */}
          {!!userData?.bio && (
            <Section title="About">
              <Text>{userData.bio}</Text>
            </Section>
          )}

          {/* SKILLS */}
          {!!userData?.skills?.length && (
            <Section title="Skills">
              <View style={styles.skillsWrap}>
                {userData.skills.map((s: string, i: number) => (
                  <View key={i} style={styles.skill}>
                    <Text style={styles.skillText}>{s}</Text>
                  </View>
                ))}
              </View>
            </Section>
          )}

          {/* EXPERIENCE */}
          {!!userData?.experience?.length && (
            <Section title="Experience">
              {userData.experience.map((exp: any, i: number) => (
                <View key={i} style={styles.expCard}>
                  <Text style={styles.expRole}>
                    {exp.role}
                  </Text>
                  <Text>{exp.company}</Text>
                  <Text style={styles.expDate}>
                    {exp.start} - {exp.end}
                  </Text>
                </View>
              ))}
            </Section>
          )}

          {/* ACTIVITY */}
          <View style={styles.activityHeader}>
            <Text style={styles.sectionTitle}>
              Activity
            </Text>
          </View>
        </View>
      }
      renderItem={({ item }) => (
        <Image
          source={{ uri: item.mediaUrl }}
          style={styles.postImage}
        />
      )}
    />
  );
}

/* COMPONENTS */
function Section({ title, children }: any) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {children}
    </View>
  );
}

/* STYLES */
const styles = StyleSheet.create({
  header: {
    alignItems: "center",
    padding: 20,
    backgroundColor: "#fff",
  },

  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
  },

  name: { fontSize: 20, fontWeight: "700" },
  username: { color: "#65676B" },

  headline: { marginTop: 6 },
  location: { color: "#65676B", marginTop: 4 },

  actions: {
    flexDirection: "row",
    marginTop: 15,
    gap: 10,
  },

  connectBtn: {
    borderWidth: 1,
    borderColor: "#6C2BD9",
    padding: 8,
    borderRadius: 6,
  },

  messageBtn: {
    backgroundColor: "#6C2BD9",
    padding: 8,
    borderRadius: 6,
  },

  section: {
    backgroundColor: "#fff",
    padding: 15,
    marginTop: 10,
  },

  sectionTitle: {
    fontWeight: "700",
    marginBottom: 10,
  },

  skillsWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },

  skill: {
    backgroundColor: "#E7F3FF",
    padding: 6,
    borderRadius: 20,
  },

  skillText: {
    color: "#1877F2",
  },

  expCard: {
    marginBottom: 10,
  },

  expRole: {
    fontWeight: "700",
  },

  expDate: {
    fontSize: 12,
    color: "#777",
  },

  activityHeader: {
    padding: 15,
    backgroundColor: "#fff",
    marginTop: 10,
  },

  postImage: {
    width: "33%",
    height: 120,
  },

  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
});