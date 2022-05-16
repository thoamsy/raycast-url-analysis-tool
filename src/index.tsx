import { useEffect, useMemo, useState } from "react";
import {
  Detail,
  Clipboard,
  ActionPanel,
  Action,
  useNavigation,
  Form,
  showHUD,
  Icon,
  Toast,
  showToast,
} from "@raycast/api";
import fetch from "node-fetch";
import cheerio from "cheerio";

type Entires = [string, string][];

const getURLEntries = (pastedURL: URL) => {
  if (!pastedURL) {
    return [];
  }
  // @ts-ignore
  return Array.from(pastedURL.searchParams.entries()) as Entires;
};

const useURL = (urlString: string) => {
  const pastedURL = useMemo(() => {
    try {
      return new URL(urlString);
    } catch {
      return null;
    }
  }, [urlString]);

  const urlEntires = useMemo(() => (pastedURL ? getURLEntries(pastedURL) : []), [pastedURL]);

  return {
    pastedURL,
    urlEntires,
  };
};

function EditURL({ urlString, setURL }: { urlString: string; setURL: (url: string) => void }) {
  const { pop } = useNavigation();

  const { urlEntires } = useURL(urlString);

  return (
    <Form
      actions={
        <ActionPanel>
          <Action.SubmitForm
            title="Submit and Copy Link"
            icon={Icon.Link}
            onSubmit={(values) => {
              const url = new URL(urlString);
              Object.entries(values).forEach(([key, value]) => {
                url.searchParams.set(key, value);
              });
              Clipboard.copy(url.toString());
              setURL(url.toString());
              showHUD("URL Copied");
              pop();
            }}
          />
          <Action
            icon={Icon.XmarkCircle}
            title="Back to Detail"
            onAction={pop}
            shortcut={{ modifiers: ["cmd"], key: "[" }}
          />
        </ActionPanel>
      }
    >
      {urlEntires.map((entry) => (
        <Form.TextField defaultValue={entry[1]} key={entry[0]} title={entry[0]} id={entry[0]} />
      ))}
    </Form>
  );
}

export default function Command() {
  const [contentInClipboard, setContentInClipboard] = useState("");

  useEffect(() => {
    async function getContent() {
      const content = (await Clipboard.readText()) || "";
      setContentInClipboard(content);
    }
    getContent();
  }, []);

  const { pastedURL, urlEntires } = useURL(contentInClipboard);

  const [ogProperty, setOgProperty] = useState({
    title: "",
    desc: "",
    img: "",
  });

  useEffect(() => {
    if (pastedURL) {
      const toast = showToast({
        title: "Fetching...",
        style: Toast.Style.Animated,
      });

      fetch(pastedURL.toString(), {
        headers: {
          "User-Agent": "facebookexternalhit/1.1",
        },
      })
        .then((url) => url.text())
        .then(async (html) => {
          const $ = cheerio.load(html);
          const title = $("meta[property='og:title']").attr("content") || "";
          const desc = $("meta[property='og:description']").attr("content") || "";
          const img = $("meta[property='og:image']").attr("content") || "";

          console.log(title, desc, img);
          setOgProperty({
            title,
            desc,
            img,
          });

          (await toast).hide();
        });
    }
  }, [pastedURL]);

  return (
    <Detail
      actions={
        <ActionPanel>
          {pastedURL ? (
            <Action.Push
              icon={Icon.Pencil}
              title="Go to Edit"
              target={<EditURL urlString={contentInClipboard} setURL={setContentInClipboard} />}
              shortcut={{ modifiers: ["cmd"], key: "]" }}
            />
          ) : null}
          <Action
            title="Paste URL"
            shortcut={{ modifiers: ["cmd"], key: "v" }}
            onAction={async () => {
              const url = await Clipboard.readText();
              setContentInClipboard(url || "");
            }}
          />
        </ActionPanel>
      }
      metadata={
        urlEntires ? (
          <Detail.Metadata>
            {urlEntires?.map((entries) => (
              <Detail.Metadata.Label key={entries[0]} title={entries[0]} text={entries[1]} />
            ))}
          </Detail.Metadata>
        ) : null
      }
      markdown={pastedURL ? markdown({ url: contentInClipboard, ...ogProperty }) : "No URL found in clipboard"}
    />
  );
}

function markdown({ url, title, desc, img }: { url: string; title: string; desc?: string; img?: string }) {
  return `
Your **URL** is *[${url.slice(0, 50)}](${url})*
Fetch Result:

---
${img ? `![](${img})` : ""}
### ${title}
${desc}
  `;
}
