import Link from 'next/link';
import Navbar from '../components/Navbar';

const STOCKS = [
  "APOLLOHOSP.NS", "EICHERMOT.NS", "DRREDDY.NS", "DIVISLAB.NS", "BPCL.NS",
  "GODREJCP.NS", "JIOFIN.NS", "SIEMENS.NS", "IOC.NS", "BAJAJHLDNG.NS",
  "HEROMOTOCO.NS", "TATAPOWER.NS", "ADANIPOWER.NS", "DLF.NS", "INDIGO.NS",
  "GAIL.NS", "AMBUJACEM.NS", "BANKBARODA.NS", "CHOLAFIN.NS", "HAVELLS.NS",
  "PIDILITIND.NS", "UNITDSPR.NS", "SHREECEM.NS", "ABB.NS", "VEDL.NS"
];

export default function Home() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      <main className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-extrabold text-gray-900 sm:text-5xl sm:tracking-tight lg:text-6xl">
            Market Intelligence <span className="text-blue-600">Reimagined</span>
          </h1>
          <p className="mt-5 max-w-xl mx-auto text-xl text-gray-500">
            Select a stock below to generate AI-powered price predictions using advanced Machine Learning algorithms.
          </p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
          {STOCKS.map((ticker) => (
            <Link 
              key={ticker} 
              href={`/stock/${ticker}`}
              className="transform hover:-translate-y-1 transition-all duration-200"
            >
              <div className="bg-white overflow-hidden shadow rounded-lg hover:shadow-xl border border-gray-100 p-6 text-center cursor-pointer group">
                <div className="text-lg font-bold text-gray-800 group-hover:text-blue-600">
                  {ticker.split('.')[0]}
                </div>
                <div className="text-xs text-gray-400 mt-1">NSE</div>
              </div>
            </Link>
          ))}
        </div>
      </main>
    </div>
  );
}