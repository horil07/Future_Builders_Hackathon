(() => {
  const NEVER_FILL = /(password|otp|one.?time|captcha|cvv|card.?number|upi|bank|payment|declaration|agree|consent|terms|submit)/i;
  const FILE_KEYS = {
    resume: /(resume|cv|curriculum)/i,
    photo: /(photo|photograph|profile.?image|passport.?photo)/i,
    signature: /(signature|sign)/i,
    marksheet10: /(10th|secondary|matric).*?(marksheet|certificate)/i,
    marksheet12: /(12th|senior.?secondary|intermediate).*?(marksheet|certificate)/i,
    degreeCertificate: /(degree|graduation).*?(certificate|marksheet)/i,
    disabilityCertificate: /(disability|pwd|benchmark).*?(certificate|document)/i
  };

  const FIELD_RULES = [
    ["personal.fullName", ["full name", "candidate name", "applicant name", "name of candidate"]],
    ["personal.firstName", ["first name", "given name", "forename"]],
    ["personal.middleName", ["middle name"]],
    ["personal.lastName", ["last name", "surname", "family name"]],
    ["personal.dob", ["date of birth", "dob", "birth date"]],
    ["personal.gender", ["gender", "sex"]],
    ["personal.email", ["email", "e-mail", "email id"]],
    ["personal.phone", ["mobile", "mobile number", "phone", "contact number"]],
    ["personal.alternatePhone", ["alternate mobile", "alternate phone", "secondary phone"]],
    ["personal.nationality", ["nationality", "citizenship"]],
    ["personal.maritalStatus", ["marital status"]],
    ["address.line1", ["address line 1", "address1", "street address", "house no", "present address", "current address"]],
    ["address.line2", ["address line 2", "address2", "locality", "area"]],
    ["address.city", ["city", "town"]],
    ["address.district", ["district"]],
    ["address.state", ["state", "province"]],
    ["address.country", ["country"]],
    ["address.pincode", ["pincode", "pin code", "postal code", "zip code", "zipcode"]],
    ["identity.category", ["category", "caste category", "reservation category", "social category"]],
    ["identity.disability", ["disability", "pwd status", "person with disability", "benchmark disability"]],
    ["identity.disabilityPercent", ["disability percentage", "percentage of disability", "pwd percentage"]],
    ["identity.pan", ["pan", "pan number"]],
    ["education.tenthSchool", ["10th school", "secondary school", "matric school"]],
    ["education.tenthBoard", ["10th board", "secondary board", "matric board"]],
    ["education.tenthYear", ["10th passing year", "matric passing year"]],
    ["education.tenthPercent", ["10th percentage", "matric percentage", "secondary percentage"]],
    ["education.twelfthSchool", ["12th school", "senior secondary school", "intermediate school"]],
    ["education.twelfthBoard", ["12th board", "senior secondary board", "intermediate board"]],
    ["education.twelfthYear", ["12th passing year", "intermediate passing year"]],
    ["education.twelfthPercent", ["12th percentage", "intermediate percentage"]],
    ["education.degree", ["degree", "highest qualification", "qualification", "course"]],
    ["education.branch", ["branch", "specialization", "discipline", "major"]],
    ["education.college", ["college", "institute", "institution"]],
    ["education.university", ["university"]],
    ["education.graduationYear", ["graduation year", "year of passing", "passing year"]],
    ["education.cgpa", ["cgpa", "gpa"]],
    ["education.percentage", ["graduation percentage", "degree percentage", "percentage"]],
    ["experience.currentCompany", ["current company", "employer", "organization", "company name"]],
    ["experience.currentRole", ["current role", "job title", "designation", "position"]],
    ["experience.totalYears", ["total experience", "years of experience", "experience years"]],
    ["experience.currentCtc", ["current ctc", "current salary", "present salary"]],
    ["experience.expectedCtc", ["expected ctc", "expected salary"]],
    ["experience.noticePeriod", ["notice period", "availability to join", "joining availability"]],
    ["experience.summary", ["professional summary", "work summary", "about you", "profile summary"]],
    ["skills", ["skills", "technical skills", "key skills"]],
    ["links.linkedin", ["linkedin", "linkedin url", "linkedin profile"]],
    ["links.github", ["github", "github url", "github profile"]],
    ["links.portfolio", ["portfolio", "website", "personal website"]],
    ["preferences.preferredLocations", ["preferred location", "job location preference", "preferred cities"]],
    ["preferences.workAuthorization", ["work authorization", "authorized to work", "visa status"]],
    ["preferences.willingToRelocate", ["willing to relocate", "relocation"]]
  ];

  const normalize = s => (s || "").toLowerCase().replace(/[_\-./]+/g, " ").replace(/\s+/g, " ").trim();

  function fieldText(el) {
    const parts = [el.name, el.id, el.placeholder, el.getAttribute("aria-label"), el.getAttribute("data-testid")];
    if (el.labels) parts.push(...[...el.labels].map(l => l.innerText));
    const closestLabel = el.closest("label");
    if (closestLabel) parts.push(closestLabel.innerText);
    const parentText = el.parentElement?.innerText?.slice(0, 160);
    if (parentText) parts.push(parentText);
    return normalize(parts.filter(Boolean).join(" "));
  }

  function tokens(s) { return new Set(normalize(s).split(" ").filter(t => t.length > 1)); }
  function similarity(a, b) {
    const A = tokens(a), B = tokens(b); if (!A.size || !B.size) return 0;
    let inter = 0; A.forEach(x => B.has(x) && inter++);
    return inter / Math.sqrt(A.size * B.size);
  }

  function getValue(profile, path) {
    if (path === "skills") return Array.isArray(profile.skills) ? profile.skills.join(", ") : (profile.skills || "");
    return path.split(".").reduce((o, k) => o?.[k], profile) ?? "";
  }

  function chooseMapping(el, profile) {
    const text = fieldText(el);
    if (!text || NEVER_FILL.test(text) || el.disabled || el.readOnly) return null;
    if (text === "name" && profile.personal?.fullName) return { path: "personal.fullName", value: profile.personal.fullName, score: 0.98, text };
    let best = null;
    for (const [path, phrases] of FIELD_RULES) {
      const value = getValue(profile, path);
      if (value === "" || value == null) continue;
      let score = 0;
      for (const p of phrases) {
        const pn = normalize(p);
        if (text === pn) score = Math.max(score, 1);
        else if (text.includes(pn)) score = Math.max(score, 0.92);
        else score = Math.max(score, similarity(text, pn) * 0.82);
      }
      if (!best || score > best.score) best = { path, value, score };
    }
    return best && best.score >= 0.44 ? { ...best, text } : null;
  }

  function detectFileKey(el) {
    const text = fieldText(el);
    for (const [key, re] of Object.entries(FILE_KEYS)) if (re.test(text)) return key;
    return null;
  }

  function setNativeValue(el, value) {
    const tag = el.tagName.toLowerCase();
    const type = (el.type || "").toLowerCase();
    if (tag === "select") {
      const wanted = normalize(value);
      const options = [...el.options];
      const exact = options.find(o => normalize(o.value) === wanted || normalize(o.textContent) === wanted);
      const partial = options.find(o => normalize(o.textContent).includes(wanted) || wanted.includes(normalize(o.textContent)));
      const target = exact || partial;
      if (!target) return false;
      el.value = target.value;
    } else if (type === "checkbox") {
      const yes = /^(yes|true|1|y)$/i.test(String(value));
      el.checked = yes;
    } else if (type === "radio") {
      const name = el.name;
      const radios = [...document.querySelectorAll(`input[type="radio"]${name ? `[name="${CSS.escape(name)}"]` : ""}`)];
      const wanted = normalize(value);
      const target = radios.find(r => normalize(r.value) === wanted || fieldText(r).includes(wanted));
      if (!target) return false;
      target.checked = true;
      target.dispatchEvent(new Event("change", { bubbles: true }));
      return true;
    } else {
      const proto = tag === "textarea" ? HTMLTextAreaElement.prototype : HTMLInputElement.prototype;
      const setter = Object.getOwnPropertyDescriptor(proto, "value")?.set;
      if (setter) setter.call(el, value); else el.value = value;
    }
    el.dispatchEvent(new Event("input", { bubbles: true }));
    el.dispatchEvent(new Event("change", { bubbles: true }));
    el.dispatchEvent(new Event("blur", { bubbles: true }));
    return true;
  }

  async function attachFile(el, doc) {
    try {
      if (!doc?.dataUrl) return false;
      const res = await fetch(doc.dataUrl);
      const blob = await res.blob();
      const file = new File([blob], doc.name || "document", { type: doc.type || blob.type });
      const dt = new DataTransfer(); dt.items.add(file); el.files = dt.files;
      el.dispatchEvent(new Event("change", { bubbles: true }));
      return true;
    } catch { return false; }
  }

  function scan(profile) {
    const candidates = [...document.querySelectorAll("input, select, textarea")];
    const plan = [];
    for (const el of candidates) {
      const type = (el.type || "").toLowerCase();
      const text = fieldText(el);
      if (NEVER_FILL.test(text) || ["hidden", "password", "submit", "button", "reset"].includes(type)) continue;
      if (type === "file") {
        const key = detectFileKey(el);
        const doc = key ? profile.documents?.[key] : null;
        if (key && doc?.dataUrl) plan.push({ el, kind: "file", key, label: text || key, value: doc.name, confidence: 0.96 });
        continue;
      }
      const map = chooseMapping(el, profile);
      if (map) plan.push({ el, kind: "field", path: map.path, label: text || map.path, value: String(map.value), confidence: map.score });
    }
    return dedupe(plan);
  }

  function dedupe(plan) {
    const seenRadio = new Set();
    return plan.filter(item => {
      if (item.el.type === "radio" && item.el.name) {
        if (seenRadio.has(item.el.name)) return false;
        seenRadio.add(item.el.name);
      }
      return true;
    });
  }

  function clearHighlights() { document.querySelectorAll(".jaai-highlight").forEach(el => el.classList.remove("jaai-highlight")); }

  function showReview(plan) {
    document.getElementById("jaai-review-root")?.remove();
    clearHighlights(); plan.forEach(p => p.el.classList.add("jaai-highlight"));
    const root = document.createElement("div"); root.id = "jaai-review-root";
    root.innerHTML = `<div class="jaai-backdrop"></div><section class="jaai-panel">
      <div class="jaai-header"><div><h2>Review autofill</h2><div class="jaai-sub">${plan.length} suggested fields • Nothing will be submitted automatically</div></div><span class="jaai-badge">Local AI</span></div>
      <div class="jaai-list"></div>
      <div class="jaai-footer"><button class="jaai-btn jaai-secondary" data-action="cancel">Cancel</button><button class="jaai-btn jaai-primary" data-action="apply">Apply selected fields</button></div>
    </section>`;
    document.documentElement.appendChild(root);
    const list = root.querySelector(".jaai-list");
    plan.forEach((item, i) => {
      const row = document.createElement("div"); row.className = "jaai-row";
      row.innerHTML = `<input type="checkbox" checked data-check="${i}" aria-label="Include field"><div><div class="jaai-label">${escapeHtml(shortLabel(item.label))}</div><div class="jaai-meta">${escapeHtml(item.path || item.key)} • ${Math.round(item.confidence * 100)}% confidence</div>${item.kind === "file" ? `<div class="jaai-value">${escapeHtml(item.value)}</div>` : `<input class="jaai-value" data-value="${i}" value="${escapeAttr(item.value)}">`}</div>`;
      list.appendChild(row);
    });
    root.querySelector('[data-action="cancel"]').onclick = () => { root.remove(); clearHighlights(); };
    root.querySelector('[data-action="apply"]').onclick = async () => {
      let applied = 0, failed = 0;
      for (let i = 0; i < plan.length; i++) {
        const checked = root.querySelector(`[data-check="${i}"]`)?.checked;
        if (!checked) continue;
        const item = plan[i];
        let ok = false;
        if (item.kind === "file") ok = await attachFile(item.el, window.__JAAI_PROFILE.documents[item.key]);
        else {
          const edited = root.querySelector(`[data-value="${i}"]`)?.value ?? item.value;
          ok = setNativeValue(item.el, edited);
        }
        ok ? applied++ : failed++;
      }
      root.remove(); clearHighlights();
      alert(`Job Autofill AI: ${applied} field(s) filled${failed ? `, ${failed} could not be filled` : ""}. Please review the page before submitting.`);
    };
  }

  function shortLabel(s) { return s.length > 95 ? s.slice(0, 92) + "…" : s; }
  function escapeHtml(s) { return String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c])); }
  function escapeAttr(s) { return escapeHtml(s).replace(/`/g, '&#096;'); }

  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message?.type === "SCAN_AND_REVIEW") {
      chrome.runtime.sendMessage({ type: "GET_PROFILE" }, ({ profile }) => {
        window.__JAAI_PROFILE = profile;
        const plan = scan(profile);
        if (!plan.length) {
          sendResponse({ ok: true, count: 0 });
          alert("Job Autofill AI: No confident matches found on this page. Add more profile details or use a supported form field.");
          return;
        }
        showReview(plan);
        sendResponse({ ok: true, count: plan.length });
      });
      return true;
    }
    if (message?.type === "SCAN_ONLY") {
      chrome.runtime.sendMessage({ type: "GET_PROFILE" }, ({ profile }) => sendResponse({ ok: true, count: scan(profile).length }));
      return true;
    }
  });
})();
