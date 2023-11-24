import { useState } from "react";
import {
  Button,
  Col,
  Container,
  Form,
  ListGroup,
  Row,
  Stack,
} from "react-bootstrap";

async function isKnownWord(word: string): Promise<boolean> {
  const response = await fetch(`http://localhost:3000/known/${word}`);
  return await response.json();
}

async function translate(word: string): Promise<string[]> {
  const response = await fetch(`http://localhost:3000/translate/${word}`);
  return await response.json();
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
      <Row>
        <p>{`Hmm, it seems we currently don't have a translation for '${english}'. Do you have an idea?`}</p>
      </Row>
    );
  }

  return (
    <Row>
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

export default function TranslationsPane() {
  return (
    <Container className="mt-3">
      <TranslateBar />
    </Container>
  );
}
