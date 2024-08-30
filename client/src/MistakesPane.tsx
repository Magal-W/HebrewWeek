import { useState } from "react";
import {
  Accordion,
  Button,
  Col,
  Container,
  Form,
  Modal,
  Row,
  Table,
} from "react-bootstrap";
import { verifyResponse } from "./api_utils";

async function suggestMistake(report: MistakeSuggestion): Promise<void> {
  verifyResponse(
    await fetch("/api/suggest/mistakes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(report),
    }),
  );
}

async function getMistakes(name: string): Promise<PersonMistakes> {
  const response = verifyResponse(
    await fetch(`/api/mistakes/${name}`),
  );
  return await response.json();
}

function SuggestMistakeForm({
  names,
  onSubmit,
}: {
  names: string[];
  onSubmit: () => void;
}) {
  const [name, setName] = useState<string>("");
  const [mistake, setMistake] = useState<string>("");
  const [context, setContext] = useState<string>("");

  async function handleSubmit(e: React.SyntheticEvent) {
    e.preventDefault();
    await suggestMistake({
      id: 0,
      name: name,
      mistake: mistake,
      context: context,
    });
    setName("");
    setMistake("");
    setContext("");
    onSubmit();
  }

  return (
    <Form noValidate onSubmit={handleSubmit}>
      <Form.Group controlId="formName" className="mb-3">
        <Form.Label>שם</Form.Label>
        <Form.Select
          value={name}
          onChange={(e) => {
            setName(e.target.value);
          }}
        >
          <option></option>
          {names.map((n) => (
            <option key={n} value={n}>
              {n}
            </option>
          ))}
        </Form.Select>
      </Form.Group>
      <Form.Group controlId="formMistake" className="mb-3">
        <Form.Label>שגיאה</Form.Label>
        <Form.Control
          type="text"
          value={mistake}
          onChange={(e) => {
            setMistake(e.target.value);
          }}
        />
      </Form.Group>
      <Form.Group controlId="formContext" className="mb-3">
        <Form.Label>הקשר</Form.Label>
        <Form.Control
          type="text"
          value={context}
          onChange={(e) => {
            setContext(e.target.value);
          }}
        />
        <Form.Text>מתי ובאיזה הקשר קרתה השגיאה?</Form.Text>
      </Form.Group>
      <div style={{ direction: "ltr", textAlign: "left" }}>
        <Button variant="primary" type="submit">
          שלח
        </Button>
      </div>
    </Form>
  );
}

function SuggestMistake({ names }: { names: string[] }) {
  const [show, setShow] = useState<boolean>(false);
  const handleClose = () => setShow(false);
  const handleShow = () => setShow(true);

  return (
    <div
      style={{
        direction: "rtl",
        textAlign: "right",
      }}
    >
      <p>
        שמעתם שגיאה שאינה מופיעה פה?{" "}
        <a href="#" onClick={handleShow}>
          דווחו לי עליה
        </a>
      </p>
      <p>
        אם אתם מעוניינים להצטרף ושמכם אינו מופיע פה, אנא פנו אליי בדוא"ל או
        בהודעה ישירה
      </p>
      <Modal
        style={{
          direction: "rtl",
          textAlign: "right",
        }}
        show={show}
        onHide={handleClose}
      >
        <Modal.Header>
          <Modal.Title>דווחו על שגיאה</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <SuggestMistakeForm names={names} onSubmit={handleClose} />
        </Modal.Body>
      </Modal>
    </div>
  );
}

function ParticipantMistakesAccordion({
  name,
  activeKeys,
  handleSelect: onSelect,
}: {
  name: string;
  activeKeys: string[];
  handleSelect: (key: string) => () => void;
}) {
  const [mistakes, setMistakes] = useState<PersonMistakes>({
    name: name,
    counted_mistakes: [],
  });

  async function handleEnter() {
    setMistakes(await getMistakes(name));
  }

  return (
    <Accordion activeKey={activeKeys}>
      <Accordion.Item eventKey={name}>
        <Accordion.Header
          onClick={onSelect(name)}
          style={{ textAlign: "right", direction: "rtl" }}
        >
          {name}
        </Accordion.Header>
        <Accordion.Body onEnter={handleEnter}>
          <PersonMistakesTable personMistakes={mistakes} />
        </Accordion.Body>
      </Accordion.Item>
    </Accordion>
  );
}

function PersonMistakesTable({
  personMistakes,
}: {
  personMistakes: PersonMistakes;
}) {
  return (
    <Table striped bordered hover size="sm">
      <thead>
        <tr>
          <th className="text-center">כמות</th>
          <th className="text-center">שגיאה</th>
        </tr>
      </thead>
      <tbody>
        {personMistakes.counted_mistakes.map((mistake) => (
          <tr key={mistake.mistake}>
            <th className="text-center">{mistake.count}</th>
            <th className="text-center">{mistake.mistake}</th>
          </tr>
        ))}
      </tbody>
    </Table>
  );
}

function ParticipantsView({ names }: { names: string[] }) {
  const [activeKeys, setActiveKeys] = useState<string[]>([]);

  function handleSelect(key: string): () => void {
    return () => {
      if (activeKeys.includes(key)) {
        setActiveKeys(activeKeys.filter((value) => value !== key));
      } else {
        setActiveKeys(activeKeys.concat([key]));
      }
    };
  }

  return (
    <>
      <Row xs={2} md={5} lg={8} className="mb-3 mt-3">
        {names.map((name) => (
          <Col key={name}>
            <ParticipantMistakesAccordion
              name={name}
              activeKeys={activeKeys}
              handleSelect={handleSelect}
            />
          </Col>
        ))}
      </Row>
      <Row className="justify-content-md-center">
        <Col md="auto">
          <Button onClick={() => setActiveKeys([])}>קפל הכול</Button>
        </Col>
        <Col md="auto">
          <Button onClick={() => setActiveKeys(names)}>הרחב הכול</Button>
        </Col>
      </Row>
    </>
  );
}

export default function MistakesPane({ names }: { names: string[] }) {
  return (
    <Container>
      <ParticipantsView names={names} />
      <Row>
        <Col>
          <SuggestMistake names={names} />
        </Col>
      </Row>
    </Container>
  );
}
