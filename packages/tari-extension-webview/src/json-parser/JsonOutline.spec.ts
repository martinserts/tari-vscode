import { describe, expect, it } from "vitest";
import { JsonOutline, KnownJsonPart } from "./JsonOutline";
import { JsonDocument } from "./JsonDocument";
import path from "path";
import { readFile } from "fs/promises";
import { ACCOUNT_KNOWN_PARTS } from "./known-parts/account";

describe(JsonOutline, () => {
  it("can parse account details", async () => {
    const data = await fetchTestData("account.json");
    const outline = parseDocument("Account", data, ACCOUNT_KNOWN_PARTS);

    expect(outline.items).toStrictEqual([
      { title: "Account ID", details: undefined, offset: 4, length: 12, icon: "account" },
      { title: "Address", details: undefined, offset: 23, length: 9, icon: "briefcase" },
      { title: "Public Key", details: undefined, offset: 114, length: 12, icon: "key" },
      {
        title: 'Resource "Confidential"',
        details: "XTR",
        offset: 225,
        length: 6,
        icon: "book",
      },
      {
        title: 'Resource "Fungible"',
        details: "token-a",
        offset: 519,
        length: 6,
        icon: "book",
      },
      {
        title: 'Resource "Fungible"',
        details: "token-b",
        offset: 807,
        length: 6,
        icon: "book",
      },
      {
        title: 'Resource "Fungible"',
        details: "LP",
        offset: 1095,
        length: 6,
        icon: "book",
      },
    ]);
  });
});

function parseDocument(title: string, json: string, knownParts: KnownJsonPart[]): JsonOutline {
  const document = new JsonDocument(title, JSON.parse(json) as object);
  return new JsonOutline(document, knownParts);
}

async function fetchTestData(name: string): Promise<string> {
  const fileName = path.join(__dirname, "__test_data__", name);
  const contents = await readFile(fileName, { encoding: "utf-8" });
  return contents;
}
