import { useEffect, useMemo, useState } from "react";
import { Detail, Clipboard, ActionPanel, Action, useNavigation, Form, showHUD, Icon } from "@raycast/api";

type Entires = [string, string][];

function EditURL({ origin, urlEntries }: { urlEntries: Entires; origin: string }) {
  const { pop } = useNavigation();

  return (
    <Form
      actions={
        <ActionPanel>
          <Action.SubmitForm
            title="Submit and Copy Link"
            icon={Icon.Link}
            onSubmit={(values) => {
              const url = new URL(origin);
              Object.entries(values).forEach(([key, value]) => {
                url.searchParams.set(key, value);
              });
              Clipboard.copy(url.toString());
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
      {urlEntries.map((entry) => (
        <Form.TextField defaultValue={entry[1]} key={entry[0]} title={entry[0]} id={entry[0]} />
      ))}
    </Form>
  );
}

export default function Command() {
  const [contentInClipboard, setContentInClipboard] = useState("");
  const { push } = useNavigation();

  useEffect(() => {
    async function getContent() {
      const content = (await Clipboard.readText()) || "";
      setContentInClipboard(content);
    }
    getContent();
  }, []);

  const pastedURL = useMemo(() => {
    try {
      return new URL(contentInClipboard);
    } catch {
      return null;
    }
  }, [contentInClipboard]);

  const urlEntires = useMemo(() => {
    if (!pastedURL) {
      return [];
    }
    // @ts-ignore
    return Array.from(pastedURL.searchParams.entries()) as Entires;
  }, [pastedURL]);

  console.log("111", urlEntires);

  return (
    <Detail
      actions={
        <ActionPanel>
          {pastedURL ? (
            <Action
              title="Go to Edit"
              onAction={() => {
                if (!pastedURL) {
                  return;
                }
                return push(<EditURL origin={pastedURL.origin} urlEntries={urlEntires} />);
              }}
              shortcut={{ modifiers: ["cmd"], key: "]" }}
            />
          ) : (
            <Action
              title="Paste URL"
              shortcut={{ modifiers: ["cmd"], key: "v" }}
              onAction={async () => {
                const url = await Clipboard.readText();
                setContentInClipboard(url || "");
              }}
            />
          )}
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
      markdown={pastedURL ? markdown(contentInClipboard) : "No URL found in clipboard"}
    />
  );
}

function markdown(url: string) {
  return `Your **URL** is *[${url}](${url})*`;
}
