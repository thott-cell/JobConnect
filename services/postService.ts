import { db, auth } from "../firebase/firebaseConfig";
import {
  addDoc,
  collection,
  getDoc,
  doc,
} from "firebase/firestore";

/* 🔥 CREATE POST */
export const createPost = async (
  text: string,
  mediaUrl: string,
  mediaType: string
) => {
  try {
    const user = auth.currentUser;

    if (!user) throw new Error("User not logged in");

    /* 🔥 GET USER DATA */
    let userName = "Anonymous";
    let userAvatar = "";

    try {
      const userRef = doc(db, "users", user.uid);
      const userSnap = await getDoc(userRef);

      if (userSnap.exists()) {
        const data = userSnap.data();
        userName = data.name || "Anonymous";
        userAvatar = data.avatar || "";
      }
    } catch (err) {
      console.log("User fetch error:", err);
    }

    /* 🔥 CREATE POST OBJECT */
    const newPost = {
      userId: user.uid,

      userName,
      userAvatar,

      text: text || "",
      mediaUrl: mediaUrl || "",
      mediaType: mediaType || "none",

      likes: 0,
      likedBy: [],
      commentsCount: 0,

      // ✅ FIX: USE LOCAL TIME (INSTANT UI UPDATE)
      createdAt: new Date(),
    };

    /* 🔥 SAVE TO FIREBASE */
    const docRef = await addDoc(collection(db, "posts"), newPost);

    return docRef.id;

  } catch (error) {
    console.log("CREATE POST ERROR:", error);
    throw error;
  }
};