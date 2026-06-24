import { View, Text, FlatList, Linking, TouchableOpacity } from "react-native";
import { useEffect, useState } from "react";
import { db } from "../../../firebase/firebaseConfig";
import { collection, query, where, onSnapshot } from "firebase/firestore";
import { useLocalSearchParams } from "expo-router";

export default function Applicants() {
  const { jobId } = useLocalSearchParams();
  const [apps, setApps] = useState<any[]>([]);

  useEffect(() => {
    const q = query(
      collection(db, "applications"),
      where("jobId", "==", jobId)
    );

    const unsub = onSnapshot(q, (snap) => {
      setApps(
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
      data={apps}
      keyExtractor={(item) => item.id}
      renderItem={({ item }) => (
        <View style={{ padding: 15 }}>
          <Text>User: {item.userId}</Text>

          <TouchableOpacity onPress={() => Linking.openURL(item.cvUrl)}>
            <Text style={{ color: "blue" }}>Open CV</Text>
          </TouchableOpacity>
        </View>
      )}
    />
  );
}