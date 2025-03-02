"use client";

import { useEffect, useState } from 'react';
import { Search, Shield, Check, Info, Link, FileText, ArrowRight, RotateCcw } from 'lucide-react';
import { ScoreCard } from '@/components/ScoreCard';
import axios from 'axios'; 
import * as stopword from 'stopword';
import { useRouter } from 'next/navigation';

export default function Home() {
  const [inputType, setInputType] = useState('url');
  const [inputValue, setInputValue] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [progress, setProgress] = useState(0);
  const [analysisStage, setAnalysisStage] = useState("");
  const [showLastAnalysisPopup, setShowLastAnalysisPopup] = useState(false);
  const router = useRouter();

  useEffect(() => {
    // Check if there's a previous analysis result in localStorage
    const savedResult = localStorage.getItem('articleAnalysisResult');
    if (savedResult && savedResult.length > 500) {
      setShowLastAnalysisPopup(true);
    }
  }, []);

  useEffect(() => {
    console.log(inputType);
  }, [inputType]);

  // Progress simulation during analysis
  useEffect(() => {
    if (isSubmitting) {
      const stages = [
        "Extracting content...", 
        "Processing text...", 
        "Analyzing sources...", 
        "Checking facts...", 
        "Evaluating bias...", 
        "Generating report..."
      ];
      
      let currentStage = 0;
      setAnalysisStage(stages[0]);
      
      // Reset progress
      setProgress(0);
      
      const interval = setInterval(() => {
        setProgress(prev => {
          // Stage completion logic
          if (prev >= 95) {
            clearInterval(interval);
            return 100;
          }
          
          // Change stage every ~16% of progress
          if (prev % 16 === 15 && currentStage < stages.length - 1) {
            currentStage++;
            setAnalysisStage(stages[currentStage]);
          }
          
          // Gradually increase progress
          return prev + 1;
        });
      }, 120);
      
      return () => clearInterval(interval);
    }
  }, [isSubmitting]);

  const preprocessText = async (text) => {  
    // Remove special characters & extra spaces  
    text = (text || "").replace(/[^a-zA-Z0-9\s]/g, "").replace(/\s+/g, " ").trim();

    // Convert to lowercase  
    text = text.toLowerCase();  

    // Tokenize  
    let words = text.split(/\s+/);  

    // Remove stopwords  
    words = stopword.removeStopwords(words);  

    return words.join(" ");  
  }  

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError("");

    try {
      let datainp = ""
      if(inputType=='url'){
        const { data } = await axios.post("/api/scrape", { url: inputValue });
        if(!data || !data?.text){
          console.log("error")
          setError("Failed to scrape article.");
          setIsSubmitting(false);
          return;
        }
        datainp = await preprocessText(data.text);
      } else {
        datainp = inputValue;
      }
      const res = await axios.post("/api/analyze", {content: datainp, url: (inputType=='url')?inputValue:""})
      console.log("res", res);

      if(res){
        // Ensure progress shows completed before redirecting
        setTimeout(()=>{
          console.log("loading")
          setProgress(100);
          setAnalysisStage("Analysis complete!");
        }, 50000)
        
        // Store data in localStorage for retrieval on the results page
        localStorage.setItem('articleAnalysisResult', JSON.stringify(res.data));
        
        // Short delay before redirect to show completed progress
        setTimeout(() => {
          router.push('/results');
        }, 800);
      }

    } catch (err) {
      console.log("error", err);
      setError(err.response?.data?.error || err.message || "Failed to analyze article.");
      setIsSubmitting(false);
    }
  };

  const handleViewLastAnalysis = () => {
    router.push('/results');
  };

  const dismissLastAnalysisPopup = () => {
    setShowLastAnalysisPopup(false);
  };

  return (isSubmitting)?(
    <div className="fixed inset-0 min-h-full bg-gray-900 bg-opacity-80 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl p-8 max-w-md w-full">
        <div className="text-center">
          <div className="relative w-24 h-24 mx-auto mb-6">
            <div className="absolute inset-0 rounded-full border-4 border-blue-600 border-opacity-20"></div>
            <div 
              className="absolute inset-0 rounded-full border-4 border-blue-600 border-l-transparent animate-spin"
              style={{ animationDuration: '1.5s' }}
            ></div>
            <Shield className="absolute inset-0 h-full w-full text-blue-600 p-4" />
          </div>
          
          <h3 className="text-2xl font-bold text-gray-900 mb-2">Analyzing Content</h3>
          <p className="text-gray-600 mb-6 text-lg">{analysisStage}</p>
          
          {/* Progress Bar */}
          <div className="w-full bg-gray-200 rounded-full h-3 mb-6 overflow-hidden">
            <div 
              className="bg-blue-600 h-full rounded-full transition-all duration-300 ease-out"
              style={{ width: `${progress}%` }}
            ></div>
          </div>
          
          {/* Analysis Steps */}
          <div className="grid grid-cols-4 gap-4 mt-6">
            <div className={`flex flex-col items-center transition-all duration-300 ${progress < 33 ? 'opacity-100 scale-110' : 'opacity-40'}`}>
              <div className={`p-3 rounded-full ${progress < 33 ? 'bg-blue-100' : 'bg-gray-100'}`}>
                <Search className={`h-5 w-5 ${progress < 33 ? 'text-blue-600' : 'text-gray-500'}`} />
              </div>
              <span className="text-xs mt-2 text-gray-600">Extracting</span>
            </div>
            <div className={`flex flex-col items-center transition-all duration-300 ${progress >= 33 && progress < 66 ? 'opacity-100 scale-110' : 'opacity-40'}`}>
              <div className={`p-3 rounded-full ${progress >= 33 && progress < 66 ? 'bg-blue-100' : 'bg-gray-100'}`}>
                <Info className={`h-5 w-5 ${progress >= 33 && progress < 66 ? 'text-blue-600' : 'text-gray-500'}`} />
              </div>
              <span className="text-xs mt-2 text-gray-600">Analyzing</span>
            </div>
            <div className={`flex flex-col items-center transition-all duration-300 ${progress >= 66 && progress < 90 ? 'opacity-100 scale-110' : 'opacity-40'}`}>
              <div className={`p-3 rounded-full ${progress >= 66 && progress < 90 ? 'bg-blue-100' : 'bg-gray-100'}`}>
                <Shield className={`h-5 w-5 ${progress >= 66 && progress < 90 ? 'text-blue-600' : 'text-gray-500'}`} />
              </div>
              <span className="text-xs mt-2 text-gray-600">Verifying</span>
            </div>
            <div className={`flex flex-col items-center transition-all duration-300 ${progress >= 90 ? 'opacity-100 scale-110' : 'opacity-40'}`}>
              <div className={`p-3 rounded-full ${progress >= 90 ? 'bg-green-100' : 'bg-gray-100'}`}>
                <Check className={`h-5 w-5 ${progress >= 90 ? 'text-green-600' : 'text-gray-500'}`} />
              </div>
              <span className="text-xs mt-2 text-gray-600">Complete</span>
            </div>
          </div>
          
          {/* Processing details */}
          <div className="mt-6 p-4 bg-gray-50 rounded-lg text-left">
            <h4 className="text-sm font-medium text-gray-700 mb-2">Processing details:</h4>
            <ul className="text-xs text-gray-600 space-y-1 pl-2">
              <li>• Content length: {inputType === 'url' ? 'Fetching from URL' : `${inputValue.length} characters`}</li>
              <li>• Analysis depth: Comprehensive</li>
              <li>• Source verification: Enabled</li>
              <li>• Bias analysis: In progress</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  ):(
    <div className="min-h-screen bg-gray-50 relative">
      {/* Last Analysis Popup */}
      {showLastAnalysisPopup && (
        <div className="fixed bottom-4 right-4 bg-white rounded-lg shadow-lg p-4 max-w-sm z-50 border-l-4 border-blue-600 animate-fade-in">
          <div className="flex justify-between items-start">
            <div className="flex items-start space-x-3">
              <div className="bg-blue-100 p-2 rounded-full">
                <FileText className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <h3 className="font-medium text-gray-900">Previous analysis available</h3>
                <p className="text-sm text-gray-600 mt-1">You have a recent analysis result. Would you like to view it?</p>
              </div>
            </div>
            <button 
              onClick={dismissLastAnalysisPopup}
              className="text-gray-400 hover:text-gray-600"
            >
              <span className="sr-only">Close</span>
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          <div className="mt-3 flex space-x-3">
            <button
              onClick={handleViewLastAnalysis}
              className="flex-1 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 flex items-center justify-center"
            >
              View Results
              <ArrowRight className="ml-2 h-4 w-4" />
            </button>
            <button
              onClick={dismissLastAnalysisPopup}
              className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 text-sm font-medium rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
            >
              Dismiss
            </button>
          </div>
        </div>
      )}

      <main>
        {/* Hero Section */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 pb-24 text-center">
          <h2 className="text-4xl font-extrabold text-gray-900 sm:text-5xl">
            Verify News Credibility with AI
          </h2>
          <p className="mt-4 text-xl text-gray-600 max-w-3xl mx-auto">
            Combat misinformation and enhance your digital literacy with our AI-powered 
            news verification system.
          </p>
          
          {/* Input Form with Dropdown */}
          <div className="mt-12 max-w-xl mx-auto">
            <form onSubmit={handleSubmit}>
              <div className="mb-4">
                <div className="inline-flex rounded-md shadow-sm">
                  <button
                    type="button"
                    onClick={() => setInputType('url')}
                    className={`flex items-center px-4 py-2 text-sm font-medium rounded-l-md border ${
                      inputType === 'url' 
                        ? 'bg-blue-600 text-white border-blue-600' 
                        : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    <Link className="h-4 w-4 mr-2" />
                    URL
                  </button>
                  <button
                    type="button"
                    onClick={() => setInputType('text')}
                    className={`flex items-center px-4 py-2 text-sm font-medium rounded-r-md border ${
                      inputType === 'text' 
                        ? 'bg-blue-600 text-white border-blue-600' 
                        : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    <FileText className="h-4 w-4 mr-2" />
                    Text
                  </button>
                </div>
              </div>

              <p className='text-red-500 font-normal'>
                {error}
              </p>
              <div className="sm:flex">
                <div className="min-w-0 flex-1">
                  {inputType === 'url' ? (
                    <>
                      <label htmlFor="url" className="sr-only">News URL</label>
                      <input
                        id="url"
                        type="url"
                        placeholder="Paste a news article URL"
                        value={inputValue}
                        onChange={(e) => setInputValue(e.target.value)}
                        required
                        className="block w-full px-5 py-3 text-gray-600 rounded-md shadow-sm border-gray-300 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </>
                  ) : (
                    <>
                      <label htmlFor="text" className="sr-only">News Text</label>
                      <textarea
                        id="text"
                        placeholder="Paste or type news article text"
                        value={inputValue}
                        onChange={(e) => setInputValue(e.target.value)}
                        required
                        rows={3}
                        className="block w-full px-5 py-3 text-gray-600 rounded-md shadow-sm border-gray-300 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </>
                  )}
                </div>
                <div className="mt-3 sm:mt-0 sm:ml-3">
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="block w-full py-3 px-5 rounded-md shadow bg-blue-600 text-white font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-75 flex items-center justify-center"
                  >
                    {isSubmitting ? (
                      <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                    ) : (
                      <>
                        <Search className="h-5 w-5 mr-2" />
                        Verify Now
                      </>
                    )}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </section>

        {/* How It Works Section */}
        <section id="how-it-works" className="bg-white py-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">How It Works</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
              <div className="text-center">
                <div className="bg-blue-100 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Search className="h-6 w-6 text-blue-600" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">Submit Content</h3>
                <p className="text-gray-600">Paste a URL or text from any news article you'd like to verify.</p>
              </div>
              
              <div className="text-center">
                <div className="bg-blue-100 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Shield className="h-6 w-6 text-blue-600" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">AI Analysis</h3>
                <p className="text-gray-600">Our AI analyzes the content by cross-referencing with trusted sources.</p>
              </div>
              
              <div className="text-center">
                <div className="bg-blue-100 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Check className="h-6 w-6 text-blue-600" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">Credibility Score</h3>
                <p className="text-gray-600">Receive a 1-10 credibility score with detailed insights on the article.</p>
              </div>
              
              <div className="text-center">
                <div className="bg-blue-100 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Info className="h-6 w-6 text-blue-600" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">Alternative Sources</h3>
                <p className="text-gray-600">Get suggestions for verified sources covering the same topic.</p>
              </div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="py-16 bg-gray-50" id="about">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="lg:grid lg:grid-cols-2 lg:gap-8 items-center">
              <div>
                <h2 className="text-3xl font-bold text-gray-900 mb-4">
                  Combat Misinformation with AI
                </h2>
                <p className="text-lg text-gray-600 mb-6">
                  Our AI-powered system helps you:
                </p>
                <ul className="space-y-4">
                  <li className="flex">
                    <Check className="h-6 w-6 text-green-500 flex-shrink-0 mr-3" />
                    <span className="text-gray-600">Verify news against multiple trusted sources</span>
                  </li>
                  <li className="flex">
                    <Check className="h-6 w-6 text-green-500 flex-shrink-0 mr-3" />
                    <span className="text-gray-600">Get objective credibility scores for any article</span>
                  </li>
                  <li className="flex">
                    <Check className="h-6 w-6 text-green-500 flex-shrink-0 mr-3" />
                    <span className="text-gray-600">Discover reliable alternative sources</span>
                  </li>
                  <li className="flex">
                    <Check className="h-6 w-6 text-green-500 flex-shrink-0 mr-3" />
                    <span className="text-gray-600">Generate multi-source summaries on any topic</span>
                  </li>
                </ul>
              </div>
              <div className="mt-10 lg:mt-0">
                <ScoreCard
                  score={7.5} 
                  fact_score={8} 
                  src_score={6} 
                  bias_score={6}
                />
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="bg-white border-t border-gray-200 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="flex items-center">
              <Shield className="h-6 w-6 text-blue-600" />
              <span className="ml-2 text-xl font-bold text-gray-900">TrueFact</span>
            </div>
            <div className="mt-4 md:mt-0 text-center md:text-left">
              <p className="text-gray-600">
                © 2025 TrueFact. Combating misinformation with AI.
              </p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}