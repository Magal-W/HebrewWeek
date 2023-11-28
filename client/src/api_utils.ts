export async function getAllParticipants(): Promise<string[]> {
  const response = await fetch("http://localhost:3000/participants");
  return await response.json();
}

export async function isKnownWord(word: string): Promise<boolean> {
  const response = await fetch(`http://localhost:3000/known/${word}`);
  return await response.json();
}

export function authHeader(pass: string): { Authorization: string } {
  return { Authorization: `Basic ${btoa("admin:" + pass)}` };
}
