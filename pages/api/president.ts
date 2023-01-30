import {withBrowser, withPage} from '@/lib/puppeteerlib';
import bluebird from 'bluebird';
import {getAPIRoute, getAuthorizationToken} from '@/lib/scrapelist';
import type { NextApiRequest, NextApiResponse } from 'next';

interface ResultItem {
    name: string;
    birthday: string;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse<ResultItem[]>) {
    try {
        if (req.method === 'POST'){
            const {url} = req.body;
            if (getAPIRoute(url) === '/api/president' &&  getAuthorizationToken(req) === process.env.NEXT_PUBLIC_API_SECRECY){
                const results = await withBrowser(async (browser: any) => {           
                    const urls = await withPage(browser)(async (page: any) => {
                        await page.goto(url);
                
                        const selecor = '.wikitable  tbody  b  a';
                        await page.waitForSelector(selecor);
                    
                        // @ts-ignore
                        return await page.$$eval(selecor, links => {
                            // @ts-ignore
                            return links.map(item => item.href);
                        });
                    });

                    return await bluebird.map(urls, async (url) => {    
                        return await withPage(browser)(async (page: any) => {
                            await page.goto(url);
                            const result = await page.evaluate(() => {
                                const name = (document.querySelector('.firstHeading') as any)?.innerText || '';
                                const birthday = (document.querySelector('.infobox-data .bday') as any)?.innerText || '';
                                return {name, birthday};
                            });
                            return result;
                        });
                    },{concurrency: 10});
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

