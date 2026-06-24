import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, Pressable, ViewStyle, TextStyle } from 'react-native';
import { useRouter } from 'expo-router';
import { auth, db } from '../firebase/firebaseConfig';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { createOrGetChatRoom } from '../services/chatService';

interface UserProfile {
  id: string;
  name: string;
}

export default function NewChatSelectorScreen() {
  const router = useRouter();
  const [users, setUsers] = useState<UserProfile[]>([]);
  const currentUserId = auth.currentUser?.uid;
  const currentUserName = auth.currentUser?.displayName || 'My Profile Name';

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        // Fetch users from your 'users' collection (assuming you have one)
        const usersRef = collection(db, 'users');
        
        // Exclude the currently logged-in user so you don't chat with yourself
        const q = query(usersRef, where('__name__', '!=', currentUserId || ''));
        const snapshot = await getDocs(q);
        
        const userList = snapshot.docs.map(doc => ({
          id: doc.id,
          name: doc.data().name || doc.data().email || 'Unknown User'
        }));
        
        setUsers(userList);
      } catch (error) {
        console.error("Failed to load global user directory:", error);
        
        // 🧪 TESTING FALLBACK: If you don't have a 'users' collection yet,
        // this creates a clickable test profile so you can force-create a valid room.
        setUsers([{ id: 'test_receiver_99', name: 'Developer Target Tester Account' }]);
      }
    };

    fetchUsers();
  }, [currentUserId]);

  const handleStartChat = async (targetUser: UserProfile) => {
    if (!currentUserId) return;

    try {
      console.log(`Creating valid chat room between: ${currentUserId} and ${targetUser.id}`);
      
      // Triggers your base chat service logic to build the exact arrays needed
      const generatedRoomId = await createOrGetChatRoom(
        currentUserId,
        targetUser.id,
        currentUserName,
        targetUser.name
      );

      console.log("Room initialized successfully with ID:", generatedRoomId);
      
      // Return to dashboard screen
      router.replace('/messages');
    } catch (error) {
      console.error("Failed to generate chat sequence:", error);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.titleHeader}>Start a New Chat</Text>
      <FlatList
        data={users}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <Pressable style={styles.userRow} onPress={() => handleStartChat(item)}>
            <View style={styles.avatarPlaceholder}>
              <Text style={styles.avatarText}>{item.name.charAt(0).toUpperCase()}</Text>
            </View>
            <View>
              <Text style={styles.userNameText}>{item.name}</Text>
              <Text style={styles.subText}>UID: {item.id}</Text>
            </View>
          </Pressable>
        )}
      />
    </View>
  );
}

const styles = {
  container: { flex: 1, backgroundColor: '#ffffff', padding: 15 } as ViewStyle,
  titleHeader: { fontSize: 20, fontWeight: 'bold', marginBottom: 15, color: '#333' } as TextStyle,
  userRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 0.5, borderBottomColor: '#eee' } as ViewStyle,
  avatarPlaceholder: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#00a884', justifyContent: 'center', alignItems: 'center', marginRight: 15 } as ViewStyle,
  avatarText: { color: '#fff', fontSize: 16, fontWeight: 'bold' } as TextStyle,
  userNameText: { fontSize: 16, fontWeight: '600', color: '#000' } as TextStyle,
  subText: { fontSize: 11, color: '#999', marginTop: 2 } as TextStyle
};
