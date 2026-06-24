import { View, Text, FlatList, StyleSheet } from "react-native";
import { useEffect, useState } from "react";
import { db, auth } from "../../firebase/firebaseConfig";
import { collection, query, where, onSnapshot } from "firebase/firestore";

export default function Dashboard() {
  const [jobs, setJobs] = useState<any[]>([]);

  useEffect(() => {
    const q = query(
      collection(db, "jobs"),
      where("userId", "==", auth.currentUser?.uid)
    );

    const unsub = onSnapshot(q, (snap) => {
      setJobs(
        snap.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }))
      );
    });

    return unsub;
  }, []);

  return (
    <FlatList
      data={jobs}
      keyExtractor={(item) => item.id}
      renderItem={({ item }) => (
        <View style={styles.card}>
          <Text style={styles.title}>{item.title}</Text>
          <Text>{item.applicants?.length || 0} applicants</Text>
        </View>
      )}
    />
  );
}

const styles = StyleSheet.create({
  card: {
    padding: 16,
    backgroundColor: "#fff",
    margin: 10,
    borderRadius: 10,
  },
  title: {
    fontWeight: "700",
  },
});