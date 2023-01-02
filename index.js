const config = require('./config.json');
const TelegramBot = require('node-telegram-bot-api');
const fs = require('fs/promises');

const child_process = require('child_process');
const { createReadStream, existsSync } = require('fs');
const path = require('path');

const bot = new TelegramBot(config.token, {
    polling: true
});

bot.onText(/^\/start$/, (msg) => {
    bot.sendMessage(msg.chat.id, `👋 Привет, ${msg.from.username ?? msg.from.first_name}!\n🤖 Этот бот поможет Вам конвертировать видео и аудио, извлекать аудио из видео и т.д.\n⭐ Чтобы начать, отправьте боту файл для работы.\n\n` +
    `🔁 Бот умеет конвертировать:\n- Видео (поддерживаемые Telegram) > mp4, wav, mp3\n- Аудио (поддерживаемые Telegram) > mp3, wav\nВидео в формате MTS > mp4, mp3, wav`);
});

/**
 * Convert to mp3
 * @param {TelegramBot.Message} msg 
 */
async function convertToMp3(msg) {
    try {
        const thing = msg.video || msg.audio;
        if (thing) {
            if (existsSync(thing.file_id)) await fs.rm(thing.file_id, {
                recursive: true
            });
            await fs.mkdir(thing.file_id);
            await bot.downloadFile(thing.file_id, thing.file_id);
            for (const file of await fs.readdir(thing.file_id)) {
                var outputFile = file + ".mp3";
                const c = child_process.spawn(`${config.ffmpeg_command}`, ['-i', path.join(thing.file_id, file), path.join(thing.file_id, outputFile)]);
                c.on('exit', async () => {
                    await bot.sendAudio(msg.chat.id, createReadStream(`${thing.file_id}/${outputFile}`), {
                        reply_to_message_id: msg.message_id,
                        caption: "✅ Готово!"
                    });
                    await fs.unlink(path.join(thing.file_id, file));
                    await fs.unlink(path.join(thing.file_id, outputFile));
                    if ((await fs.readdir(thing.file_id)).length == 0) {
                        await fs.rmdir(thing.file_id);
                    }
                });
            }
        } else {
            await bot.sendMessage('❌ На этом сообщении нет нужного типа файла.');
        }
    } catch (error) {
        await bot.sendMessage('❗ Не удалось сконвертировать. Возможные причины:\n1️⃣ Файл слишком большой\n2️⃣ Создатель бота допустил тупую ошибку в коде');
    }
}

/**
 * Convert to wav
 * @param {TelegramBot.Message} msg 
 */
async function convertToWav(msg) {
    try {
        const thing = msg.video || msg.audio;
        if (thing) {
            if (existsSync(thing.file_id)) await fs.rm(thing.file_id, {
                recursive: true
            });
            await fs.mkdir(thing.file_id);
            await bot.downloadFile(thing.file_id, thing.file_id);
            for (const file of await fs.readdir(thing.file_id)) {
                var outputFile = file + ".wav";
                const c = child_process.spawn(`${config.ffmpeg_command}`, ['-i', path.join(thing.file_id, file), path.join(thing.file_id, outputFile)]);
                c.on('exit', async () => {
                    await bot.sendAudio(msg.chat.id, createReadStream(`${thing.file_id}/${outputFile}`), {
                        reply_to_message_id: msg.message_id,
                        caption: "✅ Готово!"
                    });
                    await fs.unlink(path.join(thing.file_id, file));
                    await fs.unlink(path.join(thing.file_id, outputFile));
                    if ((await fs.readdir(thing.file_id)).length == 0) {
                        await fs.rmdir(thing.file_id);
                    }
                });
            }
        } else {
            await bot.sendMessage('❌ На этом сообщении нет нужного типа файла.');
        }
    } catch (error) {
        await bot.sendMessage('❗ Не удалось сконвертировать. Возможные причины:\n1️⃣ Файл слишком большой\n2️⃣ Создатель бота допустил тупую ошибку в коде');
    }
}

/**
 * Convert to mp4
 * @param {TelegramBot.Message} msg 
 */
async function convertToMp4(msg) {
    try {
        const thing = msg.video || msg.document;
        if (thing) {
            if (existsSync(thing.file_id)) await fs.rm(thing.file_id, {
                recursive: true
            });
            await fs.mkdir(thing.file_id);
            await bot.downloadFile(thing.file_id, thing.file_id);
            for (const file of await fs.readdir(thing.file_id)) {
                var outputFile = file + ".mp4";
                const c = child_process.spawn(`${config.ffmpeg_command}`, ['-i', path.join(thing.file_id, file), path.join(thing.file_id, outputFile)]);
                c.on('exit', async () => {
                    await bot.sendVideo(msg.chat.id, createReadStream(`${thing.file_id}/${outputFile}`), {
                        reply_to_message_id: msg.message_id,
                        caption: "✅ Готово!"
                    });
                    await fs.unlink(path.join(thing.file_id, file));
                    await fs.unlink(path.join(thing.file_id, outputFile));
                    if ((await fs.readdir(thing.file_id)).length == 0) {
                        await fs.rmdir(thing.file_id);
                    }
                });
            }
        } else {
            await bot.sendMessage('❌ На этом сообщении нет нужного типа файла.');
        }
    } catch (error) {
        await bot.sendMessage('❗ Не удалось сконвертировать. Возможные причины:\n1️⃣ Файл слишком большой\n2️⃣ Создатель бота допустил тупую ошибку в коде');
    }
}

bot.onText(/^\/mp3$/, (msg) => {
    if (!msg.reply_to_message && !msg.reply_to_message.reply_to_message) {
        return;
    }
    convertToMp3(msg.reply_to_message.reply_to_message);
});

bot.on('callback_query', async query => {
    try {
        const msg = query.message.reply_to_message;
        await bot.answerCallbackQuery({
            callback_query_id: query.id,
            text: "⌛ Пожалуйста, подождите..."
        });
        if (query.data == 'mp3') {
            convertToMp3(msg);
        } else if (query.data == 'wav') {
            convertToWav(msg);
        } else if (query.data == 'mp4') {
            convertToMp4(msg);
        }
    } catch (error) {
        console.error(error);
    }
});

bot.on('video', async msg => {
    await bot.sendMessage(msg.chat.id, `🎞 Выберите действие с помощью кнопок ниже.`, {
        reply_to_message_id: msg.message_id,
        reply_markup: JSON.stringify({
            inline_keyboard: [
                [
                    { text: '📹 MP4', callback_data: `mp4` },
                    { text: '🔊 MP3', callback_data: `mp3` },
                    { text: '🔊 WAV', callback_data: `wav` }
                ]
            ]
        })
    });
});

bot.on('document', async msg => {
    if (!msg.document.file_name.endsWith('.mts')) return;
    await bot.sendMessage(msg.chat.id, `🎞 Выберите действие с помощью кнопок ниже.`, {
        reply_to_message_id: msg.message_id,
        reply_markup: JSON.stringify({
            inline_keyboard: [
                [
                    { text: '📹 MP4', callback_data: `mp4` },
                    { text: '🔊 MP3', callback_data: `mp3` },
                    { text: '🔊 WAV', callback_data: `wav` }
                ]
            ]
        })
    });
});

bot.on('audio', async msg => {
    await bot.sendMessage(msg.chat.id, `🎞 Выберите действие с помощью кнопок ниже.`, {
        reply_to_message_id: msg.message_id,
        reply_markup: JSON.stringify({
            inline_keyboard: [
                [
                    { text: '🔊 MP3', callback_data: `mp3` },
                    { text: '🔊 WAV', callback_data: `wav` }
                ]
            ]
        })
    });
});