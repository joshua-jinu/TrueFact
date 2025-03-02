import { NextResponse } from "next/server";
import axios from "axios";
import { hf } from '@/utils/hf';
import { genAI } from '@/utils/gemini';

interface src {
    name: string;
}
interface ArticleSuggestion {
    title: string;
    url: string;
    source: src;
}

const NEWS_API_KEY = process.env.NEWS_API_KEY;

async function huggingSummarize(content: string) {
    const out = await hf.summarization({
        model: 'facebook/bart-large-cnn',
        inputs: content,

    });

    if (!out || !out.summary_text) {
        console.error("Summarization failed or returned empty output.");
        return null;
    }

    return out.summary_text;
}

async function analyzeGemini(summary: string, domain: string) {
    try {
        // Initialize Gemini model
        const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

        // Modified prompt to exclude suggested articles since we'll fetch those separately
        const prompt = `Analyze the following content for factual accuracy, reliability, and bias (scores out of 10) as of today in 2025. Cross-reference with multiple recent, reputable news sources to verify claims. Provide a concise JSON response. If domain is empty, prioritize broad news searches. Focus on brevity. \n\nContent: ${summary}\nDomain: ${domain}\n\nJSON Output:\n{\n  \"factual_accuracy\": [score 0-10],\n  \"source_reliability\": [score 0-10, 0 if no domain provided],\n  \"bias_assessment\": [score 0-10, lower if politically slanted or emotionally charged],\n  \"fact_check_result\": [\"confirmed true\", \"confirmed false\", \"partially true\", or \"insufficient data\"],\n  \"factual_comments\": [concise evidence with references, max 150 chars],\n  \"source_comments\": [reason for source score, max 150 chars],\n  \"bias_comments\": [assessment of language, max 150 chars],\n  \"summary\": [short factual summary],\n  \"keywords\": [array of 4 keywords]\n}`;

        const result = await model.generateContent(prompt);

        if (result?.response) {
            const text = await result.response.text();
            return text;
        } else {
            console.error("No valid response from Gemini:", result);
            return null;
        }
    } catch (error) {
        console.error("Error analyzing with Gemini:", error);
        return null;
    }
}

async function extractKeyTopics(text: string) {
    try {
        const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
        
        const prompt = `Extract the 3-5 most important topics, people, organizations, or events mentioned in this text. 
        Return only a JSON array of strings with no explanation or additional text.
        
        Text: ${text}`;
        
        const result = await model.generateContent(prompt);
        if (result?.response) {
            const text = await result.response.text();
            // Clean up
            const cleanedText = text.replace(/```json\n|\n```|```|\[|\]/g, '').trim();
            const topics = cleanedText.split(',').map(t => t.trim().replace(/"/g, ''));
            return topics.filter(t => t.length > 0);
        }
        return [];
    } catch (error) {
        console.error("Error extracting topics:", error);
        return [];
    }
}

async function fetchRelatedArticles(topics: string[], excludeDomain: string) {
    if (!NEWS_API_KEY) {
        console.error("NEWS_API_KEY is missing!");
        return [];
    }
    
    try {
        const query = topics.join(' OR ');
        const encodedQuery = encodeURIComponent(query);
        
        const url = `https://newsapi.org/v2/everything?q=${encodedQuery}&sortBy=relevancy&language=en&pageSize=5&apiKey=${NEWS_API_KEY}`;
        
        const response = await axios.get(url, { timeout: 10000 });
        
        if (response.status === 200 && response.data?.articles) {
            // Filter out articles from the same domain as the original
            const filteredArticles = response.data.articles
                .filter((article: ArticleSuggestion) => {
                    if (!article.url) return false;
                    try {
                        const articleDomain = new URL(article.url).hostname;
                        return articleDomain !== excludeDomain;
                    } catch {
                        return false;
                    }
                })
                .slice(0, 5) // Limit to 4 articles
                .map((article: ArticleSuggestion) => ({
                    title: article.title,
                    url: article.url,
                    source: article.source?.name || "Unknown"
                }));
                
            return filteredArticles;
        }
        
        return [];
    } catch (error) {
        console.error("Error fetching related articles:", error);
        return [];
    }
}

// API Route Handler
export async function POST(req: Request) {
  try {
    const { content, url } = await req.json();
    if (!content) {
      return NextResponse.json(
        { error: "Missing content or URL." },
        { status: 400 }
      );
    }

    let domain = "";
    if (url) {
        try {
            domain = new URL(url).hostname || "";
        } catch (error: unknown) {
            if (error instanceof Error) {
                console.error(`Invalid URL:`, error.message);
            } else {
                console.error(`Invalid URL:`, error);
            }
            return NextResponse.json(
                { error: "Invalid URL." },
                { status: 400 }
            );
        }
    }

    // Summarize content if too long
    let summary = content;
    console.log(summary);
    if (content.length > 500) {
        summary = await huggingSummarize(content) || "";
    }
    
    // Get AI analysis
    const aiAnalysisResult = await analyzeGemini(summary, domain) || "";
    console.log("aianalysis", aiAnalysisResult);

    // Clean up and parse the JSON
    const jsonString = aiAnalysisResult.replace(/^```json\n/, "").replace(/\n```$/, "");
    const scores = JSON.parse(jsonString);
    
    // Extract topics for article search
    let topics = [];
    if (scores.keywords && Array.isArray(scores.keywords)) {
        topics = scores.keywords;
        console.log("topics", topics);
    } else {
        topics = await extractKeyTopics(summary);
    }
    
    // Fetch related articles using News API
    const suggestedArticles = await fetchRelatedArticles(topics, domain);
    
    // Calculate overall score
    let overall = 0;
    if(url!=""){
        overall = parseFloat(((
            scores.factual_accuracy + 
            scores.bias_assessment + 
            scores.source_reliability) / 3
        ).toFixed(2));
    }else{
        overall = parseFloat(((
            scores.factual_accuracy + 
            scores.bias_assessment) / 2
        ).toFixed(2));
    }

    return NextResponse.json({
        overall,
        ...scores,
        suggestedArticles
    });
  } catch (error: unknown) {
        if (error instanceof Error) {
            console.error(`Error verifying news:`, error.message);
        } else {
            console.error(`Error verifying news:`, error);
        }
        return NextResponse.json(
            { error: `Error verifying news` },
            { status: 400 }
        );
  }
}