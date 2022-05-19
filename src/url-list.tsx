import React, { useEffect, useState } from "react";
import { List, Action, ActionPanel, Clipboard } from "@raycast/api";
import { useListData } from "./use-list-data";
import { URLItem } from "./detail";

const EmptyCase = ({ setContentInClipboard }: { setContentInClipboard: (value: string) => void }) => (
  <List.EmptyView
    actions={
      <ActionPanel>
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
    title="No URLs were detected"
  />
);

const newID = () => Date.now();

export const URLList = () => {
  const { list, prependList, deleteList, editURLInList } = useListData();
  const [contentInClipboard, setContentInClipboard] = useState("");

  const updateListURL = (id: number) => (newValue: string) => {
    editURLInList({
      id,
      urlString: newValue,
    });
  };

  return (
    <List navigationTitle="Your urls" enableFiltering isShowingDetail={list.length > 0}>
      {list.length ? (
        list.map((item) => (
          <URLItem
            appendURL={(value) => {
              prependList({
                id: newID(),
                urlString: value,
              });
            }}
            onDelete={() => deleteList(item.id)}
            urlString={item.urlString}
            key={item.id}
            setURLString={updateListURL(item.id)}
          />
        ))
      ) : (
        <EmptyCase
          setContentInClipboard={(value) => {
            setContentInClipboard(value);
            prependList({
              id: newID(),
              urlString: value,
            });
          }}
        />
      )}
    </List>
  );
};
