import playwright from 'playwright';
import xlsx from 'xlsx';
import Telegraf from 'telegraf';

const bot = new Telegraf('6764310002:AAHIkln5uLzdtGO156wtMUhwa5frxE28b28');
const flatNumber = 491;


bot.start((ctx) => {
  ctx.reply('сиськи письки и ириськи');
  ct = ctx;
});
bot.help((ctx) => ctx.reply('Send me a sticker'));
bot.on('text', async (ctx) => {
  ctx.reply('ща узнаю, жди блин');
  await updateData(ctx);
});
bot.hears('hi', (ctx) => ctx.reply('Hey there'));
bot.launch();

async function updateData(ct) {
  let ownFlatIsReady = false;
  const browser = await playwright['chromium'].launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();
  await page.goto('https://setlgroup.ru/projects/svetlana-park/owner');
  let articles = await page.$$('.BuildingDocuments__building');
  for (let article of articles) {
    const title = await article.$eval('td.BuildingDocuments__building-title', (el) => el.textContent);
    if (title.includes('2.1')) {
      await article.click();
      const [download] = await Promise.all([
        page.waitForEvent('download'), // wait for download to start
        page.click('.BuildingDocuments__documents-list > a:nth-child(2)'),
      ]);

      const path = await download.path();
      const file = xlsx.readFile(path);
      const temp = xlsx.utils.sheet_to_json(file.Sheets[file.SheetNames[0]]);
      let readyCount = 0;
      temp.forEach((res) => {
        const flat = Object.values(res);
        const isOwn = flat.find((e) => e === flatNumber);
        const isReady = flat.find((e) => typeof e === 'string' && (e.includes('+'))) && flat.length> 5;
 
        if(isReady) ++readyCount;

        if (isOwn && isReady) {
          ownFlatIsReady = true;
        }
      });
      console.log(readyCount)
      const message = ownFlatIsReady ? 'хата готова ауф!!!!!!!!!!!!!!!!!!!!!!' : 'не мороси, еще не готова';

      if (ct) {
        ct.reply(message);
        ct.reply(`готовых квартир: ${readyCount}`);
      }
    }
  }
  
  await browser.close();
}