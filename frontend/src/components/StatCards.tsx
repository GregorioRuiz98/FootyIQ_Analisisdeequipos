import {
  Activity,
  AlertTriangle,
  BrainCircuit,
  Sparkles,
  Target,
} from "lucide-react";
import type { DashboardSnapshot } from "../types";

type CardMeta = {
  key: keyof Pick<
    DashboardSnapshot,
    | "matchesToday"
    | "activeAlerts"
    | "analysisInProgress"
    | "opportunities"
    | "modelPrecision"
  >;
  title: string;
  icon: typeof Activity;
  suffix: string;
  isPercentage?: boolean;
};

const cardMeta: CardMeta[] = [
  {
    key: "matchesToday",
    title: "PARTIDOS HOY",
    icon: Activity,
    suffix: "en seguimiento",
  },
  {
    key: "activeAlerts",
    title: "ALERTAS ACTIVAS",
    icon: AlertTriangle,
    suffix: "criticas",
  },
  {
    key: "analysisInProgress",
    title: "ANALISIS EN CURSO",
    icon: BrainCircuit,
    suffix: "por finalizar",
  },
  {
    key: "opportunities",
    title: "INSIGHTS",
    icon: Sparkles,
    suffix: "alta prioridad",
  },
  {
    key: "modelPrecision",
    title: "PRECISION MODELOS",
    icon: Target,
    suffix: "ultimos 7 dias",
    isPercentage: true,
  },
];

type Props = {
  snapshot: DashboardSnapshot;
};

export function StatCards({ snapshot }: Props): JSX.Element {
  return (
    <section className="stats-grid">
      {cardMeta.map((meta) => {
        const Icon = meta.icon;
        const rawValue = snapshot[meta.key];
        const value = meta.isPercentage ? `${rawValue}%` : rawValue;
        return (
          <article key={meta.key} className="stat-card glass-panel">
            <div className="stat-card-top">
              <p>{meta.title}</p>
              <Icon size={16} />
            </div>
            <p className="stat-value">{value}</p>
            <p className="stat-foot">{meta.suffix}</p>
          </article>
        );
      })}
    </section>
  );
}
