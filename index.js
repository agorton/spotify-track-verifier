// Import Spotify Web API Node library
const SpotifyWebApi = require('spotify-web-api-node');
const { clientId, clientSecret, redirectUri } = require('./config');

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

// Fetch all tracks from a playlist
async function getPlaylistTracks(playlistId) {
    const tracks = [];
    let nextUrl = null;

    try {
        do {
            const response = await spotifyApi.getPlaylistTracks(playlistId, {
                offset: tracks.length,
                limit: 100
            });

            response.body.items.forEach(item => {
                if (item.track) {
                    tracks.push({
                        id: item.track.id,
                        name: item.track.name,
                        artist: item.track.artists[0].name
                    });
                }
            });

            nextUrl = response.body.next;
        } while (nextUrl);

    } catch (error) {
        console.error(`Error fetching tracks for playlist ${playlistId}:`, error);
    }

    return tracks;
}

// Verify that each track in the master playlist is present in at least one of the collection playlists
async function verifyMasterInCollection(masterPlaylistId, collectionPlaylistIds) {
    // Get tracks from the master playlist
    const masterTracks = await getPlaylistTracks(masterPlaylistId);
    const masterTrackIds = new Set(masterTracks.map(track => track.id));

    // Get tracks from the collection playlists
    const collectionTrackIds = new Set();
    for (const playlistId of collectionPlaylistIds) {
        const collectionTracks = await getPlaylistTracks(playlistId);
        collectionTracks.forEach(track => collectionTrackIds.add(track.id));
    }

    // Find missing tracks
    const missingTracks = [...masterTrackIds].filter(id => !collectionTrackIds.has(id));
    const placedTracks = [...masterTrackIds].filter(id => collectionTrackIds.has(id));

    if (missingTracks.length === 0) {
        console.log("All tracks from the master playlist are present in the collection.");
    } else {
        console.log("The following tracks are missing from the collection:");
        missingTracks.forEach(trackId => {
            const track = masterTracks.find(t => t.id === trackId);
            console.log(`- ${track.name} by ${track.artist}`);
        });
    }

    console.log(`${placedTracks.length} tracks from the master playlist have been placed into the collection.`);
    console.log(`${missingTracks.length} tracks are still missing from the collection.`);
}

// Replace these with your Spotify playlist IDs
const masterPlaylistId = "2BKvOE5kFkva0Ts37imjB2";
const collectionPlaylistIds = [
    "3YduQeHs2hjNPG7lN04QLM",
    "6u13L257C8IFdcOcNOkkZg",
    "7o9Mzy6zpfUWYRUZcAkEdz",
    "6QHfkWoP00mFJProcSOY25",
    "3pVcq56ibWuRvffmwDqYVf",
    "3JrmrQzCRD1iPFvAkElwzk"
];

// Main function
(async () => {
    await authenticate();
    await verifyMasterInCollection(masterPlaylistId, collectionPlaylistIds);
})();
