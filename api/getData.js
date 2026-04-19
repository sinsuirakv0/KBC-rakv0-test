import { getJWT } from "../js/jwt.js";

export default async function handler(req, res) {
  try {
    const type = req.query.type || "gatya";
    const locale = req.query.locale || "ja";
    const urlOnly = req.query.urlOnly === "1";

    const jwt = await getJWT(locale);

    const url = `https://nyanko-events.ponosgames.com/battlecats${locale}_production/${type}.tsv?jwt=${jwt}`;

    if (urlOnly) return res.status(200).send(url);

    const response = await fetch(url);
    const text = await response.text();

    res.status(200).send(text);

  } catch (err) {
    res.status(500).send("Error: " + err.message);
  }
}
