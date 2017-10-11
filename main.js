const puppeteer = require('puppeteer');
const mongoose = require('mongoose');
const User = require('./models/user');

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

  const ENTRY_SUB_DOMAINS =  [ ENTRY_PATH_DOING, ENTRY_PATH_DONE, ENTRY_PATH_TO_DO ];
  // Helper function
  async function filterElementsFor(page, selector, handleFilter) {
    const elHandles = await page.$$(selector);
    const filtered = await Promise.all(elHandles.map(async h => {
      return await page.evaluate(handleFilter, h);
    }));
    return filtered.filter(Boolean); // Remove falsy values
  }

  function saveFindings(userPages) {
    if (userPages && userPages.length) {
      // We found treasure! Save their emails and send them later
      userPages.forEach(page => {
        upsertUser({
          url: page,
          dateCrawled: new Date()
        })
      })
    }
  }

  function upsertUser(userObj) {
    const DB_URL = 'mongodb://localhost:1029/friends';

    if (mongoose.connection.readyState == 0) {
      mongoose.connect(DB_URL);
    }

    let conditions = { url: userObj.url };
    let options = {
      upsert: true,
      new: true, 
      setDefaultsOnInsert: true
    };

    User.findOneAndUpdate(conditions, userObj, options, (err, result) => {
      if (err) throw err;
    })
  }

  function filterUserByLocation(userHandle) {
    const LOCATION_OF_INTEREST = 'New York City';
    if (userHandle.innerHTML && userHandle.innerHTML.includes(`(${LOCATION_OF_INTEREST})`)) {
      return userHandle.href; 
    }
  }

  const NEXT_BUTTON_SELECTOR = 'div.sub_ins > div > span.next > a';
  const USER_HOME_PAGE = 'div.sub_ins > table > tbody > tr > td:nth-child(2) > div > a';

  for (let i = 0; i < ENTRY_SUB_DOMAINS.length; ++i) {
    let path = ENTRY_SUB_DOMAINS[i];

    await page.goto(`${STARTING_ENTRY}/${path}`);
    let filteredUsers = [];
    while(await page.$(USER_HOME_PAGE)) {
      filteredUsers = filteredUsers.concat(await filterElementsFor(page, USER_HOME_PAGE, filterUserByLocation));
      await page.click(NEXT_BUTTON_SELECTOR);
      await page.waitForNavigation();
    }

    console.log(filteredUsers);
    saveFindings(filteredUsers);
  }

  await browser.close();
})();