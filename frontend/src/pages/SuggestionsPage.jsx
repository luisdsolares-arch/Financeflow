import { useEffect, useState } from "react";
import { fallbackSuggestions } from "../data/mock";
import api from "../services/api";

export default function SuggestionsPage() {
  const [cards, setCards] = useState(fallbackSuggestions);

  useEffect(() => {
    api
      .get("/suggestions")
      .then((res) => setCards(res.data.advice || []))
      .catch(() => setCards(fallbackSuggestions));
  }, []);

  return (
    <div className="space-y-4">
      <div className="panel p-5">
        <h2 className="text-lg font-semibold text-slate-800">Consejos Inteligentes</h2>
        <p className="mt-1 text-sm text-slate-500">Motor analítico con reglas 70% y 50/30/20.</p>
      </div>
      {cards.map((card) => (
        <article key={card.title} className="panel p-5">
          <p className="text-xs uppercase tracking-[0.18em] text-slate-500">{card.type}</p>
          <h3 className="mt-2 text-xl font-semibold text-slate-900">{card.title}</h3>
          <p className="mt-2 text-sm text-slate-600">{card.message}</p>
          <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-slate-700">
            {card.actions?.map((action) => (
              <li key={action}>{action}</li>
            ))}
          </ul>
        </article>
      ))}
    </div>
  );
}
