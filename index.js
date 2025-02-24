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

const ADMIN_CHAT_ID = "1113965699"; // Replace with the actual admin's chat ID

// Main bot logic
const main = () => {
  bot.on("message", async (msg) => {
    const chatId = msg.chat.id;
    const text = msg.text;

    if (text === "/start") {
      await bot.sendMessage(
        chatId,
        `Assalomu aleykum <b>${msg.from.first_name}!</b> \nShare your phone number to get started!`,
        {
          parse_mode: "HTML",
          reply_markup: {
            keyboard: [[{ text: "📞 Share My Phone Number", request_contact: true }]],
            resize_keyboard: true,
            one_time_keyboard: true,
          },
        }
      );
    }

    if (msg.contact) {
      const phoneNumber = msg.contact.phone_number;
      userPhoneNumbers.set(chatId, phoneNumber);

      await bot.sendMessage(
        chatId,
        "<b>You're all set! 😊</b>\nClick 'Products 📦' to start shopping.",
        {
          parse_mode: "HTML",
          reply_markup: {
            inline_keyboard: [
              [
                { text: "Products 📦", web_app: { url: "https://merch-polito.vercel.app/" } },
                { text: "About ℹ️", callback_data: "aboutOpt" },
              ],
            ],
          },
        }
      );
    }
  });

  // Handle callbacks
  bot.on("callback_query", (query) => {
    const chatId = query.message?.chat?.id;

    if (query.data === "aboutOpt") {
      bot.sendMessage(
        chatId,
        `<b>TTPU's official merchandise bot!🎓</b>\nFind exclusive items to showcase our university pride.`,
        { parse_mode: "HTML" }
      );
    }
  });
};

// Handle incoming orders from the web app
app.post("/web-data", async (req, res) => {
  try {
    const { products, userID } = req.body;

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
        return `<b>${index + 1}. ${item.title}</b>\n${item.quantity} x ${item.price} so'm = ${totalItemPrice} so'm`;
      })
      .join("\n\n");

    const totalPrice = products.reduce((a, c) => a + c.price * c.quantity, 0) + " so'm";

    // Confirm order to user
    await bot.sendMessage(
      userID,
      `<b>Your order is successfully created ✅</b>\n\n<b>Order Details:</b>\n${productDetails}\n\n<b>Total:</b> ${totalPrice}`,
      { parse_mode: "HTML" }
    );

    await bot.sendMessage(
      userID,
      `<b>Card number:</b> 9860 1901 1084 9378 (Shohbaxt Axmedov)\n\nAfter payment, send the receipt to @akhmedov_mailbox to confirm your order.`,
      { parse_mode: "HTML" }
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

app.get('/', (req, res) => {
  res.send('Bot is alive!');
});

bot.on("polling_error", (error) => console.error("Polling error:", error));

app.listen(process.env.PORT || 8000, () => console.log("Server started on port 8000"));

main();
