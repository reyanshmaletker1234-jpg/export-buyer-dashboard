const defaultLeads = [
  {
    company: "Zen Sound & Wellness Studio",
    product: "Singing Bowls",
    source: "Google Maps API",
    email: "buyer@zensoundusa.com",
    phone: "+1-713-555-0192",
    valid: true,
    type: "B2B Buyer",
    status: "Pending"
  },
  {
    company: "Houston Home Decor Gallery",
    product: "Home Decor",
    source: "LinkedIn B2B",
    email: "purchasing@houstondecor.com",
    phone: "+1-713-555-0144",
    valid: true,
    type: "B2B Buyer",
    status: "Pending"
  },
  {
    company: "Sarah Jenkins",
    product: "Singing Bowls",
    source: "Google Maps API",
    email: "sarah.j99@gmail.com",
    phone: "+1-212-555-0188",
    valid: true,
    type: "Individual",
    status: "Skipped"
  },
  {
    company: "Texas Lighting & Brass",
    product: "Lamps",
    source: "ImportYeti",
    email: "sales@@texaslighting..com",
    phone: "+1-512-555-0109",
    valid: false,
    type: "Unverified",
    status: "Blocked"
  }
];

let leads = JSON.parse(localStorage.getItem("exportFlowLeads")) || [...defaultLeads];
let blockedCount = Number(localStorage.getItem("exportFlowBlocked")) || 1;
let apiCounter = 1;

function saveState() {
  localStorage.setItem("exportFlowLeads", JSON.stringify(leads));
  localStorage.setItem("exportFlowBlocked", blockedCount);
}

function showAlert(msg, type) {
  const box = document.getElementById("alertBox");
  box.className = "alert " + type;
  box.innerText = msg;
}

function validateEmail(email) {
  return /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(email);
}

function classifyBuyer(company, email) {
  const freeDomains = ["gmail.com", "yahoo.com", "hotmail.com", "outlook.com"];
  const domain = email.split("@").pop().toLowerCase();
  const b2bWords = ["llc", "inc", "gallery", "studio", "imports", "store", "decor", "wholesale", "showroom"];
  if (!freeDomains.includes(domain) || b2bWords.some(w => company.toLowerCase().includes(w))) {
    return "B2B Buyer";
  }
  return "Individual";
}

function render() {
  const tbody = document.getElementById("tableBody");
  tbody.innerHTML = leads.map(l => `
    <tr>
      <td><strong>${l.company}</strong><br><small style="color:#64748b">${l.phone || ""}</small></td>
      <td>${l.product}</td>
      <td>${l.source}</td>
      <td>${l.email}</td>
      <td><span class="badge ${l.valid ? "valid" : "invalid"}">${l.valid ? "Valid" : "Invalid"}</span></td>
      <td><span class="badge ${l.type === "B2B Buyer" ? "b2b" : "indiv"}">${l.type}</span></td>
      <td><strong>${l.status}</strong></td>
    </tr>
  `).join("");

  document.getElementById("statTotal").innerText = leads.length;
  document.getElementById("statB2B").innerText = leads.filter(l => l.valid && l.type === "B2B Buyer").length;
  document.getElementById("statBlocked").innerText = blockedCount + leads.filter(l => !l.valid).length;
  document.getElementById("statSent").innerText = leads.filter(l => l.status.includes("Sent")).length;
}

function processAndInsert(company, product, source, email, phone) {
  email = email.trim().toLowerCase();
  if (leads.some(l => l.email === email)) {
    blockedCount++;
    saveState();
    render();
    showAlert("Duplicate Prevented: " + email + " is already in the database!", "error");
    return;
  }

  const isValid = validateEmail(email);
  const type = isValid ? classifyBuyer(company, email) : "Unverified";
  const status = !isValid ? "Blocked" : (type === "B2B Buyer" ? "Pending" : "Skipped");

  leads.unshift({ company, product, source, email, phone, valid: isValid, type, status });
  saveState();
  render();
  showAlert(
    isValid ? "Added " + company + " — Classified as " + type + "." : "Added " + company + " — Flagged Invalid Email.",
    isValid ? "success" : "error"
  );
}

function simulateApiFetch() {
  const keyword = document.getElementById("apiKeyword").value || "Home Decor";
  const loc = document.getElementById("apiLocation").value;
  const source = document.getElementById("apiSource").value;
  const cityName = loc.split(",")[0].trim();
  const citySlug = cityName.toLowerCase().replace(/\s+/g, "");

  const company = cityName + " Artisan Imports #" + apiCounter + " LLC";
  const email = "purchasing" + apiCounter + "@" + citySlug + "artisan.com";
  apiCounter++;

  processAndInsert(company, keyword, source, email, "+1-800-555-019" + (apiCounter % 9));
}

function addManualLead(e) {
  e.preventDefault();
  processAndInsert(
    document.getElementById("inCompany").value,
    document.getElementById("inProduct").value,
    "Manual Upload",
    document.getElementById("inEmail").value,
    document.getElementById("inPhone").value
  );
  e.target.reset();
}

function sendBulkOutreach() {
  let sentNow = 0;
  leads.forEach(l => {
    if (l.valid && l.type === "B2B Buyer" && l.status === "Pending") {
      l.status = "Sent (PDF Attached)";
      sentNow++;
    }
  });
  saveState();
  render();
  showAlert(
    sentNow > 0 ? "Gmail API Outreach Complete: Sent " + sentNow + " emails with catalog PDF!" : "No pending valid B2B buyers left to email.",
    "success"
  );
}

function exportCSV() {
  const rows = [
    ["Company", "Product", "Source", "Email", "Phone", "Valid", "Type", "Status"],
    ...leads.map(l => [l.company, l.product, l.source, l.email, l.phone, l.valid, l.type, l.status])
  ];
  const csv = rows.map(r => r.join(",")).join("\n");
  const blob = new Blob([csv], { type: "text/csv" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = "us_export_buyers.csv";
  a.click();
}

function resetDemoData() {
  localStorage.clear();
  leads = [...defaultLeads];
  blockedCount = 1;
  apiCounter = 1;
  render();
  showAlert("Demo database reset to initial state.", "success");
}

render();
