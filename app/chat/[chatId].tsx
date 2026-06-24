import React, { useEffect, useState, useRef } from 'react';
import { StyleSheet, View, Text, FlatList, TextInput, Pressable, KeyboardAvoidingView, Platform, SafeAreaView, ViewStyle, TextStyle, Image, ActivityIndicator, Alert } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { auth, db } from '../../firebase/firebaseConfig';
import { collection, query, where, orderBy, onSnapshot, addDoc, serverTimestamp, doc, updateDoc, writeBatch, Timestamp } from 'firebase/firestore';
import { Audio } from 'expo-av';
import { initiateVoipCallStream } from '../../services/callService';

import * as DocumentPicker from 'expo-document-picker';
import { uploadFile } from '../../services/storageService'; // Points to your exact upload utility

// Strict WhatsApp-grade data specifications
export interface ChatMessage {
  id: string;
  chatId: string;
  senderId: string;
  receiverId: string;
  text: string;
  createdAt: any;
  status: 'sending' | 'sent' | 'delivered' | 'read';
  messageType: 'text' | 'image' | 'voice_note' | 'document' | 'call_log';
  mediaUrl?: string;
  isEdited?: boolean;
  isDeleted?: boolean;
  callDuration?: string;
}

interface UserPresence {
  uid: string;
  isOnline: boolean;
  isTypingTo: string | null;
}

export default function UltimateWhatsAppScreen() {
  const { chatId, receiverId } = useLocalSearchParams<{
  chatId: string;
  receiverId: string;
}>();
  const router = useRouter();
  
  // Real-time engine operational hooks
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [text, setText] = useState('');
  const [recording, setRecording] = useState<Audio.Recording | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
  const [recipientPresence, setRecipientPresence] = useState<UserPresence | null>(null);
  const [loading, setLoading] = useState(false);
  
  const flatListRef = useRef<FlatList>(null);
  const currentUserId = auth.currentUser?.uid;
  const currentUserName = auth.currentUser?.displayName || "JobConnect User";

  const parts = chatId ? chatId.split('_') : [];
  

  // Hardware safety release cleanup hook
  useEffect(() => {
    return () => {
      if (recording) {
        recording.stopAndUnloadAsync().catch(() => {});
      }
    };
  }, [recording]);

  // Continued in Part 2...
  // ==========================================
  // 1. DATA STREAM LISTENERS & READ RECEIPTS
  // ==========================================
  useEffect(() => {
    if (!chatId || !currentUserId) return;

    const q = query(
      collection(db, "messages"),
      where("chatId", "==", chatId),
      orderBy("createdAt", "asc")
    );

    const unsubscribe = onSnapshot(q, { includeMetadataChanges: true }, async (snapshot) => {
      const msgs = snapshot.docs.map((doc) => {
        const data = doc.data({ serverTimestamps: "estimate" });
        return {
          id: doc.id,
          ...data,
          createdAt: data.createdAt || Timestamp.now(),
        } as ChatMessage;
      });
      setMessages(msgs);

      // WhatsApp Read Receipt Tracker Loop
      const unreadIncomingDocs = snapshot.docs.filter((d) => {
        const data = d.data();
        return data.receiverId === currentUserId && data.status !== "read";
      });

      if (unreadIncomingDocs.length > 0) {
        const batch = writeBatch(db);
        unreadIncomingDocs.forEach((d) => batch.update(d.ref, { status: "read" }));
        await batch.commit();
      }
    });

    return () => unsubscribe();
  }, [chatId, currentUserId]);

  // Presence/Typing status listener
  useEffect(() => {
    if (!receiverId) return;
    const presenceRef = doc(db, "presence", receiverId);
    return onSnapshot(presenceRef, (snap) => {
      if (snap.exists()) setRecipientPresence(snap.data() as UserPresence);
    });
  }, [receiverId]);

  // ==========================================
  // 2. TEXT MANAGEMENT & INDICATORS
  // ==========================================
  const handleTextChange = (inputText: string) => {
    setText(inputText);
    if (!currentUserId) return;
    updateDoc(doc(db, "presence", currentUserId), {
      isTypingTo: inputText.trim().length > 0 ? chatId : null,
    }).catch(() => {});
  };

  const handleSendText = async () => {
    if (!text.trim() || !currentUserId || !receiverId || !chatId) return;
    const messageContent = text.trim();
    setText("");

    if (currentUserId) {
      updateDoc(doc(db, "presence", currentUserId), { isTypingTo: null }).catch(() => {});
    }

    if (editingMessageId) {
      await updateDoc(doc(db, "messages", editingMessageId), {
        text: messageContent,
        isEdited: true,
      });
      setEditingMessageId(null);
    } else {
      await addDoc(collection(db, "messages"), {
        chatId, senderId: currentUserId, receiverId, text: messageContent,
        createdAt: serverTimestamp(), status: "sent", messageType: "text",
      });
    }
  };

  // ==========================================
  // 3. VOICE NOTE ENGAGING LOCKS
  // ==========================================
  const startRecordingVoice = async () => {
    if (isRecording || recording) return;
    try {
      await Audio.requestPermissionsAsync();
      await Audio.setAudioModeAsync({ allowsRecordingIOS: true, playsInSilentModeIOS: true });
      
      setIsRecording(true);
      const { recording: newRecording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY
      );
      setRecording(newRecording);
    } catch (err) {
      console.error("Failed to start recording", err);
      setIsRecording(false);
      setRecording(null);
    }
  };

  const stopAndSendVoiceNote = async () => {
    if (!recording) return;
    setIsRecording(false);
    const currentRecording = recording;
    setRecording(null);

    try {
      await currentRecording.stopAndUnloadAsync();
      const uri = currentRecording.getURI();

      if (uri) {
        setLoading(true);
        const cloudinaryUrl = await uploadFile(uri, "voice_notes");
        await addDoc(collection(db, "messages"), {
          chatId, senderId: currentUserId, receiverId, text: "🎵 Voice Note",
          mediaUrl: cloudinaryUrl, createdAt: serverTimestamp(), status: "sent", messageType: "voice_note",
        });
      }
    } catch (err) {
      console.error("Audio capture fault:", err);
    } finally {
      setLoading(false);
    }
  };

   // 4. DOCUMENT SELECTION PIPELINE WITH ATOMIC LOCK
  const handlePickAndSendDocument = async () => {
    // 🔥 SAFE GUARD LOCK: Prevents multiple document pickers from opening simultaneously
    if (loading) {
      console.log("⚠️ Guard blocked overlapping document picking request.");
      return;
    }

    setLoading(true); // Engages lock instantly

    try {
      console.log("Opening native file explorer windows...");
      const result = await DocumentPicker.getDocumentAsync({ 
        type: "*/*", 
        copyToCacheDirectory: true 
      });

      if (result.canceled || !result.assets || result.assets.length === 0) {
        console.log("User cancelled file selection windows picker.");
        setLoading(false); // Release lock safely if cancelled
        return;
      }

      const fileUri = result.assets[0].uri;
      const fileName = result.assets[0].name || `upload_${Date.now()}`;

      console.log("🌐 Shipping document binary tracking layout directly to Cloudinary folder...");
      // Uses your optimized uploadFile function to process the file
      const cloudinaryUrl = await uploadFile(fileUri, "chat_documents");
      
      console.log("✅ Cloudinary URL generated successfully:", cloudinaryUrl);

      // Writes the transaction securely to your working flat messages collection
      await addDoc(collection(db, "messages"), {
        chatId,
        senderId: currentUserId,
        receiverId,
        text: `📄 ${fileName}`,
        mediaUrl: cloudinaryUrl,
        createdAt: serverTimestamp(),
        status: 'sent',
        messageType: 'document'
      });

    } catch (err) {
      console.error("❌ Document picker execution pipeline crashed completely:", err);
      Alert.alert("Upload Failed", "Could not upload document attachment.");
    } finally {
      setLoading(false); // Always release the lock at the absolute end of execution loops
    }
  };


  const openMessageActionsMenu = (message: ChatMessage) => {
    if (message.senderId !== currentUserId || message.isDeleted) return;

    Alert.alert("Message Options", "Choose an action", [
      { text: "Edit Message", onPress: () => { setText(message.text); setEditingMessageId(message.id); } },
      { text: "Delete Message", style: "destructive", onPress: async () => {
          await updateDoc(doc(db, "messages", message.id), { text: "🚫 This message was deleted", isDeleted: true });
        } 
      },
      { text: "Cancel", style: "cancel" }
    ]);
  };

const initializeVoipCall = async (callType: 'audio' | 'video') => {
  if (!chatId || !currentUserId || !receiverId) {
    Alert.alert("Connection Error", "Unable to establish valid session parameters.");
    return;
  }

  try {
    console.log(`📡 Initializing signaling handshake sequence for cloud ${callType} call...`);
    
    // Trigger your service layer engine to fetch an Agora token from Render
    const callSession = await initiateVoipCallStream({
      chatId,
      senderId: currentUserId,
      receiverId,
      callType
    });

    console.log("✅ Signaling pipeline live. Launching local calling room view...");

    // Automatically navigate your screen route straight to your call screen viewport page
   router.push({
  // Type-casting as 'any' bypasses the Typed Routes validation engine until it updates its cache maps
  pathname: `/call/${callSession.callRoomId}` as any,
  params: {
    rtcToken: callSession.rtcToken,
    callType: callType,
    callerId: currentUserId
  }
});

  } catch (err: any) {
    console.error("❌ VOIP HANDSHAKE RUNTIME CRASH:", err);
    Alert.alert("Call Failure", "Your calling server could not generate a secure communication token.");
  }
};
  // Continued in Part 3...
  // ==========================================
  // 5. INTERFACE RENDER ENGINE
  // ==========================================
  const renderStatusTicks = (status: 'sending' | 'sent' | 'delivered' | 'read') => {
    if (status === 'sending') return <Text style={styles.tickText}>🕒</Text>;
    if (status === 'sent') return <Text style={styles.tickText}>✓</Text>;
    if (status === 'delivered') return <Text style={styles.tickText}>✓✓</Text>;
    if (status === 'read') return <Text style={[styles.tickText, { color: '#34B7F1' }]}>✓✓</Text>;
    return null;
  };

  return (
    <SafeAreaView style={styles.safeContainer}>
      {/* WHATSAPP DYNAMIC VOIP SUB-HEADER */}
      <View style={styles.headerBar}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backTxt}>←</Text>
        </Pressable>
        <View style={styles.headerMeta}>
          <Text style={styles.headerTitleText}>JobConnect Chat</Text>
          <Text style={styles.headerSubtitleText}>
            {recipientPresence?.isTypingTo === chatId ? "typing..." : (recipientPresence?.isOnline ? "Online" : "Offline")}
          </Text>
        </View>
        <View style={styles.callIconGroup}>
          <Pressable onPress={() => initializeVoipCall('audio')} style={styles.callBtn}><Text style={styles.iconTxt}>📞</Text></Pressable>
          <Pressable onPress={() => initializeVoipCall('video')} style={styles.callBtn}><Text style={styles.iconTxt}>📹</Text></Pressable>
        </View>
      </View>

      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'} 
        style={styles.container} 
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        <FlatList
          ref={flatListRef}
          data={messages}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
          renderItem={({ item }) => {
            const isMe = item.senderId === currentUserId;

            let timeString = '';
            if (item.createdAt?.seconds) {
              timeString = new Date(item.createdAt.seconds * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
            }

            return (
              <Pressable 
                onLongPress={() => openMessageActionsMenu(item)} 
                style={[styles.bubbleWrapper, isMe ? styles.myWrapper : styles.theirWrapper]}
              >
                <View style={[styles.bubble, isMe ? styles.myBubble : styles.theirBubble]}>
                  <Text style={[styles.messageText, item.isDeleted && { color: '#888888', fontStyle: 'italic' }]}>
                    {item.text}
                  </Text>
                  
                  {item.messageType === 'document' && item.mediaUrl && (
                    <Text style={styles.docLink}>⬇️ Tap to download attachment</Text>
                  )}
                  
                  <View style={styles.timestampContainer}>
                    {item.isEdited && !item.isDeleted && <Text style={styles.editedIndicator}>edited </Text>}
                    <Text style={styles.timestampText}>{timeString || 'Sending...'}</Text>
                    {isMe && renderStatusTicks(item.status)}
                  </View>
                </View>
              </Pressable>
            );
          }}
        />

        {loading && <ActivityIndicator size="small" color="#00a884" style={{ marginVertical: 5 }} />}

        {/* INPUT HARDWARE BAR */}
        <View style={styles.inputContainer}>
          <Pressable style={styles.attachBtn} onPress={handlePickAndSendDocument}>
            <Text style={styles.attachBtnText}>📎</Text>
          </Pressable>
          <TextInput
            style={styles.input}
            value={text}
            onChangeText={handleTextChange}
            placeholder={editingMessageId ? "Edit message..." : "Type a message..."}
            placeholderTextColor="#999"
            multiline
          />
          {text.trim().length > 0 || editingMessageId ? (
            <Pressable style={styles.sendButton} onPress={handleSendText}>
              <Text style={styles.sendButtonText}>Send</Text>
            </Pressable>
          ) : (
            <Pressable 
              style={[styles.sendButton, isRecording && { backgroundColor: '#d32f2f' }]} 
              onPress={isRecording ? stopAndSendVoiceNote : startRecordingVoice}
            >
              <Text style={styles.sendButtonText}>{isRecording ? "⏹️" : "🎤"}</Text>
            </Pressable>
          )}
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

// ==========================================
// 6. STYLESHEETS
// ==========================================
const styles = {
  safeContainer: { flex: 1, backgroundColor: '#efe7dd' } as ViewStyle,
  container: { flex: 1 } as ViewStyle,
  headerBar: { flexDirection: 'row', backgroundColor: '#075E54', padding: 16, alignItems: 'center' } as ViewStyle,
  backBtn: { marginRight: 15 } as ViewStyle,
  backTxt: { color: '#fff', fontSize: 20, fontWeight: 'bold' } as TextStyle,
  headerMeta: { flex: 1 } as ViewStyle,
  headerTitleText: { color: '#ffffff', fontSize: 17, fontWeight: 'bold' } as TextStyle,
  headerSubtitleText: { color: '#dcf8c6', fontSize: 12, marginTop: 2 } as TextStyle,
  callIconGroup: { flexDirection: 'row' } as ViewStyle,
  callBtn: { marginLeft: 18, padding: 4 } as ViewStyle,
  iconTxt: { fontSize: 20, color: '#fff' } as TextStyle,
  listContent: { paddingHorizontal: 10, paddingVertical: 15 } as ViewStyle,
  bubbleWrapper: { flexDirection: 'row', marginVertical: 4, width: '100%' } as ViewStyle,
  myWrapper: { justifyContent: 'flex-end' } as ViewStyle,
  theirWrapper: { justifyContent: 'flex-start' } as ViewStyle,
  bubble: { maxWidth: '75%', borderRadius: 12, paddingHorizontal: 12, paddingVertical: 8, elevation: 1 } as ViewStyle,
  myBubble: { backgroundColor: '#DCF8C6', alignSelf: 'flex-end' } as ViewStyle,
  theirBubble: { backgroundColor: '#ffffff', alignSelf: 'flex-start' } as ViewStyle,
  messageText: { fontSize: 15, color: '#000000', lineHeight: 20 } as TextStyle,
  docLink: { color: '#0288d1', fontSize: 12, marginTop: 4, fontWeight: 'bold' } as TextStyle,
  editedIndicator: { fontSize: 9, color: '#888888', fontStyle: 'italic' } as TextStyle,
  timestampContainer: { flexDirection: 'row', justifyContent: 'flex-end', alignItems: 'center', marginTop: 4 } as ViewStyle,
  timestampText: { fontSize: 10, color: '#666666', marginRight: 4 } as TextStyle,
  tickText: { fontSize: 11, color: '#999999', fontWeight: 'bold' } as TextStyle,
  inputContainer: { flexDirection: 'row', padding: 10, backgroundColor: '#f0f0f0', alignItems: 'center' } as ViewStyle,
  attachBtn: { marginRight: 10, padding: 5 } as ViewStyle,
  attachBtnText: { fontSize: 20, color: '#555' } as TextStyle,
  input: { flex: 1, backgroundColor: '#ffffff', borderRadius: 20, paddingHorizontal: 15, paddingVertical: 8, fontSize: 16, maxHeight: 100, minHeight: 40, borderWidth: 0.5, borderColor: '#dddddd', color: '#000000' } as TextStyle,
  sendButton: { marginLeft: 10, backgroundColor: '#128C7E', width: 60, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center' } as ViewStyle,
  sendButtonText: { color: '#ffffff', fontWeight: 'bold', fontSize: 14 } as TextStyle
};
