"use client";

import { useState } from "react";
import { Card, Field, TextInput, TextArea, Toggle, SaveBar } from "@/components/admin/ui";
import { useSettingsForm } from "@/components/admin/useSettingsForm";

type Chatbot = { enabled?: boolean; greeting?: string; systemPrompt?: string };

export default function ChatbotForm({ initial }: { initial: Chatbot }) {
  const { saving, status, submit } = useSettingsForm("chatbot");
  const [enabled, setEnabled] = useState(initial.enabled ?? true);
  const [greeting, setGreeting] = useState(initial.greeting ?? "");
  const [systemPrompt, setSystemPrompt] = useState(initial.systemPrompt ?? "");

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        submit({ enabled, greeting, systemPrompt });
      }}
    >
      <Card title="Chatbot du site" description="Assistant IA affiché sur le storefront (§13).">
        <div className="space-y-4">
          <Toggle checked={enabled} onChange={setEnabled} label="Activer le chatbot sur le site" />
          <Field label="Message d'accueil" htmlFor="greeting">
            <TextInput id="greeting" value={greeting} onChange={(e) => setGreeting(e.target.value)} placeholder="Bonjour 👋 Comment puis-je vous aider ?" />
          </Field>
          <Field
            label="Comportement (prompt système)"
            htmlFor="systemPrompt"
            hint="Ton, politique de la boutique, ce que l'assistant peut/ne peut pas dire."
          >
            <TextArea id="systemPrompt" value={systemPrompt} onChange={(e) => setSystemPrompt(e.target.value)} className="min-h-[160px]" />
          </Field>
        </div>
        <SaveBar saving={saving} status={status} />
      </Card>
    </form>
  );
}
