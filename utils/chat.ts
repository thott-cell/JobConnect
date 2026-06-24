import { Timestamp } from 'firebase/firestore';

/**
 * Formats standard message headers or message line timestamps
 * Output: "10:42 AM" or yesterday boundaries
 */
export const formatMessageTime = (timestamp: Timestamp | null): string => {
  if (!timestamp) return 'Sending...';
  
  const date = timestamp.toDate();
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

/**
 * Cleanly truncates lengthy text inside chat list overview rows
 */
export const truncateText = (text: string | undefined | null, limit = 30): string => {
  if (!text) return '';
  if (text.length <= limit) return text;
  return text.substring(0, limit) + '...';
};
