import { db, auth } from "../firebase/firebaseConfig";
import {
  collection,
  onSnapshot,
  doc,
  updateDoc,
  arrayUnion,
  arrayRemove,
} from "firebase/firestore";

/* =========================================
   🔥 REALTIME USERS
========================================= */
export const subscribeToUsers = (callback: any) => {
  const unsub = onSnapshot(collection(db, "users"), (snap) => {
    const users = snap.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    callback(users);
  });

  return unsub;
};

/* =========================================
   🤝 SEND CONNECTION REQUEST
========================================= */
export const sendConnection = async (targetUserId: string) => {
  const user = auth.currentUser;
  if (!user) return;

  const myRef = doc(db, "users", user.uid);
  const targetRef = doc(db, "users", targetUserId);

  await updateDoc(targetRef, {
    requestsReceived: arrayUnion(user.uid),
  });

  await updateDoc(myRef, {
    requestsSent: arrayUnion(targetUserId),
  });
};

/* =========================================
   ✅ ACCEPT CONNECTION
========================================= */
export const acceptConnection = async (targetUserId: string) => {
  const user = auth.currentUser;
  if (!user) return;

  const myRef = doc(db, "users", user.uid);
  const targetRef = doc(db, "users", targetUserId);

  await updateDoc(myRef, {
    connections: arrayUnion(targetUserId),
    requestsReceived: arrayRemove(targetUserId),
  });

  await updateDoc(targetRef, {
    connections: arrayUnion(user.uid),
    requestsSent: arrayRemove(user.uid),
  });
};

/* =========================================
   👥 MUTUAL CONNECTIONS
========================================= */
export const getMutualConnections = (
  myConnections: string[] = [],
  theirConnections: string[] = []
) => {
  return myConnections.filter((id) =>
    theirConnections.includes(id)
  );
};

/* =========================================
   ➕ FOLLOW (FIXED)
========================================= */
export const followUser = async (targetUserId: string) => {
  const user = auth.currentUser;
  if (!user) return;

  const currentUserId = user.uid;

  // 🚫 prevent self-follow
  if (currentUserId === targetUserId) return;

  const meRef = doc(db, "users", currentUserId);
  const targetRef = doc(db, "users", targetUserId);

  try {
    await Promise.all([
      updateDoc(meRef, {
        following: arrayUnion(targetUserId),
      }),
      updateDoc(targetRef, {
        followers: arrayUnion(currentUserId),
      }),
    ]);
  } catch (e) {
    console.log("FOLLOW ERROR:", e);
  }
};

/* =========================================
   ➖ UNFOLLOW (FIXED)
========================================= */
export const unfollowUser = async (targetUserId: string) => {
  const user = auth.currentUser;
  if (!user) return;

  const currentUserId = user.uid;

  const meRef = doc(db, "users", currentUserId);
  const targetRef = doc(db, "users", targetUserId);

  try {
    await Promise.all([
      updateDoc(meRef, {
        following: arrayRemove(targetUserId),
      }),
      updateDoc(targetRef, {
        followers: arrayRemove(currentUserId),
      }),
    ]);
  } catch (e) {
    console.log("UNFOLLOW ERROR:", e);
  }
};