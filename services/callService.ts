import { db } from '../firebase/firebaseConfig';
import { doc, setDoc, serverTimestamp, deleteDoc } from 'firebase/firestore';
import { AGORA_CONFIG } from '../firebase/agora.config';

interface InitiateCallParams {
  chatId: string;
  senderId: string;
  receiverId: string;
  callType: 'audio' | 'video';
}

/**
 * Requests a secure WebRTC token from Render and posts a signal document
 * into Firestore to make the receiver's phone ring.
 */
export const initiateVoipCallStream = async ({ chatId, senderId, receiverId, callType }: InitiateCallParams) => {
  // Generate a distinct room session ID using the chatId and current time
  const callRoomId = `${chatId}_${Date.now()}`;
  
  try {
    console.log(`🌐 Contacting Render token engine for channel: ${callRoomId}`);
    
    // 1. Fetch the real-time Agora token from your deployed Render server
    const tokenResponse = await fetch(
      `${AGORA_CONFIG.TOKEN_SERVER_URL}/rtc/${callRoomId}/publisher/uid/0/`
    );
    
    if (!tokenResponse.ok) {
      throw new Error(`Server responded with status: ${tokenResponse.status}`);
    }
    
    const tokenData = await tokenResponse.json();
    const rtcToken = tokenData.rtcToken;

    if (!rtcToken) {
      throw new Error("Failed to extract token string from backend response.");
    }

    // 2. Write an active call document under a global flat "calls" collection.
    // The document ID is set to the receiverId so they can listen for it directly.
    const callSignalRef = doc(db, "calls", receiverId);
    await setDoc(callSignalRef, {
      callRoomId,
      chatId,
      callerId: senderId,
      receiverId,
      callType,
      rtcToken,
      signalState: 'ringing', // Signals the receiver's phone to start ringing
      timestamp: serverTimestamp()
    });

    return { callRoomId, rtcToken };
  } catch (error) {
    console.error("❌ CALL SIGNALING SEED FAILURE:", error);
    throw error;
  }
};

/**
 * Completely clears out the call document from Firestore to end the ringing/call session.
 */
export const terminateCallSession = async (targetUserId: string) => {
  if (!targetUserId) return;
  try {
    const callSignalRef = doc(db, "calls", targetUserId);
    await deleteDoc(callSignalRef);
    console.log(`🧹 Call session for user ${targetUserId} cleared successfully.`);
  } catch (error) {
    console.error("❌ Failed to terminate call session document:", error);
  }
};
