import fs from 'fs';
import path from 'path';
import {remark} from 'remark';
import html from 'remark-html';
import bluebird from 'bluebird';
import {ScrapeItem} from './types';
import type { NextApiRequest } from 'next';

export const scrapeList: ScrapeItem[] = [
  {title: 'Reddit', url: 'https://old.reddit.com/r/programming/', api: '/api/reddit', posts: 'reddit'},   
  {title: 'Exchange Rate', url: 'https://www.iban.com/exchange-rates', api: '/api/iban', posts: 'iban'},   
  {title: 'US Presidents', url: 'https://en.wikipedia.org/wiki/List_of_Presidents_of_the_United_States', api: '/api/president', posts: 'president'},   
  {title: 'Seattle Restaurants', url: 'https://www.yellowpages.com/search?search_terms=restaurant&geo_location_terms=Seattle%2C+WA', api: '/api/restaurant', posts: 'restaurant'},   
  {title: 'Stack Overflow Jobs', url: 'https://stackoverflow.com/jobs', api: '/api/job', posts: 'job'},   
  {title: 'Hacker News', url: 'https://news.ycombinator.com/news', api: '/api/hackernews', posts: 'hackernews'},   
  {title: 'Book Scraping', url: 'http://books.toscrape.com', api: '/api/bookscraper', posts: 'bookscraper'},   
  {title: 'Countries', url: 'https://www.scrapethissite.com/pages/simple/', api: '/api/country', posts: 'country'},   
  {title: 'Quotes to Scrape', url: 'https://quotes.toscrape.com/search.aspx', api: '/api/quotescrape', posts: 'quotescrape'},   
];

const postsDirectory = path.join(process.cwd(), 'posts');
const resultsDirectory = path.join(process.cwd(), 'results');

export async function getScrapeList(){
    return await bluebird.map(scrapeList, async (item) => { 
      if (!item.posts) {
        return item;
      }
      const id = item.posts;
      const fileName = id + '.md';
      const fullPath = path.join(postsDirectory, fileName); 
      const fileContents = fs.readFileSync(fullPath, {encoding: 'utf8'});
      const processedContent = await remark()
        .use(html)
        .process(fileContents);
      const contentHtml = processedContent.toString();  
     
      return {...item, id: id, posts: contentHtml};
    
    },{concurrency: 10});
}

export function getAPIRoute(url: string){
  let elm = scrapeList.find(item => item.url == url);
  if (!elm) {
     return '';
  }
  return elm.api;
}

export function getTitle(url: string){
  let elm = scrapeList.find(item => item.url == url);
  if (!elm) {
    return '';
  }
  return elm.title;

}

export function getTableName(url: string){
  return getTitle(url).replace(/\s/g, '');
}

export function getPostsData(url: string, scrapeList: ScrapeItem[]){
  let elm = scrapeList.find(item => item.url == url);
  if (!elm){
     return '';
  }
  if (!elm.posts){
     return '';
  }
  return elm.posts; 
}

export function getResultPath(url: string){
  let elm = scrapeList.find(item => item.url == url);
  if (!elm) {
     return '';
  }
  return elm.posts;
}

export function getAuthorizationToken(req: NextApiRequest){
  const bearerHeader = req.headers['authorization'];
  //check if bearer is undefined
  if(typeof bearerHeader === 'undefined'){
      return '';
  }
  //split the space at the bearer
  const bearer = bearerHeader.split(' ');
  if (bearer.length <2){
      return '';
  }
  return bearer[1]; 
}
