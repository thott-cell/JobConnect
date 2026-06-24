import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  Image,
} from "react-native";
import { useEffect, useState } from "react";
import { auth, db } from "../firebase/firebaseConfig";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { useRouter } from "expo-router";
import * as ImagePicker from "expo-image-picker";

/* 🔥 CLOUDINARY CONFIG */
const CLOUD_NAME = "dbj6koi4f";
const UPLOAD_PRESET = "JobConnect-upload";

export default function EditProfile() {
  const user = auth.currentUser;
  const router = useRouter();

  const [loading, setLoading] = useState(true);

  const [name, setName] = useState("");
  const [username, setUsername] = useState("");
  const [headline, setHeadline] = useState("");
  const [location, setLocation] = useState("");
  const [bio, setBio] = useState("");

  const [skills, setSkills] = useState<string[]>([]);
  const [newSkill, setNewSkill] = useState("");

  const [experience, setExperience] = useState<any[]>([]);

  const [avatar, setAvatar] = useState<string | null>(null);

  /* LOAD USER */
  useEffect(() => {
    const load = async () => {
      if (!user) return;

      const snap = await getDoc(doc(db, "users", user.uid));

      if (snap.exists()) {
        const data: any = snap.data();

        setName(data.name || "");
        setUsername(data.username || "");
        setHeadline(data.headline || "");
        setLocation(data.location || "");
        setBio(data.bio || "");
        setSkills(data.skills || []);
        setExperience(data.experience || []);
        setAvatar(data.avatar || null);
      }

      setLoading(false);
    };

    load();
  }, []);

  /* 🖼 PICK + UPLOAD IMAGE (CLOUDINARY) */
  const pickImage = async () => {
    try {
      const permission =
        await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (!permission.granted) {
        Alert.alert("Permission needed");
        return;
      }

      const res = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        quality: 0.7,
      });

      if (res.canceled) return;

      const uri = res.assets[0].uri;

      // 🔥 upload to cloudinary
      const data = new FormData();

      data.append("file", {
        uri,
        type: "image/jpeg",
        name: "profile.jpg",
      } as any);

      data.append("upload_preset", UPLOAD_PRESET);

      const response = await fetch(
        `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`,
        {
          method: "POST",
          body: data,
        }
      );

      const result = await response.json();

      if (!result.secure_url) {
        throw new Error("Upload failed");
      }

      setAvatar(result.secure_url);

      Alert.alert("Success", "Image uploaded!");
    } catch (e: any) {
      console.log("UPLOAD ERROR:", e);
      Alert.alert("Upload failed: " + (e?.message || "unknown"));
    }
  };

  /* SKILLS */
  const addSkill = () => {
    if (!newSkill.trim()) return;
    setSkills([...skills, newSkill.trim()]);
    setNewSkill("");
  };

  const removeSkill = (index: number) => {
    const updated = [...skills];
    updated.splice(index, 1);
    setSkills(updated);
  };

  /* EXPERIENCE */
  const addExperience = () => {
    setExperience([
      ...experience,
      { role: "", company: "", start: "", end: "", description: "" },
    ]);
  };

  const updateExperience = (index: number, field: string, value: string) => {
    const updated = [...experience];
    updated[index][field] = value;
    setExperience(updated);
  };

  const removeExperience = (index: number) => {
    const updated = [...experience];
    updated.splice(index, 1);
    setExperience(updated);
  };

  /* SAVE */
  const handleSave = async () => {
    try {
      await updateDoc(doc(db, "users", user!.uid), {
        name,
        username,
        headline,
        location,
        bio,
        skills,
        experience,
        avatar,
      });

      Alert.alert("Success", "Profile updated");
      router.back();
    } catch (e: any) {
      Alert.alert("Error", e.message);
    }
  };

  if (loading) return null;

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Edit Profile</Text>

      <View style={styles.avatarContainer}>
        <TouchableOpacity onPress={pickImage}>
          <Image
            source={{
              uri: avatar || "https://via.placeholder.com/100",
            }}
            style={styles.avatar}
          />
        </TouchableOpacity>

        <Text style={styles.changePhoto}>Change profile photo</Text>
      </View>

      <Input label="Name" value={name} onChange={setName} />
      <Input label="Username" value={username} onChange={setUsername} />
      <Input label="Headline" value={headline} onChange={setHeadline} />
      <Input label="Location" value={location} onChange={setLocation} />

      <Text style={styles.section}>About</Text>
      <TextInput
        style={[styles.input, { height: 100 }]}
        value={bio}
        onChangeText={setBio}
        multiline
      />

      <Text style={styles.section}>Skills</Text>

      <View style={styles.row}>
        <TextInput
          placeholder="Add skill"
          style={[styles.input, { flex: 1 }]}
          value={newSkill}
          onChangeText={setNewSkill}
        />
        <TouchableOpacity style={styles.addBtn} onPress={addSkill}>
          <Text style={{ color: "#fff" }}>Add</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.skillsWrap}>
        {skills.map((skill, i) => (
          <TouchableOpacity key={i} onPress={() => removeSkill(i)}>
            <Text style={styles.skill}>{skill} ✕</Text>
          </TouchableOpacity>
        ))}
      </View>

      <Text style={styles.section}>Experience</Text>

      {experience.map((exp, i) => (
        <View key={i} style={styles.expCard}>
          <Input label="Role" value={exp.role} onChange={(v: string) => updateExperience(i, "role", v)} />
          <Input label="Company" value={exp.company} onChange={(v: string) => updateExperience(i, "company", v)} />
          <Input label="Start" value={exp.start} onChange={(v: string) => updateExperience(i, "start", v)} />
          <Input label="End" value={exp.end} onChange={(v: string) => updateExperience(i, "end", v)} />
          <Input label="Description" value={exp.description} onChange={(v: string) => updateExperience(i, "description", v)} />

          <TouchableOpacity onPress={() => removeExperience(i)}>
            <Text style={styles.delete}>Remove</Text>
          </TouchableOpacity>
        </View>
      ))}

      <TouchableOpacity style={styles.addExp} onPress={addExperience}>
        <Text>Add Experience</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.saveBtn} onPress={handleSave}>
        <Text style={{ color: "#fff" }}>Save</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

/* INPUT */
function Input({ label, value, onChange }: any) {
  return (
    <View>
      <Text style={styles.label}>{label}</Text>
      <TextInput style={styles.input} value={value} onChangeText={onChange} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: "#fff" },
  title: { fontSize: 22, fontWeight: "700", marginBottom: 20 },

  avatarContainer: { alignItems: "center", marginBottom: 20 },
  avatar: { width: 100, height: 100, borderRadius: 50 },
  changePhoto: { marginTop: 8, color: "#6C2BD9", fontWeight: "600" },

  section: { fontWeight: "700", marginTop: 20 },
  label: { marginTop: 10 },

  input: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    padding: 10,
    marginTop: 5,
  },

  row: { flexDirection: "row", gap: 10 },

  addBtn: {
    backgroundColor: "#6C2BD9",
    padding: 10,
    borderRadius: 8,
    justifyContent: "center",
  },

  skillsWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginTop: 10,
    gap: 8,
  },

  skill: {
    backgroundColor: "#eee",
    padding: 8,
    borderRadius: 20,
  },

  expCard: {
    borderWidth: 1,
    borderColor: "#eee",
    padding: 10,
    marginTop: 10,
    borderRadius: 10,
  },

  delete: { color: "red", marginTop: 5 },

  addExp: { marginTop: 10, alignItems: "center" },

  saveBtn: {
    backgroundColor: "#6C2BD9",
    padding: 15,
    borderRadius: 10,
    alignItems: "center",
    marginTop: 20,
  },
});