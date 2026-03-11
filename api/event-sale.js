import { getJWT } from "../js/jwt.js";
import { parseSale } from "../parsers/sale.js";

// JST (UTC+9) で "YY/MM/DD HH:MM:SS" を生成
function getJSTTimestamp() {
  const now = new Date(Date.now() + 9 * 60 * 60 * 1000); // UTC → JST
  const yy  = String(now.getUTCFullYear()).slice(2);
  const mon = String(now.getUTCMonth() + 1).padStart(2, '0');
  const d   = String(now.getUTCDate()).padStart(2, '0');
  const h   = String(now.getUTCHours()).padStart(2, '0');
  const min = String(now.getUTCMinutes()).padStart(2, '0');
  const sec = String(now.getUTCSeconds()).padStart(2, '0');
  return `${yy}/${mon}/${d} ${h}:${min}:${sec}`;
}

export default async function handler(req, res) {
  try {
    const jwt = await getJWT();
    const url = `https://nyanko-events.ponosgames.com/battlecats_production/sale.tsv?jwt=${jwt}`;
    const response = await fetch(url);
    const text = await response.text();

    const data = parseSale(text);
    res.setHeader("Cache-Control", "s-maxage=300");
    res.status(200).json({ updatedAt: getJSTTimestamp(), data });
  } catch (err) {
    console.error("sale error:", err);
    res.status(500).json({ error: err.message });
  }
}
