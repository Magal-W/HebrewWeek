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

async function isKnownWord(word: string): Promise<boolean> {
  const response = await fetch(`http://localhost:3000/known/${word}`);
  return await response.json();
}

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

function UnknownWordLabel({
  english,
  known,
}: {
  english: string;
  known: boolean;
}) {
  if (english === "" || known) {
    return <></>;
  }

  return (
    <Row>
      <p>{`Sorry, we do not know '${english}'... Try searching for a different form of the word`}</p>
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
        <p>{`Hmm, it seems we currently don't have a translation for '${english}'. Do you have an idea?`}</p>
      </Row>
    );
  }

  return (
    <Row className="mb-3">
      <ListGroup>
        <ListGroup.Item variant="primary">{`Translations for '${english}'`}</ListGroup.Item>
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
    <>
      <Row className="mb-3">
        <Stack direction="horizontal" gap={3}>
          <Form.Control
            placeholder="Translate..."
            value={translationRequest}
            onChange={(e) => {
              setTranslationRequest(e.target.value);
            }}
          />
          <Button onClick={handleClick}>Translate</Button>
        </Stack>
      </Row>
      <UnknownWordLabel english={english} known={known} />
      <TranslationList english={english} translations={translations} />
    </>
  );
}

function TranslationsTable({ translations }: { translations: Translation[] }) {
  return (
    <Row className="mb-3">
      <Table borderless>
        <thead>
          <tr>
            <th>English</th>
            <th>Hebrew</th>
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
    <Form.Control type="search" placeholder="Search" onChange={handleChange} />
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
          placeholder="English word"
          value={english}
          onChange={(e) => setEnglish(e.target.value)}
        />
      </Form.Group>
      <Form.Group controlId="formHebrew">
        <Form.Control
          type="text"
          placeholder="Hebrew word"
          value={hebrew}
          onChange={(e) => setHebrew(e.target.value)}
        />
      </Form.Group>
      <Button className="mt-3" variant="primary" type="submit">
        Submit
      </Button>
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
    <>
      <Row className="mb-3 justify-content-md-center">
        <Col md="auto">
          <Button type="submit" onClick={handleClickDict}>
            Dictionary
          </Button>
        </Col>
        <Col md="auto">
          <Button type="submit" onClick={() => setShowForm(true)}>
            Suggest a Translation
          </Button>
        </Col>
      </Row>
      <Modal show={showDict} onHide={() => setShowDict(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Dictionary</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <AllTranslationsView
            allTranslations={allTranslations}
            setTranslations={setTranslations}
            translations={translations}
          />
        </Modal.Body>
      </Modal>
      <Modal show={showForm} onHide={() => setShowForm(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Suggest a Translation</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <SuggestTranslationForm onSubmit={handleCloseForm} />
        </Modal.Body>
      </Modal>
    </>
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
