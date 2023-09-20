import { App } from "components/App.tsx";
import { render } from "preact";
import "./main.css";

render(<App />, document.getElementById("app") as HTMLElement);
