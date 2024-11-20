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

async function discardSuggestion(
  suggestion: DiscardMistakeSuggestion,
  password: string,
): Promise<void> {
  verifyResponse(
    await fetch("/api/suggest/mistakes", {
      method: "DELETE",
      headers: { ...authHeader(password), "Content-Type": "application/json" },
      body: JSON.stringify(suggestion),
    }),
  );
}

async function acceptSuggestion(
  suggestion: MistakeSuggestion,
  password: string,
): Promise<void> {
  const mistake: MistakeReport = {
    name: suggestion.name,
    mistake: suggestion.mistake,
  };
  verifyResponse(
    await fetch("/api/mistakes", {
      method: "POST",
      headers: { ...authHeader(password), "Content-Type": "application/json" },
      body: JSON.stringify(mistake),
    }),
  );
}

function MistakeSuggestionCard({
  suggestion,
  triggerRefresh,
}: {
  suggestion: SuggestedMistake;
  triggerRefresh: () => Promise<void>;
}) {
  const password = useContext(PasswordContext);

  async function handleAcceptClick() {
    await acceptSuggestion(suggestion.mistake, password);
    await discardSuggestion(
      { id: suggestion.mistake.id, accepted: true },
      password,
    );
    await triggerRefresh();
  }

  async function handleDiscardClick() {
    await discardSuggestion(
      { id: suggestion.mistake.id, accepted: false },
      password,
    );
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
                      <th>מדווח</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td>{suggestion.mistake.name}</td>
                      <td>
                        <CanonicalizeUnknownWord
                          word={suggestion.mistake.mistake}
                        />
                      </td>
                      <td>{suggestion.mistake.context}</td>
                      <td>{suggestion.reporter}</td>
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
  suggestions: SuggestedMistake[];
  triggerRefresh: () => Promise<void>;
}) {
  return (
    <>
      {suggestions.length === 0 ? (
        <p>אין דיווחים על שגיאות כרגע!</p>
      ) : (
        <Carousel interval={null} wrap={false}>
          {suggestions.map((suggestion) => (
            <Carousel.Item key={suggestion.mistake.id}>
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
