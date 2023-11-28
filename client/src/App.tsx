import { useEffect, useState } from "react";
import "bootstrap/dist/css/bootstrap.min.css";
import { Tab, Tabs } from "react-bootstrap";
import "./types.d.ts";
import MistakesPane from "./MistakesPane.tsx";
import TranslationsPane from "./TranslationsPane.tsx";
import HomeTab from "./HomeTab.tsx";
import { getAllParticipants } from "./api_utils.ts";

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
        style={{ direction: "rtl" }}
        defaultActiveKey="home"
        id="hebrew-tabs"
        onSelect={handleSelect}
      >
        <Tab eventKey="home" title="בית">
          <HomeTab />
        </Tab>
        <Tab eventKey="mistakes" title="לוח המשתתפים">
          <MistakesPane names={names} />
        </Tab>
        <Tab eventKey="translations" title="מילון">
          <TranslationsPane />
        </Tab>
      </Tabs>
      <footer
        style={{
          direction: "rtl",
          textAlign: "right",
          marginRight: 20,
          marginBottom: "auto",
        }}
      >
        <hr></hr>
        <p>אתר שבוע העברית™ הרשמי מאת מגל ויינברגר</p>
      </footer>
    </div>
  );
}
