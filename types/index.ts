import { Timestamp } from 'firebase/firestore';

export type MessageStatus = 'sending' | 'sent' | 'delivered' | 'read';
export type MessageType = 'text' | 'image' | 'video' | 'audio' | 'document' | 'voice_note' | 'call_log';

export interface ChatMessage {
  id: string;
  chatId: string;
  senderId: string;
  receiverId: string;
  text: string;
   createdAt: Timestamp | null;
  status: 'sending' | 'sent' | 'delivered' | 'read';
  messageType: MessageType;
  mediaUrl?: string;          // Cloudinary path for images, audio, or docs
  voiceDuration?: number;     // Voice note length in seconds
  isEdited?: boolean;         // Adds "Edited" flag to bubble
  isDeleted?: boolean;        // Replaces text with "This message was deleted"
  callDuration?: string;      // Logs length of completed call calls
}


export interface ChatMessage {
  id: string;
  chatId: string;
  senderId: string;
  receiverId: string;
  text: string;
  createdAt: Timestamp | null; // Nullable for immediate local optimistic UI injection
  status: MessageStatus;
  messageType: MessageType;
  mediaUrl?: string; // Pointing directly to your optimized Cloudinary storage path
}

export interface UserPresence {
  uid: string;
  isOnline: boolean;
  lastSeen: Timestamp;
  isTypingTo: string | null; // Holds the current chatId if typing, otherwise null
}

export interface Message {
  id: string;
  text: string;
  senderId: string;
  senderName: string;
  createdAt: Timestamp | null; // Nullable for local optimistic UI updates
  status: MessageStatus;
}

export interface ChatRoom {
  id: string;
  participantIds: string[];
  participantDetails: {
    [userId: string]: { name: string; avatarUrl: string };
  };
  lastMessage?: {
    text: string;
    senderId: string;
    createdAt: Timestamp;
  };
  unreadCounts: {
    [userId: string]: number;
  };
  typingStatus: {
    [userId: string]: boolean;
  };
}

export interface Post {
  id?: string;
  userId: string;
  text: string;
  mediaUrl: string;
  mediaType: "image" | "video" | "none";
  likes: number;
  likedBy: string[];
  commentsCount: number;
  createdAt: any;
  
}

export interface Comment {
  id?: string;
  userId: string;
  text: string;
  createdAt: any;
}