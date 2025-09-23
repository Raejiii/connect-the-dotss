export const MAX_IMAGE_FILE_SIZE = 2 * 1024 * 1024; // 10 MB in bytes
export const MAX_AUDIO_FILE_SIZE = 2 * 1024 * 1024; // 10 MB in bytes

export const SUPPORTED_IMAGE_FORMATS = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "image/svg+xml",
  "image/jpg",
];

export const SUPPORTED_AUDIO_FORMATS = [
  "audio/mpeg",   // .mp3
  "audio/wav",    // .wav
  "audio/x-wav",
  "audio/ogg",    // .ogg
  "audio/mp4",    // .m4a
  "audio/webm",   // WebM audio
  "audio/x-m4a",
  "video/webm",   // ✅ WebM with only audio tracks (e.g., from MediaRecorder)
];