import { db, auth } from "../firebase/firebaseConfig";
import {
  collection,
  addDoc,
  serverTimestamp,
  query,
  where,
  onSnapshot,
  updateDoc,
  doc,
} from "firebase/firestore";

/* =========================================
   🔔 SEND NOTIFICATION
========================================= */
export const sendNotification = async ({
  toUserId,
  type,
  text,
  postId,
  jobId,
}: any) => {
  const user = auth.currentUser;
  if (!user) return;

  await addDoc(collection(db, "notifications"), {
    toUserId,
    fromUserId: user.uid,
    type, // like, comment, follow, job
    text,
    postId: postId || null,
    jobId: jobId || null,
    read: false,
    createdAt: serverTimestamp(),
  });
};

/* =========================================
   🔥 REALTIME USER NOTIFICATIONS
========================================= */
export const subscribeToNotifications = (callback: any) => {
  const user = auth.currentUser;
  if (!user) return () => {};

  const q = query(
    collection(db, "notifications"),
    where("toUserId", "==", user.uid)
  );

  return onSnapshot(q, (snap) => {
    const data = snap.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    callback(data);
  });
};

/* =========================================
   ✅ MARK AS READ
========================================= */
export const markNotificationAsRead = async (id: string) => {
  await updateDoc(doc(db, "notifications", id), {
    read: true,
  });
};

/* =========================================
   ✅ MARK ALL AS READ
========================================= */
export const markAllAsRead = async () => {
  const user = auth.currentUser;
  if (!user) return;

  const q = query(
    collection(db, "notifications"),
    where("toUserId", "==", user.uid)
  );

  const unsub = onSnapshot(q, (snap) => {
    snap.docs.forEach(async (d) => {
      await updateDoc(doc(db, "notifications", d.id), {
        read: true,
      });
    });
  });

  return unsub;
};