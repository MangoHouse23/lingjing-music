export interface SongPayload {
  source: string;
  sourceId: string;
  title: string;
  artist: string;
  album?: string;
  duration?: number;
  cover?: string;
  quality?: string; // JSON 字符串，如 '["无损"]'
}

export const songKey = (s: { source: string; sourceId: string }) => `${s.source}:${s.sourceId}`;
