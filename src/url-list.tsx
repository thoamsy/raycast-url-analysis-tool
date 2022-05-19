import React, { useEffect, useState } from "react";
import { List, Action, ActionPanel, Clipboard, LocalStorage } from "@raycast/api";
import { useListData } from "./use-list-data";
import { URLItem, isURL } from "./detail";

const EmptyCase = ({ append }: { append: (value: string) => void }) => (
  <List.EmptyView
    actions={
      <ActionPanel>
        <Action
          title="Paste URL"
          shortcut={{ modifiers: ["cmd"], key: "v" }}
          onAction={async () => {
            const url = (await Clipboard.readText()) || "";
            if (isURL(url)) {
              append(url);
            }
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

  const [showDetail, setShowDetail] = useState(true);

  useEffect(() => {
    async function f() {
      const show = await LocalStorage.getItem("showDetail");
      setShowDetail(!!show);
    }
    f();
  }, []);
  const toggleDetail = () => {
    setShowDetail((c) => {
      const nextValue = !c;
      if (!nextValue) {
        LocalStorage.removeItem("showDetail");
      } else {
        LocalStorage.setItem("showDetail", "1");
      }
      return nextValue;
    });
  };

  const updateListURL = (id: number) => (newValue: string) => {
    editURLInList({
      id,
      urlString: newValue,
    });
  };

  return (
    <List navigationTitle="Your urls" enableFiltering isShowingDetail={list.length > 0 && showDetail}>
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
            showDetail={showDetail}
            toggleDetail={toggleDetail}
          />
        ))
      ) : (
        <EmptyCase
          append={(url) =>
            prependList({
              id: newID(),
              urlString: url,
            })
          }
        />
      )}
    </List>
  );
};
