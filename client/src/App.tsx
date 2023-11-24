import { useEffect, useState } from "react";
import "bootstrap/dist/css/bootstrap.min.css";
import { Tab, Tabs } from "react-bootstrap";
import "./types.d.ts";
import MistakesPane from "./MistakesPane.tsx";

// async function getAllMistakes(): Promise<PersonMistakes[]> {
//   const response = await fetch("http://localhost:3000/mistakes");
//   return await response.json();
// }

async function getAllParticipants(): Promise<string[]> {
  const response = await fetch("http://localhost:3000/participants");
  return await response.json();
}

export default function App() {
  const [names, setNames] = useState<string[]>([]);

  useEffect(() => {
    getAllParticipants().then((res) => setNames(res));
  }, []);

  return (
    <div style={{ display: "flex", flexDirection: "column" }}>
      <Tabs defaultActiveKey="names" id="test-tabs">
        <Tab eventKey="names" title="Mistakes">
          <MistakesPane names={names} />
        </Tab>
        <Tab eventKey="test" title="Test">
          Test
        </Tab>
      </Tabs>
      <footer style={{ marginBottom: "auto" }}>
        <hr></hr>
        <p>The official Hebrew Week™ portal by Magal Weinberger</p>
      </footer>
    </div>
  );
}
