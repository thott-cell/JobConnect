import { db } from "../firebase/firebaseConfig";
import {
  collection,
  doc,
  writeBatch,
  query,
  orderBy,
  onSnapshot,
  serverTimestamp,
  increment,
  Timestamp,
} from "firebase/firestore";

import { Message } from "../types";

export const sendWhatsAppMessage = async (
  roomId: string,
  senderId: string,
  senderName: string,
  text: string,
  recipientId: string
) => {
  if (!roomId || !senderId || !recipientId || !text.trim()) return;

  const roomRef = doc(db, "rooms", roomId);
  const messageRef = doc(collection(db, "rooms", roomId, "messages"));

  const batch = writeBatch(db);

  batch.set(messageRef, {
    senderId,
    senderName,
    text: text.trim(),
    createdAt: serverTimestamp(),
    status: "sent",
  });

  batch.set(
    roomRef,
    {
      id: roomId,

      lastMessage: {
        text: text.trim(),
        senderId,
        createdAt: serverTimestamp(),
      },

      unreadCounts: {
        [recipientId]: increment(1),
      },
    },
    { merge: true }
  );

  await batch.commit();
};

export const listenForRoomMessages = (
  roomId: string,
  callback: (messages: Message[]) => void
) => {
  if (!roomId) return () => {};

  const q = query(
    collection(db, "rooms", roomId, "messages"),
    orderBy("createdAt", "asc")
  );

  return onSnapshot(
    q,
    (snapshot) => {
      console.log("Listening Room:", roomId);
      console.log("Documents:", snapshot.size);

      const messages: Message[] = snapshot.docs.map((docSnap) => {
        const data = docSnap.data();

        return {
          id: docSnap.id,
          senderId: data.senderId,
          senderName: data.senderName,
          text: data.text,
          createdAt:
            data.createdAt instanceof Timestamp
              ? data.createdAt
              : Timestamp.now(),
          status: data.status || "sent",
        };
      });

      console.log("Fetched Messages:", messages);

      callback(messages);
    },
    (error) => {
      console.log("Firestore Listener Error:", error);
    }
  );
};