"use client";

import { useEffect, useState } from "react";
import { api, post } from "@/lib/api";

type Member = { id: number; name: string; email: string; role: string };

export default function Team() {
  const [members, setMembers] = useState<Member[]>([]);
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");

  const load = () => api<Member[]>("/team", "team").then(setMembers);
  useEffect(() => { load(); }, []);

  async function invite() {
    setError("");
    if (members.length >= 10) {
      setError("Pendulum team has reached 10 members — you can't add more people.");
      return;
    }
    const r = await post("/team/invite", { email });
    if (r) { setEmail(""); load(); } else setError("Invite failed — is the API running?");
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="text-center">
        <h1 className="font-display text-4xl font-bold">Pendulum Team</h1>
        <p className="text-ink/50 mt-1">Start inviting more team members now! ({members.length}/10 seats)</p>
      </div>

      <div className="flex gap-2">
        <input
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Invite team members by entering their email"
          className="flex-1 border border-ink/15 rounded-lg px-4 py-2.5 text-sm bg-white"
        />
        <button onClick={invite} className="btn-accent">Invite</button>
      </div>
      {error && <p className="text-sm text-red-500">{error}</p>}

      <div className="card divide-y divide-ink/5">
        {members.map((m) => (
          <div key={m.id} className="flex items-center gap-3 px-5 py-4">
            <div className="h-10 w-10 rounded-full bg-ink text-white grid place-items-center font-bold">
              {m.name[0]}
            </div>
            <div>
              <div className="font-medium">
                {m.name} {m.role === "admin" && <span className="text-ink/40 font-normal">(Admin)</span>}
              </div>
              <div className="text-sm text-ink/50">{m.email}</div>
            </div>
            {m.role !== "admin" && (
              <button className="ml-auto text-sm text-ink/40 hover:text-red-500">Remove</button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
