import { useState } from "react";
import "bootstrap/dist/css/bootstrap.min.css";
import { Button, Form, Modal } from "react-bootstrap";

export default function Admin() {
  const [show, setShow] = useState<boolean>(true);
  const [password, setPassword] = useState<string>("");

  async function handleClick() {
    const response = await fetch("http://localhost:3000/auth", {
      method: "GET",
      headers: { Authorization: `Basic ${btoa("admin:" + password)}` },
    });
    const res: boolean = await response.json();
    setShow(!res);
    setPassword("");
  }

  return (
    <div style={{ direction: "rtl", textAlign: "right" }}>
      <p>אני הוא המנהל</p>
      <Modal show={show} onHide={() => setShow(false)} keyboard={false}>
        <Modal.Header>
          <Modal.Title>האם אתה מנהל?</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form.Control
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
