import {
  Button,
  Card,
  Carousel,
  Col,
  Container,
  Row,
  Table,
} from "react-bootstrap";
import { authHeader, verifyResponse } from "./api_utils";
import { useContext } from "react";
import { PasswordContext } from "./PasswordContext";
import { CanonicalizeUnknownWord } from "./NewCanonicalization";

async function discardSuggestion(id: number, password: string): Promise<void> {
  verifyResponse(
    await fetch("http://localhost:3000/suggest/mistakes", {
      method: "DELETE",
      headers: { ...authHeader(password), "Content-Type": "application/json" },
      body: JSON.stringify(id),
    }),
  );
}

async function acceptSuggestion(
  suggestion: MistakeSuggestion,
  password: string,
): Promise<void> {
  const translation: MistakeReport = {
    name: suggestion.name,
    mistake: suggestion.mistake,
  };
  verifyResponse(
    await fetch("http://localhost:3000/mistakes", {
      method: "POST",
      headers: { ...authHeader(password), "Content-Type": "application/json" },
      body: JSON.stringify(translation),
    }),
  );
}

function MistakeSuggestionCard({
  suggestion,
  triggerRefresh,
}: {
  suggestion: MistakeSuggestion;
  triggerRefresh: () => Promise<void>;
}) {
  const password = useContext(PasswordContext);

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
                      <th>הקשר</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td>{suggestion.name}</td>
                      <td>
                        <CanonicalizeUnknownWord word={suggestion.mistake} />
                      </td>
                      <td>{suggestion.context}</td>
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
  suggestions,
  triggerRefresh,
}: {
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
