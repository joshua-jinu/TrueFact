import axios from "axios";
import * as cheerio from "cheerio";
import { NextResponse } from "next/server";
import puppeteer from "puppeteer";

export async function POST(req: Request) {
  try {
    const { url } = await req.json();
    if (!url) {
      return NextResponse.json({ error: "URL is required" }, { status: 400 });
    }
    
    // Try Cheerio first
    let articleText = await scrapeWithCheerio(url);
    
    // Fallback to Puppeteer if needed
    if (!articleText) {
        articleText = await scrapeWithPuppeteer(url);
    }
    
    if (!articleText) {
      return NextResponse.json(
        { error: "Failed to extract content" },
        { status: 500 }
      );
    }
    
    return NextResponse.json({ text: articleText }, { status: 200 });
  } catch (err: unknown) {
    if (err instanceof Error) {
      console.error(`Error processing request:`, err.message);
    } else {
        console.error(`Error processing request:`, err);
    }
    return NextResponse.json(
        { error: "Invalid URL." },
        { status: 400 }
    );
  }
}

// 🔹 1️⃣ Fast Scraping with Cheerio
async function scrapeWithCheerio(url: string) {
  try {
    const { data } = await axios.get(url);
    const $ = cheerio.load(data);
    
    let articleText = $("article").text().trim();
    if (!articleText) {
      articleText = $("p").text().trim(); // Fallback to paragraphs
    }
    if (!articleText) {
      articleText = $("div").text().trim(); // Additional fallback
    }
    
    return articleText || null;
  } catch (err: unknown) {
    if (err instanceof Error) {
      console.error("Cheerio failed:", err.message);
    } else {
        console.error("Cheerio failed:", err);
    }
    return NextResponse.json(
        { error: "Cheerio failed:" },
        { status: 400 }
    );
}}

// 🔹 2️⃣ Puppeteer for JavaScript-heavy sites
async function scrapeWithPuppeteer(url: string) {
  try {
    const browser = await puppeteer.launch({
      headless: true,
      args: ["--no-sandbox"], // Required for some environments (e.g., Vercel)
    });
    
    const page = await browser.newPage();
    await page.goto(url,);

    const articleText = await page.evaluate(() => document.body.innerText);
    await browser.close();
    
    return articleText.trim() || null;
  } catch (err: unknown) {
    if (err instanceof Error) {
      console.error("Puppeteer failed:", err.message);
    } else {
        console.error("Puppeteer failed:", err);
    }
    return NextResponse.json(
        { error: "Puppeteer failed:" },
        { status: 400 }
    );
  }
}