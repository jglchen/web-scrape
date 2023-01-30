// @ts-nocheck
import {withBrowser} from '@/lib/puppeteerlib';
import {getAPIRoute, getAuthorizationToken} from '@/lib/scrapelist';
import useragent from '@/lib/useragent';
import type { NextApiRequest, NextApiResponse } from 'next';

interface ResultItem {
    name: string;
    capital: string;
    population: number;
    area: number;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse<ResultItem[]>){
    try {
        if (req.method === 'POST'){
            const {url} = req.body;
            if (getAPIRoute(url) === '/api/country' && getAuthorizationToken(req) === process.env.NEXT_PUBLIC_API_SECRECY){
                const results = await withBrowser(async (browser: any) => {           
                    const page = await browser.newPage();
                    await page.setUserAgent(useragent);
                    await page.goto(url);
                    
                    await page.waitForSelector('section#countries');
                    const results = await page.evaluate(() => {
                        let resultArr: ResultItem[] = [];
                        let elements = document.querySelectorAll('div.col-md-4.country');
                        elements.forEach((elm) => {
                            const name = (elm.querySelector('.country-name') as any).innerText.trim();
                            const capital = (elm.querySelector('.country-capital') as any).innerText.trim();
                            const population = +(elm.querySelector('.country-population') as any).innerText;
                            const area = +(elm.querySelector('.country-area') as any).innerText;
                            resultArr.push({name, capital, population, area});
                        });
                        return resultArr;
                    });
                    return results;
                });
                res.status(200).json(results);
            }else{
                res.status(200).end();
            }
        }else{
            res.status(200).end();
        }
    } catch (e) {
        res.status(400).end();
    }
}
