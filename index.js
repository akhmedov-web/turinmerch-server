import TelegramBot from "node-telegram-bot-api";
import express from "express";
import cors from "cors";

const token = "7757829354:AAHWc9IqCpAAcrK28YsNX-mo3cPqGupgzcI";
const bot = new TelegramBot(token, { polling: true });
const app = express();

app.use(express.json());
app.use(cors());

// Store user phone numbers
const userPhoneNumbers = new Map();
const userLanguage = new Map();

const ADMIN_CHAT_ID = "1113965699"; // Replace with the actual admin's chat ID

// Main bot logic
bot.on("message", async (msg) => {
  const chatId = msg.chat.id;
  const text = msg.text;

  if (text === "/start") {
    await bot.sendMessage(
      chatId,
      `Assalomu aleykum <b>${msg.from.first_name}!</b> \n\nChoose your preferred language. \n— \nO'zingizga qulay tilni tanlang.`,
      {
        parse_mode: "HTML",
        reply_markup: {
          inline_keyboard: [
            [
              { text: "English", callback_data: "english" },
              { text: "Uzbek", callback_data: "uzbek" },
            ],
          ],
          resize_keyboard: true,
          one_time_keyboard: true,
        },
      }
    );
  }
});

// Handle callbacks
bot.on("callback_query", async (query) => {
  const chatId = query.message?.chat?.id;
  const messageId = query.message?.message_id;

  if (query.data === "english" || query.data === "uzbek") {
    userLanguage.set(chatId, query.data);
    await bot.editMessageReplyMarkup(
      { inline_keyboard: [] },
      { chat_id: chatId, message_id: messageId }
    );
    await bot.sendMessage(
      chatId,
      `${
        query.data === "english"
          ? "\nShare your phone number to get started!"
          : "\nDavom etish uchun telefon raqamingizni kiriting!"
      }`,
      {
        parse_mode: "HTML",
        reply_markup: {
          keyboard: [
            [
              {
                text: `${
                  query.data === "english"
                    ? "📞 Share My Phone Number"
                    : "📞 Telefon Raqamni Jo'natish"
                }`,
                request_contact: true,
              },
            ],
          ],
          resize_keyboard: true,
          one_time_keyboard: true,
        },
      }
    );
  }

  if (query.data === "aboutOpt") {
    bot.sendMessage(
      chatId,

      `${query.data==="english"?`TTPU's official merchandise bot!🎓
        
Here, you’ll find exclusive items like hoodies, mugs, notebooks, and more, designed to showcase our university pride. 
                
For assistance or inquiries, reach out to us at: @dias_james
                
Shop easily, support the campus, and stay stylish! ✨
                
Developed with care.`:`TTPUning rasmiy xaridlar boti! 👇

Bu yerda siz universitetimiz brendini namoyish etishga mo‘ljallangan sviter, brilok va boshqa eksklyuziv buyumlarni topasiz.

Yordam yoki savollar bo'yicha bizga murojaat qiling: @dias_james

Osonlik bilan xarid qiling, kampusni qo‘llab-quvvatlang va doim zamonaviy ko‘rinishda qoling! ✨

Developed with care.`}`,
      { parse_mode: "HTML" }
    );
  }
});
bot.on("message", async (msg) => {
  const chatId = msg.chat.id;
  const userLang = userLanguage.get(chatId);

  if (msg.contact) {
    const phoneNumber = msg.contact.phone_number;
    userPhoneNumbers.set(chatId, phoneNumber);

    await bot.sendMessage(
      chatId,
      `${
        userLang == "english"
          ? "✅ Your number is accepted!"
          : "✅ Raqamingiz qabul qilindi!"
      }`,
      {
        reply_markup: {
          remove_keyboard: true, // Ensure the reply keyboard is removed
        },
      }
    );

    await bot.sendMessage(
      chatId,
      `${
        userLang == "english"
          ? "<b>You're all set!</b>\n\nClick 'Products 📦' to start shopping."
          : "<b>Barchasi tayyor!</b>\n\nXaridni boshlash uchun 'Mahsulotlar 📦' tugmasini bosing."
      }`,
      {
        parse_mode: "HTML",
        reply_markup: {
          inline_keyboard: [
            [
              {
                text: `${
                  userLang === "english" ? "Products 📦" : "Mahsulotlar 📦"
                }`,
                web_app: { url: "https://merch-polito.vercel.app/" },
              },
              {
                text: `${
                  userLang === "english" ? "About ℹ️" : "Bot haqida ℹ️"
                }`,
                callback_data: "aboutOpt",
              },
            ],
          ],
        },
      }
    );
  }
});

// Handle incoming orders from the web app
app.post("/web-data", async (req, res) => {
  try {
    const { products, userID } = req.body;
    const userLang = userLanguage.get(userID);

    if (!userID || !products || !products.length) {
      return res.status(400).json({ error: "Invalid request data." });
    }

    const user = await bot.getChat(userID);
    const userName = `${user.first_name || ""} ${user.last_name || ""}`.trim();
    const userHandle = user.username ? `@${user.username}` : "No username";

    const phoneNumber = userPhoneNumbers.get(userID) || "Unknown";

    const productDetails = products
      .map((item, index) => {
        const totalItemPrice = item.price * item.quantity;
        return `<b>${index + 1}. ${item.title}</b>\n${item.quantity} x ${
          item.price
        } so'm = ${totalItemPrice} so'm`;
      })
      .join("\n\n");

    const totalPrice =
      products.reduce((a, c) => a + c.price * c.quantity, 0) + " so'm";

    // Confirm order to user
    await bot.sendMessage(
      userID,
      `${
        userLang === "english"
          ? `<b>Your order is successfully created ✅</b>\n\n<b>Order Details:</b>\n${productDetails}\n\n<b>Total:</b> ${totalPrice} \n\n<i>The admin will contact you soon.</i> \n\n<b>Contact:</b> \n📨 @dias_james \n☎️+998909395458`
          : `<b>Buyurtmangiz muvaffaqqiyatli qabul qilindi✅</b>\n\n<b>Buyurtma tafsilotlari:</b>\n${productDetails}\n\n<b>Umumiy:</b> ${totalPrice} \n\n<i>Admin sizga buyurtma bo'yicha tez orada aloqaga chiqadi.</i> \n\n<b>Kontakt:</b> \n📨 @dias_james \n☎️+998909395458`
      }`,
      {
        parse_mode: "HTML",
        reply_markup: {
          inline_keyboard: [
            [
              {
                text: `${
                  userLang === "english"
                    ? "Shopping again 📦"
                    : "Yana xarid qilish 📦"
                }`,
                web_app: { url: "https://merch-polito.vercel.app" },
              },
            ],
          ],
        },
      }
    );

    // Notify admin
    await bot.sendMessage(
      ADMIN_CHAT_ID,
      `<b>🚨 New Order Received!</b>\n\n<b>Name:</b> ${userName}\n<b>Username:</b> ${userHandle}\n<b>Phone Number:</b> ${phoneNumber}\n\n<b>Order Details:</b>\n${productDetails}\n\n<b>Total:</b> ${totalPrice}`,
      { parse_mode: "HTML" }
    );

    res.status(200).json({ success: true });
  } catch (error) {
    console.error("Error processing order:", error);
    res.status(500).json({ error: "Internal server error." });
  }
});

app.get("/", (req, res) => {
  res.send("Bot is alive!");
});

bot.on("polling_error", (error) => console.error("Polling error:", error));

app.listen(process.env.PORT || 8000, () =>
  console.log("Server started on port 8000")
);
