const { Telegraf, Markup, session } = require('telegraf');

const bot = new Telegraf('7463729826:AAEcii_PWqDdBSVPEHeudWEEAXAQvojGLkA');

const ACTION = {
  addVk: 'addVk',
  addYoutube: 'addYoutube',
  addPhoto: 'addPhoto',
  addDescription: 'addDescription',
  publish: 'publish',
  create: 'create',
  reset: 'reset',
};

const ACTIONS = {
  [ACTION.addVk]: {
    title: 'Вставить ссылку ВК',
    description: 'Вставь ссылку ВК:',
    buttonTitle: 'VK',
    command: ACTION.addVk,
  },
  [ACTION.addYoutube]: {
    title: 'Вставить ссылку YouTube',
    buttonTitle: 'YouTube',
    description: 'Вставь ссылку YouTube:',
    command: ACTION.addYoutube,
  },
  [ACTION.addPhoto]: {
    title: 'Вставить картинку',
    description: 'Вставь картинку через выбор ФОТО',
    command: ACTION.addPhoto,
  },
  [ACTION.addDescription]: {
    title: 'Вставить описание',
    description: 'Укажи описание:',
    command: ACTION.addDescription,
  },
  [ACTION.publish]: {
    title: 'Сгенерировать',
    command: ACTION.publish,
  },
  [ACTION.create]: {
    title: 'Создать',
    command: ACTION.create,
  },
  [ACTION.reset]: {
    title: 'Сбросить все',
    command: ACTION.reset,
  },
};

const ButtonsFlow = {
  [ACTION.create]: getButtonsArray(ACTIONS, [ACTION.reset, ACTION.create, ACTION.publish]),
  [ACTION.addVk]: getButtonsArray(ACTIONS, [ACTION.create, ACTION.addVk]),
  [ACTION.addYoutube]: getButtonsArray(ACTIONS, [ACTION.create, ACTION.addVk]),
};

function buildInlineKeyboard(actions) {
  const btns = actions.map((a) => {
    const { title, command } = ACTIONS[a];
    return [title, command];
  });

  return Markup.inlineKeyboard(btns.map((b) => [Markup.button.callback(...b)]));
}

function getButtonsArray(actionsMap, excludeArr = []) {
  return Object.keys(actionsMap).filter((a) => !excludeArr.includes(a));
}

bot.use(session());
bot.telegram.setMyCommands([
  { command: 'start', description: 'Начать работу' },
  { command: ACTION.create, description: 'Сгенерировать пост' },
]);

bot.start((ctx) => {
  ctx.session = { data: {} };

  ctx.reply('Выберите опцию:', Markup.inlineKeyboard([[Markup.button.callback('Сгенерировать пост', ACTION.create)]]));
});

bot.action([ACTION.addVk, ACTION.addYoutube, ACTION.addDescription, ACTION.addPhoto], async (ctx) => {
  const step = ctx.match[0];
  const message = ACTIONS[step]?.description ?? 'операция не распознана';
  ctx.answerCbQuery('Выбрано');
  ctx.session.currentStep = step;
  console.log(ctx.session);
  await ctx.editMessageReplyMarkup();
  await ctx.reply(message);
});

bot.action(ACTION.create, (ctx) => {
  ctx.answerCbQuery('Выбрано');
  ctx.editMessageReplyMarkup();
  ctx.reply('Погнали!!!', buildInlineKeyboard(ButtonsFlow[ACTION.create]));
});

bot.action(ACTION.reset, async (ctx) => {
  ctx.session.data = {};

  ctx.reply(
    'Данные сброшены',
    buildInlineKeyboard(getButtonsArray(ACTIONS, [...Object.keys(ctx.session.data), ACTION.create]))
  );
});

bot.on('text', (ctx) => {
  const step = ctx.session.currentStep;
  if (step) {
    ctx.session.data[step] = ctx.message.text;
  }

  console.log('пришло ', ctx.session.data, Object.keys(ctx.session.data));
  ctx.reply(
    'Готово, Что дальше???',
    buildInlineKeyboard(getButtonsArray(ACTIONS, [...Object.keys(ctx.session.data), ACTION.create]))
  );
});

bot.on('photo', async (ctx) => {
  if (ctx.session.currentStep !== ACTION.addPhoto) {
    return;
  }

  const photoArray = ctx.message.photo;
  const fileId = photoArray[photoArray.length - 1].file_id; // самое большое изображение
  ctx.session.data[ACTION.addPhoto] = fileId;
  console.log(fileId, ctx.session.data);
  ctx.reply(
    'Готово, Что дальше???',
    buildInlineKeyboard(getButtonsArray(ACTIONS, [...Object.keys(ctx.session.data), ACTION.create]))
  );
});

bot.action(ACTION.publish, async (ctx) => {
  const data = ctx.session.data;
  if (!data) {
    ctx.reply(
      'Еще пусто, заполни инфу:',
      buildInlineKeyboard(getButtonsArray(ACTIONS, [...Object.keys(ctx.session.data), ACTION.create]))
    );
  }

  const caption = data[ACTION.addDescription] ?? 'Подключайся к трансляции';

  const buttons = [
    { k: ACTION.addVk, v: data[ACTION.addVk] },
    { k: ACTION.addYoutube, v: data[ACTION.addYoutube] },
  ]
    .filter((z) => !!z.v?.length)
    .map((z) => ({ title: ACTIONS[z.k].buttonTitle ?? 'Ссылка', value: z.v }));
  await sendPost(ctx, data[ACTION.addPhoto] ?? '', caption, buttons);
});

bot.launch(() => {});
bot.catch((e) => {});

const sendPost = async (ctx, imageUrl, caption, hrefs) => {
  try {
    const { reply_markup } = Markup.inlineKeyboard(hrefs.map(({ title, value }) => [Markup.button.url(title, value)]));
    if (!imageUrl.length) {
      await ctx.reply(caption, {
        reply_markup,
      });
      return;
    }

    await ctx.replyWithPhoto(imageUrl, {
      caption,
      reply_markup,
    });
  } catch (err) {
    console.error(err);
  }
};
