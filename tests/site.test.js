import { beforeEach, afterEach, it, expect, vi } from "vitest";
import { JSDOM } from "jsdom";
import fs from "node:fs";
import { imageMarkup } from "../image-markup.js";
const html = fs.readFileSync(new URL("../index.html", import.meta.url), "utf8");
let dom, observers = [];
beforeEach(() => { vi.resetModules(); vi.useFakeTimers(); vi.setSystemTime(new Date("2026-10-14T12:00:00Z")); });
afterEach(() => { vi.clearAllTimers(); vi.useRealTimers(); dom?.window.close(); vi.unstubAllGlobals(); vi.restoreAllMocks(); observers = []; });
async function mount(options = {}) {
  dom = new JSDOM(html, { url: "http://localhost/", pretendToBeVisual: true });
  const { window } = dom, doc = window.document;
  for (const id of options.missing || []) doc.getElementById(id)?.removeAttribute("id");
  if (options.brokenImages) doc.getElementById("imgdata").textContent = "{bad";
  if (options.emptyImages) doc.getElementById("imgdata").textContent = "{}";
  if (options.emptyTarget) doc.querySelector(".stat-num").setAttribute("data-to", "");
  Object.defineProperty(window, "innerHeight", { value: options.height ?? 800, configurable: true });
  window.matchMedia = query => ({ matches: query.includes("reduced") ? Boolean(options.reduce) : Boolean(options.dark) });
  window.Element.prototype.scrollIntoView = vi.fn();
  window.HTMLElement.prototype.getBoundingClientRect = function() {
    return { left: 10, top: options.top ?? 100, bottom: options.bottom ?? 200, width: options.width ?? 100, height: 100 };
  };
  const frame = doc.getElementById("cmpFrame");
  if (frame) frame.setPointerCapture = vi.fn();
  class Observer {
    constructor(callback) { this.callback = callback; this.nodes = []; this.disconnect = vi.fn(); this.unobserve = vi.fn(); observers.push(this); }
    observe(node) { this.nodes.push(node); }
    emit(visible = true) { this.callback(this.nodes.map(target => ({ target, isIntersecting: visible }))); }
  }
  if (options.observer !== false) { window.IntersectionObserver = Observer; vi.stubGlobal("IntersectionObserver", Observer); }
  else { delete window.IntersectionObserver; }
  if (options.saved) window.localStorage.setItem("tr-theme", options.saved);
  if (options.storageError) {
    Object.defineProperty(window.localStorage, "getItem", { value: () => { throw Error("storage disabled"); } });
    Object.defineProperty(window.localStorage, "setItem", { value: () => { throw Error("storage disabled"); } });
  }
  vi.stubGlobal("window", window); vi.stubGlobal("document", doc); vi.stubGlobal("localStorage", window.localStorage);
  await import("../app.js");
  return { window, doc, frame, click: selector => doc.querySelector(selector).click(),
    key: (element, key, shiftKey = false) => element.dispatchEvent(new window.KeyboardEvent("keydown", { key, shiftKey, bubbles: true, cancelable: true })) };
}
it("rend les photos sans perdre les dimensions ni casser les alternatives", () => {
  expect(imageMarkup({ one: { uri: "/photo.jpg", w: 20, h: 10 } }, "one", 'Toit "avant"', true)).toContain('alt="Toit &quot;avant&quot;" width="20" height="10" loading="eager"');
  expect(imageMarkup({}, "missing")).toBe('<img src="" alt="" loading="lazy" decoding="async">');
});
it("navigation, thèmes et devis couvrent les parcours valides et les erreurs", async () => {
  const { doc, window, click, key } = await mount({ reduce: true });
  expect(doc.querySelectorAll("#acTrack .review")).toHaveLength(12);
  expect(doc.documentElement).toHaveProperty("className", expect.stringContaining("js"));
  click("#themeBtn"); expect(doc.documentElement.getAttribute("data-theme")).toBe("dark");
  click("#themeBtn"); expect(doc.documentElement.getAttribute("data-theme")).toBe("light");
  click("#navToggle"); expect(doc.getElementById("navToggle").getAttribute("aria-expanded")).toBe("true");
  click("#menu"); expect(doc.getElementById("menu").classList.contains("is-open")).toBe(true);
  click("#menu a"); expect(doc.getElementById("menu").classList.contains("is-open")).toBe(false);
  Object.defineProperty(window, "scrollY", { value: 100 }); window.dispatchEvent(new window.Event("scroll"));
  expect(doc.getElementById("nav").classList.contains("is-scrolled")).toBe(true);
  const triggers = [...doc.querySelectorAll("[data-devis]")].filter(el => !el.closest("#stats"));
  for (const el of triggers) { el.click(); key(el, "Enter"); key(el, " "); key(el, "x"); }
  doc.body.click(); key(doc.body, "Enter");
  doc.querySelector("#stats .stat").click(); doc.getElementById("stats").click();
  const form = doc.getElementById("devisForm");
  form.dispatchEvent(new window.Event("submit", { bubbles: true, cancelable: true }));
  expect(doc.getElementById("formOk").classList.contains("is-on")).toBe(false);
  doc.getElementById("f-nom").value = "Camille";
  form.dispatchEvent(new window.Event("submit", { cancelable: true }));
  expect(doc.getElementById("formOk").classList.contains("is-on")).toBe(false);
  doc.getElementById("f-tel").value = "0600000000";
  form.dispatchEvent(new window.Event("submit", { cancelable: true }));
  expect(doc.getElementById("formOk").classList.contains("is-on")).toBe(true);
  expect(form.querySelector("button[type=submit]").textContent).toBe("Demande envoyée ✓");
  expect(doc.getElementById("year").textContent).toBe("2026");
  await vi.advanceTimersByTimeAsync(4100);
});
it("filtre les réalisations et navigue dans la lightbox au clic et au clavier", async () => {
  const { doc, click, key } = await mount({ reduce: true });
  expect(doc.querySelectorAll(".shot")).toHaveLength(9);
  click("#filters");
  for (const button of doc.querySelectorAll(".filter")) button.click();
  doc.querySelector('.filter[data-cat="zinguerie"]').click();
  expect(doc.querySelectorAll(".shot:not(.is-hidden)")).toHaveLength(2);
  click("#gallery");
  click(".shot:not(.is-hidden)");
  expect(doc.querySelector(".lb").classList.contains("is-open")).toBe(true);
  const initial = doc.getElementById("lbCap").textContent;
  click('.lb [data-d="1"]'); expect(doc.getElementById("lbCap").textContent).not.toBe(initial);
  click('.lb [data-d="-1"]'); expect(doc.getElementById("lbCap").textContent).toBe(initial);
  key(doc.body, "ArrowRight"); key(doc.body, "ArrowLeft"); key(doc.body, "x"); click("#lbStage");
  key(doc.body, "Escape"); expect(doc.querySelector(".lb").classList.contains("is-open")).toBe(false);
  click('.lb [data-d="1"]'); // Closed-state navigation stays safe.
  doc.querySelector(".lb")._vis = undefined;
  click('.lb [data-d="-1"]');
  click(".shot:not(.is-hidden)"); click(".lb-close");
  click(".shot:not(.is-hidden)"); click(".lb");
});
it("compare avant/après au pointeur et avec toutes les commandes clavier", async () => {
  const { doc, frame, window, key } = await mount({ reduce: true });
  const handle = doc.getElementById("cmpHandle"), cmp = doc.getElementById("cmp");
  frame.dispatchEvent(new window.MouseEvent("pointermove", { clientX: 50 }));
  frame.dispatchEvent(new window.MouseEvent("pointerdown", { clientX: -20, bubbles: true }));
  expect(handle.getAttribute("aria-valuenow")).toBe("0");
  frame.dispatchEvent(new window.MouseEvent("pointermove", { clientX: 500 }));
  expect(handle.getAttribute("aria-valuenow")).toBe("100");
  frame.dispatchEvent(new window.Event("pointerup")); expect(cmp.classList.contains("dragging")).toBe(false);
  frame.dispatchEvent(new window.Event("pointercancel"));
  handle.dispatchEvent(new window.MouseEvent("pointerdown", { clientX: 60, bubbles: true }));
  for (const k of ["ArrowLeft","ArrowDown","ArrowRight","ArrowUp","Home","End","PageDown","PageUp","x"]) key(handle, k);
  key(handle, "ArrowLeft", true); handle.click(); window.dispatchEvent(new window.Event("resize"));
  expect(+handle.getAttribute("aria-valuenow")).toBeGreaterThanOrEqual(0);
  expect(+handle.getAttribute("aria-valuenow")).toBeLessThanOrEqual(100);
});
it("anime les compteurs et révèle les contenus sans dépendre d’un observer parfait", async () => {
  const { doc, window } = await mount();
  for (const observer of observers) { observer.emit(false); observer.emit(); observer.emit(); }
  await vi.advanceTimersByTimeAsync(2200);
  expect(doc.getElementById("cmpHandle").getAttribute("aria-valuenow")).toBe("50");
  for (const el of doc.querySelectorAll(".stat-num")) expect(el.textContent).toBe(el.getAttribute("data-to"));
  for (const el of doc.querySelectorAll(".reveal")) expect(el.classList.contains("is-in")).toBe(true);
  window.dispatchEvent(new window.Event("load")); window.dispatchEvent(new window.Event("scroll"));
  await vi.advanceTimersByTimeAsync(2000);
});
it("les animations hors écran ne masquent pas le contenu et leur interaction les interrompt", async () => {
  const { doc, window, frame } = await mount({ observer: false, top: 2000, bottom: 2100 });
  window.dispatchEvent(new window.Event("scroll"));
  await vi.advanceTimersByTimeAsync(600);
  frame.getBoundingClientRect = () => ({ top: 100, bottom: 500, width: 100, left: 0 });
  window.dispatchEvent(new window.Event("scroll"));
  expect(doc.getElementById("cmp").classList.contains("is-anim")).toBe(true);
  frame.dispatchEvent(new window.MouseEvent("pointerdown", { clientX: 30 }));
  await vi.advanceTimersByTimeAsync(5000);
  expect(doc.getElementById("cmp").classList.contains("is-anim")).toBe(false);
});
it.each([
  { saved: "dark" }, { saved: "light" }, { dark: true }, { storageError: true },
  { brokenImages: true }, { emptyImages: true }, { emptyTarget: true },
  { missing: ["artisanMedia","stats","cmp","miniReviews","zoneMap","acTrack","svc6-01"] },
  { missing: ["f-type","f-nom","devis","realisations"], reduce: false },
  { observer: false, reduce: true, height: 0 },
  { width: 0 },
])("garde un comportement sûr avec des options ou des médias indisponibles (%j)", async options => {
  const { doc, window, frame, click } = await mount(options);
  click("#themeBtn");
  const trigger = [...doc.querySelectorAll("[data-devis]")].find(el => !el.closest("#stats")); trigger.click();
  const extra = doc.createElement("button"); extra.setAttribute("data-devis", "Inconnue"); doc.body.append(extra); extra.click();
  extra.setAttribute("data-devis", ""); extra.click();
  if (frame) {
    frame.setPointerCapture = () => { throw Error("not supported"); };
    frame.dispatchEvent(new window.MouseEvent("pointerdown", { clientX: 0 }));
  }
  for (const observer of observers) { observer.emit(false); observer.emit(); }
  window.dispatchEvent(new window.Event("load")); window.dispatchEvent(new window.Event("scroll"));
  await vi.advanceTimersByTimeAsync(5000);
  expect(doc.querySelectorAll(".shot")).toHaveLength(9);
});
it("accepte les navigateurs dont scrollIntoView ou focus ont des capacités réduites", async () => {
  const { doc, click } = await mount({ reduce: true });
  const scroll = doc.defaultView.Element.prototype.scrollIntoView;
  scroll.mockImplementationOnce(() => { throw Error("options unsupported"); });
  [...doc.querySelectorAll("[data-devis]")].find(el => !el.closest("#stats")).click();
  expect(scroll).toHaveBeenCalledTimes(2);
  scroll.mockImplementation(() => { throw Error("scroll unsupported"); });
  doc.getElementById("f-nom").focus = () => { throw Error("focus unsupported"); };
  [...doc.querySelectorAll("[data-devis]")].find(el => !el.closest("#stats")).click();
  await vi.advanceTimersByTimeAsync(1);
  expect(doc.getElementById("devis")).not.toBeNull();
});

it("rend les trois avis rapides si leur conteneur est présent", async () => {
  const {doc}=await mount({reduce:true});
  const container=doc.createElement("div");container.id="miniReviews";doc.body.append(container);
  vi.resetModules();await import("../app.js");
  expect(container.querySelectorAll(".mp-card")).toHaveLength(3);
  expect(container.textContent).toContain("Avis Google");
});
it("débloque les compteurs invisibles et révèle les éléments proches du viewport", async () => {
  const {doc,window}=await mount({top:2000,bottom:2100,height:0});
  await vi.advanceTimersByTimeAsync(4100);
  for(const el of doc.querySelectorAll(".stat-num"))expect(el.textContent).toBe(el.getAttribute("data-to"));
  dom.window.HTMLElement.prototype.getBoundingClientRect=()=>({top:10,bottom:100,width:100,left:0});
  for(const el of doc.querySelectorAll(".reveal"))el.classList.remove("is-in");
  window.dispatchEvent(new window.Event("load"));
  for(const el of doc.querySelectorAll(".reveal"))expect(el.classList.contains("is-in")).toBe(true);
  window.dispatchEvent(new window.Event("scroll"));
});
it("l’interaction gagne sur les callbacks d’introduction déjà en attente", async () => {
  const {doc,frame}=await mount({height:0});
  const comparator=observers.find(observer=>observer.nodes.includes(frame));
  comparator.emit();comparator.emit();
  vi.spyOn(globalThis,"clearTimeout").mockImplementation(()=>{});
  frame.dispatchEvent(new dom.window.MouseEvent("pointerdown",{clientX:30}));
  const position=doc.getElementById("cmpHandle").getAttribute("aria-valuenow");
  await vi.advanceTimersByTimeAsync(2200);
  expect(doc.getElementById("cmpHandle").getAttribute("aria-valuenow")).toBe(position);
});
it("tolère un choix de devis sans valeur explicite et une statistique sans cible",async()=>{
 const {doc}=await mount({top:2000});
 const option=doc.querySelector("#f-type option:nth-child(2)");option.value="";
 const button=doc.createElement("button");button.setAttribute("data-devis",option.text);doc.body.append(button);button.click();
 const first=doc.querySelector(".stat-num");first.setAttribute("data-to","0");first.textContent="0";
 await vi.advanceTimersByTimeAsync(4100);expect(first.textContent).toBe("0");
});
