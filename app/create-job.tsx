import { useState } from "react";
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
} from "react-native";
import { useRouter } from "expo-router";

import { createJob } from "./../services/jobService";

export default function CreateJobScreen() {
  const router = useRouter();

  const [loading, setLoading] = useState(false);

  const [job, setJob] = useState({
    title: "",
    company: "",
    location: "",
    type: "Full-time",
    salary: "",
    description: "",
    requirements: "",
    skills: "",
  });

  const handleCreate = async () => {

  if (
    !job.title.trim() ||
    !job.company.trim()
  ) {
    return Alert.alert(
      "Error",
      "Title and company required"
    );
  }

  try {

    setLoading(true);

    const skillsArray =
      job.skills
      .split(",")
      .map(
        (skill) =>
          skill.trim()
      )
      .filter(
        (skill) =>
          skill !== ""
      );

    await createJob({

      title:
        job.title.trim(),

      company:
        job.company.trim(),

      location:
        job.location.trim(),

      type:
        job.type,

      salary:
        job.salary.trim(),

      description:
        job.description.trim(),

      requirements:
        job.requirements.trim(),

      skills:
        skillsArray

    });

    Alert.alert(
      "Success",
      "Job posted 🚀"
    );

    router.back();

  } catch (e:any) {

    console.log(
      "CREATE JOB ERROR:",
      e
    );

    Alert.alert(
      "Error",
      e?.message ||
      "Something went wrong"
    );

  } finally {

    setLoading(false);

  }

};

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Post a Job</Text>

      <Input label="Job Title" value={job.title} onChange={(v: any) => setJob({ ...job, title: v })} />
      <Input label="Company" value={job.company} onChange={(v: any) => setJob({ ...job, company: v })} />
      <Input label="Location" value={job.location} onChange={(v: any) => setJob({ ...job, location: v })} />
      <Input label="Salary" value={job.salary} onChange={(v: any) => setJob({ ...job, salary: v })} />

      <Input
        label="Job Description"
        value={job.description}
        onChange={(v: any) => setJob({ ...job, description: v })}
        multiline
      />

      <Input
        label="Requirements"
        value={job.requirements}
        onChange={(v: any) => setJob({ ...job, requirements: v })}
        multiline
      />

      <Input
        label="Skills (comma separated)"
        value={job.skills}
        onChange={(v: any) => setJob({ ...job, skills: v })}
      />

      <TouchableOpacity
        style={styles.button}
        onPress={handleCreate}
        disabled={loading}
      >
        <Text style={styles.buttonText}>
          {loading ? "Posting..." : "Post Job"}
        </Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

/* 🔹 INPUT COMPONENT */
function Input({ label, value, onChange, multiline }: any) {
  return (
    <View style={{ marginBottom: 14 }}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        value={value}
        onChangeText={onChange}
        multiline={multiline}
        style={[
          styles.input,
          multiline && { height: 100, textAlignVertical: "top" },
        ]}
      />
    </View>
  );
}

/* 🎨 STYLE */
const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: "#fff",
  },

  title: {
    fontSize: 20,
    fontWeight: "700",
    marginBottom: 20,
  },

  label: {
    fontSize: 13,
    marginBottom: 4,
    color: "#555",
  },

  input: {
    backgroundColor: "#F3F4F6",
    borderRadius: 10,
    padding: 12,
    fontSize: 14,
  },

  button: {
    backgroundColor: "#6C2BD9",
    padding: 14,
    borderRadius: 10,
    alignItems: "center",
    marginTop: 20,
  },

  buttonText: {
    color: "#fff",
    fontWeight: "600",
  },
});