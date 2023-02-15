import Head from 'next/head';
import { useRouter } from 'next/router';
import { useState, useRef, useEffect, FormEvent } from 'react';
import axios from 'axios';
import { parse } from 'json2csv';
import isIterable from '@/utils/isiterable';
import YAML from 'json-to-pretty-yaml';
import jsonToMysql from '@/lib/json2mysql';
import apiconfig from '@/lib/apiconfig';
import {getScrapeList, getAPIRoute, getTitle, getTableName, getPostsData, getResultPath} from '@/lib/scrapelist';
import validator from 'email-validator';
import loaderStyles from '@/styles/loader.module.css';
import labelStyles from '@/styles/label.module.css';
const js2xmlparser = require("js2xmlparser");
import {ScrapeItem} from '@/lib/types';

//Static Generation of scrapeList list with getStaticProps
export async function getStaticProps(){
  const dataList: ScrapeItem[] = await getScrapeList();
  return {
    props: { scrapeList: dataList},
  }
}

export default function Home({scrapeList}: {scrapeList: ScrapeItem[]}) {
  const router = useRouter();  
  const { scrape } = router.query;  
  const intialUrl = scrapeList.length > 0 ? scrapeList[0].url: '';
  const [url, setUrl] = useState<string>(intialUrl);
  const [dataType, setDataType] = useState<string>('JSON');
  const [extractData, setExtractData] = useState('');
  const [jsonData, setJsonData] = useState('');
  const [csvData, setCSVData] = useState('');
  const [xmlData, setXMLData] = useState('');
  const [yamlData, setYAMLData] = useState('');
  const [mysqlData, setMySQLData] = useState('');
  const [goMail, setGoMail] = useState(false);
  const [mailAdd, setMailAdd] = useState<string>('');
  const [emailerr, setEmailErr] = useState<string>('');
  const emailEl = useRef<HTMLInputElement | null>(null);
  const [inScrape, setInScrape] = useState(false);
  
  useEffect(() => {
     if (scrape){
        let elem = scrapeList.find(item => item.id == scrape);
        if (elem){
           setUrl(elem.url);
        }
     }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  },[scrape]);
  
  function handleSelect(e: FormEvent<HTMLSelectElement>){
     setUrl(e.currentTarget.value);
     setDataNull();
     setMailInit();
  }

  function setDataNull(){
    setDataType('JSON');
    setExtractData('');
    setJsonData('');
    setCSVData('');
    setXMLData('');
    setYAMLData('');
    setMySQLData('');
  }

  function setMailInit(){
     setGoMail(false);
     setMailAdd('');
     setEmailErr('');
  }
  
  function getDataFields(data: any){
    if (!isIterable(data)){
      return [];
    }
    const objElm = data[0];
    const fields = [];
    for (let key in objElm) {
       fields.push(key);
    } 
    return fields;
  }

  function toJSON(){
    if (dataType !== 'JSON'){
      setMailInit();       
      setDataType('JSON');
       if (jsonData){
          setExtractData(JSON.stringify(jsonData, null, 2));
       }
    }
  }

  function toCSV(){
    if (dataType !== 'CSV'){
       setDataType('CSV');
       setMailInit();       
       if (csvData){
          setExtractData(csvData);
       }else if (jsonData){
          const fields = getDataFields(jsonData);
          const csv = parse(jsonData, {fields});
          setExtractData(csv);
          setCSVData(csv);
       }
    }
  }

  function toXML(){
     if (dataType !== 'XML'){
        setDataType('XML');
        setMailInit();       
        if (xmlData){
           setExtractData(xmlData);
        }else if (jsonData){
           const xml = js2xmlparser.parse("data", jsonData);
           setExtractData(xml);
           setXMLData(xml);
        }
     }
  }

  function toYAML(){
     if (dataType !== 'YAML'){
        setDataType('YAML');
        setMailInit();       
        if (yamlData){
           setExtractData(yamlData);
        }else if (jsonData){
           const data = YAML.stringify(jsonData);
           setExtractData(data);
           setYAMLData(data);
        }
     }
  }
  
  function toMySQL(){
     if (dataType !== 'MySQL'){
        setDataType('MySQL');
        setMailInit();       
        if (mysqlData){
           setExtractData(mysqlData);
        }else if (jsonData){
           const tableName = getTableName(url);
           const data = jsonToMysql(tableName, jsonData);
           setExtractData(data);
           setMySQLData(data);
        } 
     } 
  } 

  async function goWebScrape() {
    if (url){
      setInScrape(true);
      const apiRoute = getAPIRoute(url);
      if (apiRoute){
         try {
            const {data} = await axios.post(apiRoute, {url}, apiconfig);
            setScrapeData(data);
            //Add to Firestore
            const addedPath = '/api/addresult/' + getResultPath(url);
            await axios.post(addedPath, {data}, apiconfig);
         }catch(error: any){
            if (error.message.includes('status code 504')){
               await getSavedResult();
            }else{
               setExtractData('Error: ' + error.message);
            }
         }
      }else{
        setDataNull();
      }
      setInScrape(false);
    }
  }

  function setScrapeData(data: any) {
      if (dataType == 'JSON'){
         setExtractData(JSON.stringify(data, null, 2));
      }else if (dataType == 'CSV'){
         const fields = getDataFields(data);
         const csv = parse(data, {fields});
         setExtractData(csv);
         setCSVData(csv);
      }else if (dataType == 'XML'){
         const xml = js2xmlparser.parse("data", data);
         setExtractData(xml);
         setXMLData(xml);
      }else if (dataType == 'YAML'){
         const yaml = YAML.stringify(data);
         setExtractData(yaml);
         setYAMLData(yaml);
      }else if (dataType == 'MySQL'){
         const tableName = getTableName(url);
         const mysql = jsonToMysql(tableName, data);
         setExtractData(mysql);
         setMySQLData(mysql);
      }
      setJsonData(data);
  }
  
  async function getSavedResult() {
     if (!url) {
        return; 
     }
     const savedPath = '/api/savedresult/' + getResultPath(url);
     try {
        const {data} = await axios.get(savedPath, apiconfig);
        setScrapeData(data);
     }catch(error: any){
        setExtractData('Error: ' + error.message);
     }
  }

  function markToCopy(){
     const copyText: HTMLTextAreaElement | null = document.querySelector("textarea");
     /* Select the text field */
     copyText?.select();
     copyText?.setSelectionRange(0, 99999); /* For mobile devices */
     navigator.clipboard.writeText(copyText?.value!);
  }

  async function handleMailSend(){
     if (!goMail){
        setGoMail(true);
        setMailAdd('');
        return;
     } 
     setEmailErr('');
     //Check if Email is filled
     if (!mailAdd){
        setEmailErr("Please type your email, the email address is required!");
        emailEl.current?.focus();
        return;
     }
     //Validate the email
     if (!validator.validate(mailAdd)){
         setEmailErr("This email is not a legal email.");
         emailEl.current?.focus();
         return;
     }
     const dataObj = {
         title: getTitle(url),
         dataSend: extractData,
         tomail: mailAdd
     }
     
     setInScrape(true);
     try {
       const {data} = await axios.post('/api/sendmail', dataObj, apiconfig);
       axios.post('/api/useradd', {email: mailAdd}, apiconfig);
       setMailInit();
     }catch(error: any){
       setEmailErr('Error: ' + error.message);
     }
     setInScrape(false);
  }
  
  function handleEmailChange(e: FormEvent<HTMLInputElement>){
     let value = e.currentTarget.value;
     value = value.replace(/<\/?[^>]*>/g, "");
     setMailAdd(value);
  }
  
  return (
    <div className="container">
      <Head>
         <title>Web Scraping Demonstrations</title>
         <link rel="icon" href="/favicon.ico" />
         <meta
            name="description"
            content="A next.js framework site to demonstrate web scraping cases and my expertise in web scraping."
            />
         <meta name="og:title" content="Web Scraping Demonstrations" />
         <meta
            property="og:description"
            content="A next.js framework site to demonstrate web scraping cases and my expertise in web scraping."
            />
      </Head>
      <h1 className="text-center">
           Web Scraping Demonstrations
      </h1>
      <h5 className="text-right">
           React Native Expo Publish: <a href="https://exp.host/@jglchen/web-scrape" target="_blank" rel="noreferrer">https://exp.host/@jglchen/web-scrape</a>
      </h5>
      <form>
         <select value={url} onChange={(e) => handleSelect(e)}>
            {scrapeList.map(item => {
               return <option value={item.url} key={item.url}>{item.title}</option>
            })}  
         </select>      
      </form>
      <div className="clearfix">
         <h4 className="space-between">
             <div>
             Target URL: <a href={url} target='_blank' rel='noreferrer'>{url}</a>
             </div>
             <button className="accent-button button-right" onClick={goWebScrape}>Go</button>
         </h4>
      </div>
      <div  className="clearfix" dangerouslySetInnerHTML={{ __html: getPostsData(url, scrapeList) }} />
      <div className="space-between2">
         <div> 
            <input type="radio" id="JSON" name="strFormat" value="JSON" checked={dataType === 'JSON'} onChange={toJSON} /><label htmlFor="JSON" className={labelStyles.horizontal}>JSON</label>     
            <input type="radio" id="CSV" name="strFormat" value="CSV" checked={dataType === 'CSV'} onChange={toCSV} /><label htmlFor="CSV" className={labelStyles.horizontal}>CSV</label>     
            <input type="radio" id="XML" name="strFormat" value="XML" checked={dataType === 'XML'} onChange={toXML} /><label htmlFor="XML" className={labelStyles.horizontal}>XML</label>     
            <input type="radio" id="YAML" name="strFormat" value="YAML" checked={dataType === 'YAML'} onChange={toYAML} /><label htmlFor="YAML" className={labelStyles.horizontal}>YAML</label>    
            <input type="radio" id="MySQL" name="strFormat" value="MySQL" checked={dataType === 'MySQL'} onChange={toMySQL} /><label htmlFor="MySQL" className={labelStyles.horizontal}>MySQL</label>     
          </div> 
          {extractData && !extractData.startsWith('Error') &&
            <div>
               <button className="muted-button" onClick={handleMailSend}>{goMail ? 'Send Mail': 'Mail Result'}</button>
               <button className="muted-button button-right" onClick={markToCopy}>Copy to Clipboard</button>
            </div>
          }
     </div>
     <div className="clearfix">
       {goMail && <input type="text" value={mailAdd} onChange={handleEmailChange} placeholder="Please Type Email Address" ref={emailEl} />}
     </div>
     <span style={{color: 'red'}}>{emailerr}</span>
     <textarea value={extractData} style={{height:'25rem'}} onFocus={markToCopy} readOnly/>
     {inScrape &&
      <div className={loaderStyles.loadermodal}>
        <div className={`${loaderStyles.loader} ${loaderStyles.div_on_center}`} />
      </div>
     } 
    </div>
  )
}
