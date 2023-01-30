import puppeteer from 'puppeteer-core';
import edgeChromium from 'chrome-aws-lambda';
const LOCAL_CHROME_EXECUTABLE = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
import useragent from '@/lib/useragent';

export const withBrowser = async (fn: any) => {
    const executablePath = await edgeChromium.executablePath || LOCAL_CHROME_EXECUTABLE;
    const browser = await puppeteer.launch({
      executablePath,
      args: edgeChromium.args,
      headless: true,
    });
    try {
        return await fn(browser);
    }catch(error){
        throw error;
    } finally {
        if (browser) {
            await browser.close();
        }    
    }
}

export const withPage = (browser: any) => async (fn: any) => {
    const page = await browser.newPage();
    await page.setUserAgent(useragent);
    try {
        return await fn(page);
    }catch(error){
        throw error;
    } finally {
        await page.close();
    }
}
