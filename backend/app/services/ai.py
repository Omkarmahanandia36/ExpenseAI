from datetime import datetime, timezone, timedelta
import json
import re
from typing import Dict, Any, Optional
import httpx
from fastapi import HTTPException

from app.core.config import settings

class AIParserService:
    @staticmethod
    def parse_rule_based(message: str) -> Optional[Dict[str, Any]]:
        """
        Simple regex parser for very basic, standard message formats.
        E.g., "Spent $18.50 at Starbucks" or "Spent 18 at Starbucks"
        """
        cleaned = message.strip()
        
        # Pattern 1: Spent [Currency] X at Y
        # Allows optional $, ₹, Rs, INR, EUR, € symbols and digits with optional decimal
        pattern_spent_at = re.compile(
            r"^(?:spent|paid)\s+(?:\$|₹|rs\.?|inr|eur|€)?\s*(\d+(?:\.\d{1,2})?)\s+at\s+([a-zA-Z0-9\s&'._-]+)$",
            re.IGNORECASE
        )
        match = pattern_spent_at.match(cleaned)
        if match:
            try:
                amount = float(match.group(1))
                merchant = match.group(2).strip()
                
                # Detect currency based on matched prefix
                currency = "INR" # Default to INR for Indian users
                lower_msg = cleaned.lower()
                if "$" in lower_msg:
                    currency = "USD"
                elif "eur" in lower_msg or "€" in lower_msg:
                    currency = "EUR"
                    
                return {
                    "amount": amount,
                    "currency": currency,
                    "merchant": merchant,
                    "category": None,
                    "payment_method": "cash",  # Default fallback
                    "date": datetime.now(timezone.utc).strftime("%Y-%m-%d"),
                    "description": f"Spent at {merchant}",
                    "confidence": 0.90  # Rule-based parser has high confidence
                }
            except ValueError:
                pass
                
        return None

    @staticmethod
    async def parse_with_ai(message: str) -> Dict[str, Any]:
        """
        Calls Groq API in JSON mode to extract structured transaction data.
        """
        # 1. Check rule-based first
        rule_result = AIParserService.parse_rule_based(message)
        if rule_result:
            return rule_result

        # 2. Check which provider to use (Gemini takes priority, Groq as fallback)
        if not settings.GEMINI_API_KEY and not settings.GROQ_API_KEY:
            raise ValueError("Neither GEMINI_API_KEY nor GROQ_API_KEY is configured")

        now = datetime.now(timezone.utc)
        current_date = now.strftime("%Y-%m-%d")
        current_day = now.strftime("%A")

        system_prompt = f"""You are an expert personal finance AI assistant. Your task is to parse a raw natural language message representing a financial expense transaction and extract structured information.

You must respond with a JSON object containing the following keys:
- amount: float (the cost of the transaction, e.g. 18.50. Must be a positive number)
- currency: string (3-letter ISO code, e.g. "INR", "USD", "EUR". Default to "INR" if not specified, or if the context is Indian (e.g., mentions Rs, rupees, ₹, or Indian services like Paytm, PhonePe, GPay, Zomato, Swiggy))
- merchant: string or null (the name of the store, company, or service where the money was spent)
- category: string or null (MUST be one of the following exact category names: "Food & Dining", "Transportation", "Housing", "Utilities", "Shopping", "Healthcare", "Education", "Entertainment", "Travel", "Personal Care", "Family", "Financial Obligations", "Business/Work", "Investments", "Miscellaneous")
- subcategory: string or null (the specific subcategory if mentioned, e.g. "Lunch", "Dinner", "Fuel", "Mobile Recharge", "Rent")
- payment_method: string (one of: "cash", "debit_card", "credit_card", "bank_transfer", "upi", "net_banking", "wallet", "cheque", "other")
- account: string or null (the name of the bank account, wallet, or card used if mentioned, e.g., "SBI Savings", "HDFC Credit Card", "Paytm Wallet")
- tags: array of strings (extract tags like "Friends", "Office", "Vacation" if implied or mentioned)
- location: string or null (the city/location if mentioned, e.g., "Chandigarh", "Mumbai")
- is_recurring: boolean (set to true if indicates a repeating expense, e.g., subscription, monthly rent)
- transaction_time: string or null (extract time in HH:MM:SS format if mentioned, e.g., "2:35 PM" -> "14:35:00")
- date: string (the date of the transaction in YYYY-MM-DD format)
- description: string or null (additional context or details about the transaction)

Current context:
- Today's date: {current_date}
- Today's day of the week: {current_day}

Special Instructions for Indian users:
- Parse transactional bank SMS alerts:
  - e.g., "Dear Customer, your A/c XX1234 has been debited by Rs 150.00 on 14-Jul-26 info UPI-Paytm-Starbucks." -> Amount: 150.00, Currency: INR, Merchant: Starbucks, Payment Method: upi
  - e.g., "Sent Rs.250 to Ramesh via PhonePe." -> Amount: 250.00, Currency: INR, Merchant: Ramesh, Payment Method: upi
- If the payment is mentioned as "Paytm", "GPay", "PhonePe", "UPI", "sent to name", map payment_method to "upi".
- Items like cigarettes, tobacco, or smoke should be categorized under "Entertainment" (representing leisure/vices) rather than "Personal Care".

Examples:
1. Message: "Spent 150 rupees on auto ride today"
   Response: {{"amount": 150.00, "currency": "INR", "merchant": "Auto", "category": "Transportation", "subcategory": "Auto", "payment_method": "cash", "account": null, "tags": [], "location": null, "is_recurring": false, "transaction_time": null, "date": "{current_date}", "description": "auto ride"}}

2. Message: "Sent Rs.250 to Ramesh via PhonePe yesterday for lunch with friends at Chandigarh"
   Response: {{"amount": 250.00, "currency": "INR", "merchant": "Ramesh", "category": "Food & Dining", "subcategory": "Lunch", "payment_method": "upi", "account": "PhonePe", "tags": ["Friends"], "location": "Chandigarh", "is_recurring": false, "transaction_time": null, "date": "{(now - timedelta(days=1)).strftime('%Y-%m-%d')}", "description": "lunch with friends"}}

3. Message: "Debited SBI Savings A/c XX5678 by INR 450.00 at ZOMATO at 2:35 PM on 14-Jul-26."
   Response: {{"amount": 450.00, "currency": "INR", "merchant": "Zomato", "category": "Food & Dining", "subcategory": "Food Delivery", "payment_method": "upi", "account": "SBI Savings", "tags": [], "location": null, "is_recurring": false, "transaction_time": "14:35:00", "date": "2026-07-14", "description": "debited SMS alert"}}

4. Message: "Paid Rs.15000 for monthly rent from HDFC Credit Card"
   Response: {{"amount": 15000.00, "currency": "INR", "merchant": null, "category": "Housing", "subcategory": "Rent", "payment_method": "credit_card", "account": "HDFC Credit Card", "tags": [], "location": null, "is_recurring": true, "transaction_time": null, "date": "{current_date}", "description": "monthly rent"}}

Respond ONLY with a valid JSON object. Do not include any explanation or markdown formatting outside the JSON object."""

        if settings.GEMINI_API_KEY:
            # Call Google Gemini API (using gemini-2.5-flash)
            url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key={settings.GEMINI_API_KEY}"
            headers = {"Content-Type": "application/json"}
            payload = {
                "contents": [{
                    "parts": [{
                        "text": f"{system_prompt}\n\nParse this message: \"{message}\""
                    }]
                }],
                "generationConfig": {
                    "responseMimeType": "application/json",
                    "temperature": 0.0
                }
            }
            async with httpx.AsyncClient(timeout=15.0) as client:
                try:
                    response = await client.post(url, headers=headers, json=payload)
                except httpx.RequestError as exc:
                    raise HTTPException(
                        status_code=502,
                        detail=f"Failed to communicate with Gemini API: {exc}"
                    )
            
            if response.status_code != 200:
                raise HTTPException(
                    status_code=response.status_code,
                    detail=f"Gemini API error: {response.text}"
                )
                
            res_json = response.json()
            try:
                content = res_json["candidates"][0]["content"]["parts"][0]["text"]
                parsed_data = json.loads(content)
            except (KeyError, IndexError, json.JSONDecodeError):
                raise HTTPException(
                    status_code=502,
                    detail="Gemini API returned invalid JSON or structure"
                )
        else:
            # Call Groq API
            headers = {
                "Authorization": f"Bearer {settings.GROQ_API_KEY}",
                "Content-Type": "application/json"
            }
            payload = {
                "model": "llama-3.1-8b-instant",
                "messages": [
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": f"Parse this message: \"{message}\""}
                ],
                "response_format": {"type": "json_object"},
                "temperature": 0.0
            }
            async with httpx.AsyncClient(timeout=15.0) as client:
                try:
                    response = await client.post(
                        "https://api.groq.com/openai/v1/chat/completions",
                        headers=headers,
                        json=payload
                    )
                except httpx.RequestError as exc:
                    raise HTTPException(
                        status_code=502,
                        detail=f"Failed to communicate with Groq API: {exc}"
                    )

            if response.status_code != 200:
                raise HTTPException(
                    status_code=response.status_code,
                    detail=f"Groq API error: {response.text}"
                )

            res_json = response.json()
            content = res_json["choices"][0]["message"]["content"]
            try:
                parsed_data = json.loads(content)
            except json.JSONDecodeError:
                raise HTTPException(
                    status_code=502,
                    detail="Groq API returned invalid JSON output"
                )

        parsed_data["confidence"] = 0.85
        return parsed_data
