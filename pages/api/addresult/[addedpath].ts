import db from '@/lib/firestore';
import {getAuthorizationToken} from '@/lib/scrapelist';
import type { NextApiRequest, NextApiResponse } from 'next';
import { SavedData } from '@/lib/types';

export default async function handler (req: NextApiRequest, res: NextApiResponse){
    const { addedpath } = req.query;
    try {
        if (req.method === 'POST' && getAuthorizationToken(req) === process.env.NEXT_PUBLIC_API_SECRECY){
            const {data} = req.body;
            const docRef = db.collection('webScrape').doc(addedpath as string);
            const doc = await docRef.get();
            let addReqd = false;
            if (!doc.exists){
                addReqd = true;
            }else{   
                const {created} = doc.data() as SavedData;
                //Check if passed 24 hours
                if (Date.now() - new Date(created).getTime() > 24 * 60 * 60 * 1000){
                    addReqd = true;
                }
            } 
            if (addReqd){
               await docRef.set({created: new Date().toISOString(), data});
            }
            res.status(200).json({process: 'OK'});
        }else{
            res.status(200).end();
        }
    } catch (e) {
        res.status(400).end();
    }
}    