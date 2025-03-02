"use client";

import { Check, AlertCircle, ThumbsUp, ThumbsDown } from 'lucide-react';

interface CredibilityScoreCardProps {
  score: number;
  fact_score?: number;
  src_score?: number;
  bias_score?: number;
}

export const ScoreCard = ({ score=0, fact_score=0, src_score=0, bias_score=0 }: CredibilityScoreCardProps) => {

  const metrics = [
    { name: 'Factual Accuracy', score: fact_score ?? 0 },
    { name: 'Source Reliability', score: src_score ?? 0 },
    { name: 'Bias Assessment', score: bias_score ?? 0 }
  ];

  // Function to determine which icon to show based on score
  const getScoreIcon = (score: number) => {
    if (score >= 8) {
      return <ThumbsUp className="h-8 w-8 text-green-600" />;
    } else if (score >= 6) {
      return <Check className="h-8 w-8 text-blue-600" />;
    } else if (score >= 4) {
      return <AlertCircle className="h-8 w-8 text-yellow-600" />;
    } else {
      return <ThumbsDown className="h-8 w-8 text-red-600" />;
    }
  };

  // Function to determine background color based on score
  const getScoreBackgroundColor = (score: number) => {
    if (score >= 8) {
      return 'bg-green-100';
    } else if (score >= 6) {
      return 'bg-blue-100';
    } else if (score >= 4) {
      return 'bg-yellow-100';
    } else {
      return 'bg-red-100';
    }
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-lg">
      <div className="flex items-center mb-4">
        <div className={`w-16 h-16 rounded-full flex items-center justify-center mr-4 ${getScoreBackgroundColor(score)}`}>
          {getScoreIcon(score)}
        </div>
        <div>
          <div className="text-sm text-gray-500">Credibility Score</div>
          <div className="text-3xl font-bold text-gray-900">{score}/10</div>
        </div>
      </div>
      <div className="space-y-4">
        {metrics.map((metric) => (
          <div key={metric.name}>
            <div className="flex justify-between items-center mb-1">
              <div className="text-sm font-medium text-gray-700">{metric.name}</div>
              <div className="text-sm font-medium text-gray-700">{metric.score}/10</div>
            </div>
            <div className="h-2 bg-gray-200 rounded-full">
              <div
                className="h-2 rounded-full"
                style={{
                  width: `${metric.score * 10}%`,
                  backgroundColor:
                    metric.score >= 8 ? '#10b981' : // green
                      metric.score >= 6 ? '#3b82f6' : // blue
                        metric.score >= 4 ? '#f59e0b' : // yellow
                          '#ef4444' // red
                }}
              ></div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};