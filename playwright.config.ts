import {defineConfig} from "@playwright/test";
export default defineConfig({
 testDir:"tests/e2e",fullyParallel:false,
 reporter:[["list"],["html",{open:"never"}],["json",{outputFile:"test-results/e2e.json"}]],
 use:{baseURL:"http://127.0.0.1:4302",viewport:{width:390,height:844},contextOptions:{reducedMotion:"reduce"},trace:"retain-on-failure",launchOptions:process.env.PLAYWRIGHT_CHROME?{executablePath:process.env.PLAYWRIGHT_CHROME}:{}},
 webServer:{command:"node tests/server.mjs",url:"http://127.0.0.1:4302",reuseExistingServer:false,timeout:120000},
});