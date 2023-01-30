import nodemailer from 'nodemailer';
import {getAuthorizationToken} from '@/lib/scrapelist';
import getConfig from "next/config";
const { serverRuntimeConfig } = getConfig();
import type { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    try {
        if (req.method === 'POST'){
            const {title, dataSend, tomail} = req.body;
            if (title && dataSend && tomail && getAuthorizationToken(req) === process.env.NEXT_PUBLIC_API_SECRECY){
 
                // Create the transporter with the required configuration
                // change the user and pass !
                const transporter = nodemailer.createTransport({
                    host: serverRuntimeConfig.SENDER_MAIL_HOST, // hostname
                    secureConnection: serverRuntimeConfig.SECURE_CONNECTION, // TLS requires secureConnection to be false
                    port: serverRuntimeConfig.SENDER_MAIL_PORT, // port for secure SMTP
                    tls: {
                        ciphers:serverRuntimeConfig.TLS_CIPHERS
                    },
                    auth: {
                        user: serverRuntimeConfig.SENDER_MAIL_USER,
                        pass: serverRuntimeConfig.SENDER_USER_PASSWORD
                    }
                });

                // setup e-mail data, even with unicode symbols
                const mailOptions = {
                    from: `"Web Scraping Demonstrations " <${serverRuntimeConfig.SENDER_MAIL_USER}>`, // sender address (who sends)
                    to: tomail, // list of receivers (who receives)
                    subject: `Web Scraping Result - ${title}`, // Subject line
                    html: `The attachment is the web scraping result of ${title}.`, // html body
                    attachments: [
                        {   // utf-8 string as an attachment
                            filename: 'result.txt',
                            content: dataSend
                         },
                    ]    
                };
                await transporter.sendMail(mailOptions);
                res.status(200).json({result: 'Message Sent'});
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
