import { getJWT } from "../js/jwt.js";

export default async function handler(req, res) {
  try {
    const type = req.query.type || "gatya";
    const urlOnly = req.query.urlOnly === "1";

    const jwt = await getJWT();
    const url = `https://nyanko-events.ponosgames.com/battlecats_production/${type}.tsv?jwt=${jwt}`;

    // URL だけ返すモード
    if (urlOnly) {
      return res.status(200).send(url);
    }

    const response = await fetch(url);
    const text = await response.text();

    res.status(200).send(text);

  } catch (err) {
    console.error("API ERROR:", err);
    res.status(500).send("Internal Server Error: " + err.message);
  }
}
