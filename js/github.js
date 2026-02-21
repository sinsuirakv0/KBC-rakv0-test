const GITHUB_OWNER = "sinsuirakv0";
const GITHUB_REPO = "KBC-rakv0-test";
const GITHUB_BRANCH = "main";
const GITHUB_TOKEN = process.env.GITHUB_TOKEN;

const apiBase = `https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/contents`;

export async function getGitHubFile(path) {
  const url = `${apiBase}/${path}`;
  const res = await fetch(url, {
    headers: { Authorization: `token ${GITHUB_TOKEN}` }
  });

  if (!res.ok) return null;

  const json = await res.json();
  const content = Buffer.from(json.content, "base64").toString("utf-8");
  return { content, sha: json.sha };
}

export async function updateGitHubFile({ path, content, message }) {
  const url = `${apiBase}/${path}`;

  // 既存ファイルのSHAを取得（なければ新規作成）
  let sha = undefined;
  const res = await fetch(url, {
    headers: { Authorization: `token ${GITHUB_TOKEN}` }
  });

  if (res.ok) {
    const json = await res.json();
    sha = json.sha;
  }

  const payload = {
    message,
    content: Buffer.from(content).toString("base64"),
    branch: GITHUB_BRANCH
  };
  if (sha) payload.sha = sha;

  const updateRes = await fetch(url, {
    method: "PUT",
    headers: {
      Authorization: `token ${GITHUB_TOKEN}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify(payload)
  });

  if (!updateRes.ok) {
    const error = await updateRes.text();
    throw new Error(`GitHub push failed: ${error}`);
  }
}

export async function deleteGitHubFile({ path, message }) {
  const url = `${apiBase}/${path}`;

  // まずSHAを取得
  const file = await getGitHubFile(path);
  if (!file?.sha) throw new Error(`File not found: ${path}`);

  const res = await fetch(url, {
    method: "DELETE",
    headers: {
      Authorization: `token ${GITHUB_TOKEN}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      message,
      sha: file.sha,
      branch: GITHUB_BRANCH
    })
  });

  if (!res.ok) {
    const error = await res.text();
    throw new Error(`GitHub delete failed: ${error}`);
  }
}
