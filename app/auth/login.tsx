import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from "react-native";
import { useState } from "react";
import { signIn } from "../../services/authServices";
import { useRouter } from "expo-router";

export default function Login() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const COLORS = {
    primary: "#6C2BD9",
    gray: "#9CA3AF",
    dark: "#1F1F1F",
    light: "#F5F5F7",
    white: "#FFFFFF",
  };

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert("Error", "Please enter email and password");
      return;
    }

    try {
      setLoading(true);

      await signIn(email.trim(), password);

      // ✅ Correct redirect
      router.replace("/(tabs)/feed");

    } catch (error: any) {
      if (error.code === "auth/user-not-found") {
        Alert.alert("Error", "No account found. Please sign up.");
      } else if (error.code === "auth/wrong-password") {
        Alert.alert("Error", "Incorrect password.");
      } else if (error.code === "auth/invalid-email") {
        Alert.alert("Error", "Invalid email format");
      } else {
        Alert.alert("Login Failed", error.message);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      {/* TITLE */}
      <Text style={styles.title}>
        Welcome back to{"\n"}
        <Text style={styles.brand}>JobConnect</Text>
      </Text>

      {/* SUBTEXT */}
      <Text style={styles.subtitle}>
        Sign in to continue your journey
      </Text>

      {/* EMAIL */}
      <TextInput
        placeholder="Email"
        placeholderTextColor={COLORS.gray}
        value={email}
        onChangeText={setEmail}
        style={styles.input}
        autoCapitalize="none"
      />

      {/* PASSWORD */}
      <TextInput
        placeholder="Password"
        placeholderTextColor={COLORS.gray}
        secureTextEntry
        value={password}
        onChangeText={setPassword}
        style={styles.input}
      />

      {/* BUTTON */}
      <TouchableOpacity
        style={[styles.button, loading && { opacity: 0.6 }]}
        onPress={handleLogin}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.buttonText}>Login</Text>
        )}
      </TouchableOpacity>

      {/* SIGNUP LINK */}
      <TouchableOpacity onPress={() => router.push("/auth/signup")}>
        <Text style={styles.link}>
          Don’t have an account?{" "}
          <Text style={styles.linkBold}>Sign up</Text>
        </Text>
      </TouchableOpacity>
    </View>
  );
}

/* 🔥 STYLES (same file, no external CSS) */
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 20,
    justifyContent: "center",
  },

  title: {
    fontSize: 26,
    fontWeight: "600",
    color: "#1F1F1F",
    marginBottom: 8,
  },

  brand: {
    color: "#6C2BD9",
    fontWeight: "700",
  },

  subtitle: {
    color: "#9CA3AF",
    marginBottom: 30,
  },

  input: {
    backgroundColor: "#F5F5F7",
    padding: 15,
    borderRadius: 12,
    marginBottom: 15,
    color: "#1F1F1F",
  },

  button: {
    backgroundColor: "#6C2BD9",
    padding: 15,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 10,
  },

  buttonText: {
    color: "#fff",
    fontWeight: "600",
  },

  link: {
    marginTop: 20,
    textAlign: "center",
    color: "#9CA3AF",
  },

  linkBold: {
    color: "#6C2BD9",
    fontWeight: "600",
  },
});