const SpotifyWebApi = require('spotify-web-api-node');
const fs = require('fs');
const path = require('path');
const { clientId, clientSecret, redirectUri } = require('./config');
const id3 = require('node-id3'); // Library for reading ID3 tags from audio files

const MIN_CONFIDENCE = 0.85;
/**
 * Compute a confidence score (0–1) that two song titles match.
 */
function songTitleConfidence(a, b) {
  const clean = s => s
    .toLowerCase()
    .replace(/[_\-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  const stripMix = s => clean(s)
    .replace(/\([^)]+\)/g, "")
    .replace(/\[[^\]]+\]/g, "")
    .replace(/\b(extended|edit|dub|mix|remix|version|vip|radio|club|rework)\b/g, "")
    .replace(/\s+/g, " ")
    .trim();

  const coreA = stripMix(a).split(" ");
  const coreB = stripMix(b).split(" ");

  // Word overlap score
  const overlap = coreA.filter(w => coreB.includes(w)).length;
  const maxWords = Math.max(coreA.length, coreB.length);
  const overlapScore = overlap / maxWords;

  // Word order score (penalises same words in different order)
  let orderMatches = 0;
  coreA.forEach((w, i) => {
    const j = coreB.indexOf(w);
    if (j === i) orderMatches++;
  });
  const orderScore = orderMatches / Math.max(coreA.length, coreB.length);

  // Penalty for large word count difference
  const lengthPenalty =
    Math.abs(coreA.length - coreB.length) > 2 ? 0.2 : 1;

  // Final score (no hallucinated high scores)

  const finalScore = (overlapScore * 0.65 + orderScore * 0.35) * lengthPenalty;

  // Weighted final score
  // Core match is most important, but version similarity adds a little.
  if (finalScore > MIN_CONFIDENCE) {
    console.log(`High confidence match: "${a}" vs "${b}" => ${finalScore.toFixed(2)}`);
  } else if (finalScore > 0.6) {
    console.log(`Medium confidence match: "${a}" vs "${b}" => ${finalScore.toFixed(2)}`);
  }

  return finalScore;
}

// Define Spotify API credentials
const spotifyApi = new SpotifyWebApi({
  clientId,
  clientSecret,
  redirectUri
});

// Authenticate and get access token
async function authenticate() {
  try {
    const data = await spotifyApi.clientCredentialsGrant();
    spotifyApi.setAccessToken(data.body['access_token']);
  } catch (error) {
    console.error('Error authenticating with Spotify:', error);
  }
}

// Get all tracks from a Spotify playlist
async function getPlaylistTracks(playlistId) {
  let tracks = [];
  let offset = 0;
  const limit = 100;

  try {
    while (true) {
      const response = await spotifyApi.getPlaylistTracks(playlistId, { limit, offset });
      tracks = tracks.concat(response.body.items.map(item => item.track.name));
      offset += limit;

      if (response.body.items.length < limit) break; // Exit if no more tracks
    }
  } catch (error) {
    console.error(`Error fetching playlist ${playlistId}:`, error);
  }

  return tracks;
}

async function getLocalMusicTitles(folderPath) {
  let titles = [];

  async function scanFolder(folder) {
    try {
      const files = fs.readdirSync(folder);
      for (const file of files) {
        const fullPath = path.join(folder, file);
        const stats = fs.statSync(fullPath);

        if (stats.isDirectory()) {
          await scanFolder(fullPath); // Recurse into subfolder
        } else if (path.extname(file).toLowerCase() === '.mp3' || path.extname(file).toLowerCase() === '.flac') {
          try {
            const tags = id3.read(fullPath);
            if (tags && tags.title) {
              titles.push(tags.title);
            }
          } catch (error) {
            console.error(`Error reading metadata from ${fullPath}:`, error);
          }
        }
      }
    } catch (error) {
      console.error('Error reading folder:', error);
    }
  }

  await scanFolder(folderPath);
  return titles;
}

// Compare Spotify playlists with local folder
async function comparePlaylistsToLocal(playlists, localFolderPath) {
  const localTitles = await getLocalMusicTitles(localFolderPath);
  // const localTitles = ["Both Of Us"]
  console.log('Local music titles loaded:', localTitles);

  for (const playlistId of playlists) {
    console.log(`Fetching playlist: ${playlistId}`);
    const spotifyTitles = await getPlaylistTracks(playlistId);

    console.log(`Playlist (${playlistId}) Spotify titles:`, spotifyTitles);

    // kind of gross - we have to go through every local title for each spotify title.
    const missing = spotifyTitles.filter(title =>
      localTitles.every(localTitle => songTitleConfidence(title, localTitle) < MIN_CONFIDENCE));

    console.log(`\nComparison for Playlist ${playlistId}:`);
    console.log(`${missing.length} Missing songs (not in local folder):`, missing);
  }
}

// Main function
(async function main() {
  const playlists = ['3CcEOk0qiRVFxUVCufdJmS']; // Replace with your Spotify playlist IDs
  const localFolderPath = '/Users/andrewgorton/Music/Andy Music'; // Replace with your local music folder path

  await authenticate();
  await comparePlaylistsToLocal(playlists, localFolderPath);
})();
