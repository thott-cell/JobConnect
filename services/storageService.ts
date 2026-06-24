import * as FileSystem from "expo-file-system/legacy";

/* ======================================================
   🔥 CONFIGURATION
====================================================== */
const CLOUD_NAME = "dbj6koi4f";
const UPLOAD_PRESET = "JobConnect-upload";

/* ======================================================
   🚀 UPLOAD FILE TO CLOUDINARY
====================================================== */
export const uploadFile = async (
  uri: string,
  folder: string = "uploads"
): Promise<string> => {
  try {
    // 1. Verify file status natively on the smartphone device
    const fileInfo = await FileSystem.getInfoAsync(uri);
    if (!fileInfo.exists) {
      throw new Error("Local file target does not exist at specified path.");
    }

    // 2. Extract specific image file type properties dynamically from filename
    const filename = uri.split('/').pop() || `upload_${Date.now()}.jpg`;
    const match = /\.(\w+)$/.exec(filename);
    const ext = match ? match[1].toLowerCase() : 'jpeg';
    
    // Assign proper mime-types to enable Cloudinary's auto-optimization engines
    const mimeType = ext === 'png' ? 'image/png' : ext === 'gif' ? 'image/gif' : 'image/jpeg';

    const formData = new FormData();

    // 3. Append data payload package structured for React Native networking drivers
    formData.append("file", {
      uri,
      type: mimeType, // FIXED: Bypassed blind stream octet settings for true image transformation support
      name: filename,
    } as any);

    formData.append("upload_preset", UPLOAD_PRESET);
    formData.append("folder", folder);

    console.log(`🌐 Shipping binary chunk data directly to Cloudinary folder: [${folder}]...`);

    const res = await fetch(
      `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/auto/upload`,
      {
        method: "POST",
        body: formData,
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    );

    const data = await res.json();

    if (!res.ok || !data.secure_url) {
      console.error("❌ CLOUDINARY API REJECTION REASON:", data?.error?.message || data);
      throw new Error(data?.error?.message || "Cloudinary upload pipeline transaction rejected.");
    }

    // 4. WHATSAPP ENGINE OPTIMIZATION STEP:
    // Auto-injects performance formatting tags 'f_auto' and compression scaling tags 'q_auto'.
    // Cloudinary automatically resizes and delivers the smallest possible byte-payload file to mobile devices.
    const optimizedSecureUrl = data.secure_url.replace('/upload/', '/upload/f_auto,q_auto/');
    
    console.log("✅ CLOUDINARY PIPELINE SUCCESS:", optimizedSecureUrl);
    return optimizedSecureUrl;

  } catch (error) {
    console.error("❌ CLOUDINARY STORAGE ENGINE FAULT:", error);
    throw error;
  }
};
