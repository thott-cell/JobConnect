import React, { useEffect, useState, useRef } from 'react';
import { StyleSheet, View, Text, Pressable, SafeAreaView, ViewStyle, TextStyle } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { auth, db } from '../../firebase/firebaseConfig';
import { doc, onSnapshot, updateDoc } from 'firebase/firestore';
import createAgoraRtcEngine, { RtcSurfaceView, IRtcEngine, ChannelProfileType, ClientRoleType } from 'react-native-agora';
import { AGORA_CONFIG } from '../../firebase/agora.config';
import { terminateCallSession } from '../../services/callService';

export default function WhatsAppGradeCallScreen() {
  const { callRoomId, rtcToken, callType, callerId } = useLocalSearchParams<{ 
    callRoomId: string; rtcToken: string; callType: 'audio' | 'video'; callerId: string;
  }>();
  
  const router = useRouter();
  const agoraEngineRef = useRef<IRtcEngine | null>(null);
  const [remoteUid, setRemoteUid] = useState<number | null>(null);
  const [isJoined, setIsJoined] = useState(false);
  const currentUserId = auth.currentUser?.uid;

  const isIncomingCall = currentUserId !== callerId;
  const targetSessionUserId = isIncomingCall ? callerId : (callRoomId ? callRoomId.split('_')[1] : '');

  useEffect(() => {
    if (!callRoomId || !currentUserId) return;

    // 1. INITIALIZE AGORA WebRTC HARDWARE DRIVERS
    const initAgoraEngine = async () => {
      try {
        agoraEngineRef.current = createAgoraRtcEngine();
        const engine = agoraEngineRef.current;
        
        engine.initialize({ appId: AGORA_CONFIG.APP_ID });
        
        if (callType === 'video') {
          engine.enableVideo();
          engine.startPreview();
        } else {
          engine.enableAudio();
        }

        // Handle peer stream joins & status tracking rules natively
        engine.registerEventHandler({
          onJoinChannelSuccess: (connection, uid) => {
            console.log("✅ Joined WebRTC audio/video pipe channel successfully. ID:", uid);
            setIsJoined(true);
          },
          onUserJoined: (connection, uid) => {
            console.log("👤 Remote streaming user connected framework stream:", uid);
            setRemoteUid(uid);
          },
          onUserOffline: (connection, uid) => {
            console.log("🚪 Remote user left the channel stream frame. Closing viewport.");
            handleEndCall();
          }
        });

        // 2. CONNECT TO THE CLOUD AUDIO/VIDEO ROOM
        engine.joinChannel(
          rtcToken || '',
          callRoomId,
          0, // Passing 0 lets Agora automatically assign a unique numeric ID to the phone
          {
            channelProfile: ChannelProfileType.ChannelProfileCommunication,
            clientRoleType: ClientRoleType.ClientRoleBroadcaster,
          }
        );
      } catch (e) {
        console.error("Agora engine runtime setup failure:", e);
      }
    };

    initAgoraEngine();

    // 3. LISTEN TO SIGNAL DELETIONS (If the other user hangs up)
    const signalDocRef = doc(db, "calls", currentUserId);
    const unsubscribeSignal = onSnapshot(signalDocRef, (snapshot) => {
      // If the call document is missing or state explicitly changes to ended, terminate local view context
      if (!snapshot.exists() || snapshot.data()?.signalState === 'ended') {
        console.log("📡 Signal document deletion caught. Exiting calling room view.");
        handleEndCall();
      }
    });

    return () => {
      agoraEngineRef.current?.leaveChannel();
      agoraEngineRef.current?.release();
      unsubscribeSignal();
    };
  }, [callRoomId]);

  const handleEndCall = async () => {
    try {
      if (currentUserId && targetSessionUserId) {
        // Clear background routing flags securely across Firestore channels
        await terminateCallSession(currentUserId);
        await terminateCallSession(targetSessionUserId);
      }
    } catch {}
    router.back();
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.topInfo}>
        <Text style={styles.title}>{callType === 'video' ? "Video Calling" : "Voice Calling"}</Text>
        <Text style={styles.subtitle}>JobConnect Encryption Channel Secured</Text>
      </View>

      {/* STREAMS VIEWS LAYOUT PORT FRAME BLOCKS */}
      {callType === 'video' ? (
        <View style={styles.videoGrid}>
          {remoteUid ? (
            <RtcSurfaceView canvas={{ uid: remoteUid }} style={styles.remoteVideo} />
          ) : (
            <View style={styles.waitingView}>
              <Text style={styles.waitText}>Waiting for recipient to connect stream feeds...</Text>
            </View>
          )}

          {/* Picture-in-Picture local camera video viewport mockup */}
          {isJoined && <RtcSurfaceView canvas={{ uid: 0 }} style={styles.localVideoPreview} />}
        </View>
      ) : (
        <View style={styles.audioCenterContainer}>
          <View style={styles.audioAvatarPlaceholder}>
            <Text style={styles.audioAvatarText}>🎙️</Text>
          </View>
          <Text style={styles.audioStatusText}>{remoteUid ? "Connected" : "Ringing..."}</Text>
        </View>
      )}

      {/* ACTIONS CONTROL TOOL PANEL FOOTER */}
      <View style={styles.controlsBar}>
        <Pressable style={styles.endCallButton} onPress={handleEndCall}>
          <Text style={styles.endCallText}>🛑 End Call</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = {
  container: { flex: 1, backgroundColor: '#111b21', justifyContent: 'space-between', alignItems: 'center' } as ViewStyle,
  topInfo: { alignItems: 'center', marginTop: 50 } as ViewStyle,
  title: { color: '#ffffff', fontSize: 24, fontWeight: 'bold' } as TextStyle,
  subtitle: { color: '#8696a0', fontSize: 13, marginTop: 6, fontStyle: 'italic' } as TextStyle,
  videoGrid: { width: '100%', flex: 1, marginVertical: 20, position: 'relative', backgroundColor: '#0b141a' } as ViewStyle,
  remoteVideo: { width: '100%', height: '100%' } as ViewStyle,
  localVideoPreview: { width: 110, height: 160, position: 'absolute', top: 20, right: 20, borderRadius: 12, borderWidth: 2, borderColor: '#00a884', overflow: 'hidden' } as ViewStyle,
  waitingView: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 } as ViewStyle,
  waitText: { color: '#8696a0', fontSize: 14, textAlign: 'center' } as TextStyle,
  audioCenterContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' } as ViewStyle,
  audioAvatarPlaceholder: { width: 100, height: 100, borderRadius: 50, backgroundColor: '#222e35', justifyContent: 'center', alignItems: 'center', marginBottom: 20 } as ViewStyle,
  audioAvatarText: { fontSize: 40 } as TextStyle,
  audioStatusText: { color: '#8696a0', fontSize: 16 } as TextStyle,
  controlsBar: { width: '100%', paddingVertical: 30, alignItems: 'center', backgroundColor: '#222e35', borderTopLeftRadius: 24, borderTopRightRadius: 24 } as ViewStyle,
  endCallButton: { backgroundColor: '#ea0038', paddingVertical: 14, paddingHorizontal: 40, borderRadius: 28, elevation: 4 } as ViewStyle,
  endCallText: { color: '#ffffff', fontSize: 16, fontWeight: 'bold' } as TextStyle
};
