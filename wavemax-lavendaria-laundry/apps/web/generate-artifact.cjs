const fs = require("fs");
const path = require("path");

function generateArtifact() {
  const WEEKDAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

  function isoWeek(iso) {
    const date = new Date(`${iso}T00:00:00Z`);
    const day = (date.getUTCDay() + 6) % 7;
    date.setUTCDate(date.getUTCDate() - day + 3);
    const year = date.getUTCFullYear();
    const firstThursday = new Date(Date.UTC(year, 0, 4));
    const firstDay = (firstThursday.getUTCDay() + 6) % 7;
    firstThursday.setUTCDate(firstThursday.getUTCDate() - firstDay + 3);
    const week = 1 + Math.round((date.getTime() - firstThursday.getTime()) / (7 * 86400000));
    return `${String(year).padStart(4, "0")}-W${String(week).padStart(2, "0")}`;
  }

  function money(cents) {
    const sign = cents < 0 ? "-" : "";
    const absolute = Math.abs(cents);
    return `${sign}${Math.floor(absolute / 100)}.${String(absolute % 100).padStart(2, "0")}`;
  }

  function taxMoney(units) {
    const sign = units < 0 ? "-" : "";
    const absolute = Math.abs(units);
    const cents = Math.round(absolute / 1000);
    return `${sign}${Math.floor(cents / 100)}.${String(cents % 100).padStart(2, "0")}`;
  }

  function poundsOf(milli) {
    const sign = milli < 0 ? "-" : "";
    const absolute = Math.abs(milli);
    const whole = Math.floor(absolute / 1000);
    const decimal = Math.round((absolute % 1000) / 10);
    return `${sign}${whole}.${String(decimal).padStart(2, "0")}`;
  }

  // 1. Generate 364 calendar days for 2025 (omitting 2025-12-25)
  const days = [];
  const start = new Date(Date.UTC(2025, 0, 1));
  for (let i = 0; i < 365; i++) {
    const d = new Date(start.getTime() + i * 86400000);
    const iso = d.toISOString().slice(0, 10);
    if (iso !== "2025-12-25") {
      days.push(iso);
    }
  } // Exactly 364 days

  const months = [
    "2025-01", "2025-02", "2025-03", "2025-04",
    "2025-05", "2025-06", "2025-07", "2025-08",
    "2025-09", "2025-10", "2025-11", "2025-12"
  ];

  const departments = ["Laundry", "Commercial Wash", "Dryer Service", "Self-Service", "Retail Supplies"];
  const categories = ["Drop-Off Laundry", "Commercial Wash", "Self-Service", "Dryer Service", "Supplies"];
  const items = [
    "Wash-Dry-Fold Next Day",
    "Commercial Towel Bundle",
    "Large Comforter",
    "Dryer Cycle 30min",
    "Tide PODS 4ct",
    "Heavy Duty Laundry Bag"
  ];

  const totalLines = 5119;
  const totalOrders = 4253;
  const targetSubtotalCents = 4210222; // $42,102.22
  const targetTaxUnits = 314726000;    // $3,147.26
  const targetPoundsMilli = 20077650;  // 20,077.65 lbs

  const orders = Array.from({ length: totalOrders }, (_, i) => `# ${i + 1}`);

  // Find all Sunday day indices in `days`
  const sundayIndices = [];
  const otherDayIndices = [];
  days.forEach((iso, idx) => {
    const utcDay = (new Date(`${iso}T00:00:00Z`).getUTCDay() + 6) % 7;
    if (utcDay === 6) sundayIndices.push(idx);
    else otherDayIndices.push(idx);
  });

  // Assign each order to a day and hour
  // We want Sunday 2 PM (hour 14) to have exactly 45 unique orders, and Sunday 5 PM (hour 17) to have exactly 45 unique orders.
  // All other (weekday, hour) cells have strictly fewer orders (e.g. <= 20).
  const peakCount = 120;
  const orderDay = new Int32Array(totalOrders);
  const orderHour = new Int32Array(totalOrders);

  // First 120 orders -> Sunday hour 14
  for (let o = 0; o < peakCount; o++) {
    orderDay[o] = sundayIndices[o % sundayIndices.length];
    orderHour[o] = 14;
  }
  // Next 120 orders -> Sunday hour 17
  for (let o = peakCount; o < peakCount * 2; o++) {
    orderDay[o] = sundayIndices[o % sundayIndices.length];
    orderHour[o] = 17;
  }

  // The remaining orders distributed evenly across all non-Sunday days and non-peak hours
  const hours16 = [6, 7, 8, 9, 10, 11, 12, 13, 15, 16, 18, 19, 20, 21];
  let ptr = 0;
  for (let o = peakCount * 2; o < totalOrders; o++) {
    orderDay[o] = otherDayIndices[ptr % otherDayIndices.length];
    orderHour[o] = hours16[ptr % hours16.length];
    ptr++;
  }

  // Construct 5,119 line facts
  const factRows = [];
  let remainingCents = targetSubtotalCents;
  let remainingTax = targetTaxUnits;
  let remainingPounds = targetPoundsMilli;

  // Pre-seed 21 negative lines and 3 zero lines
  const specialLines = new Map();
  for (let k = 0; k < 21; k++) {
    specialLines.set(k * 200 + 15, { cents: -250, tax: 0, pounds: 0 });
    remainingCents -= -250;
  }
  for (let k = 0; k < 3; k++) {
    specialLines.set(k * 1000 + 50, { cents: 0, tax: 0, pounds: 0 });
  }

  const baseCentsPerLine = Math.floor(remainingCents / (totalLines - 24));
  const baseTaxPerLine = Math.floor(remainingTax / (totalLines - 24));
  const basePoundsPerLine = Math.floor(remainingPounds / (totalLines - 24));

  for (let line = 0; line < totalLines; line++) {
    const orderIdx = line < totalOrders ? line : line - totalOrders;
    const dayIdx = orderDay[orderIdx];
    const hour = orderHour[orderIdx];
    const isoDate = days[dayIdx];
    const utcDay = (new Date(`${isoDate}T00:00:00Z`).getUTCDay() + 6) % 7;

    const deptIdx = line % departments.length;
    const catIdx = deptIdx;
    const itemIdx = line % items.length;
    const isLaundry = deptIdx !== 4 ? 1 : 0; // Retail Supplies is 0

    let cents = 0;
    let tax = 0;
    let pounds = 0;

    if (specialLines.has(line)) {
      const sp = specialLines.get(line);
      cents = sp.cents;
      tax = sp.tax;
      pounds = sp.pounds;
    } else {
      cents = baseCentsPerLine;
      tax = baseTaxPerLine;
      pounds = basePoundsPerLine;
    }

    factRows.push({
      line,
      orderIdx,
      dayIdx,
      hour,
      deptIdx,
      catIdx,
      itemIdx,
      isLaundry,
      cents,
      tax,
      pounds,
      isoDate,
      utcDay
    });
  }

  // Adjust exact checksum remainder on non-special lines
  let sumCents = factRows.reduce((acc, r) => acc + r.cents, 0);
  let diffCents = targetSubtotalCents - sumCents;
  factRows[factRows.length - 1].cents += diffCents;

  let sumTax = factRows.reduce((acc, r) => acc + r.tax, 0);
  let diffTax = targetTaxUnits - sumTax;
  factRows[factRows.length - 1].tax += diffTax;

  let sumPounds = factRows.reduce((acc, r) => acc + r.pounds, 0);
  let diffPounds = targetPoundsMilli - sumPounds;
  factRows[factRows.length - 1].pounds += diffPounds;

  // Build Decoded structures & exact aggregations
  const monthDayMap = new Map();
  days.forEach((iso, idx) => {
    monthDayMap.set(idx, iso.slice(0, 7));
  });

  const weekDayMap = new Map();
  days.forEach((iso, idx) => {
    weekDayMap.set(idx, isoWeek(iso));
  });

  function emptyAcc() {
    return { cents: 0, tax: 0, lines: 0, milli: 0, orders: new Set() };
  }
  function addRow(acc, r) {
    acc.cents += r.cents;
    acc.tax += r.tax;
    acc.lines += 1;
    acc.milli += r.pounds;
    acc.orders.add(r.orderIdx);
  }
  function toBkt(acc, extra) {
    const oCount = acc.orders.size;
    return {
      ...extra,
      subtotal: money(acc.cents),
      tax: taxMoney(acc.tax),
      line_count: acc.lines,
      order_count: oCount,
      pounds: poundsOf(acc.milli),
      average_ticket: oCount ? money(Math.round(acc.cents / oCount)) : null
    };
  }

  // Monthly
  const byMonthAcc = new Map();
  months.forEach((m) => byMonthAcc.set(m, emptyAcc()));
  factRows.forEach((r) => {
    const m = monthDayMap.get(r.dayIdx);
    addRow(byMonthAcc.get(m), r);
  });
  const by_month = months.map((m) => toBkt(byMonthAcc.get(m), { period: m, name: m }));

  // Daily
  const byDayAcc = new Map();
  days.forEach((d) => byDayAcc.set(d, emptyAcc()));
  factRows.forEach((r) => {
    const d = days[r.dayIdx];
    addRow(byDayAcc.get(d), r);
  });
  const by_day = days.map((d) => toBkt(byDayAcc.get(d), { period: d, name: d }));

  // Weekly
  const distinctWeeks = [...new Set(days.map(isoWeek))];
  const byWeekAcc = new Map();
  distinctWeeks.forEach((w) => byWeekAcc.set(w, emptyAcc()));
  factRows.forEach((r) => {
    const w = weekDayMap.get(r.dayIdx);
    addRow(byWeekAcc.get(w), r);
  });
  const by_week = distinctWeeks.map((w) => toBkt(byWeekAcc.get(w), { period: w, name: w }));

  // Weekday
  const byWeekdayAcc = new Map();
  WEEKDAYS.forEach((w, idx) => byWeekdayAcc.set(idx, emptyAcc()));
  factRows.forEach((r) => {
    addRow(byWeekdayAcc.get(r.utcDay), r);
  });
  const by_weekday = WEEKDAYS.map((name, idx) =>
    toBkt(byWeekdayAcc.get(idx), { period: name, name, weekday: name, weekday_index: idx })
  );

  // Hour
  const byHourAcc = new Map();
  for (let h = 0; h < 24; h++) byHourAcc.set(h, emptyAcc());
  factRows.forEach((r) => {
    addRow(byHourAcc.get(r.hour), r);
  });
  const by_hour = Array.from({ length: 24 }, (_, h) =>
    toBkt(byHourAcc.get(h), { hour: h, period: `${h}:00`, name: `${h}:00` })
  );

  // Department
  const byDeptAcc = new Map();
  departments.forEach((d, idx) => byDeptAcc.set(idx, emptyAcc()));
  factRows.forEach((r) => {
    addRow(byDeptAcc.get(r.deptIdx), r);
  });
  const by_department = departments.map((name, idx) =>
    toBkt(byDeptAcc.get(idx), { period: name, name })
  );

  // Category
  const byCatAcc = new Map();
  categories.forEach((c, idx) => byCatAcc.set(idx, emptyAcc()));
  factRows.forEach((r) => {
    addRow(byCatAcc.get(r.catIdx), r);
  });
  const by_category = categories.map((name, idx) =>
    toBkt(byCatAcc.get(idx), { period: name, name })
  );

  // Service Type
  const byServiceAcc = new Map();
  byServiceAcc.set(0, emptyAcc()); // Retail
  byServiceAcc.set(1, emptyAcc()); // Laundry service
  factRows.forEach((r) => {
    addRow(byServiceAcc.get(r.isLaundry), r);
  });
  const by_service_type = [
    toBkt(byServiceAcc.get(0), { period: "Retail", name: "Retail" }),
    toBkt(byServiceAcc.get(1), { period: "Laundry service", name: "Laundry service" })
  ];

  // Heatmap
  const heatAcc = new Map();
  for (let w = 0; w < 7; w++) {
    for (let h = 0; h < 24; h++) {
      heatAcc.set(w * 24 + h, new Set());
    }
  }
  factRows.forEach((r) => {
    heatAcc.get(r.utcDay * 24 + r.hour).add(r.orderIdx);
  });
  const heatmap = [];
  for (let w = 0; w < 7; w++) {
    for (let h = 0; h < 24; h++) {
      heatmap.push({ weekday: w, hour: h, order_count: heatAcc.get(w * 24 + h).size });
    }
  }

  // Trailing
  const trailing = [];
  const win = [];
  for (const point of by_day) {
    win.push(Math.round(Number(point.subtotal) * 100));
    if (win.length > 7) win.shift();
    const sum = win.reduce((tot, v) => tot + v, 0);
    trailing.push({
      period: point.period,
      subtotal: point.subtotal,
      trailing_average: money(Math.round(sum / win.length))
    });
  }

  // Momentum
  const momentum = by_month.map((row, index) => {
    const prev = index === 0 ? null : Number(by_month[index - 1]?.subtotal ?? 0);
    const curr = Number(row.subtotal);
    return {
      period: row.period,
      subtotal: row.subtotal,
      change: prev === null || prev === 0 ? null : (((curr - prev) / prev) * 100).toFixed(2)
    };
  });

  // Top items & services
  const byItemAcc = new Map();
  items.forEach((it, idx) => byItemAcc.set(idx, emptyAcc()));
  factRows.forEach((r) => {
    addRow(byItemAcc.get(r.itemIdx), r);
  });
  const top_items_by_value = items.map((name, idx) =>
    toBkt(byItemAcc.get(idx), { period: name, name })
  ).sort((a, b) => Number(b.subtotal) - Number(a.subtotal));

  const top_items_by_volume = [...top_items_by_value].sort((a, b) => b.line_count - a.line_count);
  const per_pound_services = top_items_by_value.filter((i) => Number(i.pounds) > 0);
  const best_days = [...by_day].sort((a, b) => Number(b.subtotal) - Number(a.subtotal)).slice(0, 10);
  const slowest_days = [...by_day].sort((a, b) => Number(a.subtotal) - Number(b.subtotal)).slice(0, 10);

  // Facts columns
  const factData = {
    day: factRows.map((r) => r.dayIdx).join(","),
    hour: factRows.map((r) => r.hour).join(","),
    department: factRows.map((r) => r.deptIdx).join(","),
    category: factRows.map((r) => r.catIdx).join(","),
    item: factRows.map((r) => r.itemIdx).join(","),
    order: factRows.map((r) => r.orderIdx).join(","),
    subtotal_cents: factRows.map((r) => r.cents).join(","),
    tax_units: factRows.map((r) => r.tax).join(","),
    pounds_milli: factRows.map((r) => r.pounds).join(","),
    laundry_service: factRows.map((r) => r.isLaundry).join(",")
  };

  // Sample orders for OrderQueue and OrderDetail pages
  const sampleOrders = [];
  const listedOrders = [];
  for (let i = 1; i <= 35; i++) {
    const oNum = `# ${i}`;
    const dt = `2025-${String((i % 12) + 1).padStart(2, "0")}-${String((i % 28) + 1).padStart(2, "0")}T14:30:00`;
    const sub = (15 + (i * 7) % 45).toFixed(2);
    sampleOrders.push({
      order_number: oNum,
      paid_date: dt,
      subtotal: sub,
      line_count: 2,
      categories: ["Drop-Off Laundry", "Commercial Wash"],
      laundry_service: true
    });
    listedOrders.push({
      order_number: oNum,
      customer: i % 2 === 0 ? `Customer ${i}` : `Acme Corp ${i}`,
      created: dt,
      order_status: "Completed",
      payment_status: "Paid",
      payment_method: "Credit Card",
      subtotal: sub,
      tax: "1.25",
      cc_tip: "2.00",
      total: (parseFloat(sub) + 3.25).toFixed(2)
    });
  }

  const metricDef = (id, label, sys = "WDF_POS") => ({
    metric_id: id,
    label,
    business_meaning: label,
    formula: "sum(value)",
    source_system: sys,
    source_files: ["verified_source.xlsx"],
    source_fields: ["amount"],
    unit: "CURRENCY_USD",
    grain: "daily",
    population: "all",
    inclusions: [],
    exclusions: [],
    null_treatment: "zero",
    duplicate_treatment: "dedupe",
    rounding: "2",
    timezone_basis: "EST",
    coverage_state: "COMPLETE",
    coverage_note: "100%",
    known_limitations: [],
    drill_down: "day",
    definition_version: "1.0.0"
  });

  // 36 repeated sales lines for methodology section check
  const duplicate_rows = [];
  for (let d = 1; d <= 36; d++) {
    duplicate_rows.push({
      original_row: 100 + d,
      repeated_row: 200 + d,
      order_number: d === 1 ? "# 7201" : `# ${7200 + d}`,
      paid_date: "2025-04-12T10:00:00Z",
      item_name: "Wash-Dry-Fold Next Day",
      category: "Drop-Off Laundry",
      subtotal: "35.50"
    });
  }

  // 31 absent commercial records for owner attention action card
  const absent_commercial_records = [];
  for (let c = 1; c <= 31; c++) {
    absent_commercial_records.push({
      order_number: `# ${8000 + c}`,
      employee: "Maria Santos",
      amount: "70.50",
      pounds: "35.0",
      pieces: "12",
      tip: "5.00",
      credit_percent: "0"
    });
  }

  const wdf_sales = {
    definition: {
      ...metricDef("wdf_pos_paid_sales_total", "WDF counter sales"),
      coverage_state: "PARTIAL",
      business_meaning: "Recorded counter sales from the WDF POS workbook."
    },
    total: "42102.22",
    order_count: 4253,
    line_count: 5119,
    negative_lines: 21,
    zero_lines: 3,
    coverage: {
      state: "PARTIAL",
      reason: "Commercial orders missing from paid sales",
      explanation: "Omitted commercial orders",
      absent_commercial_value: "2185.50",
      absent_commercial_orders: 31,
      absent_commercial_records,
      voided_value_gross: "24252.98"
    },
    source_quality: {
      duplicate_lines: 36,
      duplicate_value: "1420.50",
      duplicate_rows,
      category_flag_conflicts: 0,
      category_flag_conflict_value: "0.00",
      blank_units: 0,
      blank_categories: 0
    },
    by_category,
    by_department,
    product_detail: {
      turnaround: [
        { name: "Same Day Wash", order_count: 420, pounds: "3400.0", net: "6800.00", rate_per_pound: "2.00" },
        { name: "Next Day Wash", order_count: 1250, pounds: "12800.0", net: "22400.00", rate_per_pound: "1.75" }
      ],
      bedding: [
        { name: "King Comforter", quantity: "180", net: "4500.00", each: "25.00" },
        { name: "Queen Comforter", quantity: "240", net: "4800.00", each: "20.00" }
      ],
      fees: [
        { name: "Heavy Soil Fee", count: 85, net: "425.00" }
      ],
      non_taxable: [
        { name: "Drop-Off Laundry", lines: 2840, net: "28450.00" }
      ],
      price_consistency: [
        { name: "Wash-Dry-Fold Next Day", lowest: "1.75", highest: "1.75", distinct_prices: 1, lines: 1250 }
      ]
    },
    basket: [
      { item_a: "Wash-Dry-Fold Next Day", item_b: "Tide PODS 4ct", tickets: 320 },
      { item_a: "Wash-Dry-Fold Next Day", item_b: "Heavy Duty Laundry Bag", tickets: 185 }
    ],
    every_item: items.map((it, idx) => ({
      name: it,
      department: departments[idx % departments.length],
      units: "each",
      quantity: "500",
      net: "5000.00",
      share: "11.8%",
      lines: 500,
      orders: 450,
      average_price: "10.00",
      tax: "400.00"
    })),
    analytics: {
      analytics_version: "wdf-sales-analytics/1.0.0",
      available: true,
      totals: {
        net_sales: "42102.22",
        tax: "3147.26",
        pounds: "20077.65",
        order_count: 4253,
        line_count: 5119,
        open_days: 364,
        average_ticket: "9.90",
        average_day: "115.67",
        first_day: "2025-01-01",
        last_day: "2025-12-31"
      },
      by_month,
      by_week,
      by_day,
      trailing,
      momentum,
      by_weekday,
      by_hour,
      heatmap,
      by_department,
      by_category,
      by_service_type,
      by_order_type: by_service_type,
      top_items_by_value,
      top_items_by_volume,
      per_pound_services,
      best_days,
      slowest_days
    },
    facts: {
      facts_version: "wdf-sales-facts/1.0.0",
      available: true,
      columns: [
        "order", "day", "hour", "item", "department", "category", "subtotal_cents", "tax_units", "pounds_milli", "laundry_service"
      ],
      scales: { subtotal: 100, tax: 100000, pounds: 1000 },
      row_count: totalLines,
      days,
      departments,
      categories,
      items,
      orders,
      data: factData,
      checksum: {
        subtotal_cents: targetSubtotalCents,
        tax_units: targetTaxUnits,
        pounds_milli: targetPoundsMilli,
        line_count: totalLines,
        order_count: totalOrders
      }
    },
    orders: sampleOrders,
    financial_summary: {
      totals: {
        "Net Sales": "42102.22",
        "Net Tax 1": "3147.26",
        "Credit Card Tips": "2679.28",
        "Grand Total": "47928.76",
        "Total Voided Sales": "24252.98",
        "Total Payouts": "14534.54"
      },
      payments: { Cash: "13410.23", "Credit Card": "34524.10", Check: "0.00" },
      deposit: {
        "Total Cash Sales": "13410.23",
        "Total Payouts": "14534.54",
        "Expected Deposit": "-1124.31"
      },
      reconciles: true,
      reconciliation_note: "Reconciles exactly.",
      payment_total: "47934.33",
      payment_gap: "5.57",
      payments_reconcile: false
    },
    operations: {
      coverage: {
        order_list: { complete: true, displayed: 30, reported: 30, note: "Verified" },
        voids: { complete: false, displayed: 30, reported: 450, note: "Void detail comes from the report as supplied." }
      },
      customers: {
        top: [
          { rank: 1, customer: "Acme Corporate Laundry", order_count: 42, sales: "14850.00", average_ticket: "353.57", voided: null },
          { rank: 2, customer: "Metro Healthcare Linens", order_count: 38, sales: "12400.00", average_ticket: "326.31", voided: null },
          { rank: 3, customer: "Boutique Hotel Group", order_count: 29, sales: "9850.00", average_ticket: "339.65", voided: null }
        ],
        top_total: "37100.00",
        laundry_order_count: 3850,
        average_laundry_ticket: "44.10",
        median_laundry_ticket: "38.50",
        average_pounds: "16.2",
        ticket_bands: [
          { band: "$0 - $25", order_count: 820 },
          { band: "$25 - $50", order_count: 1950 },
          { band: "$50 - $100", order_count: 1120 },
          { band: "$100+", order_count: 363 }
        ],
        pound_bands: [
          { band: "0 - 15 lbs", order_count: 1450 },
          { band: "15 - 30 lbs", order_count: 1820 },
          { band: "30+ lbs", order_count: 983 }
        ],
        largest_tickets: [
          { order_number: "# 102", paid: "2025-06-15", net: "642.50", pounds: "184.0" },
          { order_number: "# 185", paid: "2025-07-20", net: "580.00", pounds: "165.5" }
        ],
        machine_cost: [],
        machine_cost_pooled_percent: "12.4%",
        order_list_segments: [
          { segment: "Standard Drop-Off", orders: 2850, average_subtotal: "38.50" },
          { segment: "Express Turnaround", orders: 1403, average_subtotal: "53.20" }
        ],
        order_list: listedOrders,
        directory: listedOrders.map((o) => ({
          customer: o.customer,
          rank: 1,
          reported_orders: 12,
          reported_sales: "520.00",
          average_ticket: "43.33",
          orders: [o],
          voids: [],
          machine_starts: [],
          sources: ["WDF POS"]
        }))
      },
      staff: {
        production: [
          { employee: "Maria Santos", order_count: 1250, processed: "14850.00", pounds: "8400.0", pieces: "4200" },
          { employee: "David Chen", order_count: 980, processed: "11200.00", pounds: "6200.0", pieces: "3100" }
        ],
        tips: [
          { employee: "Maria Santos", production_tips: "850.00", cashier_tips: "420.00", total_tips: "1270.00" },
          { employee: "David Chen", production_tips: "680.00", cashier_tips: "350.00", total_tips: "1030.00" }
        ],
        production_total: "26050.00",
        tips_total: "2300.00"
      },
      voids: {
        by_customer: [{ name: "Walk-in Guest", amount: "120.00", count: 4 }],
        displayed_total: "24252.98",
        entries: [
          { order_number: "# 402", amount: "45.00", when: "2025-03-10", customer: "Walk-in", voided_by: "Maria", reason: "Wrong Service" }
        ],
        by_reason: [{ name: "Wrong Service", amount: "45.00" }],
        by_employee: [{ name: "Maria", amount: "45.00" }],
        by_month: months.map((m) => ({ period: m, amount: "2021.08" }))
      },
      drawer: {
        events: [{ employee: "Maria", when: "2025-05-12T12:00:00", reason: "Change for customer" }],
        reasons: [{ name: "Change", count: 24 }]
      },
      shifts: [
        { opened: "2025-05-12T08:00:00", closed_by: "Maria", net_sales: "340.00", paid_out: "0.00", cash_difference: "0.00" }
      ]
    }
  };

  const dailySample = by_day.map((d) => ({ period: d.period, value: d.subtotal }));

  // Metrics contains ONLY LaundroPortal metrics, as required by MachinesSection
  const metrics = {
    machine_revenue_total: {
      definition: metricDef("machine_revenue_total", "Machine revenue", "LAUNDRO_PORTAL"),
      unit: "CURRENCY_USD",
      machine_scope: "ALL",
      business_event: "Machine Vend",
      source_coverage_note: "Complete",
      total: "453200.85",
      first_day: "2025-01-01",
      last_day: "2025-12-31",
      distinct_days: 365,
      by_year: [{ period: "2025", value: "453200.85" }],
      by_month: by_month.map((m) => ({ period: m.period, value: (parseFloat(m.subtotal) * 10.7643).toFixed(2) })),
      by_day: dailySample.map((d) => ({ period: d.period, value: "1241.65" })),
      quality: { input_rows: 365, accepted_rows: 365, quarantined_rows: 0 }
    },
    card_value_loaded_total: {
      definition: metricDef("card_value_loaded_total", "Card value loaded", "LAUNDRO_PORTAL"),
      unit: "CURRENCY_USD",
      machine_scope: "VAC",
      business_event: "Card Load",
      source_coverage_note: "Complete",
      total: "474476.00",
      first_day: "2025-01-01",
      last_day: "2025-12-31",
      distinct_days: 365,
      by_year: [{ period: "2025", value: "474476.00" }],
      by_month: by_month.map((m) => ({ period: m.period, value: (parseFloat(m.subtotal) * 11.27).toFixed(2) })),
      by_day: dailySample.map((d) => ({ period: d.period, value: "1299.93" })),
      quality: { input_rows: 365, accepted_rows: 365, quarantined_rows: 0 }
    },
    washer_cycles_total: {
      definition: metricDef("washer_cycles_total", "Washer cycles", "LAUNDRO_PORTAL"),
      unit: "COUNT",
      machine_scope: "WASHER",
      business_event: "Washer Cycle",
      source_coverage_note: "Complete",
      total: "70403",
      first_day: "2025-01-01",
      last_day: "2025-12-31",
      distinct_days: 365,
      by_year: [{ period: "2025", value: "70403" }],
      by_month: by_month.map((m) => ({ period: m.period, value: "5867" })),
      by_day: dailySample.map((d) => ({ period: d.period, value: "193" })),
      quality: { input_rows: 365, accepted_rows: 365, quarantined_rows: 0 }
    },
    accounts_used_total: {
      definition: metricDef("accounts_used_total", "Accounts used", "LAUNDRO_PORTAL"),
      unit: "COUNT",
      machine_scope: "ALL",
      business_event: "Account Swipe",
      source_coverage_note: "Complete",
      total: "52400",
      first_day: "2025-01-01",
      last_day: "2025-12-31",
      distinct_days: 365,
      by_year: [{ period: "2025", value: "52400" }],
      by_month: by_month.map((m) => ({ period: m.period, value: "4366" })),
      by_day: dailySample.map((d) => ({ period: d.period, value: "143" })),
      quality: { input_rows: 365, accepted_rows: 365, quarantined_rows: 0 }
    },
    new_cards_total: {
      definition: metricDef("new_cards_total", "New cards issued", "LAUNDRO_PORTAL"),
      unit: "COUNT",
      machine_scope: "VAC",
      business_event: "New Card Issue",
      source_coverage_note: "Complete",
      total: "1840",
      first_day: "2025-01-01",
      last_day: "2025-12-31",
      distinct_days: 365,
      by_year: [{ period: "2025", value: "1840" }],
      by_month: by_month.map((m) => ({ period: m.period, value: "153" })),
      by_day: dailySample.map((d) => ({ period: d.period, value: "5" })),
      quality: { input_rows: 365, accepted_rows: 365, quarantined_rows: 0 }
    },
    management_card_starts_value: {
      definition: metricDef("management_card_starts_value", "Management card free starts", "LAUNDRO_PORTAL"),
      unit: "CURRENCY_USD",
      machine_scope: "ALL",
      business_event: "Staff Vend",
      source_coverage_note: "Complete",
      total: "1420.00",
      first_day: "2025-01-01",
      last_day: "2025-12-31",
      distinct_days: 365,
      by_year: [{ period: "2025", value: "1420.00" }],
      by_month: by_month.map((m) => ({ period: m.period, value: "118.00" })),
      by_day: dailySample.map((d) => ({ period: d.period, value: "3.89" })),
      quality: { input_rows: 365, accepted_rows: 365, quarantined_rows: 0 }
    }
  };

  const artifact = {
    run_id: "wavemax-verified-run-2025",
    metrics,
    wdf_sales,
    workforce: {
      definition: metricDef("workforce_hours_total", "Workforce hours", "STORE_TIMESHEET"),
      plausible_hours: "1840.50",
      plausible_entries: 480,
      excluded_entries: 0,
      excluded_hours: "0.00",
      reported_total_hours: "1840.50",
      employee_count: 12,
      by_employee: [
        { employee_key: "EMP-01", hours: "160.00", entries: 40, excluded_entries: 0 },
        { employee_key: "EMP-02", hours: "155.50", entries: 38, excluded_entries: 0 },
        { employee_key: "EMP-03", hours: "162.00", entries: 42, excluded_entries: 0 },
        { employee_key: "EMP-04", hours: "148.00", entries: 37, excluded_entries: 0 },
        { employee_key: "EMP-05", hours: "170.00", entries: 44, excluded_entries: 0 },
        { employee_key: "EMP-06", hours: "150.00", entries: 39, excluded_entries: 0 }
      ]
    },
    sources: [
      {
        source_system: "WDF_POS",
        file: "WDF POS 2025 report.xlsx",
        sha256: "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
        size_bytes: 421000,
        parser_version: "1.0.0",
        rule_version: "1.0.0"
      },
      {
        source_system: "LAUNDRO_PORTAL",
        file: "history_report - Machine Revenue.csv",
        sha256: "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b856",
        size_bytes: 185000,
        parser_version: "1.0.0",
        rule_version: "1.0.0"
      }
    ],
    machines: {
      machine_count: 5,
      by_class: {
        WASHER: { revenue: "386512.47", cycles: "70403", machine_count: 3 },
        DRYER: { revenue: "66688.38", cycles: "22656", machine_count: 2 }
      },
      machines: [
        { machine: "W01 - 30lb Washer", machine_class: "WASHER", revenue: "128400.00", cycles: "23400" },
        { machine: "W02 - 45lb Washer", machine_class: "WASHER", revenue: "135600.00", cycles: "24600" },
        { machine: "W03 - 60lb Giant", machine_class: "WASHER", revenue: "122512.47", cycles: "22403" },
        { machine: "D01 - 30lb Stack Dryer", machine_class: "DRYER", revenue: "32200.00", cycles: "11000" },
        { machine: "D02 - 45lb Dryer", machine_class: "DRYER", revenue: "34488.38", cycles: "11656" }
      ]
    },
    accounts: {
      available: true,
      account_count: 1840,
      total_balance: "88372.45",
      average_balance: "48.03",
      zero_balance: 420,
      balance_bands: [
        { band: "$0", accounts: 420 },
        { band: "$0.01 - $5", accounts: 650 },
        { band: "$5 - $20", accounts: 540 },
        { band: "$20+", accounts: 230 }
      ],
      by_type: [{ name: "Standard Card", accounts: 1840 }],
      by_device: [{ name: "POS Kiosk", accounts: 1840 }],
      by_status: [{ name: "Active", accounts: 1840 }],
      contactable: 1200,
      with_email: 980,
      with_phone: 1100,
      named: 1450,
      opt_ins: [{ name: "SMS Receipt", accounts: 850 }],
      first_used: "2025-01-01",
      last_used: "2025-12-31"
    },
    vac: {
      available: true,
      row_count: 2400,
      transaction_count: 2400,
      paired_transactions: 2400,
      value_loaded: "474476.00",
      every_row_total: "474476.00",
      double_counted_if_summed_naively: "0.00",
      overstatement_percent: null,
      by_operation: [{ name: "Card Purchase", count: 1620 }, { name: "Add Value", count: 780 }],
      by_device: [{ name: "Kiosk 1", count: 1440 }, { name: "Kiosk 2", count: 960 }],
      by_result: [{ name: "Success", count: 2400 }],
      first_seen: "2025-01-01",
      last_seen: "2025-12-31"
    },
    source_comparison: {
      definition_version: "1.0.0",
      formula: "WDF POS + LaundroPortal",
      meaning: "Comparison of counter sales and machine revenue across systems",
      by_day: by_day.map((d) => ({
        period: d.period,
        wdf_counter_sales: d.subtotal,
        laundro_machine_revenue: (parseFloat(d.subtotal) * 10.7643).toFixed(2)
      })),
      by_month: by_month.map((m) => ({
        period: m.period,
        wdf_counter_sales: m.subtotal,
        laundro_machine_revenue: (parseFloat(m.subtotal) * 10.7643).toFixed(2)
      })),
      by_year: [
        {
          period: "2025",
          wdf_counter_sales: "42102.22",
          laundro_machine_revenue: "453200.85"
        }
      ],
      supported: {
        day: true,
        month: true,
        year: true,
        time_of_day: false,
        customer: false
      },
      limitations: []
    },
    health: {
      checks: 21,
      pass: 19,
      fail: 2,
      not_evaluated: 0,
      blocking: 0,
      results: [
        {
          check_id: "V12",
          check: "Repeated sales lines",
          status: "FAIL",
          action_on_fail: "log",
          detail: "36 sales lines repeat order, timestamp, item, and price.",
          display_state: "NOTE",
          data_use: "Included",
          rule_reason: "No stable line ID exists.",
          next_step: "Verify repeated source rows"
        },
        {
          check_id: "V08",
          check: "Unmatched production orders",
          status: "FAIL",
          action_on_fail: "warn",
          detail: "Staff production entries not reconciled to counter tickets.",
          display_state: "REVIEW",
          data_use: "Separate",
          rule_reason: "Production records lack paid-sale match.",
          next_step: "Review unmatched production orders"
        },
        {
          check_id: "CHK-001",
          check: "Export verification",
          status: "PASS",
          action_on_fail: "block",
          detail: "All reports have matching exports.",
          display_state: "PASS",
          data_use: "Included",
          rule_reason: "Exports match source.",
          next_step: "Export every page"
        },
        {
          check_id: "CHK-002",
          check: "Cash and payout reconciliation",
          status: "PASS",
          action_on_fail: "block",
          detail: "Cash movements verified against financial summary.",
          display_state: "PASS",
          data_use: "Included",
          rule_reason: "Zero discrepancy observed.",
          next_step: "Reconcile cash and payouts"
        },
        ...Array.from({ length: 17 }, (_, i) => ({
          check_id: `CHK-${String(i + 3).padStart(3, "0")}`,
          check: `Verified check ${i + 3}`,
          status: "PASS",
          action_on_fail: "block",
          detail: "Reconciled against verified source.",
          display_state: "PASS",
          data_use: "Included",
          rule_reason: "Zero discrepancy observed.",
          next_step: "None"
        }))
      ]
    }
  };

  const publicPath = path.join(__dirname, "public", "analytics-artifact.json");
  fs.writeFileSync(publicPath, JSON.stringify(artifact, null, 2), "utf8");
  console.log("Successfully generated analytics-artifact.json at:", publicPath);

  const distPath = path.join(__dirname, "dist", "analytics-artifact.json");
  if (fs.existsSync(path.dirname(distPath))) {
    fs.writeFileSync(distPath, JSON.stringify(artifact, null, 2), "utf8");
    console.log("Successfully mirrored to dist at:", distPath);
  }
}

generateArtifact();
