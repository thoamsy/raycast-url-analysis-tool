import { useEffect, useMemo, useState } from "react";
import {
  Alert,
  LocalStorage,
  Clipboard,
  ActionPanel,
  Action,
  useNavigation,
  Form,
  showHUD,
  Icon,
  Toast,
  showToast,
  List,
  confirmAlert,
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
    if (!urlString.startsWith("http")) {
      return null;
    }
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

type Props = { urlString: string; setURLString: (url: string) => void };

function EditURL({ urlString, setURLString }: Props) {
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
              setURLString(url.toString());
              showHUD("URL Copied");
              pop();
            }}
          />
          <Action
            icon={Icon.XmarkCircle}
            title="Back to List.Item.Detail"
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

type OGProperty = {
  title: string;
  desc: string;
  img: string;
  favicon?: string;
};

export function URLDetail({
  isFetching,
  urlString,
  ogProperty,
}: Props & { isFetching: boolean; ogProperty: OGProperty }) {
  const { pastedURL, urlEntires } = useURL(urlString);

  return (
    <List.Item.Detail
      isLoading={isFetching}
      metadata={
        <List.Item.Detail.Metadata>
          {ogProperty.title ? <List.Item.Detail.Metadata.Label title="Meta" /> : null}
          {ogProperty.title ? <List.Item.Detail.Metadata.Label title="Title" text={ogProperty.title} /> : null}
          {ogProperty.desc ? <List.Item.Detail.Metadata.Label title="Description" text={ogProperty.desc} /> : null}

          {urlEntires.length > 0 ? (
            <>
              <List.Item.Detail.Metadata.Separator />

              <List.Item.Detail.Metadata.Label title="Category" icon={Icon.Binoculars} text="Query" />

              {urlEntires?.map((entries) => (
                <List.Item.Detail.Metadata.Label key={entries[0]} title={entries[0]} text={entries[1]} />
              ))}
            </>
          ) : null}
        </List.Item.Detail.Metadata>
      }
      markdown={pastedURL ? markdown({ url: urlString, ...ogProperty }) : "No URL found in clipboard"}
    />
  );
}

function crawleURL(url: string, onCrawler: (value: OGProperty) => void) {
  const toast = showToast({
    title: "Fetching...",
    style: Toast.Style.Animated,
  });

  return fetch(url, {
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
      const favicon = $("link[rel='icon']").attr("href");

      onCrawler({ title, desc, img, favicon });
      if (title) {
        LocalStorage.setItem(`og-property-${url}`, JSON.stringify({ title, desc, img }));
      }

      (await toast).hide();
    });
}

export function URLItem({
  urlString,
  setURLString,
  appendURL,
  onDelete,
  showDetail,
  toggleDetail,
}: Props & {
  showDetail: boolean;
  toggleDetail: () => void;
  appendURL: (value: string) => void;
  onDelete: () => void;
}) {
  const [isFetching, setIsFetching] = useState(false);

  const startCrawler = () => {
    try {
      setIsFetching(true);
      crawleURL(urlString, (value) => setOgProperty({ ...value, fromCache: false }));
    } finally {
      setIsFetching(false);
    }
  };

  const [ogProperty, setOgProperty] = useState<OGProperty & { fromCache: boolean }>({
    title: "",
    desc: "",
    img: "",
    fromCache: false,
  });

  useEffect(() => {
    async function readOGCache() {
      const property = await LocalStorage.getItem(`og-property-${urlString}`);
      if (typeof property === "string") {
        try {
          setOgProperty({ ...JSON.parse(property), fromCache: true });
        } catch {
          startCrawler();
        }
      } else {
        startCrawler();
      }
    }
    readOGCache();
  }, []);

  const { urlEntires } = useURL(urlString);

  return (
    <List.Item
      icon={Icon.Link}
      accessories={[
        {
          text: !showDetail ? ogProperty.desc : "",
        },
        {
          icon: ogProperty.favicon,
          text: ogProperty.title,
          tooltip: urlString,
        },
      ]}
      title={urlString}
      detail={
        <URLDetail ogProperty={ogProperty} isFetching={isFetching} urlString={urlString} setURLString={setURLString} />
      }
      actions={
        <ActionPanel>
          {!!urlEntires.length && (
            <Action.Push
              icon={Icon.Pencil}
              title="Go to Edit"
              target={<EditURL urlString={urlString} setURLString={setURLString} />}
              shortcut={{ modifiers: ["cmd"], key: "]" }}
            />
          )}
          <Action
            icon={Icon.TwoArrowsClockwise}
            title="Re-fetch URL"
            shortcut={{ modifiers: ["cmd"], key: "r" }}
            onAction={startCrawler}
          />
          <Action.OpenInBrowser shortcut={{ modifiers: ["cmd"], key: "o" }} url={urlString} />
          <Action.CopyToClipboard content={urlString} shortcut={{ modifiers: ["cmd"], key: "." }} />
          <Action
            title="Paste URL"
            icon={Icon.Clipboard}
            onAction={async () => {
              const value = (await Clipboard.readText()) || "";
              if (isURL(value)) {
                appendURL(value);
              }
            }}
            shortcut={{ modifiers: ["cmd"], key: "n" }}
          />
          <Action
            icon={Icon.Sidebar}
            title={showDetail ? "Hide Detail" : "Show Detail"}
            onAction={toggleDetail}
            shortcut={{ modifiers: ["cmd", "opt"], key: showDetail ? "[" : "]" }}
          />
          <Action
            icon={Icon.Trash}
            title="Delete the URL"
            shortcut={{ key: "delete", modifiers: ["cmd", "opt"] }}
            onAction={() => {
              confirmAlert({
                title: "Are you sure?",
                icon: Icon.Trash,
                primaryAction: {
                  title: "Delete it",
                  onAction: onDelete,
                  style: Alert.ActionStyle.Destructive,
                },
              });
            }}
          />
        </ActionPanel>
      }
    />
  );
}

function markdown({ img }: { url: string; title: string; desc?: string; img?: string }) {
  return `
${img ? `![](${img})` : ""}
  `;
}

export function isURL(url?: string) {
  if (!url?.startsWith("http")) {
    return false;
  }
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}
