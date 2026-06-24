import {
  View,
  Text,
  StyleSheet,
  Image,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import { useEffect, useState } from "react";
import { useRouter } from "expo-router";

import { auth, db } from "../../firebase/firebaseConfig";

import {
  doc,
  collection,
  query,
  where,
  onSnapshot,
} from "firebase/firestore";

export default function Profile() {
  const user = auth.currentUser;
  const router = useRouter();

  const [userData, setUserData] = useState<any>(null);
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  /* 🔥 USER REALTIME */
  useEffect(() => {
    if (!user) return;

    const ref = doc(db, "users", user.uid);

    const unsub = onSnapshot(ref, (snap) => {
      if (snap.exists()) {
        setUserData(snap.data());
      }

      setLoading(false);
    });

    return unsub;
  }, []);

  /* 🔥 POSTS */
  useEffect(() => {
    if (!user) return;

    const q = query(
      collection(db, "posts"),
      where("userId", "==", user.uid)
    );

    const unsub = onSnapshot(q, (snap) => {
      const data = snap.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      setPosts(data);
    });

    return unsub;
  }, []);

  /* ✅ COUNTS */
  const connectionsCount = Array.isArray(
    userData?.connections
  )
    ? userData.connections.length
    : 0;

  const followersCount = Array.isArray(
    userData?.followers
  )
    ? userData.followers.length
    : 0;

  const followingCount = Array.isArray(
    userData?.following
  )
    ? userData.following.length
    : 0;

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
      contentContainerStyle={{ paddingBottom: 120 }}
      ListHeaderComponent={
        <View>
          {/* 🔷 HEADER */}
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
              @{userData?.username || "username"}
            </Text>

            <Text style={styles.headline}>
              {userData?.headline ||
                "Add your profession"}
            </Text>

            {!!userData?.location && (
              <Text style={styles.location}>
                {userData.location}
              </Text>
            )}

            {/* 📊 STATS */}
            <View style={styles.stats}>
              {/* CONNECTIONS */}
              <TouchableOpacity
                onPress={() =>
                  router.push({
                    pathname: "/connections",
                    params: {
                      userId: user?.uid,
                    },
                  })
                }
              >
                <Stat
                  label="Connections"
                  value={connectionsCount}
                />
              </TouchableOpacity>

              {/* FOLLOWERS */}
              <TouchableOpacity
                onPress={() =>
                  router.push({
                    pathname: "/followers",
                    params: {
                      userId: user?.uid,
                    },
                  })
                }
              >
                <Stat
                  label="Followers"
                  value={followersCount}
                />
              </TouchableOpacity>

              {/* FOLLOWING */}
              <TouchableOpacity
                onPress={() =>
                  router.push({
                    pathname: "/following",
                    params: {
                      userId: user?.uid,
                    },
                  })
                }
              >
                <Stat
                  label="Following"
                  value={followingCount}
                />
              </TouchableOpacity>
            </View>

            {/* 🔥 BUTTONS */}
            <View style={styles.buttonRow}>
              <TouchableOpacity
                style={styles.editBtn}
                onPress={() =>
                  router.push("/edit-profile")
                }
              >
                <Text style={styles.btnText}>
                  Edit Profile
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.jobBtn}
                onPress={() =>
                  router.push("/create-job")
                }
              >
                <Text style={styles.btnText}>
                  Post Job
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* 🔷 ABOUT */}
          {!!userData?.bio && (
            <Section title="About">
              <Text style={styles.text}>
                {userData.bio}
              </Text>
            </Section>
          )}

          {/* 🔷 SKILLS */}
          {!!userData?.skills?.length && (
            <Section title="Skills">
              <View style={styles.skillsWrap}>
                {userData.skills.map(
                  (skill: string, i: number) => (
                    <View
                      key={i}
                      style={styles.skill}
                    >
                      <Text style={styles.skillText}>
                        {skill}
                      </Text>
                    </View>
                  )
                )}
              </View>
            </Section>
          )}

          {/* 🔷 EXPERIENCE */}
          {!!userData?.experience?.length && (
            <Section title="Experience">
              {userData.experience.map(
                (exp: any, i: number) => (
                  <View
                    key={i}
                    style={styles.expCard}
                  >
                    <Text style={styles.expRole}>
                      {exp.role}
                    </Text>

                    <Text
                      style={styles.expCompany}
                    >
                      {exp.company}
                    </Text>

                    <Text style={styles.expDate}>
                      {exp.start} - {exp.end}
                    </Text>

                    {!!exp.description && (
                      <Text
                        style={styles.expDesc}
                      >
                        {exp.description}
                      </Text>
                    )}
                  </View>
                )
              )}
            </Section>
          )}

          {/* 🔷 ACTIVITY */}
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

/* 🔹 SECTION */
function Section({ title, children }: any) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>
        {title}
      </Text>

      {children}
    </View>
  );
}

/* 🔹 STAT */
function Stat({ label, value }: any) {
  return (
    <View style={{ alignItems: "center" }}>
      <Text
        style={{
          fontWeight: "700",
          fontSize: 16,
        }}
      >
        {value}
      </Text>

      <Text
        style={{
          color: "#65676B",
          fontSize: 12,
        }}
      >
        {label}
      </Text>
    </View>
  );
}

/* 🎨 STYLES */
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
    marginBottom: 10,
  },

  name: {
    fontSize: 20,
    fontWeight: "700",
  },

  username: {
    color: "#65676B",
  },

  headline: {
    marginTop: 6,
    fontWeight: "500",
    textAlign: "center",
  },

  location: {
    color: "#65676B",
    marginTop: 4,
  },

  stats: {
    flexDirection: "row",
    justifyContent: "space-around",
    width: "100%",
    marginVertical: 15,
  },

  buttonRow: {
    flexDirection: "row",
    gap: 10,
    marginTop: 10,
  },

  editBtn: {
    backgroundColor: "#6C2BD9",
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
  },

  jobBtn: {
    backgroundColor: "#10B981",
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
  },

  btnText: {
    color: "#fff",
    fontWeight: "600",
  },

  section: {
    backgroundColor: "#fff",
    padding: 15,
    marginTop: 10,
  },

  sectionTitle: {
    fontWeight: "700",
    fontSize: 16,
    marginBottom: 10,
  },

  text: {
    color: "#333",
  },

  skillsWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },

  skill: {
    backgroundColor: "#E7F3FF",
    paddingHorizontal: 10,
    paddingVertical: 6,
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

  expCompany: {
    color: "#444",
  },

  expDate: {
    fontSize: 12,
    color: "#777",
  },

  expDesc: {
    marginTop: 4,
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