import { getJWT } from "../js/jwt.js";
import { parseGatya } from "../parsers/gatya.js";

export default async function handler(req, res) {
  try {
    const jwt = await getJWT();
    const url = `https://nyanko-events.ponosgames.com/battlecats_production/gatya.tsv?jwt=${jwt}`;
    const response = await fetch(url);
    const text = await response.text();

    const json = parseGatya(text);
    res.setHeader("Cache-Control", "s-maxage=300");
    res.status(200).json(json);
  } catch (err) {
    console.error("gatya error:", err);
    res.status(500).json({ error: err.message });
  }
}
