import { useEffect, useState } from "react";
import "bootstrap/dist/css/bootstrap.min.css";
import { Button, Form, Modal, Tab, Tabs } from "react-bootstrap";
import { authHeader, getAllParticipants } from "./api_utils";
import AdminParticipantsTab from "./AdminParticipantsTab";

function AdminTabs({ password }: { password: string }) {
  const [participants, setParticipants] = useState<string[]>([]);
  const [participantsTrigger, setParticipantsTrigger] = useState<boolean>(true);

  useEffect(() => {
    getAllParticipants().then((res) => setParticipants(res));
  }, [participantsTrigger]);

  async function handleSelect(key: string | null): Promise<void> {
    if (key == "participants") {
      setParticipants(await getAllParticipants());
    }
  }

  return (
    <div style={{ direction: "rtl" }}>
      <Tabs defaultActiveKey="participants" onSelect={handleSelect}>
        <Tab eventKey="participants" title="משתתפים">
          <AdminParticipantsTab
            password={password}
            participants={participants}
            triggerRefresh={() => setParticipantsTrigger(!participantsTrigger)}
          />
        </Tab>
      </Tabs>
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
