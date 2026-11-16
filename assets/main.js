"use strict";

const CONFIG = {
  user: "notthei",
  // 先頭に表示したいリポジトリ（この順で並ぶ）
  pinned: ["dll_injector", "NovaFinder", "proxy_checker", "WebHookTool", "CppUtils"],
  // 表示しないリポジトリ
  exclude: ["notthei", "notthei.github.io"],
  max: 9,
  cacheKey: "gh-repos-v1",
  cacheTtlMs: 60 * 60 * 1000,
};

function readCache() {
  try {
    const raw = sessionStorage.getItem(CONFIG.cacheKey);
    if (!raw) return null;
    const { at, data } = JSON.parse(raw);
    return Date.now() - at < CONFIG.cacheTtlMs ? data : null;
  } catch {
    return null;
  }
}

function writeCache(data) {
  try {
    sessionStorage.setItem(CONFIG.cacheKey, JSON.stringify({ at: Date.now(), data }));
  } catch {
    /* storage unavailable */
  }
}

async function fetchRepos() {
  const cached = readCache();
  if (cached) return cached;

  const url = `https://api.github.com/users/${encodeURIComponent(CONFIG.user)}/repos?per_page=100&sort=pushed`;
  const res = await fetch(url, { headers: { Accept: "application/vnd.github+json" } });
  if (!res.ok) throw new Error(`GitHub API ${res.status}`);

  const repos = (await res.json())
    .filter((r) => !r.fork && !r.archived && !CONFIG.exclude.includes(r.name))
    .map((r) => ({
      name: String(r.name),
      url: String(r.html_url),
      desc: r.description ? String(r.description) : "",
      lang: r.language ? String(r.language) : "",
      stars: Number(r.stargazers_count) || 0,
      pushed: String(r.pushed_at),
    }));

  writeCache(repos);
  return repos;
}

function sortRepos(repos) {
  const rank = (name) => {
    const i = CONFIG.pinned.indexOf(name);
    return i === -1 ? Infinity : i;
  };
  return [...repos].sort((a, b) => rank(a.name) - rank(b.name) || b.pushed.localeCompare(a.pushed));
}

function el(tag, props = {}, children = []) {
  const node = document.createElement(tag);
  for (const [k, v] of Object.entries(props)) {
    if (k === "text") node.textContent = v;
    else node.setAttribute(k, v);
  }
  for (const c of children) node.append(c);
  return node;
}

function isSafeGithubUrl(u) {
  try {
    const p = new URL(u);
    return p.protocol === "https:" && p.hostname === "github.com";
  } catch {
    return false;
  }
}

function renderRepo(r) {
  const href = isSafeGithubUrl(r.url) ? r.url : `https://github.com/${CONFIG.user}`;
  const meta = el("div", { class: "meta" });
  if (r.lang) meta.append(el("span", { class: "lang", text: r.lang }));
  meta.append(el("span", { text: `★ ${r.stars}` }));
  meta.append(el("span", { text: r.pushed.slice(0, 10) }));

  return el("article", { class: "card repo" }, [
    el("a", { class: "name", href, target: "_blank", rel: "noopener noreferrer", text: r.name }),
    el("p", { text: r.desc || "No description" }),
    meta,
  ]);
}

async function initRepos() {
  const box = document.getElementById("repos");
  if (!box) return;
  try {
    const repos = sortRepos(await fetchRepos()).slice(0, CONFIG.max);
    box.replaceChildren(...repos.map(renderRepo));
    if (repos.length === 0) box.replaceChildren(el("p", { class: "muted", text: "No repositories." }));
  } catch (e) {
    const link = el("a", { href: `https://github.com/${CONFIG.user}?tab=repositories`, target: "_blank", rel: "noopener noreferrer", text: "GitHub で見る" });
    box.replaceChildren(el("p", { class: "muted" }, [`リポジトリを取得できませんでした（${e.message}）。`, link]));
  }
}

function initAvatarFallback() {
  const img = document.getElementById("avatar");
  if (img) img.addEventListener("error", () => { img.hidden = true; }, { once: true });
}

document.getElementById("year").textContent = String(new Date().getFullYear());
initAvatarFallback();
initRepos();
