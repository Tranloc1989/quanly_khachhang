const state = { customers: [], stats: null, generatedAt: null, search: "", view: "home" };
const areaLabels = { TanKy: "Tân kỳ", DoLuong: "Đô lương", TongHop: "Tổng hợp" };
const statusOptions = [
  ["HoanThanh", "Hoàn thành", "#2b6122"],
  ["LenPhuongAn", "Lên phương án", "#86c47d"],
  ["DangXay", "Đang xây", "#457a4e"],
  ["SanXuat", "Sản xuất", "#5d9b65"],
  ["HuyDon", "Huỷ đơn", "#15371b"]
];
const statusLabels = Object.fromEntries(statusOptions.map(([value, label]) => [value, label]));
const statusColors = Object.fromEntries(statusOptions.map(([value, , color]) => [value, color]));

document.addEventListener("DOMContentLoaded", async () => {
  document.querySelectorAll(".tab").forEach(button => button.addEventListener("click", () => switchView(button.dataset.view)));
  document.getElementById("historyButton").addEventListener("click", () => switchView("history"));
  document.getElementById("searchInput").addEventListener("input", event => {
    state.search = normalizeText(event.target.value);
    renderCurrentRows();
  });
  const data = await fetch("data/customers.json", { cache: "no-store" }).then(x => x.json());
  state.customers = data.customers || [];
  state.stats = data.stats;
  state.generatedAt = data.generatedAt;
  render();
});

function render() {
  document.getElementById("generatedAt").textContent = "Cập nhật: " + formatDate(state.generatedAt);
  document.getElementById("statTotal").textContent = state.stats.total;
  document.getElementById("statTanKy").textContent = state.stats.tanKy;
  document.getElementById("statDoLuong").textContent = state.stats.doLuong;
  document.getElementById("statTongHop").textContent = state.stats.tongHop;
  document.getElementById("statDeleted").textContent = state.stats.deleted;
  document.getElementById("historyDeleted").textContent = state.stats.deleted;
  renderGauges();
  renderRows();
}

function switchView(view) {
  state.view = view;
  document.querySelectorAll(".tab").forEach(x => x.classList.toggle("active", x.dataset.view === view));
  document.getElementById("historyButton").classList.toggle("active", view === "history");
  document.querySelectorAll(".view").forEach(x => x.classList.remove("active"));
  const target = view === "home" ? "homeView" : view === "history" ? "historyView" : view === "info" ? "infoView" : "listView";
  document.getElementById(target).classList.add("active");
  renderCurrentRows();
}

function renderGauges() {
  const total = Math.max(1, state.stats.total);
  const grid = document.getElementById("gaugeGrid");
  if (!grid) return;
  grid.innerHTML = statusOptions.map(([value, label, color]) => {
    const count = statusCount(value), percent = Math.round(count / total * 100);
    return `<article class="gauge-item"><div class="gauge" style="--value:${percent * 1.8}deg; --color:${color}"><span>${percent}%</span></div><strong>${label}</strong><small>${count} khách hàng</small></article>`;
  }).join("");
}

function renderRows(area = null) {
  const source = area ? state.customers.filter(x => x.area === area) : state.customers;
  const rows = filtered(source);
  const body = document.getElementById("customerRows");
  if (!rows.length) {
    body.innerHTML = `<tr><td class="empty" colspan="8">Không có dữ liệu phù hợp.</td></tr>`;
    return;
  }
  body.innerHTML = rows.map(customer => `
    <tr>
      <td>${escapeHtml(customer.code)}</td>
      <td><strong>${escapeHtml(customer.name)}</strong></td>
      <td>${escapeHtml(customer.phone)}</td>
      <td>${escapeHtml(customer.address)}</td>
      <td>${areaLabels[customer.area] || ""}</td>
      <td><span class="status-pill" style="--pill:${statusColors[normalizeStatus(customer.status)]}">${statusLabel(customer.status)}</span></td>
      <td>${escapeHtml(customer.note)}</td>
      <td><small>${formatDate(customer.updatedAt)}</small></td>
    </tr>`).join("");
}

function renderCurrentRows() {
  if (state.view === "tanKy") renderRows("TanKy");
  if (state.view === "doLuong") renderRows("DoLuong");
  if (state.view === "tongHop") renderRows("TongHop");
}

function filtered(items) {
  if (!state.search) return items;
  return items.filter(x => normalizeText([x.code, x.name, x.phone, x.address, x.note, areaLabels[x.area], statusLabel(x.status)].join(" ")).includes(state.search));
}

function normalizeText(value) {
  return String(value || "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/đ/g, "d");
}
function statusCount(status) {
  const key = { HoanThanh: "hoanThanh", LenPhuongAn: "lenPhuongAn", DangXay: "dangXay", SanXuat: "sanXuat", HuyDon: "huyDon" }[status];
  return state.stats?.statuses?.[key] ?? 0;
}
function normalizeStatus(status) { return statusLabels[status] ? status : "LenPhuongAn"; }
function statusLabel(status) { return statusLabels[normalizeStatus(status)]; }
function formatDate(value) { return value ? new Intl.DateTimeFormat("vi-VN", { dateStyle: "short", timeStyle: "short" }).format(new Date(value)) : ""; }
function escapeHtml(value) { return String(value || "").replace(/[&<>"']/g, char => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;" }[char])); }