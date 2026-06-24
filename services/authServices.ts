import { auth, db } from "../firebase/firebaseConfig";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
} from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";

/* =========================
   🔐 SIGN UP (FULL PROFILE)
========================= */
export const signUp = async (
  email: string,
  password: string,
  firstName: string,
  lastName: string,
  username: string,
  age: string,
  avatar: string
) => {
  try {
    const res = await createUserWithEmailAndPassword(
      auth,
      email,
      password
    );

    const user = res.user;

    /* 🔥 CREATE USER PROFILE IN FIRESTORE */
    await setDoc(doc(db, "users", user.uid), {
      uid: user.uid,
      email,

      firstName,
      lastName,
      username,
      age,

      name: `${firstName} ${lastName}`, // 🔥 used everywhere
      avatar: avatar || "",

      bio: "",
      followers: 0,
      following: 0,

      createdAt: new Date(),
    });

    return user;
  } catch (error) {
    throw error;
  }
};

/* =========================
   🔐 SIGN IN (LOGIN)
========================= */
export const signIn = async (email: string, password: string) => {
  try {
    const res = await signInWithEmailAndPassword(
      auth,
      email,
      password
    );

    return res.user;
  } catch (error) {
    throw error;
  }
};

/* =========================
   🚪 LOGOUT
========================= */
export const logout = async () => {
  await signOut(auth);
};