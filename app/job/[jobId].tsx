import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from "react-native";
import { useEffect, useState } from "react";
import { useLocalSearchParams } from "expo-router";
import {
  doc,
  getDoc,
  collection,
  query,
  where,
  getDocs,
  addDoc,
  serverTimestamp,
  updateDoc,
  arrayUnion,
} from "firebase/firestore";
import { db, auth } from "../../firebase/firebaseConfig";
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";
import * as DocumentPicker from "expo-document-picker";
import { FontAwesome } from "@expo/vector-icons";

export default function JobDetails() {
  const { jobId } = useLocalSearchParams();
  const user = auth.currentUser;

  const [job, setJob] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [applied, setApplied] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  /* 🔥 LOAD EVERYTHING */
  useEffect(() => {
    const load = async () => {
      try {
        if (!jobId || !user) return;

        // 🔹 GET JOB
        const ref = doc(db, "jobs", jobId as string);
        const snap = await getDoc(ref);

        if (!snap.exists()) {
          setLoading(false);
          return;
        }

        const data: any = snap.data();
        setJob(data);

        // 🔹 CHECK IF ALREADY APPLIED
        const q = query(
          collection(db, "applications"),
          where("jobId", "==", jobId),
          where("userId", "==", user.uid)
        );

        const result = await getDocs(q);

        if (!result.empty) {
          setApplied(true);
        }

      } catch (e) {
        console.log("LOAD ERROR", e);
      }

      setLoading(false);
    };

    load();
  }, [jobId]);

  /* 🚀 APPLY WITH CV */
  const handleApply = async () => {
    try {
      if (applied) return;

      const pick = await DocumentPicker.getDocumentAsync({
        type: "application/pdf",
      });

      if (pick.canceled) return;

      const file = pick.assets[0];

      setSaving(true);

      // 🔹 UPLOAD CV
      const storage = getStorage();
      const fileRef = ref(
        storage,
        `cvs/${user?.uid}/${jobId}.pdf`
      );

      const res = await fetch(file.uri);
      const blob = await res.blob();

      await uploadBytes(fileRef, blob);

      const cvUrl = await getDownloadURL(fileRef);

      // 🔹 SAVE APPLICATION
      await addDoc(collection(db, "applications"), {
        userId: user?.uid,
        jobId,
        cvUrl,
        createdAt: serverTimestamp(),
      });

      // 🔹 UPDATE JOB
      await updateDoc(doc(db, "jobs", jobId as string), {
        applicants: arrayUnion(user?.uid),
      });

      setApplied(true);
      Alert.alert("Success", "Application submitted");

    } catch (e) {
      console.log("APPLY ERROR", e);
    }

    setSaving(false);
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#6C2BD9" />
      </View>
    );
  }

  if (!job) {
    return (
      <View style={styles.center}>
        <Text>Job not found</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={{ paddingBottom: 120 }}>
        
        {/* 🔝 HEADER */}
        <View style={styles.header}>
          <Text style={styles.title}>{job.title}</Text>
          <Text style={styles.company}>{job.company}</Text>

          <Text style={styles.meta}>
            {job.location || "Remote"} • {job.type || "Full-time"}
          </Text>

          {!!job.salary && (
            <Text style={styles.salary}>{job.salary}</Text>
          )}

          {/* TAGS */}
          <View style={styles.tags}>
            <Tag text={job.type || "Full-time"} />
            <Tag text={job.level || "Mid-level"} />
            <Tag text={job.location || "Remote"} />
          </View>
        </View>

        {/* 📄 DESCRIPTION */}
        <Section title="Job Description" text={job.description} />

        {/* 📋 RESPONSIBILITIES */}
        <Section title="Responsibilities" text={job.responsibilities} />

        {/* 🧠 REQUIREMENTS */}
        <Section title="Requirements" text={job.requirements} />

        {/* 🛠 SKILLS */}
        <Section title="Skills Required" text={job.skills} />

        {/* 🏢 COMPANY */}
        <Section title="About Company" text={job.companyInfo} />

      </ScrollView>

      {/* 🔥 ACTION BAR */}
      <View style={styles.bottomBar}>
        <TouchableOpacity
          onPress={() => setSaved(!saved)}
          style={styles.saveBtn}
        >
          <FontAwesome
            name={saved ? "bookmark" : "bookmark-o"}
            size={22}
            color="#6C2BD9"
          />
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.applyBtn,
            applied && styles.appliedBtn,
          ]}
          onPress={handleApply}
          disabled={applied || saving}
        >
          <Text style={styles.applyText}>
            {saving
              ? "Uploading..."
              : applied
              ? "Applied ✓"
              : "Upload CV & Apply"}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

/* 🔹 SECTION */
function Section({ title, text }: any) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <Text style={styles.sectionText}>
        {text || "Not specified"}
      </Text>
    </View>
  );
}

/* 🔹 TAG */
function Tag({ text }: any) {
  return (
    <View style={styles.tag}>
      <Text style={styles.tagText}>{text}</Text>
    </View>
  );
}

/* 🎨 STYLE */
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },

  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },

  header: {
    padding: 20,
    borderBottomWidth: 1,
    borderColor: "#eee",
  },

  title: {
    fontSize: 22,
    fontWeight: "700",
  },

  company: {
    marginTop: 6,
    color: "#6C2BD9",
    fontWeight: "600",
  },

  meta: {
    marginTop: 6,
    color: "#6B7280",
  },

  salary: {
    marginTop: 6,
    color: "#16A34A",
    fontWeight: "600",
  },

  tags: {
    flexDirection: "row",
    marginTop: 10,
    gap: 6,
  },

  tag: {
    backgroundColor: "#F3E8FF",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
  },

  tagText: {
    color: "#6C2BD9",
    fontSize: 12,
  },

  section: {
    padding: 20,
    borderBottomWidth: 1,
    borderColor: "#F3F4F6",
  },

  sectionTitle: {
    fontWeight: "700",
    marginBottom: 6,
  },

  sectionText: {
    color: "#374151",
    lineHeight: 20,
  },

  bottomBar: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: "row",
    padding: 15,
    backgroundColor: "#fff",
    borderTopWidth: 1,
    borderColor: "#E5E7EB",
  },

  saveBtn: {
    marginRight: 10,
    justifyContent: "center",
  },

  applyBtn: {
    flex: 1,
    backgroundColor: "#6C2BD9",
    padding: 14,
    borderRadius: 10,
    alignItems: "center",
  },

  appliedBtn: {
    backgroundColor: "#9CA3AF",
  },

  applyText: {
    color: "#fff",
    fontWeight: "700",
  },
});