// @ts-nocheck
"use client";
import { useState, useEffect } from 'react';
import axios from '../../../utils/api';
import { useParams } from 'next/navigation';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';
import { Line, Bar } from 'react-chartjs-2';
import Navbar from '../../../components/Navbar';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

export default function StockDetail() {
  const { symbol } = useParams();
  const [date, setDate] = useState('');
  const [algorithm, setAlgorithm] = useState('Linear Regression');
  const [prediction, setPrediction] = useState<any>(null);
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  // Fetch History on Load
  useEffect(() => {
    if (symbol) {
      axios.get(`http://localhost:5000/api/history/${symbol}`)
        .then(res => setHistory(res.data))
        .catch(err => console.error(err));
    }
  }, [symbol]);

  const handlePredict = async () => {
    if (!date) return alert("Please select a date");
    setLoading(true);
    try {
      const res = await axios.post('http://localhost:5000/api/predict', {
        symbol,
        date,
        algorithm
      });
      setPrediction(res.data);
    } catch (err) {
      console.error(err);
      alert("Prediction failed");
    }
    setLoading(false);
  };

  // --- Chart Data Preparation ---
  const lineChartData = {
    labels: history.slice(-50).map(h => h.date),
    datasets: [
      {
        label: 'Historical Price',
        data: history.slice(-50).map(h => h.price),
        borderColor: 'rgb(59, 130, 246)',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        fill: true,
        tension: 0.4
      }
    ]
  };

  const performanceChartData = {
    labels: ['Linear Regression', 'Random Forest', 'XGBoost', 'LSTM'],
    datasets: [
      {
        label: 'Model Accuracy Score (Simulated)',
        data: [0.85, 0.92, 0.94, 0.91], 
        backgroundColor: [
          'rgba(255, 99, 132, 0.6)',
          'rgba(54, 162, 235, 0.6)',
          'rgba(255, 206, 86, 0.6)',
          'rgba(75, 192, 192, 0.6)',
        ],
      }
    ]
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{String(symbol)} Analysis</h1>
            <p className="text-gray-500">Real-time data & AI projections</p>
          </div>
          <div className="text-right">
             <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
               Market Open
             </span>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Left Column: Controls & Result */}
          <div className="space-y-6">
            <div className="bg-white shadow rounded-lg p-6">
              <h2 className="text-lg font-medium text-gray-900 mb-4">Configuration</h2>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Target Date</label>
                  <input 
                    type="date" 
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm border p-2"
                    onChange={(e) => setDate(e.target.value)}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Algorithm</label>
                  <select 
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm border p-2"
                    value={algorithm}
                    onChange={(e) => setAlgorithm(e.target.value)}
                  >
                    <option>Linear Regression</option>
                    <option>Random Forest</option>
                    <option>XGBoost</option>
                    <option>LSTM</option>
                  </select>
                </div>

                <button 
                  onClick={handlePredict}
                  disabled={loading}
                  className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                >
                  {loading ? 'Analyzing...' : 'PREDICT'}
                </button>
              </div>
            </div>

            {prediction && (
              <div className="bg-white shadow rounded-lg p-6 border-l-4 border-blue-500">
                <h3 className="text-lg font-bold text-gray-900 mb-2">Results</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2">
                    <p className="text-sm text-gray-500">Predicted Price</p>
                    <p className="text-3xl font-bold text-blue-600">₹{prediction.predictedPrice}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">RMSE</p>
                    <p className="font-semibold">{prediction.rmse}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">52W Ratio</p>
                    <p className="font-semibold">{prediction.ratio}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">52W High</p>
                    <p className="font-semibold text-green-600">₹{prediction.week52High}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">52W Low</p>
                    <p className="font-semibold text-red-600">₹{prediction.week52Low}</p>
                  </div>
                </div>
                
                <div className="mt-4 pt-4 border-t border-gray-100">
                  <p className="text-sm font-medium text-gray-900 mb-2">Moving Averages</p>
                  <div className="flex justify-between text-xs">
                    <span className="bg-gray-100 px-2 py-1 rounded">MA20: {prediction.ma20}</span>
                    <span className="bg-gray-100 px-2 py-1 rounded">MA50: {prediction.ma50}</span>
                    <span className="bg-gray-100 px-2 py-1 rounded">MA200: {prediction.ma200}</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Right Column: Visualizations */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white shadow rounded-lg p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Price History Trend</h3>
              <div className="h-64">
                <Line data={lineChartData} options={{ maintainAspectRatio: false }} />
              </div>
            </div>

            <div className="bg-white shadow rounded-lg p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Algorithm Comparison</h3>
              <div className="h-64">
                <Bar data={performanceChartData} options={{ maintainAspectRatio: false }} />
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}