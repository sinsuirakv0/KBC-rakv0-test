import { getJWT } from "../js/jwt.js";
import { parseItem } from "../parsers/item.js";

export default async function handler(req, res) {
  try {
    const jwt = await getJWT();
    const url = `https://nyanko-events.ponosgames.com/battlecats_production/item.tsv?jwt=${jwt}`;
    const response = await fetch(url);
    const text = await response.text();

    const json = parseItem(text);
    res.setHeader("Cache-Control", "s-maxage=300");
    res.status(200).json(json);
  } catch (err) {
    console.error("item error:", err);
    res.status(500).json({ error: err.message });
  }
}
