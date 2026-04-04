// lib/replay_downloader.mjs
// Downloads Fortnite server-side tournament replays
// from Epic's CDN using a match ID

import { getAccessTokenForUser } from './epic_token_manager.mjs';

const REPLAY_BASE_URL = 'https://fngw-mcp-gc-livefn.ol.epicgames.com';

export async function getReplayManifest(matchId, accessToken) {
  // Fetch the replay manifest — lists all chunks
  // with pre-signed download URLs (expire in 15 min)
  const url = `${REPLAY_BASE_URL}/fortnite/api/game/v2/replays/${matchId}`;

  const res = await fetch(url, {
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'User-Agent': 'Fortnite/++Fortnite+Release-30.00 Windows/10'
    }
  });

  if (res.status === 404) {
    const error = new Error('REPLAY_NOT_FOUND');
    error.status = 404;
    throw error;
  }

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Manifest fetch failed: ${res.status} ${err}`);
  }

  return res.json();
}

export async function downloadChunk(downloadUrl) {
  // Download a single chunk from Epic's CDN
  // URLs are pre-signed S3 links that expire in 15 minutes
  const res = await fetch(downloadUrl);
  if (!res.ok) {
    throw new Error(`Chunk download failed: ${res.status}`);
  }
  return Buffer.from(await res.arrayBuffer());
}

export async function downloadFullReplay(matchId, accessToken, options = {}) {
  const {
    maxDataChunks = 1000,
    maxEventChunks = 1000,
    maxCheckpointChunks = 10,
    onProgress = null
  } = options;

  console.log(`[ReplayDownloader] Fetching manifest for match: ${matchId}`);
  const manifest = await getReplayManifest(matchId, accessToken);

  if (manifest.bIsLive) {
    const error = new Error('MATCH_STILL_LIVE');
    error.status = 400;
    throw error;
  }

  const totalChunks = 1 +
    Math.min(manifest.DataChunks?.length || 0, maxDataChunks) +
    Math.min(manifest.Events?.length || 0, maxEventChunks) +
    Math.min(manifest.Checkpoints?.length || 0, maxCheckpointChunks);

  let downloaded = 0;

  function progress(type) {
    downloaded++;
    if (onProgress) {
      onProgress({ downloaded, total: totalChunks, type });
    }
  }

  // Download header chunk
  console.log(`[ReplayDownloader] Downloading header chunk`);
  const headerBuffer = await downloadChunk(manifest.DownloadLink);
  progress('header');

  // Download data chunks (the actual match data)
  const dataChunks = (manifest.DataChunks || []).slice(0, maxDataChunks);
  console.log(`[ReplayDownloader] Downloading ${dataChunks.length} data chunks`);

  const dataBuffers = await downloadChunksParallel(
    dataChunks.map(c => c.DownloadLink),
    progress,
    'data',
    10 // max concurrent downloads
  );

  // Download event chunks (kill feed, player events)
  const eventChunks = (manifest.Events || []).slice(0, maxEventChunks);
  console.log(`[ReplayDownloader] Downloading ${eventChunks.length} event chunks`);

  const eventBuffers = await downloadChunksParallel(
    eventChunks.map(c => c.DownloadLink),
    progress,
    'event',
    10
  );

  // Download checkpoint chunks (world state snapshots)
  const checkpointChunks = (manifest.Checkpoints || []).slice(0, maxCheckpointChunks);
  console.log(`[ReplayDownloader] Downloading ${checkpointChunks.length} checkpoint chunks`);

  const checkpointBuffers = await downloadChunksParallel(
    checkpointChunks.map(c => c.DownloadLink),
    progress,
    'checkpoint',
    5
  );

  // Assemble the complete replay buffer
  // Same binary format as a local .replay file
  // so our existing core_parser.mjs can parse it directly
  const totalSize = headerBuffer.length +
    dataBuffers.reduce((s, b) => s + b.length, 0) +
    eventBuffers.reduce((s, b) => s + b.length, 0) +
    checkpointBuffers.reduce((s, b) => s + b.length, 0);

  const assembled = Buffer.concat([
    headerBuffer,
    ...dataBuffers,
    ...eventBuffers,
    ...checkpointBuffers
  ]);

  console.log(`[ReplayDownloader] Complete — ${(totalSize / 1024 / 1024).toFixed(1)}MB`);

  return {
    buffer: assembled,
    manifest: {
      matchId,
      replayName: manifest.ReplayName,
      lengthInMs: manifest.LengthInMS,
      networkVersion: manifest.NetworkVersion,
      timestamp: manifest.Timestamp,
      isCompressed: manifest.bCompressed,
      totalSizeBytes: totalSize,
      chunkCounts: {
        data: dataChunks.length,
        events: eventChunks.length,
        checkpoints: checkpointChunks.length
      }
    }
  };
}

async function downloadChunksParallel(urls, progressFn, type, concurrency) {
  const results = new Array(urls.length);
  const queue = urls.map((url, i) => ({ url, i }));
  const workers = [];

  async function worker() {
    while (queue.length > 0) {
      const item = queue.shift();
      if (!item) break;
      const { url, i } = item;
      try {
        results[i] = await downloadChunk(url);
        progressFn(type);
      } catch (err) {
        console.error(`[ReplayDownloader] Error downloading ${type} chunk ${i}:`, err.message);
        throw err;
      }
    }
  }

  for (let i = 0; i < Math.min(concurrency, urls.length); i++) {
    workers.push(worker());
  }

  await Promise.all(workers);
  return results;
}
