import { useEffect, useMemo, useState } from "react";
import {
  Detail,
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
} from "@raycast/api";
import { URLList } from "./url-list";

export default function Command() {
  return <URLList />;
}
