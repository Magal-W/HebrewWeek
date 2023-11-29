import {
  Button,
  Card,
  Carousel,
  Col,
  Container,
  Form,
  Modal,
  Row,
  Table,
} from "react-bootstrap";
import { authHeader } from "./api_utils";
import { useState } from "react";

async function discardSuggestion(id: number, password: string): Promise<void> {
  await fetch("http://localhost:3000/suggest/translations", {
    method: "DELETE",
    headers: { ...authHeader(password), "Content-Type": "application/json" },
    body: JSON.stringify(id),
  });
}

async function acceptSuggestion(
  english: string,
  hebrew: string,
  password: string,
): Promise<void> {
  const translation: Translation = { english: english, hebrew: hebrew };
  await fetch("http://localhost:3000/translations", {
    method: "POST",
    headers: { ...authHeader(password), "Content-Type": "application/json" },
    body: JSON.stringify(translation),
  });
}

function AcceptTranslationForm({
  suggestion,
  password,
  onSubmit,
}: {
  suggestion: TranslationSuggestion;
  password: string;
  onSubmit: () => Promise<void>;
}) {
  const [english, setEnglish] = useState<string>(suggestion.english);
  const [hebrew, setHebrew] = useState<string>(suggestion.hebrew);

  async function handleSubmit(e) {
    e.preventDefault();
    await acceptSuggestion(suggestion.english, suggestion.hebrew, password);
    await discardSuggestion(suggestion.id, password);
    await onSubmit();
  }

  return (
    <Form noValidate onSubmit={handleSubmit}>
      <Form.Group controlId="formEnglish">
        <Form.Label>{english}</Form.Label>
      </Form.Group>
      <Form.Group controlId="formHebrew">
        <Form.Control
          type="text"
          value={hebrew}
          onChange={(e) => setHebrew(e.target.value)}
        />
      </Form.Group>
      <div style={{ direction: "ltr", textAlign: "left" }}>
        <Button className="mt-3" variant="primary" type="submit">
          קבל
        </Button>
      </div>
    </Form>
  );
}

function TranslationSuggestionCard({
  password,
  suggestion,
  triggerRefresh,
}: {
  password: string;
  suggestion: TranslationSuggestion;
  triggerRefresh: () => Promise<void>;
}) {
  const [showForm, setShowForm] = useState<boolean>(false);

  async function handleDiscardClick() {
    await discardSuggestion(suggestion.id, password);
    await triggerRefresh();
  }

  return (
    <>
      <Card>
        <Card.Body>
          <Container>
            <Row>
              <Col>
                <Table>
                  <thead>
                    <tr>
                      <th>אנגלית</th>
                      <th>עברית</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td>{suggestion.english}</td>
                      <td>{suggestion.hebrew}</td>
                    </tr>
                  </tbody>
                </Table>
              </Col>
            </Row>
            <Row className="mb-3 justify-content-md-center">
              <Col md="auto">
                <Button variant="success" onClick={() => setShowForm(true)}>
                  ✅
                </Button>
              </Col>
              <Col md="auto">
                <Button variant="danger" onClick={handleDiscardClick}>
                  ❌
                </Button>
              </Col>
            </Row>
          </Container>
        </Card.Body>
      </Card>
      <Modal
        style={{ direction: "rtl", textAlign: "right" }}
        show={showForm}
        onHide={() => setShowForm(false)}
      >
        <Modal.Header>
          <Modal.Title>הצע תרגום</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <AcceptTranslationForm
            suggestion={suggestion}
            password={password}
            onSubmit={async () => {
              setShowForm(false);
              await triggerRefresh();
            }}
          />
        </Modal.Body>
      </Modal>
    </>
  );
}

export default function AdminTranslationTab({
  password,
  suggestions,
  triggerRefresh,
}: {
  password: string;
  suggestions: TranslationSuggestion[];
  triggerRefresh: () => Promise<void>;
}) {
  return (
    <>
      {suggestions.length === 0 ? (
        <p>אין הצעות לתרגומים כרגע</p>
      ) : (
        <Carousel wrap={false}>
          {suggestions.map((suggestion) => (
            <Carousel.Item key={suggestion.id}>
              <TranslationSuggestionCard
                password={password}
                suggestion={suggestion}
                triggerRefresh={triggerRefresh}
              />
            </Carousel.Item>
          ))}
        </Carousel>
      )}
    </>
  );
}
