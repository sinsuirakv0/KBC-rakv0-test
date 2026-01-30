import { getJWT } from "../../jwt.js"; // さっき作った JWT 取得コード
import fetch from "node-fetch";

export default async function handler(req, res) {
  try {
    const type = req.query.type || "gatya";

    const jwt = await getJWT();

    const url = `https://nyanko-events.ponosgames.com/battlecats_production/${type}.tsv?jwt=${jwt}`;

    const response = await fetch(url);
    const text = await response.text();

    res.status(200).send(text);

  } catch (err) {
    console.error(err);
    res.status(500).send("エラーが発生しました");
  }
}
