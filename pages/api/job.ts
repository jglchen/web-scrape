import axios from 'axios';
import * as cheerio from 'cheerio';
import {getAPIRoute, getAuthorizationToken} from '@/lib/scrapelist';
import type { NextApiRequest, NextApiResponse } from 'next';

interface ResultItem {
    title: string;
    link: string;
    date: string;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse<ResultItem[]>) {
    try {
        if (req.method === 'POST'){
            const {url} = req.body;
            if (getAPIRoute(url) === '/api/job' &&  getAuthorizationToken(req) === process.env.NEXT_PUBLIC_API_SECRECY){
                const {data} = await axios.get(url);
                const $ = cheerio.load(data);
                const results: ResultItem[] = [];
     
                $('.listResults .fl1').each((idx, el) => {
                    const title = $(el).find('.fs-body3').text().replace(/s\s+/g, '').trim();
                    const link = $(el).find('.s-link').attr('href');
                    const date = $(el).find('.fc-orange-400').text();
                    const elm = {
                        title,
                        link: `https://stackoverflow.com${link}`,
                        date
                    }
                    results.push(elm);
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

