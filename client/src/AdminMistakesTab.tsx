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
  await fetch("http://localhost:3000/suggest/mistakes", {
    method: "DELETE",
    headers: { ...authHeader(password), "Content-Type": "application/json" },
    body: JSON.stringify(id),
  });
}

async function acceptSuggestion(
  suggestion: MistakeSuggestion,
  password: string,
): Promise<void> {
  const translation: MistakeReport = {
    name: suggestion.name,
    mistake: suggestion.mistake,
  };
  await fetch("http://localhost:3000/mistakes", {
    method: "POST",
    headers: { ...authHeader(password), "Content-Type": "application/json" },
    body: JSON.stringify(translation),
  });
}

function MistakeSuggestionCard({
  password,
  suggestion,
  triggerRefresh,
}: {
  password: string;
  suggestion: MistakeSuggestion;
  triggerRefresh: () => Promise<void>;
}) {
  async function handleAcceptClick() {
    await acceptSuggestion(suggestion, password);
    await discardSuggestion(suggestion.id, password);
    await triggerRefresh();
  }

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
                      <th>משתתף</th>
                      <th>שגיאה</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td>{suggestion.name}</td>
                      <td>{suggestion.mistake}</td>
                    </tr>
                  </tbody>
                </Table>
              </Col>
            </Row>
            <Row className="mb-3 justify-content-md-center">
              <Col md="auto">
                <Button variant="success" onClick={handleAcceptClick}>
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
    </>
  );
}

export default function AdminMistakesTab({
  password,
  suggestions,
  triggerRefresh,
}: {
  password: string;
  suggestions: MistakeSuggestion[];
  triggerRefresh: () => Promise<void>;
}) {
  return (
    <>
      {suggestions.length === 0 ? (
        <p>אין דיווחים על שגיאות כרגע!</p>
      ) : (
        <Carousel interval={null} wrap={false}>
          {suggestions.map((suggestion) => (
            <Carousel.Item key={suggestion.id}>
              <MistakeSuggestionCard
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
