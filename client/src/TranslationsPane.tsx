import { useState } from "react";
import {
  Button,
  Col,
  Container,
  Form,
  ListGroup,
  Modal,
  Row,
  Stack,
  Table,
} from "react-bootstrap";
import { isKnownWord } from "./api_utils";

async function getAllTranslations(): Promise<Translation[]> {
  const response = await fetch("http://localhost:3000/translations");
  return await response.json();
}

async function translate(word: string): Promise<string[]> {
  const response = await fetch(`http://localhost:3000/translate/${word}`);
  return await response.json();
}

async function suggestTranslation(
  suggestion: TranslationSuggestion,
): Promise<void> {
  await fetch("http://localhost:3000/suggest/translations", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(suggestion),
  });
}

function UnknownWordLabel({ english }: { english: string }) {
  if (english === "") {
    return <></>;
  }

  return (
    <Row>
      <p>{`סליחה, אני לא מכיר את המילה '${english}'... נסה לחפש צורה אחרת של המילה`}</p>
    </Row>
  );
}

function TranslationList({
  english,
  translations,
}: {
  english: string;
  translations: string[];
}) {
  if (english === "") {
    return <></>;
  }

  if (translations.length === 0) {
    return (
      <Row className="mb-3">
        <p>{`נראה שאין לי כרגע תרגום טוב ל-'${english}'. אולי לך יש רעיון?`}</p>
      </Row>
    );
  }

  return (
    <Row className="mb-3">
      <ListGroup>
        <ListGroup.Item variant="primary">{`תרגומים ל-'${english}'`}</ListGroup.Item>
        {translations.map((translation) => (
          <ListGroup.Item key={translation} variant="secondary">
            {translation}
          </ListGroup.Item>
        ))}
      </ListGroup>
    </Row>
  );
}

function TranslateBar() {
  const [translationRequest, setTranslationRequest] = useState<string>("");
  const [known, setKnown] = useState<boolean>(true);
  const [english, setEnglish] = useState<string>("");
  const [translations, setTranslations] = useState<string[]>([]);

  async function handleClick(): Promise<void> {
    const isKnown = await isKnownWord(translationRequest);
    setKnown(isKnown);
    setEnglish(translationRequest);
    if (!isKnown) {
      return;
    }
    setTranslations(await translate(translationRequest));
    setTranslationRequest("");
  }

  return (
    <div style={{ textAlign: "right", direction: "rtl" }}>
      <Row className="mb-3">
        <Stack direction="horizontal" gap={3}>
          <Form.Control
            placeholder="תרגם..."
            value={translationRequest}
            onChange={(e) => {
              setTranslationRequest(e.target.value);
            }}
          />
          <Button onClick={handleClick}>תרגם</Button>
        </Stack>
      </Row>
      {known ? (
        <TranslationList english={english} translations={translations} />
      ) : (
        <UnknownWordLabel english={english} />
      )}
    </div>
  );
}

function TranslationsTable({ translations }: { translations: Translation[] }) {
  return (
    <Row className="mb-3">
      <Table>
        <thead>
          <tr>
            <th>לעז</th>
            <th>עברית</th>
          </tr>
        </thead>
        <tbody>
          {translations.map((translation) => (
            <tr key={translation.english + "%" + translation.hebrew}>
              <td>{translation.english}</td>
              <td>{translation.hebrew}</td>
            </tr>
          ))}
        </tbody>
      </Table>
    </Row>
  );
}

function TranslationsSearchBar({
  translations,
  setTranslations,
}: {
  translations: Translation[];
  setTranslations: (translations: Translation[]) => void;
}) {
  // No case and no niqqud
  const sanitize = (word: string) =>
    word
      .toLowerCase()
      .replace(/\u05BE/g, "-")
      .replace(/[\u05B0-\u05C7]/g, "");

  const filter = (term: string, word: string) => {
    return sanitize(word).includes(sanitize(term));
  };

  function handleChange(e) {
    const searchTerm: string = e.target.value;

    setTranslations(
      translations.filter(
        (translation) =>
          filter(searchTerm, translation.english) ||
          filter(searchTerm, translation.hebrew),
      ),
    );
  }

  return (
    <Form.Control type="search" placeholder="חפש" onChange={handleChange} />
  );
}

function AllTranslationsView({
  allTranslations,
  setTranslations,
  translations,
}: {
  allTranslations: Translation[];
  setTranslations: (translations: Translation[]) => void;
  translations: Translation[];
}) {
  return (
    <Stack gap={2}>
      <TranslationsSearchBar
        translations={allTranslations}
        setTranslations={setTranslations}
      />
      <hr></hr>
      <TranslationsTable translations={translations} />
    </Stack>
  );
}

function SuggestTranslationForm({ onSubmit }: { onSubmit: () => void }) {
  const [english, setEnglish] = useState<string>("");
  const [hebrew, setHebrew] = useState<string>("");

  async function handleSubmit(e) {
    e.preventDefault();
    await suggestTranslation({ id: 0, english: english, hebrew: hebrew });
    setEnglish("");
    setHebrew("");
    onSubmit();
  }

  return (
    <Form noValidate onSubmit={handleSubmit}>
      <Form.Group controlId="formEnglish">
        <Form.Control
          type="text"
          placeholder="מילה לועזית"
          value={english}
          onChange={(e) => setEnglish(e.target.value)}
        />
      </Form.Group>
      <Form.Group controlId="formHebrew">
        <Form.Control
          type="text"
          placeholder="מילה עברית"
          value={hebrew}
          onChange={(e) => setHebrew(e.target.value)}
        />
      </Form.Group>
      <div style={{ direction: "ltr", textAlign: "left" }}>
        <Button className="mt-3" variant="primary" type="submit">
          הצע
        </Button>
      </div>
    </Form>
  );
}

function TranslationModals() {
  const [translations, setTranslations] = useState<Translation[]>([]);
  const [allTranslations, setAllTranslations] = useState<Translation[]>([]);
  const [showDict, setShowDict] = useState<boolean>(false);
  const [showForm, setShowForm] = useState<boolean>(false);
  const handleCloseForm = () => setShowForm(false);

  async function handleClickDict(): Promise<void> {
    const currentTranslations = await getAllTranslations();
    setTranslations(currentTranslations);
    setAllTranslations(currentTranslations);
    setShowDict(true);
  }

  return (
    <div style={{ direction: "rtl", textAlign: "right" }}>
      <Row className="mb-3 justify-content-md-center">
        <Col md="auto">
          <Button type="submit" onClick={handleClickDict}>
            למילון
          </Button>
        </Col>
        <Col md="auto">
          <Button type="submit" onClick={() => setShowForm(true)}>
            הצע תרגום
          </Button>
        </Col>
      </Row>
      <Modal
        style={{ direction: "rtl", textAlign: "right" }}
        show={showDict}
        onHide={() => setShowDict(false)}
      >
        <Modal.Header>
          <Modal.Title>מילון המונחים</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <AllTranslationsView
            allTranslations={allTranslations}
            setTranslations={setTranslations}
            translations={translations}
          />
        </Modal.Body>
      </Modal>
      <Modal
        style={{ direction: "rtl", textAlign: "right" }}
        show={showForm}
        onHide={() => setShowForm(false)}
      >
        <Modal.Header>
          <Modal.Title>הצע תרגום</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <SuggestTranslationForm onSubmit={handleCloseForm} />
        </Modal.Body>
      </Modal>
    </div>
  );
}

export default function TranslationsPane() {
  return (
    <Container className="mt-3">
      <TranslateBar />
      <TranslationModals />
    </Container>
  );
}
