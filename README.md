# thirdy • radio (Vercel)

Six-digit room codes for a push-to-talk WebRTC radio. The frontend is plain HTML/CSS/JavaScript. A Vercel serverless function handles signaling; Upstash Redis stores temporary offers/answers. No always-running Node server or WebSocket server is needed.

## Deploy

1. Upload this folder to a GitHub repository.
2. Import the repository into Vercel.
3. Create a Redis database at Upstash (the Vercel Marketplace integration also works).
4. In Vercel Project → Settings → Environment Variables, add:
   - `UPSTASH_REDIS_REST_URL`
   - `UPSTASH_REDIS_REST_TOKEN`
   Use the values from your Upstash database. Redeploy after adding them.
5. Deploy. Open the HTTPS Vercel URL on both devices and allow microphone access.

## Use

1. Both users select the same radio channel.
2. User A chooses **Create a room** and taps **Create room**.
3. Share the six-digit code with User B.
4. User B chooses **Join a room**, enters the code, and taps **Join room**.
5. When connected, hold **Hold to talk** to speak; release to mute.

Rooms expire after 30 minutes. This prototype uses Google's public STUN server. Some restrictive networks require a TURN service; STUN alone cannot guarantee every network can connect.

## Notes

- The six-digit code is a room locator, not a password. Do not use it for sensitive conversations.
- This demo permits one joiner per room and does not include user accounts, moderation, or rate limiting. Add abuse protection before making it public.
- Signaling records are stored in Upstash Redis. Audio is sent peer-to-peer by WebRTC when the network allows it; the Vercel function does not relay audio.
- This uses Vercel Functions rather than a persistent WebSocket server, so it is compatible with Vercel's serverless deployment model.
- To test locally, install Vercel CLI, run `npm install`, configure the Upstash environment variables, then run `npx vercel dev`.
