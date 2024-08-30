export async function getAllParticipants(): Promise<string[]> {
  const response = verifyResponse(
    await fetch("/api/participants"),
  );
  return await response.json();
}

export async function isKnownWord(word: string): Promise<boolean> {
  const response = verifyResponse(
    await fetch(`/api/known/${word}`),
  );
  return await response.json();
}

export function authHeader(pass: string): { Authorization: string } {
  return { Authorization: `Basic ${btoa("admin:" + pass)}` };
}

export function verifyResponse(response: Response): Response {
  if (response.status === 500) {
    throw Error(`Failed fetch with internal server error`);
  } else if (response.status === 401) {
    throw Error("Unauthorized!");
  } else {
    return response;
  }
}
