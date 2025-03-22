const SpotifyWebApi = require('spotify-web-api-node');
const fs = require('fs');
const path = require('path');
const { clientId, clientSecret, redirectUri } = require('./config');
const id3 = require('node-id3'); // Library for reading ID3 tags from audio files

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
          } else if (path.extname(file).toLowerCase() === '.mp3') {
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
    console.log('Local music titles loaded:', localTitles);
  
    for (const playlistId of playlists) {
      console.log(`Fetching playlist: ${playlistId}`);
      const spotifyTitles = await getPlaylistTracks(playlistId);
  
      console.log(`Playlist (${playlistId}) Spotify titles:`, spotifyTitles);
  
      const missing = spotifyTitles.filter(title => !localTitles.includes(title));
  
      console.log(`\nComparison for Playlist ${playlistId}:`);
      console.log(`${missing.length} Missing songs (not in local folder):`, missing);
    }
  }

// Main function
(async function main() {
  const playlists = ['1y2oBCDVFCZn1ZLqEpCyAs', '5UlPz60WfHg45Qggr38IpC', '2MakOttB1AfUPM4XsgLHha']; // Replace with your Spotify playlist IDs
  const localFolderPath = '/Users/andrewgorton/Music/Andy Music'; // Replace with your local music folder path

  await authenticate();
  await comparePlaylistsToLocal(playlists, localFolderPath);
})();
