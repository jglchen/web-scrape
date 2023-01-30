import axios from 'axios';
import * as cheerio from 'cheerio';
import {getAPIRoute, getAuthorizationToken} from '@/lib/scrapelist';
import type { NextApiRequest, NextApiResponse } from 'next';

interface ResultItem {
    title: string;
    link: string;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse<ResultItem[]>) {
    try {
        if (req.method === 'POST'){
            const {url} = req.body;
            if (getAPIRoute(url) === '/api/hackernews' && getAuthorizationToken(req) === process.env.NEXT_PUBLIC_API_SECRECY){
                const {data} = await axios.get(url);
                const $ = cheerio.load(data);
                const results: ResultItem[] = [];
           
                $('tr.athing:has(td.votelinks) .titleline > a').each(function(index) {
                    const title = $(this).text().trim(); 
                    const link = $(this).attr('href')!; 
                    results.push({title, link});       
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
