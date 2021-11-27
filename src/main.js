import App from "./App.svelte";
import { get } from "idb-keyval";

get("santa-state").then(val => {
  const app = new App({
    target: document.getElementById("root"),
    props: {
      savedState: val || {}
    }
  });
});

export default app;
