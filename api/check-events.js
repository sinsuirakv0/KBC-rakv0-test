import { getJWT } from "../js/jwt.js";
import crypto from "crypto";
import { parseGatya } from "../parsers/gatya.js";
import { parseSale } from "../parsers/sale.js";
import { parseItem } from "../parsers/item.js";
import { pushToGitHub } from "../js/github.js";

export const config = {
  schedule: "*/5 * * * *" // 5分ごとに実行
};

const types = [
  { name: "gatya", parser: parseGatya },
  { name: "sale", parser: parseSale },
  { name: "item", parser: parseItem }
];

export default async function handler(req, res) {
  try {
    const jwt = await getJWT();
    const results = [];

    for (const { name, parser } of types) {
      const url = `https://nyanko-events.ponosgames.com/battlecats_production/${name}.tsv?jwt=${jwt}`;
      const response = await fetch(url);
      const text = await response.text();
      const hash = crypto.createHash("md5").update(text).digest("hex");

      // GitHub上の前回のハッシュを取得（ファイル名: hashes/${name}.md5）
      const prevHash = await getPreviousHashFromGitHub(name);

      if (hash !== prevHash) {
        const json = parser(text);
        await pushToGitHub({
          path: `data/${name}.json`,
          content: JSON.stringify(json, null, 2),
          message: `update ${name}.json`
        });
        await pushToGitHub({
          path: `hashes/${name}.md5`,
          content: hash,
          message: `update ${name}.md5`
        });
        results.push(`${name}.tsv updated`);
      } else {
        results.push(`${name}.tsv unchanged`);
      }
    }

    res.status(200).json({ status: "done", results });
  } catch (err) {
    console.error("check-events error:", err);
    res.status(500).send("Error: " + err.message);
  }
}
