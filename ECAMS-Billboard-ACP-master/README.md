# ECAMS Billboard Admin Control Panel

This node.js site is responsible for managing the ECAMS Billboard. It is a simple web app that allows the user to upload images to the billboard.

The site has access to a DB of approved users and admins can grant access to other users.

## Installation

1. Install [Node.js](https://nodejs.org/en/download/)

2. Clone this repository

3. Install dependencies

```bash
npm install
```

4. Create a .env file in the root directory with the following variables

```bash
CLIENT_ID=your_google_client_id
CLIENT_SECRET=your_google_client_secret
OAUTH_CALLBACK_URL=your_google_oauth_callback_url
MONGO_URI=your_mongo_uri
SESSION_SECRET=your_session_secret
API_BASE_URL=your_api_base_url
```

5. Run the server

```bash
npm start
```

6. Navigate to [http://localhost:3000](http://localhost:3000)

This site is powered by adminkit [https://adminkit.io/](https://adminkit.io/)