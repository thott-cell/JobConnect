import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  Alert,
} from "react-native";
import { useState } from "react";
import { createJob } from "../../services/jobService";
import { useRouter } from "expo-router";

export default function CreateJob() {
  const router = useRouter();

  const [title, setTitle] = useState("");
  const [company, setCompany] = useState("");
  const [location, setLocation] = useState("");
  const [salary, setSalary] = useState("");
  const [description, setDescription] = useState("");

  const handleCreate = async () => {
    if (!title || !company) {
      Alert.alert("Error", "Fill required fields");
      return;
    }

    await createJob({
      title,
      company,
      location,
      salary,
      description,
      skills: [],
      type: "",
      requirements: ""
    });

    Alert.alert("Success", "Job posted 🚀");
    router.back();
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Post a Job</Text>

      <Input placeholder="Job Title" value={title} set={setTitle} />
      <Input placeholder="Company" value={company} set={setCompany} />
      <Input placeholder="Location" value={location} set={setLocation} />
      <Input placeholder="Salary" value={salary} set={setSalary} />

      <TextInput
        placeholder="Description"
        style={[styles.input, { height: 120 }]}
        multiline
        value={description}
        onChangeText={setDescription}
      />

      <TouchableOpacity style={styles.btn} onPress={handleCreate}>
        <Text style={{ color: "#fff" }}>Post Job</Text>
      </TouchableOpacity>
    </View>
  );
}

const Input = ({ placeholder, value, set }: any) => (
  <TextInput
    placeholder={placeholder}
    value={value}
    onChangeText={set}
    style={styles.input}
  />
);

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20 },
  title: { fontSize: 22, fontWeight: "700", marginBottom: 20 },
  input: {
    borderWidth: 1,
    borderColor: "#ddd",
    padding: 12,
    borderRadius: 10,
    marginBottom: 12,
  },
  btn: {
    backgroundColor: "#6C2BD9",
    padding: 15,
    borderRadius: 10,
    alignItems: "center",
  },
});