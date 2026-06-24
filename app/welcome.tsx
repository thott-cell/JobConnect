import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";

export default function Welcome() {
  const router = useRouter();

  return (
    <LinearGradient
      colors={["#6C2BD9", "#9333EA", "#C084FC"]}
      style={styles.container}
    >
      {/* LOGO / IMAGE */}
      <View style={styles.imageContainer}>
        <Image
          source={{
            uri: "https://cdn-icons-png.flaticon.com/512/3135/3135715.png",
          }}
          style={styles.image}
        />
      </View>

      {/* TEXT */}
      <View style={styles.textContainer}>
        <Text style={styles.title}>JobConnect</Text>
        <Text style={styles.subtitle}>
          Connect. Discover. Grow your career 🚀
        </Text>
      </View>

      {/* BUTTONS */}
      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={styles.primaryBtn}
          onPress={() => router.push("/auth/login")}
        >
          <Text style={styles.primaryText}>Get Started</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.secondaryBtn}
          onPress={() => router.push("/auth/signup")}
        >
          <Text style={styles.secondaryText}>Create Account</Text>
        </TouchableOpacity>
      </View>
    </LinearGradient>
  );
}

/* 🔥 STYLES */
const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "space-between",
    paddingVertical: 80,
    paddingHorizontal: 25,
  },

  imageContainer: {
    alignItems: "center",
  },

  image: {
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: "#fff",
  },

  textContainer: {
    alignItems: "center",
    marginTop: -40,
  },

  title: {
    fontSize: 34,
    fontWeight: "bold",
    color: "#fff",
  },

  subtitle: {
    fontSize: 15,
    color: "#E9D5FF",
    marginTop: 10,
    textAlign: "center",
  },

  buttonContainer: {
    width: "100%",
  },

  primaryBtn: {
    backgroundColor: "#fff",
    padding: 16,
    borderRadius: 14,
    alignItems: "center",
    marginBottom: 12,
  },

  primaryText: {
    color: "#6C2BD9",
    fontWeight: "700",
    fontSize: 16,
  },

  secondaryBtn: {
    borderWidth: 1,
    borderColor: "#fff",
    padding: 16,
    borderRadius: 14,
    alignItems: "center",
  },

  secondaryText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 15,
  },
});