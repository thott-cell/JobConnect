import { db } from '../firebase/firebaseConfig';
import { collection, doc, setDoc, query, where, onSnapshot } from 'firebase/firestore';
import { ChatRoom } from '../types';

export const createOrGetChatRoom = async (
  currentUserId: string, 
  targetUserId: string,
  currentUserName: string,
  targetUserName: string
): Promise<string> => {
  // Sort guarantees consistency regardless of who opens the room thread first
  const roomId = [currentUserId, targetUserId].sort().join('_');
  const roomRef = doc(db, 'rooms', roomId);

  const initialData: Partial<ChatRoom> = {
    id: roomId,
    participantIds: [currentUserId, targetUserId],
    participantDetails: {
      [currentUserId]: { name: currentUserName || 'User A', avatarUrl: '' },
      [targetUserId]: { name: targetUserName || 'User B', avatarUrl: '' }
    },
    unreadCounts: { 
      [currentUserId]: 0, 
      [targetUserId]: 0 
    },
    typingStatus: { 
      [currentUserId]: false, 
      [targetUserId]: false 
    }
  };

  // setDoc with merge: true creates the room structure safely without wiping existing data
  await setDoc(roomRef, initialData, { merge: true });
  return roomId;
};

export const subscribeToUserChats = (userId: string, callback: (rooms: ChatRoom[]) => void, p0: (error: any) => void) => {
  const q = query(
    collection(db, 'rooms'),
    where('participantIds', 'array-contains', userId)
  );

  return onSnapshot(q, (snapshot) => {
    const rooms = snapshot.docs.map(doc => doc.data() as ChatRoom);
    
    const sortedRooms = rooms.sort((a, b) => {
      const timeA = a.lastMessage?.createdAt?.toMillis() || 0;
      const timeB = b.lastMessage?.createdAt?.toMillis() || 0;
      return timeB - timeA;
    });

    callback(sortedRooms);
  });
};

export const clearUnreadCount = async (roomId: string, userId: string): Promise<void> => {
  const roomRef = doc(db, 'rooms', roomId);
  await setDoc(roomRef, { unreadCounts: { [userId]: 0 } }, { merge: true });
};
