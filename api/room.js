import { Redis } from "@upstash/redis";

const redis = Redis.fromEnv();
const TTL_SECONDS = 30 * 60;
const validCode = code => /^\d{6}$/.test(String(code || ""));
const json = (res, status, body) => res.status(status).setHeader("Cache-Control", "no-store").json(body);

export default async function handler(req, res) {
  try {
    if (req.method === "POST") {
      const body = req.body || {};
      if (body.action === "create") {
        if (!body.offer || !body.channel) return json(res, 400, { error: "Offer and channel are required." });
        let code, key;
        for (let i = 0; i < 8; i++) {
          code = String(Math.floor(100000 + Math.random() * 900000));
          key = `thirdy-radio:room:${code}`;
          const exists = await redis.exists(key);
          if (!exists) break;
          code = null;
        }
        if (!code) return json(res, 503, { error: "Could not allocate a room code. Please try again." });
        await redis.set(key, { offer: body.offer, answer: null, channel: String(body.channel), createdAt: Date.now() }, { ex: TTL_SECONDS, nx: true });
        return json(res, 201, { code, expiresIn: TTL_SECONDS });
      }
      if (body.action === "answer") {
        const code = String(body.code || "");
        if (!validCode(code) || !body.answer) return json(res, 400, { error: "Valid room code and answer are required." });
        const key = `thirdy-radio:room:${code}`;
        const room = await redis.get(key);
        if (!room) return json(res, 404, { error: "Room not found or expired." });
        if (room.answer) return json(res, 409, { error: "This room already has a participant." });
        room.answer = body.answer;
        await redis.set(key, room, { ex: TTL_SECONDS });
        return json(res, 200, { ok: true });
      }
      return json(res, 400, { error: "Unknown action." });
    }
    if (req.method === "GET") {
      const code = String(req.query.code || "");
      if (!validCode(code)) return json(res, 400, { error: "Enter a six-digit room code." });
      const room = await redis.get(`thirdy-radio:room:${code}`);
      if (!room) return json(res, 404, { error: "Room not found or expired." });
      return json(res, 200, { offer: room.offer, answer: room.answer, channel: room.channel, status: room.answer ? "answered" : "waiting" });
    }
    res.setHeader("Allow", "GET, POST");
    return json(res, 405, { error: "Method not allowed." });
  } catch (error) {
    console.error("radio room API error", error);
    return json(res, 500, { error: "Room service is unavailable. Check the Vercel and Upstash environment settings." });
  }
}
