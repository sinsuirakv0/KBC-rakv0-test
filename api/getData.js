import { getJWT } from "../js/jwt.js";

export default async function handler(req, res) {
  try {
    const type = req.query.type || "gatya";

    const jwt = await getJWT();

    const url = `https://nyanko-events.ponosgames.com/battlecats_production/${type}.tsv?jwt=${jwt}`;

    const response = await fetch(url);
    const text = await response.text();

    res.status(200).send(text);

  } catch (err) {
    console.error("API ERROR:", err);
    res.status(500).send("Internal Server Error: " + err.message);
  }
}
