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
import { authHeader, verifyResponse } from "./api_utils";
import { useContext, useEffect, useState } from "react";
import { PasswordContext } from "./PasswordContext";
import { CanonicalizeUnknownWord } from "./NewCanonicalization";

async function canonicalize(word: string): Promise<string> {
  const response = verifyResponse(await fetch(`/api/canonicalize/${word}`));
  return await response.json();
}

async function discardSuggestion(id: number, password: string): Promise<void> {
  verifyResponse(
    await fetch("/api/suggest/translations", {
      method: "DELETE",
      headers: { ...authHeader(password), "Content-Type": "application/json" },
      body: JSON.stringify(id),
    }),
  );
}

async function acceptSuggestion(
  english: string,
  hebrew: string,
  suggestor: string,
  password: string,
): Promise<void> {
  const translation: Translation = { english: english, hebrew: hebrew };
  const translation_addition: TranslationAddition = {
    translation: translation,
    suggestor: suggestor,
  };
  verifyResponse(
    await fetch("/api/translations", {
      method: "POST",
      headers: { ...authHeader(password), "Content-Type": "application/json" },
      body: JSON.stringify(translation_addition),
    }),
  );
}

function AcceptTranslationForm({
  suggestion,
  onSubmit,
}: {
  suggestion: SuggestedTranslation;
  onSubmit: () => Promise<void>;
}) {
  const password = useContext(PasswordContext);
  const [hebrew, setHebrew] = useState<string>(suggestion.translation.hebrew);
  const [canonicalEnglish, setCanonicalEnglish] = useState<string>("");

  useEffect(() => {
    canonicalize(suggestion.translation.english).then((r) =>
      setCanonicalEnglish(r),
    );
  }, [suggestion]);

  async function handleSubmit(e: React.SyntheticEvent) {
    e.preventDefault();
    await acceptSuggestion(
      suggestion.translation.english,
      hebrew,
      suggestion.suggestor,
      password,
    );
    await discardSuggestion(suggestion.translation.id, password);
    await onSubmit();
  }

  return (
    <Form noValidate onSubmit={handleSubmit}>
      <Form.Group controlId="formEnglish">
        <Form.Label>{canonicalEnglish}</Form.Label>
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
  suggestion,
  triggerRefresh,
}: {
  suggestion: SuggestedTranslation;
  triggerRefresh: () => Promise<void>;
}) {
  const password = useContext(PasswordContext);
  const [showForm, setShowForm] = useState<boolean>(false);

  async function handleDiscardClick() {
    await discardSuggestion(suggestion.translation.id, password);
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
                      <th>מחדש</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td>
                        <CanonicalizeUnknownWord
                          word={suggestion.translation.english}
                        />
                      </td>
                      <td>{suggestion.translation.hebrew}</td>
                      <td>{suggestion.suggestor}</td>
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
  suggestions,
  triggerRefresh,
}: {
  suggestions: SuggestedTranslation[];
  triggerRefresh: () => Promise<void>;
}) {
  return (
    <>
      {suggestions.length === 0 ? (
        <p>אין הצעות לתרגומים כרגע</p>
      ) : (
        <Carousel wrap={false}>
          {suggestions.map((suggestion) => (
            <Carousel.Item key={suggestion.translation.id}>
              <TranslationSuggestionCard
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
