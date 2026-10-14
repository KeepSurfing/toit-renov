import {test,expect} from "@playwright/test";
test("navigation mobile et préférence de thème persistante",async({page})=>{
 await page.goto("/");await page.locator("#themeBtn").click();const theme=await page.locator("html").getAttribute("data-theme");await page.reload();await expect(page.locator("html")).toHaveAttribute("data-theme",theme!);
 await page.locator("#navToggle").click();await expect(page.locator("#navToggle")).toHaveAttribute("aria-expanded","true");await page.locator("#menu a").first().click();await expect(page.locator("#navToggle")).toHaveAttribute("aria-expanded","false");
});
test("galerie, fermeture au clavier et formulaire de démonstration",async({page})=>{
 await page.goto("/");await page.locator("#gallery .shot").first().click();await expect(page.locator(".lb")).toHaveClass(/is-open/);await page.keyboard.press("ArrowRight");await page.keyboard.press("Escape");await expect(page.locator(".lb")).not.toHaveClass(/is-open/);
 const sends:string[]=[];page.on("request",r=>{if(r.method()==="POST")sends.push(r.url());});
 await page.locator("#devisForm").scrollIntoViewIfNeeded();await page.locator("#devisForm button[type=submit]").click();await expect(page.locator("#formOk")).not.toHaveClass(/is-on/);
 await page.locator("#f-nom").fill("QA");await page.locator("#f-tel").fill("0600000000");await page.locator("#devisForm button[type=submit]").click();await expect(page.locator("#formOk")).toHaveClass(/is-on/);expect(sends).toEqual([]);
});