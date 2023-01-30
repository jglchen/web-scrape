import fs from 'fs';
import path from 'path';
import db from '@/lib/firestore';
import {getAuthorizationToken} from '@/lib/scrapelist';
import type { NextApiRequest, NextApiResponse } from 'next';
import { SavedData } from '@/lib/types';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    const { savedpath } = req.query;
    try {
        if (req.method === 'GET' && getAuthorizationToken(req) === process.env.NEXT_PUBLIC_API_SECRECY){
            const docRef = db.collection('webScrape').doc(savedpath as string);
            const doc = await docRef.get();
            if (doc.exists){
                const {data} = doc.data() as SavedData;
                res.status(200).json(data);
            }else{
                const resultsDirectory = path.join(process.cwd(), 'results');
                const fileName = savedpath + '.txt';
                const fullPath = path.join(resultsDirectory, fileName); 
                if (fs.existsSync(fullPath)) {
                   const fileContents = fs.readFileSync(fullPath, {encoding: 'utf8'});
                   await docRef.set({created: new Date().toISOString(), data: JSON.parse(fileContents)});
                   res.status(200).json(fileContents);
                }else{
                   res.status(200).end();
                } 
            }
        }else{
            res.status(200).end();
        }
    } catch (e) {
        res.status(400).end();
    }
}
