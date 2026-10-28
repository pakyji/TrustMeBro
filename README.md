# TrustMeBro 🤖

A Discord bot with moderation tools, AI-powered jokes, and music played from direct audio links.

> ⚠️ **Jokes are jokes.** Fake facts, aura scores and "100% real" answers are for fun. AI answers come from third-party models and can be wrong.

## Features

| Area | Commands |
| --- | --- |
| Moderation | `/ban`, `/unban`, `/mute`, `/unmute`, `/warn add|list|clear`, `/antilink toggle|add|remove|list` |
| AI jokes | `/askbro` (Gemini), `/heybro` (OpenRouter), `/grokbro` (xAI Grok), `/qwenbro` (BazaarLink) |
| Music | `/play <song name or audio link>`, `/queue`, `/skip`, `/pause`, `/resume`, `/stop` |
| Fun | `/aura`, `/fakefact`, mention responses |
| Utility | `/help` (paged menu), `/about` |
| Announcements | `/announce channel|test|status|off` (update message with @everyone) |
| Events | Welcome DM to new members |

Warnings and anti-link settings are saved to `data/store.json`, so they survive restarts.

## Requirements

- **Node.js 22.12 or newer.** The voice library (`@discordjs/voice` 0.19) requires it, and Discord now requires its end-to-end voice encryption (DAVE). The `@snazzah/davey` package that provides DAVE is installed automatically.
- A Discord application with a bot user.
- An always-on machine or server to keep the bot running.

## Setup

### 1. Create the bot

1. Open the [Discord Developer Portal](https://discord.com/developers/applications) and create an application.
2. Under **Bot**, copy the token. Keep it secret.
3. Under **Bot > Privileged Gateway Intents**, turn on:
   - **Server Members Intent** (welcome DMs and member moderation)
   - **Message Content Intent** (anti-link and mention responses)
4. Invite the bot with the `bot` and `applications.commands` scopes. Recommended permissions:
   - Send Messages, Embed Links, Read Message History, Manage Messages (anti-link)
   - Ban Members, Moderate Members (moderation)
   - Manage Server (anti-link command)
   - Connect, Speak (music)

Global slash commands can take up to an hour to appear in every server.

### 2. Install and configure

```bash
git clone https://github.com/pakyji/TrustMeBro.git
cd TrustMeBro
npm ci            # uses package-lock.json
cp .env.example .env
# edit .env: set TOKEN, and any AI keys you want to use
npm start
```

Only `TOKEN` is required. A command whose AI key is missing replies with a short "key is missing" message instead of crashing the bot.

### Environment variables

| Variable | Required | Purpose |
| --- | --- | --- |
| `TOKEN` | yes | Discord bot token |
| `GEMINI_API_KEY` | for `/askbro` | Google Gemini key. Several keys can be comma-separated; one is picked at random per request. |
| `OPENROUTER_API_KEY` | for `/heybro` | OpenRouter key |
| `GROK_API_KEY` | for `/grokbro` | xAI key |
| `BAZAAR_API_KEY` | for `/qwenbro` | BazaarLink key |
| `GEMINI_MODEL`, `OPENROUTER_MODEL`, `GROK_MODEL`, `BAZAAR_MODEL` | no | Override the model name. Model catalogues change, so check your provider's list if a command starts failing. |
| `STORE_PATH` | no | Where to save warnings and anti-link settings. Default: `data/store.json`. |

Keep `.env` private. It is listed in `.gitignore`.

## Music

- `/play` accepts a **song or artist name** or a **direct link** to an audio file (`.mp3`, `.ogg`, `.oga`, `.opus`, `.wav`, `.flac`, `.m4a`, `.aac`).
- Song names are searched on [Audius](https://audius.co) (independent artists), then on the [Internet Archive](https://archive.org) (public-domain and Creative Commons audio). No API key is needed.
- YouTube and other streaming-site links are **not supported**. Their terms of service restrict bot downloading and streaming.
- You must be in a voice channel for `/play`, and in the same channel as the bot for the other music commands.
- The queue holds up to 50 tracks. The bot leaves after 3 minutes with an empty queue.
- Links must use http or https. The bot refuses links that point to local or private network addresses, and it checks each redirect.
- Audio is decoded with the bundled ffmpeg (`ffmpeg-static`), so no system ffmpeg is needed.

## Update announcements

When the bot starts with a new build, it can post a "TrustMeBro is live!" message with **@everyone** in a channel you choose.

1. In the server, run `/announce channel channel:#your-channel` (needs Manage Server). The bot needs **Send Messages** and **Mention Everyone** in that channel.
2. Run `/announce test` to check that the message posts correctly.
3. Update the bot and restart it. The message is sent once per new build.

What counts as a new build:

- If the bot runs from a git clone, the git commit changes after `git pull`. The message shows the new commit and its subject line.
- If you update without git, **bump `version` in package.json**. Otherwise the bot treats it as the same build.

Restarts with the same build send nothing. If a server is missing the permission, nothing is sent, and the bot tries again on the next start. `/announce off` turns it off.

## Update from Discord

You can check for updates, pull changes, and announce them directly from Discord using the `/announce update` command (requires **Administrator** permission).

| Subcommand | Description |
|------------|-------------|
| `/announce update check` | Check for updates without applying them. Shows how many commits behind and the commit messages. |
| `/announce update apply` | Pull the latest changes from GitHub and send the update announcement to all configured servers. |
| `/announce update restart` | Pull changes, announce, and restart the bot via PM2 (or shows manual restart instructions). |

**Requirements:**
- The bot must be running from a git clone (not a zip download)
- For `/announce update restart`: PM2 must be installed and managing the bot (process name `trustmebro` or use `pm2 restart all`)
- The bot needs **Administrator** permission in the server to run the command

**Example workflow:**
1. Run `/announce update check` to see if updates are available
2. Run `/announce update apply` to pull and announce (then restart manually via your process manager)
3. Or run `/announce update restart` to pull, announce, and auto-restart via PM2

## Anti-link

The default blocked list is `discord.gg`, `t.me`, `https://` and `http://`. Once anti-link is **ON**, any message containing `http://` or `https://` is removed, which blocks all web links. To allow ordinary links, remove those two entries with `/antilink remove`.

Members with **Manage Messages** are not checked.

## Commands (100 in total)

The bot has 100 top-level slash commands, the Discord maximum. Type `/help` in Discord for the paged list.

| Area | What it has |
| --- | --- |
| Moderation | `kick`, `softban`, `tempban`, `banlist`, `purge`, `slowmode`, `lock`, `unlock`, `nick`, `roleadd`, `roleremove`, `note` (staff notes), `wordfilter`, `antispam`, plus `ban`, `unban`, `mute`, `unmute`, `warn`, `antilink` |
| Server | `roleinfo`, `roles`, `createrole`, `channelinfo`, `invites`, `autorole` |
| Utility | `userinfo`, `serverinfo`, `avatar`, `ping`, `remind`, `reminders`, `poll`, `say`, `embed`, `calc`, `time`, `password`, `timestamp`, `invite`, `color`, `qr`, `base64`, `hash`, `uuid`, `countdown`, `afk`, `suggest`, `tip` |
| Fun | `8ball`, `coinflip`, `dice`, `choose`, `rps`, `dog`, `catfact`, `rate`, `ship`, `hug`, `rizz`, `joke`, `mock`, `emojify`, `reverse`, `wyr`, `compliment`, `truthordare`, `trivia`, and the `*bro` AI commands |
| Info | `weather`, `holidays`, `crypto`, `book`, `art`, `wiki`, `define`, `currency`, `person` |
| Music | `play`, `queue`, `nowplaying`, `skip`, `skipto`, `pause`, `resume`, `stop`, `shuffle`, `remove`, `clear`, `loop`, `volume` |

Notes:

- Fun text commands accept a `language` option: English, Urdu, Italian or Hindi.
- Reminders, temporary bans and the auto role run on a saved job list (`data/store.json`), so they still work after a restart.
- Commands that need no API key use public services: Open-Meteo, Wikipedia, Open Library, Art Institute of Chicago, dictionaryapi.dev, Frankfurter (ECB rates), Nager.Date, CoinPaprika, dog.ceo, catfact.ninja and QR Server.
- Moderation commands check the bot's permissions and role position first, and do not act on people above you.

## Development

```bash
npm test          # unit tests (queue, URL safety, command definitions)
npm run check     # syntax check of every .js file
```

The tests do not connect to Discord. Test voice playback in a real server before relying on it.

## Project layout

```
index.js            loader, events, slash-command registration
commands/           one file per slash command (loaded automatically, including subfolders)
events/             Discord events (welcome DM)
lib/                shared helpers: AI clients, moderation checks, music player, audio source, store
test/               node:test unit tests
data/               runtime data (git-ignored)
```

## Known limits

- Song search covers Audius and the Internet Archive only. Major commercial catalogues are not available. Direct links work for any public audio file. Music has not been tested against a live Discord voice channel.
- AI answers are generated by third-party models and are not checked for accuracy.
- The bot does not record or receive voice audio.

## Contributing

Pull requests are welcome. Run `npm test` and `npm run check` before opening one.
