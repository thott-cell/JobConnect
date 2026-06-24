import {
  addDoc,
  collection,
  serverTimestamp,
  doc,
  updateDoc,
  increment,
  deleteDoc,
  arrayUnion,
  arrayRemove,
} from "firebase/firestore";
import { db, auth } from "../firebase/firebaseConfig";

interface CommentUserData {
  userName: string;
  userAvatar: string;
  username: string;
}

/* 🔥 ADD COMMENT */
export const addComment = async (
  postId: string, 
  text: string, 
  userData: CommentUserData, // CRASH FIX: Accept full user profile context data packets
  parentId = null
) => {
  const user = auth.currentUser;
  if (!user) throw new Error("User session not found. Please log in again.");

  const commentRef = await addDoc(
    collection(db, "posts", postId, "comments"),
    {
      text,
      userId: user.uid,
      parentId,
      // CRASH FIX: Enforce default text constants if user profile data is empty
      userName: userData?.userName ?? "Anonymous User",
      userAvatar: userData?.userAvatar ?? "https://placeholder.com",
      username: userData?.username ?? "user",
      likes: 0,
      likedBy: [],
      createdAt: serverTimestamp(),
    }
  );

  // Atomically increment the parent counter metric array block
  await updateDoc(doc(db, "posts", postId), {
    commentsCount: increment(1),
  });

  return commentRef.id;
};

/* ❤️ LIKE COMMENT */
export const toggleCommentLike = async (postId: string, comment: any, liked: boolean) => {
  const currentUid = auth.currentUser?.uid;
  // CRASH FIX: Return immediately if user credentials expire mid-click execution loop
  if (!currentUid || !comment?.id || !postId) return;

  const ref = doc(db, "posts", postId, "comments", comment.id);

  await updateDoc(ref, {
    likes: liked ? increment(-1) : increment(1),
    likedBy: liked
      ? arrayRemove(currentUid)
      : arrayUnion(currentUid),
  });
};

/* ✏️ EDIT */
export const editComment = async (postId: string, id: string, text: string) => {
  if (!postId || !id || !text.trim()) return;
  await updateDoc(doc(db, "posts", postId, "comments", id), { text });
};

/* 🗑 DELETE */
export const deleteComment = async (postId: string, id: string) => {
  if (!postId || !id) return;
  await deleteDoc(doc(db, "posts", postId, "comments", id));

  await updateDoc(doc(db, "posts", postId), {
    commentsCount: increment(-1),
  });
};
