import React, { useEffect, useState } from "react";
import { LocalStorage } from "@raycast/api";

const key = "URL_LIST";

type URLData = { urlString: string; id: number };
type URLList = URLData[];

export const useListData = () => {
  const [list, setList] = useState<URLList>([]);
  useEffect(() => {
    async function readList() {
      const list = await LocalStorage.getItem(key);
      if (typeof list === "string") {
        setList(JSON.parse(list));
      }
    }
    readList();
  }, []);

  const prependList = (data: URLData) => {
    setList((list) => {
      const res = [data].concat(list);
      LocalStorage.setItem(key, JSON.stringify(res));
      return res;
    });
  };

  const editURLInList = (data: URLData) => {
    setList((list) => {
      const res = list.map((item) => (item.id == data.id ? data : item));
      LocalStorage.setItem(key, JSON.stringify(res));
      return res;
    });
  };

  const deleteItemInList = (deletedURLID: number) => {
    setList((list) => {
      const res = list.filter((item) => item.id !== deletedURLID);
      LocalStorage.setItem(key, JSON.stringify(res));
      return res;
    });
  };

  return { list, prependList, editURLInList, deleteList: deleteItemInList };
};
