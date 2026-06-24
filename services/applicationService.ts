import { db, auth } from "../firebase/firebaseConfig";
import {
  collection,
  addDoc,
  serverTimestamp,
  query,
  where,
  getDocs,
} from "firebase/firestore";

/* 🚀 APPLY CHECK (NO DUPLICATE) */
export const hasApplied = async (jobId: string) => {
  const user = auth.currentUser;

  const q = query(
    collection(db, "applications"),
    where("jobId", "==", jobId),
    where("userId", "==", user?.uid)
  );

  const snap = await getDocs(q);
  return !snap.empty;
};

/* 📄 GET MY APPLICATIONS */
export const getMyApplications = async () => {
  const user = auth.currentUser;

  const q = query(
    collection(db, "applications"),
    where("userId", "==", user?.uid)
  );

  const snap = await getDocs(q);

  return snap.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  }));
};