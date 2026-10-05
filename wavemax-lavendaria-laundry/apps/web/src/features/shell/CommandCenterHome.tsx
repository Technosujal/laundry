import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type DragEventHandler,
  type ReactNode,
} from "react";

import type { AppRole, ProductArea } from "../../app/auth/session-types";
import { formatBusinessDate, formatExact } from "../../components/charts/primitives";
import { ProductIcon } from "../../components/ui/ProductIcon";
import type { AnalyticsGateway, OverviewResult } from "../analytics/analytics-gateway";
import { areaTheme } from "./area-theme";
import {
  arrange,
  clearPreferences,
  defaultPreferences,
  loadPreferences,
  moveTo,
  reorder,
  savePreferences,
  TILE_SIZES,
  type LaunchPreferences,
  type TileSize,
} from "./launch-preferences";

interface LaunchModule {
  /** Stable across renames, so a saved arrangement survives new wording on a tile. */
  id: string;
  title: string;
  description: string;
  category: string;
  destination: ProductArea;
  access: readonly AppRole[];
  tone: keyof typeof cardTones;
}

const cardTones = {
  peach: "border-[#dce4ef] bg-white text-ink",
  cyan: "border-[#dce4ef] bg-white text-ink",
  violet: "border-[#dce4ef] bg-white text-ink",
  mint: "border-[#dce4ef] bg-white text-ink",
  blue: "border-[#dce4ef] bg-white text-ink",
  yellow: "border-[#dce4ef] bg-white text-ink",
} as const;

const modules: readonly LaunchModule[] = [
  {
    title: "Executive dashboard",
    description: "Combined owner business view.",
    category: "Executive",
    id: "executive",
    destination: "executive",
    access: ["OWNER"],
    tone: "blue",
  },
  {
    title: "Business analytics",
    description: "Traceable store performance reports.",
    category: "Performance",
    id: "analytics",
    destination: "analytics",
    access: ["OWNER"],
    tone: "blue",
  },
  {
    title: "Order management",
    description: "Find and inspect exact orders.",
    category: "Operations",
    id: "orders",
    destination: "orders",
    access: ["OWNER", "MANAGER"],
    tone: "violet",
  },
  {
    title: "Store operations",
    description: "Store workload and busy periods.",
    category: "Operations",
    id: "operations",
    destination: "operations",
    access: ["OWNER", "MANAGER"],
    tone: "cyan",
  },
  {
    // Previously two tiles, "Employee details" and "Team & coverage", that opened the same
    // page. The description now matches what that page can actually show from the timesheet,
    // rather than promising schedules the source does not contain.
    title: "Employee details",
    description: "Employee records and recorded hours.",
    category: "People",
    id: "workforce",
    destination: "workforce",
    access: ["OWNER", "MANAGER"],
    tone: "peach",
  },
  {
    title: "My workforce",
    description: "Schedule, time, and leave.",
    category: "People",
    id: "my-workforce",
    destination: "workforce",
    access: ["EMPLOYEE"],
    tone: "peach",
  },
  {
    title: "Inventory",
    description: "Stock movement and supply needs.",
    category: "Stock",
    id: "inventory",
    destination: "inventory",
    access: ["OWNER", "MANAGER"],
    tone: "yellow",
  },
] as const;

interface LatestDaySnapshot {
  period: string;
  wdfSales: number;
  wdfOrders: number;
  machineRevenue: number;
  washerCycles: number;
}

/** Use one common source day so the four cards never mix dates. */
export function latestDaySnapshot(result: OverviewResult): LatestDaySnapshot | null {
  if (result.state !== "available" || !result.wdf_sales.analytics.available) return null;
  const machineRevenue = result.metrics.find(
    (metric) => metric.definition.metric_id === "machine_revenue_total",
  );
  const washerCycles = result.metrics.find(
    (metric) => metric.definition.metric_id === "washer_cycles_total",
  );
  if (!machineRevenue || !washerCycles) return null;

  const machineDays = new Set(machineRevenue.by_day.map((point) => point.period));
  const cycleDays = new Set(washerCycles.by_day.map((point) => point.period));
  const period = result.wdf_sales.analytics.by_day
    .map((point) => point.period)
    .filter(
      (candidate): candidate is string =>
        candidate !== undefined && machineDays.has(candidate) && cycleDays.has(candidate),
    )
    .sort()
    .at(-1);
  if (!period) return null;

  const wdf = result.wdf_sales.analytics.by_day.find((point) => point.period === period);
  const machine = machineRevenue.by_day.find((point) => point.period === period);
  const cycles = washerCycles.by_day.find((point) => point.period === period);
  if (!wdf || !machine || !cycles) return null;

  return {
    period,
    wdfSales: Number(wdf.subtotal),
    wdfOrders: wdf.order_count,
    machineRevenue: Number(machine.value),
    washerCycles: Number(cycles.value),
  };
}

function LatestActivityStrip({ snapshot }: { snapshot: LatestDaySnapshot }) {
  const cards = [
    {
      label: "WDF sales",
      value: formatExact(snapshot.wdfSales, "CURRENCY_USD"),
      source: "WDF POS",
      color: "#2563eb",
      soft: "#eff6ff",
    },
    {
      label: "Paid orders",
      value: snapshot.wdfOrders.toLocaleString("en-US"),
      source: "WDF POS",
      color: "#4f46e5",
      soft: "#eef2ff",
    },
    {
      label: "Machine revenue",
      value: formatExact(snapshot.machineRevenue, "CURRENCY_USD"),
      source: "LaundroPortal",
      color: "#7c3aed",
      soft: "#faf5ff",
    },
    {
      label: "Washer cycles",
      value: snapshot.washerCycles.toLocaleString("en-US"),
      source: "LaundroPortal",
      color: "#0d9488",
      soft: "#f0fdfa",
    },
  ];

  return (
    <section aria-label="Latest recorded activity" className="mb-7 sm:mb-8">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-[11px] font-extrabold uppercase tracking-[0.09em] text-ink">
          Latest recorded day
        </h2>
        <span className="rounded-full border border-[#bfdbfe] bg-[#eff6ff] px-2.5 py-1 text-[9px] font-bold text-[#2563eb]">
          {formatBusinessDate(snapshot.period)} · Historical
        </span>
      </div>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {cards.map((card) => (
          <article
            className="motion-card relative min-w-0 overflow-hidden rounded-2xl border border-line bg-white px-4 py-4 shadow-[0_5px_16px_rgba(29,47,78,0.04)] sm:px-5"
            key={card.label}
          >
            <span
              aria-hidden="true"
              className="absolute inset-x-0 top-0 h-[3px]"
              style={{ background: card.color }}
            />
            <div className="flex items-start justify-between gap-3">
              <span className="min-w-0">
                <span className="block text-[10px] font-extrabold uppercase tracking-[0.08em] text-muted">
                  {card.label}
                </span>
                <strong
                  className="mt-2 block text-[clamp(22px,2vw,28px)] font-bold tracking-[-0.04em] text-ink"
                  style={{ color: card.color }}
                >
                  {card.value}
                </strong>
              </span>
              <span
                className="shrink-0 rounded-full px-2 py-1 text-[8px] font-extrabold uppercase tracking-[0.05em]"
                style={{ background: card.soft, color: card.color }}
              >
                {card.source}
              </span>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

/** The grid columns each chosen width occupies, on tablet and on a wide screen. */
const SIZE_SPANS: Record<TileSize, string> = {
  small: "sm:col-span-1 xl:col-span-2",
  medium: "sm:col-span-1 xl:col-span-3",
  large: "sm:col-span-2 xl:col-span-6",
};

const SIZE_LABELS: Record<TileSize, string> = {
  small: "Small",
  medium: "Medium",
  large: "Full width",
};

/**
 * Large tiles first, in pairs, so visual weight follows the order rather than fighting it.
 *
 * The six-column grid offers two card sizes: half width (span 3, two per row) and third width
 * (span 2, three per row). Tiles are paired from the top and only an odd tail is laid out three
 * to a row, so an even count is all half-width pairs and an odd one ends on a row of three.
 * Every row therefore fills completely, whatever the role is allowed to see.
 */
function spanFor(index: number, count: number): string {
  let xl: string;
  if (count === 1) {
    xl = "xl:col-span-6";
  } else if (count >= 6) {
    xl = "xl:col-span-2";
  } else if (count % 2 === 0) {
    xl = "xl:col-span-3";
  } else {
    xl = index < count - 3 ? "xl:col-span-3" : "xl:col-span-2";
  }
  // The same idea one breakpoint down: an odd tile finishes the row on its own.
  const sm = index === count - 1 && count % 2 === 1 ? "sm:col-span-2" : "sm:col-span-1";
  return `${sm} ${xl}`;
}

function LaunchCard({
  module,
  index,
  className,
  editing = false,
  hidden = false,
  controls,
  dragging = false,
  dropTarget = false,
  selected = false,
  onSelect,
  onDragStart,
  onDragOver,
  onDragEnd,
}: {
  module: LaunchModule;
  index: number;
  className: string;
  /** While customising, a tile is a preview of itself and must not navigate. */
  editing?: boolean;
  hidden?: boolean;
  controls?: ReactNode;
  dragging?: boolean;
  dropTarget?: boolean;
  selected?: boolean;
  onSelect?: () => void;
  onDragStart?: DragEventHandler<HTMLDivElement>;
  onDragOver?: DragEventHandler<HTMLDivElement>;
  onDragEnd?: DragEventHandler<HTMLDivElement>;
}) {
  const accent = areaTheme[module.destination].accent;
  const shell = `launch-card module-card-glow group relative isolate flex h-full min-h-[214px] flex-col overflow-hidden rounded-2xl border p-5 no-underline shadow-[0_5px_16px_rgba(29,47,78,0.035)] outline-none transition-[transform,box-shadow] duration-300 focus-visible:ring-3 focus-visible:ring-offset-3 sm:min-h-[230px] sm:p-6 ${selected ? "launch-card-selected" : ""} ${cardTones[module.tone]} ${className}`;
  const body = (
    <>
      <span className="relative z-10 flex items-center justify-between">
        <span className="inline-flex items-center gap-2 text-[10px] font-extrabold uppercase tracking-[0.11em] text-[#8b9ab4]">
          {module.category}
        </span>
        <span className="font-mono text-[10px] font-bold tracking-[0.12em] text-[#c2ccdc]">
          {String(index + 1).padStart(2, "0")}
        </span>
      </span>
      <span className="relative z-10 mt-6 flex flex-1 flex-col items-start">
        <span>
          <span
            className="launch-icon mb-5 grid h-11 w-11 place-items-center rounded-xl border"
            style={{
              background: selected ? accent : areaTheme[module.destination].soft,
              borderColor: selected ? "rgba(255,255,255,0.6)" : `${accent}12`,
              color: selected ? "#ffffff" : accent,
            }}
          >
            <ProductIcon area={module.destination} className="h-5 w-5" />
          </span>
          <strong className="block max-w-[350px] text-[18px] font-bold leading-[1.15] tracking-[-0.025em]">
            {module.title}
          </strong>
          <small className="mt-2 block max-w-[360px] text-[12px] leading-[1.55] text-muted">
            {module.description}
          </small>
        </span>
        <span
          className="launch-cta relative mt-auto flex w-full items-center border-t border-line/80 pt-4 text-[12px] font-bold transition-colors duration-300"
          style={{ color: selected ? accent : "#8795aa" }}
          aria-hidden="true"
        >
          <span
            className="absolute inset-0 -z-10 rounded-full opacity-0 transition-opacity duration-300 group-hover:z-0 group-hover:opacity-100"
            style={{ background: accent }}
          />
          <span className="relative">→</span>
        </span>
      </span>
    </>
  );

  if (editing) {
    return (
      <div
        aria-label={`${module.title}, position ${index + 1}. Drag to reorder.`}
        className={`${shell} ${hidden ? "opacity-45 grayscale" : ""} ${
          dragging ? "scale-[0.98] opacity-60" : ""
        } ${dropTarget ? "ring-3 ring-offset-2" : ""} cursor-grab active:cursor-grabbing`}
        draggable
        onDragEnd={onDragEnd}
        onDragOver={onDragOver}
        onDragStart={onDragStart}
        onDrop={onDragEnd}
        role="listitem"
        style={{ ["--glow" as string]: accent, ["--tw-ring-color" as string]: accent }}
      >
        {/* In flow above the tile's own header, so the controls never sit on top of its label. */}
        {controls}
        {body}
      </div>
    );
  }

  return (
    <a
      className={`${shell} hover:-translate-y-0.5 hover:border-[var(--glow)] hover:shadow-[0_16px_36px_rgba(29,47,78,0.08)]`}
      href={`#${module.destination}`}
      onFocus={onSelect}
      onMouseEnter={onSelect}
      style={{ ["--glow" as string]: accent, ["--tw-ring-color" as string]: accent }}
    >
      {body}
    </a>
  );
}

/** The move and hide controls laid over a tile while the Command Center is being customised. */
function TileControls({
  canMoveUp,
  canMoveDown,
  hidden,
  onMove,
  onResize,
  onToggleHidden,
  size,
  title,
}: {
  canMoveUp: boolean;
  canMoveDown: boolean;
  hidden: boolean;
  onMove: (direction: -1 | 1) => void;
  onResize: (size: TileSize) => void;
  onToggleHidden: () => void;
  /** The chosen width, or null while the tile still takes the automatic one. */
  size: TileSize | null;
  title: string;
}) {
  const button =
    "grid h-9 w-9 place-items-center rounded-xl border border-black/10 bg-white/85 text-sm font-bold text-ink shadow-sm outline-none transition hover:bg-white focus-visible:ring-2 focus-visible:ring-brand disabled:cursor-not-allowed disabled:opacity-35";
  return (
    <div className="relative z-20 mb-5 flex flex-wrap items-center justify-between gap-2">
      <div className="flex gap-2">
        <button
          aria-label={`Move ${title} earlier`}
          className={button}
          disabled={!canMoveUp}
          onClick={() => onMove(-1)}
          type="button"
        >
          ↑
        </button>
        <button
          aria-label={`Move ${title} later`}
          className={button}
          disabled={!canMoveDown}
          onClick={() => onMove(1)}
          type="button"
        >
          ↓
        </button>
      </div>
      <div className="flex items-center gap-2">
        <div
          aria-label={`Width of ${title}`}
          className="flex overflow-hidden rounded-xl border border-black/10 bg-white/85 shadow-sm"
          role="group"
        >
          {TILE_SIZES.map((option) => (
            <button
              aria-label={`${SIZE_LABELS[option]} ${title}`}
              aria-pressed={size === option}
              className={`px-2.5 py-2 text-[11px] font-bold outline-none transition focus-visible:ring-2 focus-visible:ring-brand ${
                size === option ? "bg-ink text-white" : "text-ink hover:bg-white"
              }`}
              key={option}
              onClick={() => onResize(option)}
              type="button"
            >
              {SIZE_LABELS[option].charAt(0)}
            </button>
          ))}
        </div>
        <button
          aria-pressed={hidden}
          className="rounded-xl border border-black/10 bg-white/85 px-3 py-2 text-[11px] font-bold text-ink shadow-sm outline-none transition hover:bg-white focus-visible:ring-2 focus-visible:ring-brand"
          onClick={onToggleHidden}
          type="button"
        >
          {hidden ? `Show ${title}` : `Hide ${title}`}
        </button>
      </div>
    </div>
  );
}

export function CommandCenterHome({
  role,
  analyticsGateway,
}: {
  role: AppRole;
  analyticsGateway?: AnalyticsGateway;
}) {
  const roleLabel = role === "OWNER" ? "Owner" : role === "MANAGER" ? "Manager" : "Employee";
  const [editing, setEditing] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [latestActivity, setLatestActivity] = useState<LatestDaySnapshot | null>(null);

  useEffect(() => {
    if (role !== "OWNER" || !analyticsGateway) return;
    const controller = new AbortController();
    void analyticsGateway.getOverview(controller.signal).then(
      (result) => {
        if (controller.signal.aborted) return;
        const snapshot = latestDaySnapshot(result);
        if (snapshot) setLatestActivity(snapshot);
      },
      () => {
        // The launch page stays usable when analytics is unavailable. No placeholder is shown.
      },
    );
    return () => controller.abort();
  }, [analyticsGateway, role]);
  // Read once when the component first renders, and again only if the role changes, which it
  // does in the local role preview. Storage is synchronous, so an effect would render the
  // default arrangement first and then replace it, which shows as a flicker.
  const [preferences, setPreferences] = useState<LaunchPreferences>(() => loadPreferences(role));
  const [loadedFor, setLoadedFor] = useState<AppRole>(role);
  if (loadedFor !== role) {
    setLoadedFor(role);
    setPreferences(loadPreferences(role));
  }

  // Permission is applied here, every render, from the session. A stored arrangement can only
  // reorder or conceal what this role was already allowed to open; it can never add a tile.
  const permitted = useMemo(() => modules.filter((item) => item.access.includes(role)), [role]);
  const arranged = useMemo(() => arrange(permitted, preferences), [permitted, preferences]);
  const shown = useMemo(
    () => arranged.filter((item) => !preferences.hidden.includes(item.id)),
    [arranged, preferences.hidden],
  );

  const update = useCallback(
    (next: LaunchPreferences) => {
      setPreferences(next);
      savePreferences(role, next);
    },
    [role],
  );

  const move = useCallback(
    (id: string, direction: -1 | 1) => {
      update({
        ...preferences,
        order: reorder(
          arranged.map((item) => item.id),
          id,
          direction,
        ),
      });
    },
    [arranged, preferences, update],
  );

  const toggleHidden = useCallback(
    (id: string) => {
      const hidden = preferences.hidden.includes(id)
        ? preferences.hidden.filter((entry) => entry !== id)
        : [...preferences.hidden, id];
      update({ ...preferences, order: arranged.map((item) => item.id), hidden });
    },
    [arranged, preferences, update],
  );

  const resize = useCallback(
    (id: string, size: TileSize) => {
      const sizes = { ...preferences.sizes };
      // Choosing the size a tile already has returns it to the automatic width, so there is a
      // way back to the tidy grid without resetting everything.
      if (sizes[id] === size) delete sizes[id];
      else sizes[id] = size;
      update({ ...preferences, order: arranged.map((item) => item.id), sizes });
    },
    [arranged, preferences, update],
  );

  // Drag state is deliberately not persisted: it lasts only as long as the gesture.
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const pendingOrder = useRef<string[] | null>(null);

  const onDragEnter = useCallback(
    (targetId: string) => {
      if (draggingId === null || draggingId === targetId) return;
      const ids = arranged.map((item) => item.id);
      const next = moveTo(ids, draggingId, ids.indexOf(targetId));
      if (next === ids) return;
      // Reorder live so the gesture shows its result, and remember it to save when it ends.
      pendingOrder.current = next;
      setPreferences((current) => ({ ...current, order: next }));
    },
    [arranged, draggingId],
  );

  const onDragFinish = useCallback(() => {
    setDraggingId(null);
    const order = pendingOrder.current;
    pendingOrder.current = null;
    if (order) savePreferences(role, { ...preferences, order });
  }, [preferences, role]);

  const reset = useCallback(() => {
    setPreferences(defaultPreferences);
    clearPreferences(role);
  }, [role]);

  const customised =
    preferences.hidden.length > 0 ||
    Object.keys(preferences.sizes).length > 0 ||
    arranged.some((item, index) => item.id !== permitted[index]?.id);

  // Hidden tiles stay on screen while customising, otherwise there is no way to bring one back.
  const listed = editing ? arranged : shown;
  const activeId = listed.some((item) => item.id === selectedId)
    ? selectedId
    : (listed[0]?.id ?? null);

  return (
    <section className="launch-workspace relative min-h-[calc(100vh-104px)]">
      <header className="flex flex-col gap-4 pb-7 pt-2 sm:pt-3 lg:flex-row lg:items-end lg:justify-between lg:pb-8 lg:pt-4">
        <div className="max-w-[760px]">
          <p className="text-[10px] font-extrabold uppercase tracking-[0.08em] text-brand">
            WAVEMAX · COLERAIN
          </p>
          <h1 className="mt-2 text-[30px] font-bold leading-none tracking-[-0.04em] text-ink sm:text-[clamp(34px,3.2vw,44px)]">
            {roleLabel} workspace
          </h1>
          <p className="mt-2.5 max-w-[620px] text-[13px] leading-5 text-muted sm:text-[14px]">
            {editing
              ? "Move tiles into the order you work in, and hide any you do not use. This changes your own Command Center only, on this device."
              : "Enter an operating area. The tools and navigation for that area will appear after you open it."}
          </p>
        </div>
        <div className="flex shrink-0 flex-wrap items-center gap-2">
          {editing && customised ? (
            <button
              className="rounded-xl border border-line bg-white px-4 py-2.5 text-xs font-bold text-muted outline-none transition hover:text-ink focus-visible:ring-2 focus-visible:ring-brand"
              onClick={reset}
              type="button"
            >
              Reset to default
            </button>
          ) : null}
          <button
            aria-pressed={editing}
            className={`rounded-xl px-4 py-2.5 text-xs font-bold outline-none transition focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 ${
              editing
                ? "bg-[#11203a] text-white hover:bg-[#1a3158]"
                : "border border-[#ccd7e7] bg-white text-[#18345c] shadow-sm hover:border-brand/40 hover:bg-brand-soft"
            }`}
            onClick={() => setEditing((current) => !current)}
            type="button"
          >
            {editing ? "Done" : "Customize"}
          </button>
        </div>
      </header>

      {role === "OWNER" && latestActivity ? (
        <LatestActivityStrip snapshot={latestActivity} />
      ) : null}

      {editing && shown.length === 0 ? (
        <p
          className="mb-4 rounded-2xl border border-[#e6d6aa] bg-amber-soft px-5 py-4 text-[11px] leading-[1.6] text-[#77591d]"
          role="status"
        >
          Every tile is hidden. Your Command Center will be empty until you show one again or reset
          to the default arrangement.
        </p>
      ) : null}

      <div
        aria-label={`${roleLabel} workspace areas`}
        className="grid grid-cols-1 items-stretch gap-4 sm:grid-cols-2 xl:grid-cols-6"
      >
        {listed.map((module, index) => {
          const chosen = preferences.sizes[module.id];
          return (
            <LaunchCard
              className={chosen ? SIZE_SPANS[chosen] : spanFor(index, listed.length)}
              dragging={draggingId === module.id}
              editing={editing}
              hidden={preferences.hidden.includes(module.id)}
              index={index}
              key={module.id}
              module={module}
              onSelect={() => setSelectedId(module.id)}
              selected={!editing && module.id === activeId}
              {...(editing
                ? {
                    onDragStart: (event) => {
                      setDraggingId(module.id);
                      // Guarded because a synthetic drag event carries no transfer object.
                      if (event.dataTransfer) {
                        event.dataTransfer.effectAllowed = "move";
                        // Firefox starts no drag at all without a payload on the transfer.
                        event.dataTransfer.setData("text/plain", module.id);
                      }
                    },
                    onDragOver: (event) => {
                      event.preventDefault();
                      if (event.dataTransfer) event.dataTransfer.dropEffect = "move";
                      onDragEnter(module.id);
                    },
                    onDragEnd: (event) => {
                      event.preventDefault();
                      onDragFinish();
                    },
                    controls: (
                      <TileControls
                        canMoveDown={index < listed.length - 1}
                        canMoveUp={index > 0}
                        hidden={preferences.hidden.includes(module.id)}
                        onMove={(direction) => move(module.id, direction)}
                        onResize={(size) => resize(module.id, size)}
                        onToggleHidden={() => toggleHidden(module.id)}
                        size={chosen ?? null}
                        title={module.title}
                      />
                    ),
                  }
                : {})}
            />
          );
        })}
      </div>

      {!editing && shown.length === 0 ? (
        <p className="rounded-2xl border border-line bg-white/80 px-5 py-4 text-[12px] leading-[1.6] text-muted">
          You have hidden every tile. Choose Customize to bring one back.
        </p>
      ) : null}

      {role === "MANAGER" ? (
        <p className="mt-5 rounded-2xl border border-line bg-white/80 px-5 py-4 text-[11px] leading-[1.6] text-muted shadow-sm backdrop-blur-sm">
          Your workforce view is limited to employees assigned to your team. Financial and business
          analytics remain owner-only.
        </p>
      ) : null}
    </section>
  );
}
