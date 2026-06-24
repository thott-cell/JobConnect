import { db } from "../firebase/firebaseConfig";
import { doc, setDoc } from "firebase/firestore";

export const createUserProfile = async (uid: string, data: any) => {
  await setDoc(doc(db, "users", uid), data);
};