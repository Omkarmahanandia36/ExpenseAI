import os
import sys
import logging
import asyncio
import httpx
from datetime import datetime, timezone

# Load env variables from backend/.env if running from bot folder
backend_env_path = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "backend", ".env"))
if os.path.exists(backend_env_path):
    with open(backend_env_path, "r") as f:
        for line in f:
            if "=" in line and not line.startswith("#"):
                key, val = line.strip().split("=", 1)
                os.environ[key] = val

# Add backend app path to sys.path to reuse config, security, database and models
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "backend")))

from app.core.config import settings
from app.core.database import SessionLocal
from app.core.security import create_access_token
from app.models import TelegramAccount, User

# Configure logging
logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(name)s - %(levelname)s - %(message)s")
logger = logging.getLogger("ExpenseAIBot")

from aiogram import Bot, Dispatcher, html
from aiogram.types import Message
from aiogram.filters import Command, CommandObject

# Initialize bot and dispatcher
BOT_TOKEN = settings.TELEGRAM_BOT_TOKEN or os.getenv("TELEGRAM_BOT_TOKEN")
if not BOT_TOKEN:
    logger.critical("TELEGRAM_BOT_TOKEN is not set in settings or env!")
    sys.exit(1)

bot = Bot(token=BOT_TOKEN)
dp = Dispatcher()

BACKEND_API_URL = "http://localhost:8000/api/v1"

def is_valid_linking_code(text: str) -> bool:
    # 6-digit alphanumeric uppercase
    return len(text) == 6 and text.isalnum()

async def redeem_code(message: Message, code: str):
    logger.info(f"Redeeming code {code} for user {message.from_user.id}")
    redeem_payload = {
        "token": code.upper(),
        "platform": "telegram",
        "platform_user_id": str(message.from_user.id),
        "username": message.from_user.username,
        "display_name": message.from_user.first_name
    }
    
    async with httpx.AsyncClient(timeout=10.0) as client:
        try:
            response = await client.post(f"{BACKEND_API_URL}/auth/link/redeem", json=redeem_payload)
            if response.status_code == 200:
                await message.reply(
                    f"🎉 <b>Success!</b>\n\n"
                    f"Your Telegram account (<b>@{message.from_user.username or message.from_user.first_name}</b>) has been successfully linked to your ExpenseAI account!\n\n"
                    f"You can now start tracking your expenses by typing them directly in this chat!\n"
                    f"Try typing: <code>Spent ₹450 on dinner at Starbucks</code>",
                    parse_mode="HTML"
                )
            else:
                error_detail = "Linking code is invalid or has expired."
                try:
                    error_detail = response.json().get("detail", error_detail)
                except Exception:
                    pass
                await message.reply(f"❌ <b>Linking Failed:</b>\n{error_detail}\n\nPlease generate a new code from the web dashboard and try again.", parse_mode="HTML")
        except Exception as e:
            logger.error(f"Error calling redeem API: {e}")
            await message.reply("❌ <b>Error:</b>\nFailed to connect to the server. Please try again later.", parse_mode="HTML")

@dp.message(Command("start"))
async def command_start_handler(message: Message, command: CommandObject) -> None:
    code = command.args
    if code:
        await redeem_code(message, code)
        return
        
    # Check if user is already linked
    db = SessionLocal()
    try:
        telegram_acc = db.query(TelegramAccount).filter(TelegramAccount.telegram_user_id == message.from_user.id).first()
        if telegram_acc:
            await message.reply(
                f"Welcome back, <b>{html.bold(message.from_user.first_name)}</b>!\n\n"
                f"Your account is already linked to ExpenseAI.\n"
                f"Just type what you spent, and I'll log it for you!\n\n"
                f"Examples:\n"
                f"• <code>spent rs 500 on groceries yesterday</code>\n"
                f"• <code>Paid 1200 INR for electric bill</code>\n"
                f"• <code>spent $18 at Starbucks</code>",
                parse_mode="HTML"
            )
            return
    finally:
        db.close()

    welcome_text = (
        f"Hello, <b>{html.bold(message.from_user.first_name)}</b>! Welcome to <b>ExpenseAI</b> 💰\n\n"
        f"I am your personal finance companion bot. To start tracking your expenses here, you must link your Telegram account to your ExpenseAI account.\n\n"
        f"<b>How to link:</b>\n"
        f"1️⃣ Open the web dashboard at http://localhost:3000\n"
        f"2️⃣ Go to the <b>Linked Bots</b> tab.\n"
        f"3️⃣ Generate a linking code for Telegram.\n"
        f"4️⃣ Send the 6-character code here as a reply, or type: <code>/start CODE</code>"
    )
    await message.reply(welcome_text, parse_mode="HTML")

@dp.message(Command("help"))
async def command_help_handler(message: Message) -> None:
    help_text = (
        f"📝 <b>How to use ExpenseAI Bot:</b>\n\n"
        f"<b>Logging Expenses:</b>\n"
        f"Simply send a natural language text detailing what you spent:\n"
        f"• <i>\"spent rs 250 for lunch at McDonalds\"</i>\n"
        f"• <i>\"Paid 15000 rent from Credit Card\"</i>\n"
        f"• <i>\"Uber ride cost ₹450\"</i>\n\n"
        f"<b>Bot Commands:</b>\n"
        f"• /start - Start the bot or redeem a linking code\n"
        f"• /help - View this help menu\n\n"
        f"If you need to change your bank accounts, budgets, or view comprehensive visual reports, visit your dashboard at http://localhost:3000."
    )
    await message.reply(help_text, parse_mode="HTML")

@dp.message()
async def general_message_handler(message: Message) -> None:
    text = message.text.strip()
    
    # 1. Check if the message is a 6-digit linking code
    if is_valid_linking_code(text):
        await redeem_code(message, text)
        return

    # 2. Check if user is linked
    db = SessionLocal()
    telegram_account = None
    try:
        telegram_account = db.query(TelegramAccount).filter(TelegramAccount.telegram_user_id == message.from_user.id).first()
    except Exception as e:
        logger.error(f"Database query error: {e}")
    finally:
        db.close()

    if not telegram_account:
        await message.reply(
            "⚠️ <b>Account Not Linked</b>\n\n"
            "You must link your Telegram account first before logging expenses.\n"
            "Please generate a code from the <b>Linked Bots</b> tab on your dashboard (http://localhost:3000) and send it here.",
            parse_mode="HTML"
        )
        return

    # 3. Generate a temporary user JWT token using the shared security key
    token = create_access_token(subject=str(telegram_account.user_id))

    # 4. Parse the expense using the backend REST API
    headers = {"Authorization": f"Bearer {token}"}
    parse_payload = {
        "raw_message": text,
        "source": "telegram"
    }

    status_message = await message.reply("🤖 <i>Processing transaction...</i>", parse_mode="HTML")

    async with httpx.AsyncClient(timeout=30.0) as client:
        try:
            response = await client.post(f"{BACKEND_API_URL}/expenses/parse", json=parse_payload, headers=headers)
            if response.status_code == 200:
                res_data = response.json()
                
                # Check if it was a conversational query
                if res_data.get("is_query"):
                    query_reply = res_data.get("response_message")
                    await status_message.edit_text(query_reply, parse_mode="HTML")
                    return

                exp = res_data
                amount_formatted = ""
                currency = exp.get("currency", "INR")
                amount = exp.get("amount", 0)
                if currency == "INR":
                    amount_formatted = f"₹{amount:,.2f}"
                elif currency == "USD":
                    amount_formatted = f"${amount:,.2f}"
                else:
                    amount_formatted = f"{amount:,.2f} {currency}"

                category_name = "Uncategorized"
                category_icon = "💰"
                if exp.get("category"):
                    category_name = exp["category"].get("name", category_name)
                    category_icon = exp["category"].get("icon", category_icon)
                
                payment_method = exp.get("payment_method", "cash").replace("_", " ").title()
                merchant = exp.get("merchant") or "N/A"
                date_str = exp.get("expense_date") or exp.get("date")

                success_reply = (
                    f"✅ <b>Expense Logged Successfully!</b>\n\n"
                    f"💰 <b>Amount:</b> {amount_formatted}\n"
                    f"🏷️ <b>Category:</b> {category_icon} {category_name}\n"
                    f"🏢 <b>Merchant:</b> {merchant}\n"
                    f"💳 <b>Payment:</b> {payment_method}\n"
                    f"📅 <b>Date:</b> {date_str}\n\n"
                    f"<i>Updated live on your dashboard!</i>"
                )
                await status_message.edit_text(success_reply, parse_mode="HTML")
            else:
                error_detail = "Failed to parse the expense. Please try using a format like: 'spent Rs 300 on movie ticket'"
                try:
                    error_detail = response.json().get("detail", error_detail)
                except Exception:
                    pass
                await status_message.edit_text(f"⚠️ <b>Parsing Error:</b>\n{error_detail}", parse_mode="HTML")
        except Exception as e:
            logger.exception("Error parsing expense")
            await status_message.edit_text("❌ <b>Error:</b>\nFailed to process expense. Please ensure the backend server is running.", parse_mode="HTML")

async def main():
    logger.info("Starting Telegram Bot poll loop...")
    await dp.start_polling(bot)

if __name__ == "__main__":
    asyncio.run(main())
