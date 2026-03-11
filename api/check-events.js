import { getJWT } from "../js/jwt.js";
import crypto from "crypto";
import { parseGatya } from "../parsers/gatya.js";
import { parseSale } from "../parsers/sale.js";
import { parseItem } from "../parsers/item.js";
import { getGitHubFile, updateGitHubFile, deleteGitHubFile } from "../js/github.js";

export const config = {
  schedule: "*/5 * * * *"
};

const types = [
  { name: "gatya", parser: parseGatya },
  { name: "sale", parser: parseSale },
  { name: "item", parser: parseItem }
];

// JST (UTC+9) で "YY/MM/DD HH:MM:SS" を生成
function getJSTTimestamp() {
  const now = new Date(Date.now() + 9 * 60 * 60 * 1000);
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
    const forceUpdate = req.query.force === "12";
    const jwt = await getJWT();
    const results = [];

    for (const { name, parser } of types) {
      const url = `https://nyanko-events.ponosgames.com/battlecats_production/${name}.tsv?jwt=${jwt}`;
      const response = await fetch(url);
      const text = await response.text();
      const hash = crypto.createHash("md5").update(text).digest("hex");

      const prevHash = await getGitHubFile(`hashes/${name}.md5`);
      const prevHashText = prevHash?.content?.trim();

      if (hash !== prevHashText || forceUpdate) {
        const data = parser(text);

        // { updatedAt, data } 形式でラップ
        const json = {
          updatedAt: getJSTTimestamp(),
          data
        };

        if (forceUpdate) {
          await deleteGitHubFile({
            path: `data/${name}.json`,
            message: `delete ${name}.json (forced)`
          });
        }

        await updateGitHubFile({
          path: `data/${name}.json`,
          content: JSON.stringify(json, null, 2),
          message: `update ${name}.json${forceUpdate ? " (forced)" : ""}`
        });

        await updateGitHubFile({
          path: `hashes/${name}.md5`,
          content: hash,
          message: `update ${name}.md5${forceUpdate ? " (forced)" : ""}`
        });

        results.push(`${name}.tsv updated${forceUpdate ? " (forced)" : ""}`);
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
