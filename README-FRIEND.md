# CrewLink Friend Docker Bundle

These steps run CrewLink locally on a Windows laptop with Docker Desktop. The app is bound to `127.0.0.1`, so it is reachable only from that laptop.

## Requirements

1. Install Docker Desktop for Windows from Docker.
2. Start Docker Desktop and wait until it says the engine is running.
3. Put these files in one folder:
   - `crewlink-friend-1.0.tar`
   - `compose.friend.yml`

## Load the Image

Open PowerShell in that folder:

```powershell
docker image load -i .\crewlink-friend-1.0.tar
docker image ls crewlink-friend
```

## Create a Local Secret

Generate a random 48-byte session secret and write it to a local `.env` file:

```powershell
$bytes = [byte[]]::new(48)
[System.Security.Cryptography.RandomNumberGenerator]::Fill($bytes)
$secret = [Convert]::ToBase64String($bytes)
"SESSION_SECRET=$secret" | Set-Content -NoNewline -Encoding utf8 .env
```

Keep `.env` private. Do not send it to anyone.

## Start CrewLink

```powershell
docker compose -f compose.friend.yml up -d
docker compose -f compose.friend.yml logs -f
```

Open:

```text
http://127.0.0.1:3000
```

The first start creates a fresh SQLite database in a Docker named volume. No demo administrator account is created automatically.

## Stop Without Deleting Data

```powershell
docker compose -f compose.friend.yml down
```

Starting again with `docker compose -f compose.friend.yml up -d` reuses the same database volume.

## Deliberately Reset All Data

Only run this when you want to permanently delete all CrewLink data on this laptop:

```powershell
docker compose -f compose.friend.yml down
docker volume rm crewlink_friend_db
```

Then start the app again to create a fresh database.
