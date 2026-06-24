import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";

export default function JobCard({ job }: any) {
  const router = useRouter();

  return (
    <TouchableOpacity
      activeOpacity={0.9}
      onPress={() =>
        router.push({
          pathname: "/job/[jobId]",
          params: { jobId: job.id },
        })
      }
    >
      <View style={styles.card}>
        {/* HEADER */}
        <View style={styles.row}>
          <View style={styles.logo} />

          <View style={{ flex: 1 }}>
            <Text style={styles.title}>{job.title}</Text>
            <Text style={styles.company}>{job.company}</Text>
          </View>

          <Ionicons name="bookmark-outline" size={20} />
        </View>

        {/* INFO */}
        <View style={styles.infoRow}>
          <Text style={styles.info}>{job.location}</Text>
          <Text style={styles.info}>{job.type}</Text>
        </View>

        {/* SALARY */}
        {!!job.salary && (
          <Text style={styles.salary}>{job.salary}</Text>
        )}

        {/* FOOTER */}
        <View style={styles.footer}>
          <Text style={styles.meta}>
            {job.applicants?.length || 0} applicants
          </Text>

          <Text style={styles.apply}>Apply</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#fff",
    borderRadius: 14,
    padding: 16,
    marginBottom: 14,
    elevation: 2,
  },

  row: {
    flexDirection: "row",
    alignItems: "center",
  },

  logo: {
    width: 45,
    height: 45,
    borderRadius: 10,
    backgroundColor: "#E5E7EB",
    marginRight: 10,
  },

  title: {
    fontSize: 16,
    fontWeight: "700",
  },

  company: {
    color: "#6C2BD9",
    fontSize: 13,
    marginTop: 2,
  },

  infoRow: {
    flexDirection: "row",
    marginTop: 10,
    gap: 10,
  },

  info: {
    fontSize: 12,
    color: "#6B7280",
  },

  salary: {
    marginTop: 8,
    color: "#10B981",
    fontWeight: "600",
  },

  footer: {
    marginTop: 12,
    flexDirection: "row",
    justifyContent: "space-between",
  },

  meta: {
    fontSize: 12,
    color: "#6B7280",
  },

  apply: {
    color: "#6C2BD9",
    fontWeight: "600",
  },
});