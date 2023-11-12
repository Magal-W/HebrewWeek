import { useEffect, useState } from "react";
import "./App.css";
import "./types.d.ts";

async function reportMistake(report: ReportMistake): Promise<Mistake> {
  const response = await fetch("http://localhost:3000/mistakes", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(report),
  });
  return await response.json();
}

function ReportMistake() {
  const [mistake, setMistake] = useState<Mistake | null>(null);
  const [name, setName] = useState<string>("");
  const [reportedMistake, setReportedMistake] = useState<string>("");

  async function handleSubmit(e) {
    e.preventDefault();
    const response = await reportMistake({
      name: name,
      mistake: reportedMistake,
    });
    setMistake(response);
  }

  return (
    <>
      <h2>Report a use of english</h2>
      <form onSubmit={handleSubmit}>
        <label htmlFor="name">
          Name:
          <input
            type="text"
            value={name}
            onChange={(e) => {
              setName(e.target.value);
            }}
          />
        </label>
        <label htmlFor="mistake">
          Mistake:
          <input
            type="text"
            value={reportedMistake}
            onChange={(e) => {
              setReportedMistake(e.target.value);
            }}
          />
        </label>
        <button />
      </form>
      <p>
        {mistake === null
          ? ""
          : `${mistake.name} has said ${mistake.mistake} ${mistake.count} times(s)`}
      </p>
    </>
  );
}

export default function App() {
  // const [mistakes, setMistakes] = useState<string[]>([]);

  // useEffect(() => {
  //   fetch("http://localhost:3000/api/mistakes")
  //     .then((res) => res.json())
  //     .then((mistakes: string[]) => setMistakes(mistakes));
  // });

  return (
    // <div>
    //   {mistakes.map((mistake) => (
    //     <p>{mistake} is not in hebrew!</p>
    //   ))}
    // </div>
    <ReportMistake />
  );
}
