// @ts-nocheck
import {withBrowser, withPage} from '@/lib/puppeteerlib';
import bluebird from 'bluebird';
import {getAPIRoute, getAuthorizationToken} from '@/lib/scrapelist';
import useragent from '@/lib/useragent';
import type { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    try {
        if (req.method === 'POST'){
            const {url} = req.body;
            if (getAPIRoute(url) === '/api/bookscraper' && getAuthorizationToken(req) === process.env.NEXT_PUBLIC_API_SECRECY){
                const results = await withBrowser(async (browser) => {           
                    const maxPage = 3;
                    let nPage = 1;
                    let urls = [];
                    const page = await browser.newPage();
                    const navigationPromise = page.waitForNavigation({waitUntil: "networkidle2"});
                    await page.setUserAgent(useragent);
                    try{
                        await page.goto(url);
                        await getLinkUrls();
                    }catch(e){
                        console.error(e);
                    }
                    
                    // @ts-nocheck
                    async function getLinkUrls(){
                        await navigationPromise;
                        await page.waitForSelector('.page_inner');
                        // Get the link to all the required books
                        const links = await page.$$eval('section ol > li', links => {
                            // Make sure the book to be scraped is in stock
                            links = links.filter(link => {
                                const stockStr = link.querySelector('p.instock.availability').innerText.trim();
                                return stockStr === "In stock";
                            })
                            // Extract the links from the data
                            links = links.map(el => el.querySelector('h3 > a').href)
                            return links;
                        });
                        urls = urls.concat(links);
            
                        let nextButtonExist = false;
                        if (nPage < maxPage){
                            try{
                                await page.$eval('.next > a', a => a.href);
                                nextButtonExist = true;
                            }
                            catch(err){
                                nextButtonExist = false;
                            }          
                        }
                        if (nextButtonExist){
                            nPage++;
                            await page.click('.next > a');
                            return getLinkUrls();
                        }
                    }
                
                    //return await Promise.all(urls.map(async (url) => {
                    return await bluebird.map(urls, async (url) => {    
                        return await withPage(browser)(async (page) => {
                            await page.goto(url);
                            const result = await page.evaluate(() => {
                                const bookTitle = document.querySelector('.product_main > h1').innerText;
                                const price = document.querySelector('.product_main > .price_color').innerText;
                                const strAvailable = document.querySelector('.instock.availability').innerText.trim();
                                let regexp = /^In stock \((\d*) available\)$/;
                                const noAvailable = strAvailable.match(regexp) ? Number(strAvailable.match(regexp)[1]): 0;
                                const thumbnail = document.querySelector('.thumbnail img').src;
                                const description = document.querySelector('#product_description').nextElementSibling ? document.querySelector('#product_description').nextElementSibling.innerText: '';
                                let upc;
                                const elms = document.querySelectorAll('.table.table-striped > tbody > tr');
                                for (let elm of elms){
                                   if (elm.querySelector('th').innerText === 'UPC'){
                                       upc = elm.querySelector('td').innerText;
                                       break;
                                   }
                                }
                                return {bookTitle, price, noAvailable, thumbnail, description, upc};
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
