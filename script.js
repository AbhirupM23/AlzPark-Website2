const tabTriggers = document.querySelectorAll("[data-tab]");
const navTabs = document.querySelectorAll(".nav [data-tab]");
const panels = document.querySelectorAll("[data-panel]");
const filters = document.querySelectorAll(".filter");
const cards = document.querySelectorAll(".evidence-card");
const validTabs = new Set(Array.from(navTabs, (tab) => tab.dataset.tab));
let volcanoRendered = false;

function getRequestedTab() {
  const params = new URLSearchParams(window.location.search);
  return params.get("tab") || window.location.hash.slice(1);
}

function tabUrl(tabName) {
  const url = new URL(window.location.href);
  url.searchParams.set("tab", tabName);
  url.hash = "";
  return url;
}

function setActiveTab(tabName, updateHash = true, resetScroll = false) {
  const nextTab = validTabs.has(tabName) ? tabName : "findings";

  panels.forEach((panel) => {
    panel.hidden = panel.dataset.panel !== nextTab;
  });

  navTabs.forEach((tab) => {
    const selected = tab.dataset.tab === nextTab;
    tab.classList.toggle("active", selected);
    tab.setAttribute("aria-selected", String(selected));
    tab.setAttribute("tabindex", selected ? "0" : "-1");
  });

  if (updateHash) {
    history.pushState({ tab: nextTab }, "", tabUrl(nextTab));
  }

  if (resetScroll) {
    window.scrollTo({ top: 0, left: 0, behavior: "instant" });
    requestAnimationFrame(() => {
      window.scrollTo({ top: 0, left: 0, behavior: "instant" });
    });
    setTimeout(() => {
      window.scrollTo({ top: 0, left: 0, behavior: "instant" });
    }, 50);
  }

  if (nextTab === "evidence") {
    renderVolcanoPlot();
  }
}

tabTriggers.forEach((trigger) => {
  trigger.addEventListener("click", (event) => {
    event.preventDefault();
    setActiveTab(trigger.dataset.tab, true, true);
  });
});

filters.forEach((button) => {
  button.addEventListener("click", () => {
    const category = button.dataset.filter;

    filters.forEach((item) => item.classList.remove("active"));
    button.classList.add("active");

    cards.forEach((card) => {
      const visible = category === "all" || card.dataset.category === category;
      card.classList.toggle("is-hidden", !visible);
    });
  });
});

function renderVolcanoPlot() {
  const neuronTarget = document.querySelector("#neuron-volcano-plot");
  const microgliaTarget = document.querySelector("#microglia-volcano-plot");

  if (!neuronTarget || !microgliaTarget || volcanoRendered) {
    return;
  }

  const neuronMarkers = [
    { marker: "SNAP25", x: -1.85, y: 300, cellType: "Neuron", regulation: "Down-regulated" },
    { marker: "SCN3A", x: -1.28, y: 300, cellType: "Neuron", regulation: "Down-regulated" },
    { marker: "DNM3", x: -1.12, y: 300, cellType: "Neuron", regulation: "Down-regulated" },
    { marker: "RASGRF2", x: -0.55, y: 300, cellType: "Neuron", regulation: "Down-regulated" },
    { marker: "NRG3", x: 1.62, y: 300, cellType: "Neuron", regulation: "Up-regulated" },
    { marker: "RP11-89N4.2", x: 1.88, y: 300, cellType: "Neuron", regulation: "Up-regulated" },
    { marker: "DANT2", x: 1.12, y: 300, cellType: "Neuron", regulation: "Up-regulated" },
    { marker: "IL1RAPL1", x: 2.55, y: 300, cellType: "Neuron", regulation: "Up-regulated" },
    { marker: "MALAT1", x: 4.95, y: 300, cellType: "Neuron", regulation: "Up-regulated" }
  ];

  const microgliaMarkers = [
    { marker: "ETV6", x: -0.72, y: 300, cellType: "Microglia", regulation: "Down-regulated" },
    { marker: "DPYD", x: -0.52, y: 300, cellType: "Microglia", regulation: "Down-regulated" },
    { marker: "TAB2", x: -0.28, y: 300, cellType: "Microglia", regulation: "Down-regulated" },
    { marker: "UBE2D3", x: -0.18, y: 292, cellType: "Microglia", regulation: "Down-regulated" },
    { marker: "PAN3", x: -0.12, y: 300, cellType: "Microglia", regulation: "Down-regulated" },
    { marker: "DYM", x: 0.25, y: 300, cellType: "Microglia", regulation: "Up-regulated" },
    { marker: "SRGAP2", x: 1.55, y: 300, cellType: "Microglia", regulation: "Up-regulated" }
  ];

  if (!window.Plotly) {
    renderVolcanoFallback(neuronTarget, neuronMarkers, "Neuron Volcano Markers", "#7a3150");
    renderVolcanoFallback(microgliaTarget, microgliaMarkers, "Microglia Volcano Markers", "#1f6975");
    volcanoRendered = true;
    return;
  }

  Plotly.newPlot(neuronTarget, [volcanoTrace(neuronMarkers, "#7a3150", "Neuron genes", "triangle-up")], volcanoLayout("Neuron Volcano Markers", [-5.4, 5.4]), {
    responsive: true,
    displaylogo: false
  });

  Plotly.newPlot(microgliaTarget, [volcanoTrace(microgliaMarkers, "#1f6975", "Microglia genes", "triangle-down")], volcanoLayout("Microglia Volcano Markers", [-3, 2]), {
    responsive: true,
    displaylogo: false
  });

  volcanoRendered = true;
}

function volcanoTrace(markers, color, name, symbol) {
  return {
    x: markers.map((point) => point.x),
    y: markers.map((point) => point.y),
    text: markers.map((point) => point.marker),
    mode: "markers",
    name,
    type: "scatter",
    marker: { color, size: 11, symbol },
    customdata: markers.map((point) => [point.marker, point.cellType, point.regulation]),
    hovertemplate: "Gene: %{customdata[0]}<br>Cell type: %{customdata[1]}<br>Direction: %{customdata[2]}<br>log2FC: %{x:.2f}<br>-log10(adj p): %{y:.1f}<extra></extra>"
  };
}

function volcanoLayout(title, xRange) {
  return {
    title: { text: title, font: { size: 18 } },
    margin: { t: 58, r: 24, b: 64, l: 62 },
    xaxis: {
      title: "log2 fold change",
      zeroline: true,
      range: xRange
    },
    yaxis: {
      title: "-log10(adjusted p-value)",
      range: [0, 325]
    },
    shapes: [
      { type: "line", x0: -1, x1: -1, y0: 0, y1: 320, line: { color: "#1f6975", dash: "dash", width: 1 } },
      { type: "line", x0: 1, x1: 1, y0: 0, y1: 320, line: { color: "#1f6975", dash: "dash", width: 1 } },
      { type: "line", x0: xRange[0], x1: xRange[1], y0: 1.3, y1: 1.3, line: { color: "#7a3150", dash: "dot", width: 1 } }
    ],
    showlegend: false,
    paper_bgcolor: "#ffffff",
    plot_bgcolor: "#ffffff",
    font: { family: "Arial, Helvetica, sans-serif", color: "#172126" }
  };
}

function renderVolcanoFallback(target, markers, title, color) {
  const width = 980;
  const height = 500;
  const pad = { left: 64, right: 28, top: 40, bottom: 62 };
  const xMin = -5.4;
  const xMax = 5.4;
  const yMin = 0;
  const yMax = 325;
  const mapX = (x) => pad.left + ((x - xMin) / (xMax - xMin)) * (width - pad.left - pad.right);
  const mapY = (y) => height - pad.bottom - ((y - yMin) / (yMax - yMin)) * (height - pad.top - pad.bottom);
  const markerDots = markers.map((point) => {
    const x = mapX(point.x).toFixed(1);
    const y = mapY(point.y).toFixed(1);
    return `<g class="fallback-marker">
      <circle cx="${x}" cy="${y}" r="7" fill="${color}" tabindex="0" role="img" aria-label="${point.marker}, ${point.cellType}, ${point.regulation}">
        <title>Gene: ${point.marker} | Cell type: ${point.cellType} | Direction: ${point.regulation} | log2FC: ${point.x.toFixed(2)} | -log10(adj p): ${point.y.toFixed(1)}</title>
      </circle>
    </g>`;
  }).join("");

  target.innerHTML = `
    <svg class="fallback-volcano" viewBox="0 0 ${width} ${height}" role="img" aria-label="Hoverable volcano marker view">
      <rect width="${width}" height="${height}" fill="#fff"></rect>
      <text x="${width / 2}" y="24" text-anchor="middle" class="fallback-title">${title}</text>
      <line x1="${mapX(0)}" x2="${mapX(0)}" y1="${pad.top}" y2="${height - pad.bottom}" class="axis-line"></line>
      <line x1="${pad.left}" x2="${width - pad.right}" y1="${height - pad.bottom}" y2="${height - pad.bottom}" class="axis-line"></line>
      <line x1="${mapX(-1)}" x2="${mapX(-1)}" y1="${pad.top}" y2="${height - pad.bottom}" class="threshold-line"></line>
      <line x1="${mapX(1)}" x2="${mapX(1)}" y1="${pad.top}" y2="${height - pad.bottom}" class="threshold-line"></line>
      <line x1="${pad.left}" x2="${width - pad.right}" y1="${mapY(1.3)}" y2="${mapY(1.3)}" class="pvalue-line"></line>
      ${markerDots}
      <text x="${width / 2}" y="${height - 18}" text-anchor="middle" class="axis-label">log2 fold change</text>
      <text x="18" y="${height / 2}" text-anchor="middle" transform="rotate(-90 18 ${height / 2})" class="axis-label">-log10(adjusted p-value)</text>
      <text x="${pad.left}" y="${height - 38}" class="tick-label">-5</text>
      <text x="${mapX(0)}" y="${height - 38}" text-anchor="middle" class="tick-label">0</text>
      <text x="${width - pad.right}" y="${height - 38}" text-anchor="end" class="tick-label">5</text>
    </svg>
    <p class="plotly-fallback">Hover over a dot to see the gene name and plotted marker details.</p>`;
}

window.addEventListener("resize", () => {
  const targets = document.querySelectorAll("#neuron-volcano-plot, #microglia-volcano-plot");
  if (volcanoRendered && window.Plotly) {
    targets.forEach((target) => Plotly.Plots.resize(target));
  }
});

window.addEventListener("popstate", () => {
  setActiveTab(getRequestedTab(), false, true);
});

const initialTab = validTabs.has(getRequestedTab()) ? getRequestedTab() : "findings";
history.replaceState({ tab: initialTab }, "", tabUrl(initialTab));
setActiveTab(initialTab, false, true);
