# Notice Board

A simple two-panel notice board:

- Admin panel publishes a notice with a title, text, and optional image link.
- Viewer panel shows the latest notices from MongoDB.
- Plain HTML, CSS, and browser JavaScript on the front end.
- Express and MongoDB on the back end for Render deployment.

## Local Setup

1. Install Node.js 20 or newer.
2. Copy `.env.example` to `.env`.
3. Add your MongoDB connection string and a strong `ADMIN_PASSWORD`.
4. Install dependencies:

```bash
npm install
```

5. Start the app:

```bash
npm run dev
```

Open `http://localhost:3000`.

## Environment Variables

| Name | Required | Purpose |
| --- | --- | --- |
| `MONGODB_URI` | Yes in production | MongoDB Atlas or MongoDB server connection string |
| `MONGODB_DB` | No | Database name, defaults to `notice_board` |
| `ADMIN_PASSWORD` | Yes | Password required to publish notices |
| `PORT` | No | Local server port, defaults to `3000` |

## Deploy To Render

1. Push this folder to a GitHub repository.
2. Create a MongoDB Atlas database and copy the application connection string.
3. Add Render outbound IPs to MongoDB Atlas Network Access, or use your preferred Atlas network rule.
4. In Render, create a Blueprint from this repository, or create a Node web service manually.
5. Set these Render environment variables:

```text
MONGODB_URI=your MongoDB Atlas connection string
MONGODB_DB=notice_board
ADMIN_PASSWORD=your strong admin password
```

Render can use `render.yaml` for the build command and start command.

## Helpful Docs

- [Render Blueprint YAML reference](https://render.com/docs/blueprint-spec)
- [Render guide for MongoDB Atlas](https://render.com/docs/connect-to-mongodb-atlas)
- [MongoDB connection string reference](https://www.mongodb.com/docs/manual/reference/connection-string/)
