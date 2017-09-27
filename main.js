const puppeteer = require('puppeteer');
const EMAIL_SELECTOR = '#form_email';
const PASSWORD_SELECTOR = '#form_password';
const LOGIN_SUBMIT_SELECTOR = '#lzform > fieldset > div.item.item-submit > input';

(async () => {
  const browser = await puppeteer.launch({headless: false});
  const page = await browser.newPage();

  const STARTING_ENTRY = 'https://book.douban.com/subject/1382917';

  const ENTRY_PATH_TO_DO = 'wishes';
  const ENTRY_PATH_DOING = 'doings';
  const ENTRY_PATH_DONE = 'collections'; 

  const list =  [ ENTRY_PATH_DOING, ENTRY_PATH_DONE, ENTRY_PATH_TO_DO ];

  for (let i = 0; i < 3; ++i) {
    let path = list[i];

    await page.goto(`${STARTING_ENTRY}/${path}`);
    await page.waitFor(5*1000);
    const PERSON = 'div.sub_ins > table > tbody > tr > td:nth-child(2) > div > a';
    let people = await page.evaluate(() => {
      const PERSON = 'div.sub_ins > table > tbody > tr > td:nth-child(2) > div > a';
      let els = [...document.querySelectorAll(PERSON)]; // Convert a node list to an array
      console.log(els);
      return JSON.stringify(els.reduce((result, p) => {
        if (p.innerHTML.includes('(New York City)')) {
          result.push(p.href);
        }
        return result;
      }, []));
    });
    console.log(people);
    if (people) {
      // We found treasure! Save their emails and send them later
      const file = require('fs').createWriteStream('friends.txt');
      file.write(people);
      file.end();
    }
  }

  // [ ENTRY_PATH_DOING, ENTRY_PATH_DONE, ENTRY_PATH_TO_DO ].forEach((path) => {
  //   const STARTING_ENTRY = 'https://book.douban.com/subject/1382917';

  //   const PERSON = 'div.sub_ins > table > tbody > tr > td:nth-child(2) > div > a';

  //   await page.goto(`${STARTING_ENTRY}/${path}`);
  //   const people = await page.evaluate(() => {
  //     return document.querySelectorAll(PERSON);
  //   });
  //   people = Array.apply(null, people); // Convert a node list to an array
  //   const peopleInSameLocation = people.reduce((result, p) => {
  //     if (p.innerHTML.includes('(New York City)')) {
  //       result.push(p.href);
  //     }
  //     return result;
  //   }, []);
  //   if (peopleInSameLocation && peopleInSameLocation.length) {
  //     // We found treasure! Save their emails and send them later
  //     const file = require('fs').createWriteStream('friends.txt');
  //     peopleInSameLocation.forEach((p) => {
  //       file.write(p + '\n');
  //     });
  //     file.end();
  //   }
  // });


  await browser.close();
})();