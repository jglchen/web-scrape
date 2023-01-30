import db from '@/lib/firestore';
import {getAuthorizationToken} from '@/lib/scrapelist';
import type { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method === 'POST'){
        try {
            const {email} = req.body;
            if (email && getAuthorizationToken(req) === process.env.NEXT_PUBLIC_API_SECRECY){
                const docRef = db.collection('userWBSCRP').doc(email);
                const doc = await docRef.get();
                if (!doc.exists){
                   await docRef.set({created: new Date().toISOString()});
                }
                res.status(200).json({process: 'OK'});
            }else{
                res.status(200).end();
            }
        }catch(error){
            res.status(400).end();
        }
    }else{
        res.status(200).end();
    }
}
