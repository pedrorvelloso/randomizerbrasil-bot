interface Streamer {
  id: string;
  username: string;
  displayName: string;
  twitchUrl: string;
  thumbnailUrl: string;
  streamTitle: string;
  gameName: string;
  startedAt: string;
  liveDuration: string;
  viewerCount: number;
}

interface StreamersResponse {
  success: boolean;
  data: Streamer[];
  count: number;
  timestamp: string;
}

export async function fetchStreamers(): Promise<StreamersResponse> {
  const baseUrl = process.env.RBR_API_URL;
  const response = await fetch(`${baseUrl}/api/streamers`);

  if (!response.ok) {
    throw new Error(`API request failed: ${response.status}`);
  }

  return response.json() as Promise<StreamersResponse>;
}

export async function getStreamers(): Promise<StreamersResponse> {
  let result = await fetchStreamers();

  // Check if timestamp is > 1 minute old
  const timestamp = new Date(result.timestamp);
  const now = new Date();
  const diffMs = now.getTime() - timestamp.getTime();
  const ONE_MINUTE = 60 * 1000;

  if (diffMs > ONE_MINUTE) {
    // Refetch once
    result = await fetchStreamers();
  }

  return result;
}
