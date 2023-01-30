import axios from 'axios';
import * as cheerio from 'cheerio';
import {getAPIRoute, getAuthorizationToken} from '@/lib/scrapelist';
import type { NextApiRequest, NextApiResponse } from 'next';

interface UrlItem {
    name: string;
    link: string;
}

interface ResultItem {
    name: string;
    emailAddress: string;
    link: string;
    phone: string;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse<(ResultItem | undefined)[]>) {
    try {
        if (req.method === 'POST'){
            const {url} = req.body;
            if (getAPIRoute(url) === '/api/restaurant' &&  getAuthorizationToken(req) === process.env.NEXT_PUBLIC_API_SECRECY){
                const {data} = await axios.get(url);
                const urlList: UrlItem[] = [];
                const $ = cheerio.load(data);
                $('a.business-name').each((index, el) => {
                    urlList.push({name: $(el).text(), link: $(el).attr('href')!});
                });
                //Obtain url host 
                const urlObj = new URL(url);
                const urlHost = urlObj.origin;
                const results: (ResultItem | undefined) [] = await Promise.all(
                    urlList.map((item)  => getDetailData(urlHost + item.link, item.name))
                );
            
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

async function getDetailData(url: string, comName: string) {
    try {
        const {data} = await axios.get(url);
        const $ = cheerio.load(data);
        const link = url;
        let emailAddress = $('a.email-business').attr('href');
        emailAddress = emailAddress ? emailAddress.replace('mailto:', ''): '';
        const name = comName || $('h1').text();
        const phone = $('p.phone').text().replace('Phone:', '').trim();

        return {
            name, 
            emailAddress,
            link,
            phone,
        };    
    }catch(e){
        console.error(e);
    }
}

