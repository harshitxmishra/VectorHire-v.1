export function extractDriveFileId(url: string): string | null {
  const patterns = [
    /\/file\/d\/([a-zA-Z0-9_-]+)/,
    /[?&]id=([a-zA-Z0-9_-]+)/,
    /\/d\/([a-zA-Z0-9_-]+)/,
  ];

  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match?.[1]) {
      return match[1];
    }
  }

  return null;
}

export function toDirectDownloadUrl(url: string): string {
  const fileId = extractDriveFileId(url);

  if (!fileId) {
    return url;
  }

  return `https://drive.google.com/uc?export=download&id=${fileId}`;
}
