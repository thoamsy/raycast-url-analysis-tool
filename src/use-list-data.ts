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

  const appendList = (data: URLData) => {
    setList((list) => {
      const res = list.concat(data);
      LocalStorage.setItem(key, JSON.stringify(res));
      return res;
    });
  };

  const editURLInList = (data: URLData) => {
    setList((list) => list.map((item) => (item.id == data.id ? data : item)));
  };

  return [list, appendList, editURLInList] as [URLList, (data: URLData) => void, (data: URLData) => void];
};
