import {withBrowser} from '@/lib/puppeteerlib';
import {getAPIRoute, getAuthorizationToken} from '@/lib/scrapelist';
import useragent from '@/lib/useragent';
import type { NextApiRequest, NextApiResponse } from 'next';

interface ResultItem {
    title: string;
    link: string;
}

export default async function handler (req: NextApiRequest, res: NextApiResponse<ResultItem[]>){
    try {
        if (req.method === 'POST'){
            const {url} = req.body;
            if (getAPIRoute(url) === '/api/reddit' && getAuthorizationToken(req) === process.env.NEXT_PUBLIC_API_SECRECY){
                const results = await withBrowser(async (browser: any) => {           
                    const page = await browser.newPage();
                    await page.setUserAgent(useragent);
                    await page.goto(url);
                
                    await page.waitForSelector('div > p.title > a');
                    return await page.evaluate(() => {
                        let resultArr: ResultItem[] = [];
                        let elements = document.querySelectorAll('div > p.title > a');
                        elements.forEach((elm: any) => {
                            const title = elm.innerText;
                            const link = elm.href;
                            resultArr.push({title, link});
                        });
                        return resultArr;
                    });
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