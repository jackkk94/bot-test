const { Telegraf, Markup, session } = require("telegraf");

const bot = new Telegraf("7463729826:AAEcii_PWqDdBSVPEHeudWEEAXAQvojGLkA");
bot.use(session());
bot.telegram.setMyCommands([

  { command: "generate", description: "Сгенерировать пост" },
  // { command: "setcapture", description: "Изменить тайтл" },
  // { command: "setvkbtntext", description: "Изменить текст кнопки Вк" },
  // { command: "setytbtntext", description: "Изменить текст кнопки Youtube" },
]);

bot.start(() => {});

bot.command("generate", (ctx) => {
  ctx.reply("Введите ссылку на youtube");
  ctx.session.awaitingLinkYoutube = true;
});

bot.on("text", (ctx) => {
  if (ctx.session.awaitingLinkYoutube) {
    const link = ctx.message.text;
    ctx.session.linkYoutube = link;
    ctx.session.awaitingLinkYoutube = false;
    ctx.session.awaitingLinkVk = true;
    ctx.reply("Введите ссылку на vk");
  } else if (ctx.session.awaitingLinkVk) {
    const link = ctx.message.text;
    ctx.session.linkVk = link;
    ctx.reply("Прикрепите картинку");
    ctx.session.awaitingLinkVk = false;
    ctx.session.awaitingPhoto = true;
  }
});

bot.on("photo", async (ctx) => {
  const photoArray = ctx.message.photo;
  const fileId = photoArray[photoArray.length - 1].file_id; // самое большое изображение
  ctx.session.photoFileId = fileId;
  ctx.session.awaitingPhoto = false;
  await sendPost(ctx, ctx.session.photoFileId, [
    { title: "VK", value: ctx.session.linkVk },
    { title: "YouTube", value: ctx.session.linkYoutube },
  ]);
});

bot.launch();
bot.catch((e) => {});

const sendPost = async (ctx, imageUrl, hrefs) => {
  try {
    const reply_markup = Markup.inlineKeyboard(
      hrefs.map(({ title, value }) => [Markup.urlButton(title, value)]),
    );
    delete ctx.session.linkYoutube;
    delete ctx.session.linkVk;
    delete ctx.session.photoFileId;
    delete ctx.session.awaitingPhoto;
    delete ctx.session.awaitingLinkVk;
    delete ctx.session.awaitingLinkYoutube;
    await ctx.replyWithPhoto(imageUrl, {
      caption: "Подключайся к трансляции",
      reply_markup,
    });
  } catch (err) {
    console.error(err);
  }
};
