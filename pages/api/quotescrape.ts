// @ts-nocheck
import {withBrowser, withPage} from '@/lib/puppeteerlib';
import bluebird from 'bluebird';
import {getAPIRoute, getAuthorizationToken} from '@/lib/scrapelist';
import type { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
     try {
        if (req.method === 'POST'){
            const {url} = req.body;
            if (getAPIRoute(url) === '/api/quotescrape' && getAuthorizationToken(req) === process.env.NEXT_PUBLIC_API_SECRECY){
                const results = await withBrowser(async (browser) => {           
                    const selectList = await withPage(browser)(async (page) => {
                        await page.goto(url);    
            
                        await page.waitForSelector('#author');
                        const authorList = await page.evaluate(() => {
                            const arr = [];
                            const authList = document.querySelectorAll('#author > option'); 
                            authList.forEach(item => {
                                if (item.hasAttribute('value')){
                                    arr.push(item.getAttribute('value'));
                                }
                            });
                            return arr;
                        }); 
                        let selList = [];
                        const len = authorList.length;
                        for (let i = 0; i < len; i++){
                            await page.select('#author', authorList[i]);    
                            await page.waitForSelector('#tag');
                            const tagList = await page.evaluate((author) => {
                                const arr = [];
                                const tagArr = document.querySelectorAll('#tag > option'); 
                                tagArr.forEach(item => {
                                    if (item.hasAttribute('value')){
                                        arr.push({author: author, tag: item.getAttribute('value')});
                                    }
                                });
                                return arr;
                            }, authorList[i]);
                            selList = selList.concat(tagList);
                        }
                        return selList;
                    });
             
                    return await bluebird.map(selectList, async (selElm) => {    
                        return await withPage(browser)(async (page) => {
                            await page.goto(url);
                            
                            await page.waitForSelector('#author');
                            await page.select('#author', selElm.author);    
                      
                            await page.waitForSelector('#tag');
                            await page.select('#tag', selElm.tag);
                      
                            await page.click('.btn');
                            await page.waitForSelector('.quote');
                    
                            const quotes = await page.evaluate((author, tag) => {
                                let result = [];
                                const elements = document.querySelectorAll('.quote');
                                elements.forEach(item => {
                                   const quote = item.querySelector('.content') ? item.querySelector('.content').innerText.replace("“", '').replace("”", ''): null;
                                   result.push(quote);
                                });
                                if (result.length > 1){
                                    return {author: author, tag: tag, quote: result};
                                }
                                return {author: author, tag: tag, quote: result[0]};
                            }, selElm.author, selElm.tag);
                            return quotes; 
                    
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
