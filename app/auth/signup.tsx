import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  Image,
} from "react-native";
import { useState } from "react";
import { useRouter } from "expo-router";
import * as ImagePicker from "expo-image-picker";

import { signUp } from "../../services/authServices";

export default function Signup() {
  const router = useRouter();

  /* 🔥 FORM STATE */
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [username, setUsername] = useState("");
  const [age, setAge] = useState("");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [avatar, setAvatar] = useState<string>("");

  const [loading, setLoading] = useState(false);

  /* 📸 PICK AVATAR */
  const pickAvatar = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 1,
    });

    if (!result.canceled) {
      setAvatar(result.assets[0].uri);
    }
  };

  /* 🚀 SIGNUP */
  const handleSignup = async () => {
    if (
      !firstName ||
      !lastName ||
      !username ||
      !age ||
      !email ||
      !password
    ) {
      Alert.alert("Error", "Please fill all fields");
      return;
    }

    if (password.length < 6) {
      Alert.alert("Error", "Password must be at least 6 characters");
      return;
    }

    try {
      setLoading(true);

      await signUp(
        email.trim(),
        password,
        firstName,
        lastName,
        username,
        age,
        avatar
      );

      Alert.alert("Success", "Account created 🚀");

      router.replace("/auth/login");
    } catch (error: any) {
      Alert.alert("Signup Failed", error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Create Account</Text>

      {/* 📸 AVATAR */}
      <TouchableOpacity style={styles.avatarBox} onPress={pickAvatar}>
        {avatar ? (
          <Image source={{ uri: avatar }} style={styles.avatar} />
        ) : (
          <Text style={{ color: "#65676B" }}>Add Photo</Text>
        )}
      </TouchableOpacity>

      {/* 👤 NAME */}
      <View style={styles.row}>
        <TextInput
          placeholder="First name"
          value={firstName}
          onChangeText={setFirstName}
          style={[styles.input, { flex: 1, marginRight: 6 }]}
        />
        <TextInput
          placeholder="Last name"
          value={lastName}
          onChangeText={setLastName}
          style={[styles.input, { flex: 1, marginLeft: 6 }]}
        />
      </View>

      {/* 🧠 USERNAME */}
      <TextInput
        placeholder="Username"
        value={username}
        onChangeText={setUsername}
        style={styles.input}
      />

      {/* 🎂 AGE */}
      <TextInput
        placeholder="Age"
        value={age}
        onChangeText={setAge}
        keyboardType="numeric"
        style={styles.input}
      />

      {/* 📧 EMAIL */}
      <TextInput
        placeholder="Email"
        value={email}
        onChangeText={setEmail}
        style={styles.input}
        autoCapitalize="none"
      />

      {/* 🔐 PASSWORD */}
      <TextInput
        placeholder="Password"
        secureTextEntry
        value={password}
        onChangeText={setPassword}
        style={styles.input}
      />

      {/* 🚀 BUTTON */}
      <TouchableOpacity
        style={[styles.button, loading && { opacity: 0.6 }]}
        onPress={handleSignup}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.buttonText}>Sign Up</Text>
        )}
      </TouchableOpacity>

      {/* 🔁 LOGIN */}
      <TouchableOpacity onPress={() => router.push("/auth/login")}>
        <Text style={styles.link}>
          Already have an account? Login
        </Text>
      </TouchableOpacity>
    </View>
  );
}

/* 🎨 PREMIUM FACEBOOK-STYLE UI */
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F0F2F5",
    padding: 20,
    justifyContent: "center",
  },

  title: {
    fontSize: 28,
    fontWeight: "700",
    marginBottom: 20,
    color: "#050505",
  },

  avatarBox: {
    alignSelf: "center",
    marginBottom: 20,
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: "#E4E6EB",
    justifyContent: "center",
    alignItems: "center",
  },

  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
  },

  row: {
    flexDirection: "row",
  },

  input: {
    backgroundColor: "#fff",
    padding: 14,
    borderRadius: 10,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#ddd",
  },

  button: {
    backgroundColor: "#1877F2",
    padding: 15,
    borderRadius: 10,
    alignItems: "center",
    marginTop: 10,
  },

  buttonText: {
    color: "#fff",
    fontWeight: "700",
  },

  link: {
    marginTop: 15,
    textAlign: "center",
    color: "#1877F2",
  },
});