# Infobot

Discord bot for checking Free Fire player information by UID.

## Features
- `/info uid:<UID>` Discord slash command
- Small HTTP endpoint: `/api/info?uid=<UID>`
- Health endpoint: `/`
- Environment variables for the Discord token and upstream API
- Node.js 18+

## Setup

1. Upload these files to your GitHub repository.
2. Create a Discord application and bot in the Discord Developer Portal.
3. Put the bot token and application/client ID in `.env`.
4. Install dependencies:
   `npm install`
5. Start:
   `npm start`

### Environment variables

Copy `.env.example` to `.env`:

- `DISCORD_TOKEN` = Discord bot token
- `CLIENT_ID` = Discord application ID
- `PORT` = hosting port (usually provided by the host)
- `FREE_FIRE_API` = upstream Free Fire info endpoint

The default upstream endpoint is an unofficial third-party API. Its availability and response format can change, so the bot keeps the upstream URL configurable.

## Discord invite permissions

Scopes:
- `bot`
- `applications.commands`

Bot permissions:
- Send Messages
- Embed Links

## API example

`GET /api/info?uid=305000592`

The API validates the UID before forwarding the request.

## Important

Never upload `.env` or your Discord bot token to GitHub. Keep secrets in your hosting provider's environment-variable settings.
