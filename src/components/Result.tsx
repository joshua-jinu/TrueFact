"use client";

import { ExternalLink } from "lucide-react";
import { ScoreCard } from "./ScoreCard";

interface ResultPageProps {
  overall: string;
  factual_accuracy: number;
  source_reliability: number;
  bias_assessment: number;
  factual_comments: string;
  source_comments: string;
  bias_comments: string;
  summary: string;
  articleTitle?: string;
  suggestedArticles?: ArticleSuggestion[];
}

interface ArticleSuggestion {
  title: string;
  url: string;
  source: string;
}

export const Result = ({
  overall,
  factual_accuracy,
  source_reliability,
  bias_assessment,
  factual_comments,
  source_comments,
  bias_comments,
  summary,
  articleTitle = "Article Analysis",
  suggestedArticles = []
}: ResultPageProps) => {
  return (
    <div className="mx-auto py-8 px-6 bg-white min-h-screen text-gray-900">
      
      <h1 className="text-3xl font-semibold text-gray-900 mb-6 border-b pb-2 border-blue-200">{articleTitle}</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-1">
          <ScoreCard
            score={parseFloat(overall)}
            fact_score={factual_accuracy}
            src_score={source_reliability}
            bias_score={bias_assessment}
          />
        </div>
        
        <div className="md:col-span-2 space-y-6">
          <div className="bg-blue-50 p-5 rounded-lg border border-blue-200">
            <h2 className="text-lg font-medium text-blue-700 mb-2">Article Summary</h2>
            <p className="text-gray-700 text-sm leading-relaxed">{summary}</p>
          </div>
          
          <div className="bg-white p-5 rounded-lg border border-gray-200">
            <h2 className="text-lg font-medium text-blue-700 mb-2">Detailed Assessment</h2>
            <div className="mb-4">
              <h3 className="text-md font-semibold text-gray-800">Factual Accuracy</h3>
              <p className="text-gray-700 text-sm">{factual_comments}</p>
            </div>
            <div className="mb-4">
              <h3 className="text-md font-semibold text-gray-800">Source Reliability</h3>
              <p className="text-gray-700 text-sm">{source_comments}</p>
            </div>
            <div>
              <h3 className="text-md font-semibold text-gray-800">Bias Assessment</h3>
              <p className="text-gray-700 text-sm">{bias_comments}</p>
            </div>
          </div>
          
          {suggestedArticles?.length > 0 && (
            <div className="bg-white p-5 rounded-lg border border-gray-200">
              <h2 className="text-lg font-medium text-blue-700 mb-2">Suggested Articles</h2>
              <ul className="space-y-3">
                {suggestedArticles.map((article, index) => (
                  <li key={index} className="flex items-start">
                    <ExternalLink className="h-4 w-4 text-blue-500 mr-2 flex-shrink-0 mt-1" />
                    <div>
                      <a
                        href={article.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:text-blue-800 hover:underline font-medium text-sm"
                      >
                        {article.title}
                      </a>
                        <p className="text-xs text-gray-500">{article.source}</p>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
