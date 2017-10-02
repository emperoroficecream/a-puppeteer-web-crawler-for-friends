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
      const file = require('fs').createWriteStream('friends.txt',  {'flags': 'a'});
      userPages.forEach(p => {
        file.write(p + '\n');
      })
      file.end();
    }
  }

  const NEXT_BUTTON_SELECTOR = 'div.sub_ins > div > span.next > a';

  for (let i = 0; i < ENTRY_SUB_DOMAINS.length; ++i) {
    let path = ENTRY_SUB_DOMAINS[i];

    await page.goto(`${STARTING_ENTRY}/${path}`);
    const USER_HOME_PAGE = 'div.sub_ins > table > tbody > tr > td:nth-child(2) > div > a';
    const userFilter = function(userHandle) {
      const LOCATION_OF_INTEREST = 'New York City';
      if (userHandle.innerHTML && userHandle.innerHTML.includes(`(${LOCATION_OF_INTEREST})`)) {
        return userHandle.href;
      }
    }

    let filteredUsers = [];
    while(await page.$(USER_HOME_PAGE)) {
      filteredUsers = filteredUsers.concat(await filterElementsFor(page, USER_HOME_PAGE, userFilter));
      await page.click(NEXT_BUTTON_SELECTOR);
      await page.waitForNavigation();
    }

    console.log(filteredUsers);
    saveFindings(filteredUsers);
  }

  await browser.close();
})();