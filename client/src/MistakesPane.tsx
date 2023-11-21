import { useState } from "react";
import { Button, Col, Container, Form, Row, Table } from "react-bootstrap";

async function reportMistake(report: MistakeReport): Promise<PersonMistake> {
  const response = await fetch("http://localhost:3000/mistakes", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(report),
  });
  return await response.json();
}

function ReportMistake() {
  const [mistake, setMistake] = useState<PersonMistake | null>(null);
  const [name, setName] = useState<string>("");
  const [reportedMistake, setReportedMistake] = useState<Mistake>("");

  async function handleSubmit(e) {
    e.preventDefault();
    const response = await reportMistake({
      name: name,
      mistake: reportedMistake,
    });
    setMistake(response);
    setName("");
    setReportedMistake("");
  }

  return (
    <>
      <Row>
        <Col>
          <h2 className="text-center">Report a use of English</h2>
        </Col>
      </Row>
      <Form noValidate onSubmit={handleSubmit}>
        <Row className="mb-3">
          <Form.Group as={Col} controlId="formName">
            <Form.Label>Name</Form.Label>
            <Form.Control
              type="text"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
              }}
            />
          </Form.Group>
          <Form.Group as={Col} controlId="formMistake">
            <Form.Label>Mistake</Form.Label>
            <Form.Control
              type="text"
              value={reportedMistake}
              onChange={(e) => {
                setReportedMistake(e.target.value);
              }}
            />
          </Form.Group>
        </Row>
        <Row className="justify-content-md-center">
          <Col md="auto">
            <Button variant="primary" type="submit">
              Submit
            </Button>
          </Col>
        </Row>
      </Form>
      <p>
        {mistake === null
          ? ""
          : `${mistake.name} has said ${mistake.counted_mistake.mistake} ${mistake.counted_mistake.count} times(s)`}
      </p>
    </>
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
          <th colSpan={2} className="text-center">
            {personMistakes.name}
          </th>
        </tr>
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

export default function MistakesPane({
  mistakes,
}: {
  mistakes: PersonMistakes[];
}) {
  return (
    <div>
      <Container>
        <Row>
          <Col>
            <ReportMistake />
          </Col>
        </Row>
        <Row>
          {mistakes.map((mistake) => (
            <Col key={mistake.name}>
              <PersonMistakesTable personMistakes={mistake} />
            </Col>
          ))}
        </Row>
      </Container>
    </div>
  );
}
