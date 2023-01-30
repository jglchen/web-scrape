import {getScrapeList} from '@/lib/scrapelist';
import type { NextApiRequest, NextApiResponse } from 'next';
import {ScrapeItem} from '@/lib/types';

export default async function handler(req: NextApiRequest, res: NextApiResponse<ScrapeItem[]>) {
    try {
        const dataList = await getScrapeList();
        res.status(200).json(dataList);
    } catch (e) {
        res.status(400).end();
    }
}
