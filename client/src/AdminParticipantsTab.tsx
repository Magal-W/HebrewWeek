import { useState } from "react";
import { Button, Form, ListGroup } from "react-bootstrap";
import { authHeader } from "./api_utils";

async function addParticipant(
  password: string,
  participant: string,
): Promise<void> {
  await fetch("http://localhost:3000/participants", {
    method: "POST",
    headers: {
      ...authHeader(password),
      ...{ "Content-Type": "application/json" },
    },
    body: JSON.stringify(participant),
  });
}

function ParticipantsList({ participants }: { participants: string[] }) {
  return (
    <ListGroup>
      {participants.map((participant) => (
        <ListGroup.Item key={participant}>{participant}</ListGroup.Item>
      ))}
    </ListGroup>
  );
}

function AddParticipantForm({
  password,
  onSubmit,
  triggerRefresh,
}: {
  password: string;
  onSubmit: () => void;
  triggerRefresh: () => Promise<void>;
}) {
  const [participant, setParticipant] = useState<string>("");

  async function handleSubmit(e) {
    e.preventDefault();
    await addParticipant(password, participant);
    setParticipant("");
    await triggerRefresh();
    onSubmit();
  }

  return (
    <Form noValidate onSubmit={handleSubmit}>
      <Form.Group>
        <Form.Control
          type="text"
          placeholder="משתתף"
          value={participant}
          onChange={(e) => setParticipant(e.target.value)}
        />
      </Form.Group>
      <div style={{ direction: "ltr", textAlign: "left" }}>
        <Button className="mt-3" variant="primary" type="submit">
          שלח
        </Button>
      </div>
    </Form>
  );
}

export default function AdminParticipantsTab({
  password,
  participants,
  triggerRefresh,
}: {
  password: string;
  participants: string[];
  triggerRefresh: () => Promise<void>;
}) {
  return (
    <>
      <AddParticipantForm
        password={password}
        triggerRefresh={triggerRefresh}
        onSubmit={() => {}}
      />
      <ParticipantsList participants={participants} />
    </>
  );
}
