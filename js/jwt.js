import crypto from "crypto";

export async function getInquiryCode() {
  const res = await fetch("https://nyanko-backups.ponosgames.com/?action=createAccount&referenceId=");
  const json = await res.json();
  return json.accountId;
}

function sign(inquiryCode, dataString) {
  const randomData = crypto.randomBytes(32).toString("hex");
  const key = inquiryCode + randomData;

  const hmac = crypto.createHmac("sha256", key);
  hmac.update(dataString);

  return randomData + hmac.digest("hex");
}

export async function getPassword(inquiryCode) {
  const data = {
    accountCode: inquiryCode,
    accountCreatedAt: Math.floor(Date.now() / 1000).toString(),
    nonce: crypto.randomBytes(16).toString("hex"),
  };

  const body = JSON.stringify(data);

  const res = await fetch("https://nyanko-auth.ponosgames.com/v1/users", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "nyanko-signature": sign(inquiryCode, body),
      "nyanko-timestamp": Math.floor(Date.now() / 1000).toString(),
      "nyanko-signature-version": "1",
      "nyanko-signature-algorithm": "HMACSHA256",
    },
    body,
  });

  const json = await res.json();
  return json.payload.password;
}

export async function getToken(inquiryCode, password, locale) {
  const data = {
    clientInfo: {
      client: { countryCode: locale, version: "999999" },
      device: { model: "ONEPLUS A3010" },
      os: { type: "android", version: "7.1.1" }
    },
    password,
    accountCode: inquiryCode,
    nonce: crypto.randomBytes(16).toString("hex"),
  };

  const body = JSON.stringify(data);

  const res = await fetch("https://nyanko-auth.ponosgames.com/v1/tokens", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "nyanko-signature": sign(inquiryCode, body),
      "nyanko-timestamp": Math.floor(Date.now() / 1000).toString(),
      "nyanko-signature-version": "1",
      "nyanko-signature-algorithm": "HMACSHA256",
    },
    body,
  });

  const json = await res.json();
  return json.payload.token;
}

export async function getJWT(locale) {
  const inquiry = await getInquiryCode();
  const password = await getPassword(inquiry);
  return await getToken(inquiry, password, locale);
}
