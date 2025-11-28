export const allowedOrigins = [
  "http://localhost:3000",
  "http://localhost:3001",
  "https://commng.nunext.dev",
  process.env.BACKEND_URL || "",
].filter(Boolean);
