import { useEffect, useState } from "react";
import "bootstrap/dist/css/bootstrap.min.css";
import { Tab, Tabs } from "react-bootstrap";
import "./types.d.ts";
import MistakesPane from "./MistakesPane.tsx";

function TranslationsPane({ translations }: { translations: Translation[] }) {}

async function getAllMistakes(): Promise<PersonMistakes[]> {
  const response = await fetch("http://localhost:3000/mistakes");
  return await response.json();
}

export default function App() {
  const [mistakes, setMistakes] = useState<PersonMistakes[]>([]);

  useEffect(() => {
    getAllMistakes().then((res) => setMistakes(res));
  }, []);

  return (
    <div>
      <Tabs defaultActiveKey="mistakes" id="test-tabs">
        <Tab eventKey="mistakes" title="Mistakes">
          <MistakesPane mistakes={mistakes} />
        </Tab>
        <Tab eventKey="test" title="Test">
          Test
        </Tab>
      </Tabs>
    </div>
  );
}
