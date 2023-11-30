import { useContext, useEffect, useState } from "react";
import { authHeader, isKnownWord } from "./api_utils";
import { PasswordContext } from "./PasswordContext";
import { Button, Form, Modal } from "react-bootstrap";

async function addCanonicalization(
  word: string,
  canonical: string,
  password: string,
): Promise<void> {
  const request: CanonicalRequest = { word: word, canonical: canonical };
  await fetch("http://localhost:3000/canonicalize", {
    method: "POST",
    headers: { ...authHeader(password), "Content-Type": "application/json" },
    body: JSON.stringify(request),
  });
}

export function NewCanonicalizationForm({
  word,
  onSubmit,
}: {
  word: string;
  onSubmit: () => void;
}) {
  const password = useContext(PasswordContext);
  const [canonical, setCanonical] = useState<string>(word);

  async function handleSubmit(e: React.SyntheticEvent) {
    e.preventDefault();
    await addCanonicalization(word, canonical, password);
    setCanonical("");
    onSubmit();
  }

  return (
    <Form noValidate onSubmit={handleSubmit}>
      <Form.Group className="mt-3" controlId="formCanonical">
        <Form.Label>{word}</Form.Label>
        <Form.Control
          type="text"
          value={canonical}
          onChange={(e) => setCanonical(e.target.value)}
        />
      </Form.Group>
      <Button className="mt-3" type="submit">
        שלח
      </Button>
    </Form>
  );
}

export function CanonicalizeUnknownWord({ word }: { word: string }) {
  const [knownWord, setKnownWord] = useState<boolean>(true);
  const [showForm, setShowForm] = useState<boolean>(false);

  useEffect(() => {
    isKnownWord(word).then((res) => setKnownWord(res));
  }, [word]);

  if (knownWord) {
    return <>{word}</>;
  } else {
    return (
      <>
        <a href="#" onClick={() => setShowForm(true)}>
          {word}
        </a>
        <Modal show={showForm} onHide={() => setShowForm(false)}>
          <Modal.Header>
            <Modal.Title>הכנס מילה למסד הנתונים</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <NewCanonicalizationForm
              word={word}
              onSubmit={() => {
                setShowForm(false);
                setKnownWord(true);
              }}
            />
          </Modal.Body>
        </Modal>
      </>
    );
  }
}

export default function AdminCanonicalizationTab() {
  const [word, setWord] = useState<string>("");

  return (
    <>
      <Form.Control
        type="text"
        placeholder="מילה להכניס למסד הנתונים"
        value={word}
        onChange={(e) => setWord(e.target.value)}
      />
      <NewCanonicalizationForm word={word} onSubmit={() => {}} />
    </>
  );
}
