"use client"; // If using App Router

import { useEffect, useState } from 'react';
import { Result } from '@/components/Result'; // Import your component
import Link from 'next/link';
import { ResultPageProps } from '@/components/Result';

export default function ResultsPage() {
  const [analysisData, setAnalysisData] = useState<ResultPageProps>();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    // Retrieve the data from localStorage
    const storedData = localStorage.getItem('articleAnalysisResult');
    if (storedData) {
      try {
        const parsedData = JSON.parse(storedData);
        setAnalysisData(parsedData);
      } catch (error) {
        console.error('Error parsing stored data:', error);
        setError('Error loading analysis data');
      }
    } else {
      setError('No analysis data found');
    }
    setLoading(false);
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-gray-700">Loading results...</div>
      </div>
    );
  }

  if (error || !analysisData) {
    return (
      <div className="flex flex-col justify-center items-center min-h-screen bg-gray-50 p-4">
        <div className="text-gray-700 mb-4">{error || 'No analysis data found'}</div>
        <Link
          href="/" 
          className="inline-flex items-center px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors"
        >
          Analyze New Article
        </Link>
      </div>
    );
  }

  // Transform the API response to match the props structure of the Result component
  const resultProps = {
    overall: analysisData.overall || "0.0",
    factual_accuracy: analysisData.factual_accuracy || 0,
    source_reliability: analysisData.source_reliability || 0,
    bias_assessment: analysisData.bias_assessment || 0,
    factual_comments: analysisData.factual_comments || "No factual assessment available.",
    source_comments: analysisData.source_comments || "No source assessment available.",
    bias_comments: analysisData.bias_comments || "No bias assessment available.",
    summary: analysisData.summary || "No summary available.",
    articleTitle: "Article Analysis",
    suggestedArticles: analysisData.suggestedArticles || []
  };

  return <Result {...resultProps} />;
}