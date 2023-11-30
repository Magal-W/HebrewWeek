import { useEffect, useState } from "react";
import "bootstrap/dist/css/bootstrap.min.css";
import { Button, Form, Modal, Tab, Tabs } from "react-bootstrap";
import { authHeader, getAllParticipants } from "./api_utils";
import AdminParticipantsTab from "./AdminParticipantsTab";
import AdminTranslationTab from "./AdminTranslationsTab";
import AdminMistakesTab from "./AdminMistakesTab";
import { PasswordContext } from "./PasswordContext";

async function getAllTranslationSuggestions(): Promise<
  TranslationSuggestion[]
> {
  const response = await fetch("http://localhost:3000/suggest/translations");
  return await response.json();
}

async function getAllMistakeSuggestions(): Promise<MistakeSuggestion[]> {
  const response = await fetch("http://localhost:3000/suggest/mistakes");
  return await response.json();
}

function AdminTabs({ password }: { password: string }) {
  const [participants, setParticipants] = useState<string[]>([]);
  const [translationSuggestions, setTranslationSuggestions] = useState<
    TranslationSuggestion[]
  >([]);
  const [mistakeSuggestions, setMistakeSuggestions] = useState<
    MistakeSuggestion[]
  >([]);

  useEffect(() => {
    getAllParticipants().then((res) => setParticipants(res));
    getAllTranslationSuggestions().then((res) =>
      setTranslationSuggestions(res),
    );
    getAllMistakeSuggestions().then((res) => setMistakeSuggestions(res));
  }, []);

  async function handleSelect(key: string | null): Promise<void> {
    if (key === "participants") {
      setParticipants(await getAllParticipants());
    } else if (key === "translations") {
      setTranslationSuggestions(await getAllTranslationSuggestions());
    } else if (key === "mistakes") {
      setMistakeSuggestions(await getAllMistakeSuggestions());
    }
  }

  return (
    <div style={{ direction: "rtl" }}>
      <PasswordContext.Provider value={password}>
        <Tabs defaultActiveKey="participants" onSelect={handleSelect}>
          <Tab eventKey="participants" title="משתתפים">
            <AdminParticipantsTab
              participants={participants}
              triggerRefresh={async () =>
                setParticipants(await getAllParticipants())
              }
            />
          </Tab>
          <Tab eventKey="translations" title="תרגומים">
            <AdminTranslationTab
              suggestions={translationSuggestions}
              triggerRefresh={async () =>
                setTranslationSuggestions(await getAllTranslationSuggestions())
              }
            />
          </Tab>
          <Tab eventKey="mistakes" title="שגיאות">
            <AdminMistakesTab
              suggestions={mistakeSuggestions}
              triggerRefresh={async () =>
                setMistakeSuggestions(await getAllMistakeSuggestions())
              }
            />
          </Tab>
        </Tabs>
      </PasswordContext.Provider>
    </div>
  );
}

export default function Admin() {
  const [show, setShow] = useState<boolean>(true);
  const [password, setPassword] = useState<string>("");

  async function handleClick() {
    const response = await fetch("http://localhost:3000/auth", {
      method: "GET",
      headers: authHeader(password),
    });
    const res: boolean = await response.json();
    setShow(!res);
    if (!res) {
      setPassword("");
    }
  }

  return (
    <div style={{ direction: "rtl", textAlign: "right" }}>
      <AdminTabs password={password} />
      <Modal
        style={{ direction: "rtl", textAlign: "right" }}
        show={show}
        onHide={() => setShow(false)}
        keyboard={false}
      >
        <Modal.Header>
          <Modal.Title>האם אתה מנהל?</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form.Control
            type="password"
            placeholder="סיסמה"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </Modal.Body>
        <Modal.Footer>
          <Button type="submit" onClick={handleClick}>
            שלח
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
}
