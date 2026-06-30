const { Telegraf, Markup } = require('telegraf');
require('dotenv').config();
const axios = require('axios');

const bot = new Telegraf(process.env.BOT_TOKEN);
const cf = axios.create({
    baseURL: 'https://api.cloudflare.com/client/v4/',
    headers: {
        'Authorization': `Bearer ${process.env.CLOUDFLARE_API_KEY}`,
        'Content-Type': 'application/json'
    }
});

// Simpan data user di memori (Gunakan database seperti MongoDB/JSON jika ingin permanen)
const userSubdomains = {}; 

bot.start((ctx) => {
    ctx.reply(
        "𝗪𝗲𝗹𝗰𝗼𝗺𝗲 𝗧𝗼 𝗢𝗳𝗳𝗶𝗰𝗶𝗮𝗹 𝗔𝗱𝗶𝘁𝘇𝗺𝗼𝗱𝘀 𝘀𝘂𝗯𝗱𝗼𝗺𝗮𝗶𝗻\nWebsite : aditzmods.my.id",
        Markup.inlineKeyboard([
            [Markup.button.callback('Generate Subdomain', 'gen')],
            [Markup.button.callback('My Subdomain', 'my')]
        ])
    );
});

// Logic Generate
bot.action('gen', (ctx) => {
    ctx.reply("Kirimkan IP dan Nama Subdomain dengan format:\nip,namasubdo\nContoh: 1.1.1.1,tes");
});

bot.on('text', async (ctx) => {
    const input = ctx.message.text;
    if (!input.includes(',')) return;

    const [ip, name] = input.split(',');
    const fullDomain = `${name}.${process.env.DOMAIN}`;
    const userId = ctx.from.id;

    // Batasan 8 subdomain
    if (!userSubdomains[userId]) userSubdomains[userId] = [];
    if (userSubdomains[userId].length >= 8) {
        return ctx.reply("❌ Limit maksimal 8 subdomain telah tercapai!");
    }

    try {
        // Panggil API Cloudflare
        const response = await cf.post(`zones/${process.env.CLOUDFLARE_ZONE_ID}/dns_records`, {
            type: 'A',
            name: name,
            content: ip,
            ttl: 1,
            proxied: false
        });

        userSubdomains[userId].push({ id: response.data.result.id, domain: fullDomain, ip: ip });
        ctx.reply(`✅ Berhasil dibuat: ${fullDomain} -> ${ip}`);
    } catch (err) {
        ctx.reply("❌ Gagal membuat subdomain. Cek format atau API Key Anda.");
    }
});

// Command Admin
bot.command('broadcast', (ctx) => {
    if (ctx.from.id != process.env.ADMIN_ID) return;
    const msg = ctx.message.text.split(' ').slice(1).join(' ');
    // Logika kirim ke semua user...
    ctx.reply("Broadcast dikirim.");
});

bot.command('offline', (ctx) => {
    if (ctx.from.id != process.env.ADMIN_ID) return;
    ctx.reply("Bot dalam mode maintenance.");
    process.exit();
});

bot.launch();
console.log('Bot aktif dan terhubung ke Cloudflare.');
