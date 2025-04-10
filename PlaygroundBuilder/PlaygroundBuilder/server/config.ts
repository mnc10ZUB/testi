// Konfigurationsdatei für die Anwendung
export const config = {
  sessionSecret: process.env.SESSION_SECRET || "zubcarpoolbrandenburg-secret",
  database: {
    url: process.env.DATABASE_URL,
  },
  port: 5000,
  host: "0.0.0.0",
};