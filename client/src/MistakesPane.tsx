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

async function suggestMistake(report: MistakeSuggestion): Promise<void> {
  await fetch("http://localhost:3000/suggest/mistakes", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(report),
  });
}

async function getMistakes(name: string): Promise<PersonMistakes> {
  const response = await fetch(`http://localhost:3000/mistakes/${name}`);
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

  async function handleSubmit(e) {
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
    <>
      <Form noValidate onSubmit={handleSubmit}>
        <Form.Group controlId="formName">
          <Form.Label>Name</Form.Label>
          <Form.Select
            value={name}
            onChange={(e) => {
              setName(e.target.value);
            }}
          >
            {names.map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </Form.Select>
        </Form.Group>
        <Form.Group controlId="formMistake">
          <Form.Label>Mistake</Form.Label>
          <Form.Control
            type="text"
            value={mistake}
            onChange={(e) => {
              setMistake(e.target.value);
            }}
          />
        </Form.Group>
        <Form.Group controlId="formContext">
          <Form.Label>Context</Form.Label>
          <Form.Control
            type="text"
            value={context}
            onChange={(e) => {
              setContext(e.target.value);
            }}
          />
          <Form.Text>When did this mistake happen?</Form.Text>
        </Form.Group>
        <Button className="mt-3" variant="primary" type="submit">
          Submit
        </Button>
      </Form>
    </>
  );
}

function SuggestMistake({ names }: { names: string[] }) {
  const [show, setShow] = useState<boolean>(false);
  const handleClose = () => setShow(false);
  const handleShow = () => setShow(true);

  return (
    <>
      <p>
        Heard a mistake that is not here?{" "}
        <a href="#" onClick={handleShow}>
          Tell me about it
        </a>
      </p>
      <p>If you wish to join, please contact me by mail or chat</p>
      <Modal show={show} onHide={handleClose}>
        <Modal.Header closeButton>
          <Modal.Title>Report a mistake you've heard</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <SuggestMistakeForm names={names} onSubmit={handleClose} />
        </Modal.Body>
      </Modal>
    </>
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
        <Accordion.Header onClick={onSelect(name)}>{name}</Accordion.Header>
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
          <th className="text-center">Mistake</th>
          <th className="text-center">Count</th>
        </tr>
      </thead>
      <tbody>
        {personMistakes.counted_mistakes.map((mistake) => (
          <tr key={mistake.mistake}>
            <th className="text-center">{mistake.mistake}</th>
            <th className="text-center">{mistake.count}</th>
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
          <Button onClick={() => setActiveKeys(names)}>Expand All</Button>
        </Col>
        <Col md="auto">
          <Button onClick={() => setActiveKeys([])}>Collapse All</Button>
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
