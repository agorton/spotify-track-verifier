# Spotify Playlist Validator

## Purpose
This app is designed to validate that all songs from a designated "master" Spotify playlist are present in at least one playlist from a collection of playlists. It uses the Spotify Web API to fetch tracks and perform the comparison.

---

## Prerequisites
1. Node.js installed on your machine.
2. A Spotify Developer account.

---

## Setup Instructions

### 1. Clone the Repository
Clone this repository to your local machine:
```bash
git clone <repository-url>
cd <repository-folder>
```

### 2. Install Dependencies
Install the required dependencies:
```bash
npm install
```

### 3. Create a Spotify Developer App
1. Go to the [Spotify Developer Dashboard](https://developer.spotify.com/dashboard/).
2. Create a new app to get your **Client ID** and **Client Secret**.

### 4. Create `config.js`
Create a file named `config.js` in the root directory with the following content:

```javascript
module.exports = {
    clientId: 'your_client_id',
    clientSecret: 'your_client_secret',
    redirectUri: 'http://localhost:8888/callback'
};
```
Replace `your_client_id` and `your_client_secret` with the values from your Spotify Developer app.

### 5. Add `config.js` to `.gitignore`
To prevent sensitive keys from being pushed to version control, ensure `config.js` is excluded by adding it to your `.gitignore` file:

```
config.js
```

---

## Usage

### 1. Update Playlist IDs
Edit the script to include the ID of the master playlist and the collection of playlists you want to validate. Replace the placeholders:

```javascript
const masterPlaylistId = "master_playlist_id_here";
const collectionPlaylistIds = [
    "collection_playlist_id_1",
    "collection_playlist_id_2",
    "collection_playlist_id_3"
];
```

### 2. Run the Script
Run the app using the following command:
```bash
node index.js
```

The script will authenticate with Spotify, fetch the tracks from the playlists, and log the following:
- Missing tracks from the collection.
- Number of tracks successfully placed into the collection.
- Total number of missing tracks.

---

## Notes
- Make sure the Spotify Developer App is configured with appropriate permissions for playlist access.
- This script uses the `client_credentials` authentication flow, which does not provide access to private playlists.

---

## Troubleshooting
- **Authentication Errors**: Ensure your `clientId` and `clientSecret` are correct.
- **Missing Tracks**: Verify that the master playlist and collection playlists are public or accessible.

For further assistance, refer to the [Spotify API Documentation](https://developer.spotify.com/documentation/web-api/).

