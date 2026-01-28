# Pastebin Lite

A minimal Pastebin-like service that allows users to create text pastes and share them via a URL.
Supports time-based expiry (TTL) and view-count limits.
## Run Locally

```bash
npm install
npm run dev

```
### Persistence Layer

Redis (Upstash) is used as the persistence layer to ensure data survives across requests
in serverless environments.

### Design Decisions

- Redis hashes are used for atomic view-count updates

- TTL and view-limit constraints are enforced strictly

- Deterministic time handling is supported via TEST_MODE=1

- Paste content is safely rendered to prevent script execution

## API Endpoints

#### Create Paste
`POST /api/pastes`

**Request Body**
```json
{
  "content": "Hello Pastebin",
  "ttl_seconds": 60,
  "max_views": 3
}
```

#### Get Paste (JSON)

`GET /api/pastes/:id`

#### View Paste (HTML)

`GET /p/:id`

```md
## Notes

- Pastes are deleted automatically after TTL expiry
- Pastes become inaccessible once max view count is reached
- Redis TTL is used to enforce automatic expiration