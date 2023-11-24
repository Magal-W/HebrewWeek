import { useEffect, useState } from "react";
import "bootstrap/dist/css/bootstrap.min.css";
import { Tab, Tabs } from "react-bootstrap";
import "./types.d.ts";
import MistakesPane from "./MistakesPane.tsx";
import TranslationsPane from "./TranslationsPane.tsx";

async function getAllParticipants(): Promise<string[]> {
  const response = await fetch("http://localhost:3000/participants");
  return await response.json();
}

export default function App() {
  const [names, setNames] = useState<string[]>([]);

  useEffect(() => {
    getAllParticipants().then((res) => setNames(res));
  }, []);

  async function handleSelect(key: string | null): Promise<void> {
    if (key === "mistakes") {
      setNames(await getAllParticipants());
    }
  }

  return (
    <div style={{ display: "flex", flexDirection: "column" }}>
      <Tabs
        defaultActiveKey="mistakes"
        id="hebrew-tabs"
        onSelect={handleSelect}
      >
        <Tab eventKey="mistakes" title="Mistakes">
          <MistakesPane names={names} />
        </Tab>
        <Tab eventKey="translations" title="Translations">
          <TranslationsPane />
        </Tab>
      </Tabs>
      <footer style={{ marginBottom: "auto" }}>
        <hr></hr>
        <p>The official Hebrew Week™ portal by Magal Weinberger</p>
      </footer>
    </div>
  );
}
