import {withBrowser} from '@/lib/puppeteerlib';
import {getAPIRoute, getAuthorizationToken} from '@/lib/scrapelist';
import useragent from '@/lib/useragent';
import type { NextApiRequest, NextApiResponse } from 'next';

interface ResultItem {
    Currency: string;
    CurrencyName: string;
    ExchangeRate: number;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse<ResultItem[]>) {
    try {
        if (req.method === 'POST'){
            const {url} = req.body;
            if (getAPIRoute(url) === '/api/iban' && getAuthorizationToken(req) === process.env.NEXT_PUBLIC_API_SECRECY){
                const results = await withBrowser(async (browser: any) => {           
                    const page = await browser.newPage();
                    await page.setUserAgent(useragent);
                    await page.goto(url);
            
                    await page.waitForSelector('.table.table-bordered.table-hover.downloads > tbody > tr');
                    const results = await page.evaluate(() => {
                        let resultArr: ResultItem[] = [];
                        let elements = document.querySelectorAll('.table.table-bordered.table-hover.downloads > tbody > tr');
                        elements.forEach((elm) => {
                            const Currency = (elm.querySelector('td') as any).innerText.trim();
                            const CurrencyName = (elm.querySelector('td:nth-child(2)') as any).innerText;
                            const ExchangeRate = +(elm.querySelector('td:nth-child(3)') as any).innerText;
                            resultArr.push({Currency, CurrencyName, ExchangeRate});
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