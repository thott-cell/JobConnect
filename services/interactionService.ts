import { db, auth } from "../firebase/firebaseConfig";
import {
  doc,
  updateDoc,
  arrayUnion,
  arrayRemove,
  increment,
} from "firebase/firestore";

/* ❤️ LIKE / UNLIKE */
export const toggleLike = async (postId: string, liked: boolean) => {
  const user = auth.currentUser;
  if (!user) throw new Error("Not logged in");

  const postRef = doc(db, "posts", postId);

  if (liked) {
    await updateDoc(postRef, {
      likedBy: arrayRemove(user.uid),
      likes: increment(-1),
    });
  } else {
    await updateDoc(postRef, {
      likedBy: arrayUnion(user.uid),
      likes: increment(1),
    });
  }
};

/* 🔁 SHARE */
export const addShare = async (postId: string) => {
  const postRef = doc(db, "posts", postId);

  await updateDoc(postRef, {
    shares: increment(1),
  });
};