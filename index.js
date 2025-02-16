import TelegramBot from "node-telegram-bot-api";
import express from "express";
import cors from "cors";

const token = "7757829354:AAHWc9IqCpAAcrK28YsNX-mo3cPqGupgzcI";

const bot = new TelegramBot(token, { polling: true });
const app = express();
app.use(express.json());
app.use(cors());

// Set webhook
const webhookUrl = `https://turinmerch-server.onrender.com/webhook`;
bot.setWebHook(webhookUrl);

const main = () => {
  bot.on("message", async (msg) => {
    const chatId = msg.chat.id;
    const text = msg.text;

    if (text === "/start") {
      await bot.sendMessage(
        chatId,
        `
        Assalomu alaykum <b>${msg.from.first_name}!</b> 
            \nWe're happy to see you there😊
            \nClick <b>'Products 📦'</b> button to start the shopping.`,
        {
          parse_mode: "HTML",
          reply_markup: {
            inline_keyboard: [
              [
                {
                  text: "Products 📦",
                  web_app: {
                    url: "https://merch-polito.vercel.app/",
                  },
                },
                {
                  text: "About ℹ️",
                  callback_data: "aboutOpt",
                },
              ],
            ],
          },
        }
      );
    }
  });

  // Handle callback
  bot.on("callback_query", (query) => {
    console.log(query);
    const chatId = query.message?.chat?.id;
    if (query.data === "aboutOpt") {
      bot.sendMessage(
        chatId,
        `
        <b>TTPU's official merchandise bot!🎓</b>
        \nHere, you’ll find exclusive items like hoodies, mugs, notebooks, and more, designed to showcase our university pride. 
        \nFor assistance or inquiries, reach out to us at: @akhmedov_mailbox
        \nShop easily, support the campus, and stay stylish! ✨
        \nDeveloped with care.`,
        { parse_mode: "HTML" }
      );
    }
  });
};

bot.on("polling_error", (error) => {
  console.error("Polling error:", error);
});

const ADMIN_CHAT_ID = "1113965699"; // Replace with the actual admin's chat ID

app.post("/web-data", async (req, res) => {
  const { products, userID } = req.body;

  // Fetch user information (name, username)
  const user = await bot.getChat(userID);
  const userName = `${user.first_name || ""} ${user.last_name || ""}`.trim();
  const userHandle = user.username ? `@${user.username}` : "No username";

  try {
    // Format the product details
    const productDetails = products
      .map((item, index) => {
        const totalItemPrice = item.price * item.quantity;
        return `<b>${index + 1}. ${item.title}</b>\n   ${
          item.quantity
        } x ${item.price
          .toLocaleString("uz-UZ", {
            style: "currency",
            currency: "UZS",
            minimumFractionDigits: 0,
          })
          .replace("UZS", "so'm")} = ${totalItemPrice
          .toLocaleString("uz-UZ", {
            style: "currency",
            currency: "UZS",
            minimumFractionDigits: 0,
          })
          .replace("UZS", "so'm")}`;
      })
      .join("\n\n");

    // Calculate the total price
    const totalPrice = products
      .reduce((a, c) => a + c.price * c.quantity, 0)
      .toLocaleString("uz-UZ", {
        style: "currency",
        currency: "UZS",
        minimumFractionDigits: 0,
      })
      .replace("UZS", "so'm");

    // 2. Send order confirmation & payment details to the user
    await bot.sendMessage(
      userID,
      `<b>Your order has been successfully created✅</b>
      \n<b>Order Details:</b> \n${productDetails} 
      \n<b>Total:</b> ${totalPrice}`,
      { parse_mode: "HTML" }
    );

    await bot.sendMessage(
      userID,
      `<b>Card number:</b> 9860 1901 1084 9378 (Shohbaxt Axmedov)
      \n<b>After making the payment, send a payment receipt to @akhmedov_mailbox to complete the order.</b>
      \n<b>Thanks for shopping with us! 🎉</b>`,
      { parse_mode: "HTML" }
    );

    // 3. Send order details to the admin
    await bot.sendMessage(
      ADMIN_CHAT_ID,
      `<b>🚨 New Order Received!</b>\n
<b>Name:</b> ${userName}
<b>Username:</b> ${userHandle}
      \n<b>Order Details:</b>\n${productDetails}
      \n<b>Total:</b> ${totalPrice}`,
      { parse_mode: "HTML" }
    );

    return res.status(200).json({});
  } catch (error) {
    console.error("Error processing order:", error);
    return res.status(500).json({});
  }
});

app.listen(process.env.PORT || 8000, () => console.log("Server started!"));

main();

// import TelegramBot from "node-telegram-bot-api";

// // Replace with your actual bot token
// const token = "7757829354:AAHWc9IqCpAAcrK28YsNX-mo3cPqGupgzcI";

// const bot = new TelegramBot(token, { polling: true });

// console.log("🤖 Bot is running...");

// // Respond with "hello" when user sends /start
// bot.on("message", (msg) => {
//   const chatId = msg.chat.id;
//   const text = msg.text;

//   if (text === "/start") {
//     bot.sendMessage(chatId, "hello");
//   }
// });

// // Log any polling errors
// bot.on("polling_error", (error) => {
//   console.error("Polling error:", error);
// });
