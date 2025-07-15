'use client';

import React, { useState, useEffect } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ChartOptions,
  ChartData,
} from 'chart.js';
import { Bar } from 'react-chartjs-2';
import { Trash2 } from 'lucide-react';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

interface HistoryItem {
  encoder: string;
  query: string;
  timestamp: string;
  relevancy: number;
  map: number;
  mrr: number;
  related_relevancy: number;
  verses_stats?: {
    total_related: number;
    total_processed: number;
    total_predicted: number;
    related_verses?: Array<{
      surah_name: string;
      sura: string;
      aya: string;
    }>;
    processed_verses?: Array<{
      surah_name: string;
      sura: string;
      aya: string;
    }>;
    predicted_verses?: Array<{
      surah_name: string;
      sura: string;
      aya: string;
    }>;
  };
}

interface RankingItem {
  index: number;
  encoder: string;
  query: string;
  map: number;
  mrr: number;
  combinedScore: number;
}

interface Props {
  history: HistoryItem[];
  onHistoryUpdate?: (newHistory: HistoryItem[]) => void;
  onDelete?: (index: number) => void;
}

const getRankColor = (rank: number) => {
  switch(rank) {
    case 1: return '#FFD700'; // Gold
    case 2: return '#C0C0C0'; // Silver
    case 3: return '#CD7F32'; // Bronze
    default: return '#94A3B8'; // Default slate color
  }
};

const GraphHistory: React.FC<Props> = ({ history, onHistoryUpdate, onDelete }) => {
  const [rankings, setRankings] = useState<RankingItem[]>([]);
  const [expandedRows, setExpandedRows] = useState<{ [key: number]: boolean }>({});
  const [hoveredBar, setHoveredBar] = useState<number | null>(null);
  const [chartData, setChartData] = useState<ChartData<'bar'>>({
    labels: [],
    datasets: []
  });

  // Function to format encoder name to be more readable
  const formatEncoderName = (encoder: string | undefined) => {
    if (!encoder) return 'Unknown Encoder';
    
    // Map of encoder paths to display names
    const encoderNames: { [key: string]: string } = {
      'firqaaa/indo-sentence-bert-base': 'Indo-SBERT Base',
      'indobenchmark/indobert-base-p1': 'IndoBERT Base P1',
      'msmarco-distilbert-base-tas-b': 'MS MARCO DistilBERT',
      'aubmindlab/bert-base-arabert': 'Arabert',
      'text-embedding-ada-002': 'OpenAI Ada'
    };

    return encoderNames[encoder] || encoder;
  };

  // Function to delete a history item
  const handleDelete = (index: number) => {
    const newHistory = history.filter((_, i) => i !== index);
    
    // Update localStorage
    localStorage.setItem('graphHistory', JSON.stringify(newHistory));
    
    // Notify parent component if callback exists
    if (onHistoryUpdate) {
      onHistoryUpdate(newHistory);
    }
  };

  // Function to create formatted labels
  const createLabel = (item: HistoryItem) => {
    const encoderName = formatEncoderName(item.encoder);
    const query = item.query || 'No Query';
    return `${encoderName} (${query})`;
  };

  useEffect(() => {
    if (!history || history.length === 0) return;

    // Calculate rankings
    const rankingData = history.map((item, index) => ({
      index,
      encoder: item.encoder,
      query: item.query,
      map: item.map,
      mrr: item.mrr,
      combinedScore: (item.map + item.mrr) / 2
    }));

    // Sort by combined score in descending order
    const sortedRankings = rankingData.sort((a, b) => b.combinedScore - a.combinedScore);
    setRankings(sortedRankings);

    // Chart data setup remains the same
    const data: ChartData<'bar'> = {
      labels: history.map(() => ''),
      datasets: [
        {
          label: 'MAP@10',
          data: history.map(item => item.map),
          backgroundColor: 'rgba(253, 196, 66, 0.6)',
          borderColor: 'rgba(253, 196, 66, 1)',
          borderWidth: 1,
          borderRadius: 4,
        },
        {
          label: 'MRR',
          data: history.map(item => item.mrr),
          backgroundColor: 'rgba(241, 117, 117, 0.6)',
          borderColor: 'rgba(241, 117, 117, 1)',
          borderWidth: 1,
          borderRadius: 4,
        }
      ]
    };

    setChartData(data);
  }, [history]);

  const options: ChartOptions<'bar'> = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      y: {
        beginAtZero: true,
        max: 1,
        grid: {
          display: true,
          color: '#E5E7EB',
          drawTicks: false
        },
        border: {
          display: false
        },
        ticks: {
          callback: function(value) {
            return Number(value).toFixed(2);
          },
          font: {
            family: "'Saira', sans-serif",
            size: 10
          },
          color: '#666666'
        }
      },
      x: {
        grid: {
          display: true,
          color: '#E5E7EB',
          drawTicks: false
        },
        border: {
          display: false
        },
        ticks: {
          maxRotation: 45,
          minRotation: 45,
          callback: function(value, index) {
            return '';
          },
          font: {
            family: "'Saira', sans-serif"
          }
        }
      }
    },
    plugins: {
      legend: {
        display: false
      },
      title: {
        display: false
      },
      tooltip: {
        backgroundColor: 'white',
        titleColor: '#666666',
        bodyColor: '#666666',
        borderColor: '#e5e7eb',
        borderWidth: 1,
        padding: 12,
        cornerRadius: 8,
        titleFont: {
          size: 12,
          weight: 'bold',
          family: "'Saira', sans-serif"
        },
        bodyFont: {
          size: 12,
          family: "'Saira', sans-serif"
        },
        callbacks: {
          title: (context) => {
            const idx = context[0].dataIndex;
            const item = history[idx];
            return [
              `Time: ${item.timestamp || 'No Time'}`
            ];
          },
          label: (context) => {
            const label = context.dataset.label || '';
            const value = context.parsed.y;
            return `${label}: ${value.toFixed(3)}`;
          }
        }
      }
    },
    onHover: (event: any, elements: any[]) => {
      if (elements && elements.length > 0) {
        setHoveredBar(elements[0].index);
      } else {
        setHoveredBar(null);
      }
    }
  };

  // Function to toggle row expansion
  const toggleRowExpansion = (index: number) => {
    setExpandedRows(prev => ({
      ...prev,
      [index]: !prev[index]
    }));
  };

  return (
    <div className="bg-white border border-gray-200 shadow-sm overflow-hidden mb-2">
      {/* Header */}
      <div className="bg-gradient-to-r from-[#2FB5A8] to-[#3F86C7] text-white p-2 rounded-t-lg">
        <div className="grid grid-cols-3 items-center">
          <div className="flex items-center justify-start">
            <div className="flex items-center justify-center" style={{ minWidth: '1.7em' }}>
              <span style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '1.5em',
                height: '1.5em',
                background: '#65d1cb',
                color: '#fff',
                fontSize: '0.95em',
                borderRadius: '50%',
              }}>
                H
              </span>
            </div>
          </div>
          <div className="text-center font-medium">Riwayat Metrik Evaluasi</div>
          <div className="flex justify-end">
            <button
              onClick={() => {
                if (window.confirm('Apakah Anda yakin ingin menghapus semua riwayat?')) {
                  localStorage.removeItem('graphHistory');
                  if (onHistoryUpdate) {
                    onHistoryUpdate([]);
                  }
                }
              }}
              disabled={history.length === 0}
              className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors ${
                history.length === 0
                  ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                  : 'bg-red-500 text-white hover:bg-red-600'
              }`}
            >
              Hapus Semua
            </button>
          </div>
        </div>
      </div>

      <div className="p-5 rounded-b-lg">
        {/* Chart */}
        <div className="relative h-[300px] mb-16">
          <Bar options={options} data={chartData} />
          
          {/* Rank numbers positioned below bars */}
          <div className="absolute bottom-[-40px] left-0 right-0 px-8">
            <div className="flex">
              {history.map((_, index) => (
                <div
                  key={index}
                  className="flex-1 flex justify-center"
                >
                  <div
                    className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white"
                    style={{
                      backgroundColor: getRankColor(rankings.findIndex(r => r.index === index) + 1)
                    }}
                  >
                    {rankings.findIndex(r => r.index === index) + 1}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Rankings Table */}
        <div className="mt-10 overflow-x-auto">
          <div className="flex rounded-lg shadow-sm">
            <div className="w-2.5 bg-gradient-to-b from-[#2FB5A8] to-[#3F86C7] rounded-l-lg"></div>
            <div className="flex-1 bg-gradient-to-r from-[#2FB5A8]/10 to-[#eafaf7] rounded-r-lg">
              <div className="p-4">
                <h3 className="text-gray-700 font-semibold mb-4">Metrik Evaluasi</h3>
                <table className="w-full text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-gray-300">
                      <th className="px-2 py-1.5 text-center font-medium text-gray-600 w-[5%]">Peringkat</th>
                      <th className="px-2 py-1.5 text-center font-medium text-gray-600 w-[15%]">Encoder</th>
                      <th className="px-2 py-1.5 text-center font-medium text-gray-600 w-[30%]">Pertanyaan</th>
                      <th className="px-2 py-1.5 text-center font-medium text-gray-600 w-[10%]">MAP@10</th>
                      <th className="px-2 py-1.5 text-center font-medium text-gray-600 w-[10%]">MRR</th>
                      <th className="px-2 py-1.5 text-center font-medium text-gray-600 w-[10%]">Skor Gabungan</th>
                      <th className="px-2 py-1.5 text-center font-medium text-gray-600 w-[15%]">Keberhasilan Prediksi</th>
                      <th className="px-2 py-1.5 text-center font-medium text-gray-600 w-[5%]">Aksi</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rankings.map((item, index) => (
                      <React.Fragment key={item.index}>
                        {/* Main encoder row */}
                        <tr className="border-b border-gray-300 hover:bg-white/30">
                          <td className="px-2 py-1.5 text-center">
                            <div className="flex justify-center">
                              <div
                                className="w-5 h-5 rounded-full flex items-center justify-center text-[11px] font-bold text-white"
                                style={{ backgroundColor: getRankColor(index + 1) }}
                              >
                                {index + 1}
                              </div>
                            </div>
                          </td>
                          <td className="px-2 py-1.5 text-center">
                            <div className="flex justify-center">
                              <span className="px-1.5 py-0.5 text-[11px] bg-[#2FB5A8] text-white rounded">
                                {formatEncoderName(item.encoder)}
                              </span>
                            </div>
                          </td>
                          <td className="px-2 py-1.5">
                            <div className="text-gray-600 text-xs" title={item.query}>
                              {item.query}
                            </div>
                          </td>
                          <td className="px-2 py-1.5 text-center text-gray-600">{item.map.toFixed(3)}</td>
                          <td className="px-2 py-1.5 text-center text-gray-600">{item.mrr.toFixed(3)}</td>
                          <td className="px-2 py-1.5 text-center font-medium text-gray-700">{item.combinedScore.toFixed(3)}</td>
                          <td className="px-2 py-1.5 text-center">
                            {history[item.index]?.verses_stats?.total_processed ? (
                              <div className="flex items-center justify-center gap-1">
                                <span className="text-gray-600">
                                  {Math.round((((history[item.index]?.verses_stats?.total_predicted || 0) / (history[item.index]?.verses_stats?.total_processed || 1)) * 100) * 10) / 10}%
                                </span>
                                <span className="text-[10px] text-gray-500">
                                  ({history[item.index]?.verses_stats?.total_predicted || 0}/{history[item.index]?.verses_stats?.total_processed || 0})
                                </span>
                              </div>
                            ) : (
                              <span className="text-gray-500">-</span>
                            )}
                          </td>
                          <td className="px-2 py-1.5 text-center">
                            <div className="flex flex-col items-end gap-1">
                              <button
                                onClick={() => toggleRowExpansion(index)}
                                className="flex items-center gap-1 px-1.5 py-0.5 text-[11px] font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 rounded transition-colors w-full justify-center"
                              >
                                Detail Hasil Prediksi
                                <span className={`transform transition-transform duration-200 ${expandedRows[index] ? 'rotate-180' : ''}`}>
                                  ▼
                                </span>
                              </button>
                              <div className="h-[1px] bg-gray-200 w-full"></div>
                              <button
                                onClick={() => handleDelete(item.index)}
                                className="flex items-center gap-1 px-1.5 py-0.5 text-[11px] font-medium text-red-500 hover:text-red-700 transition-colors w-full justify-center"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                                Hapus
                              </button>
                            </div>
                          </td>
                        </tr>
                        {/* Expandable verse details */}
                        {expandedRows[index] && (
                          <tr className="border-b border-gray-300">
                            <td colSpan={8} className="px-2 py-1.5">
                              <div className="max-w-5xl mx-auto">
                                <div className="grid grid-cols-3 gap-2 w-full">
                                  {/* Ayat Terkait */}
                                  <div className="flex flex-col items-center w-full">
                                    <div className="flex items-center justify-center gap-1 w-full mb-1">
                                      <div className="text-[11px] font-medium text-blue-800 text-center">Ayat Terkait</div>
                                      <span className="text-[11px] bg-blue-100 text-blue-800 px-1.5 py-0.5 rounded">
                                        {history[item.index]?.verses_stats?.total_related || '0'} ayat
                                      </span>
                                    </div>
                                    <div className="bg-white rounded-lg shadow-sm p-1.5 max-h-24 overflow-y-auto w-full">
                                      {history[item.index]?.verses_stats?.related_verses?.length ? (
                                        <ul className="grid grid-cols-2 gap-0.5 w-full">
                                          {history[item.index]?.verses_stats?.related_verses?.map((verse, idx) => (
                                            <li key={idx} className="text-[11px] text-gray-600 text-left">
                                              {verse.surah_name} ({verse.sura}:{verse.aya})
                                            </li>
                                          ))}
                                        </ul>
                                      ) : (
                                        <p className="text-[11px] text-gray-500 italic text-center">Tidak ada ayat terkait</p>
                                      )}
                                    </div>
                                  </div>
                                  
                                  {/* Ayat Diproses */}
                                  <div className="flex flex-col items-center w-full">
                                    <div className="flex items-center justify-center gap-1 w-full mb-1">
                                      <div className="text-[11px] font-medium text-green-800 text-center">Ayat Diproses</div>
                                      <span className="text-[11px] bg-green-100 text-green-800 px-1.5 py-0.5 rounded">
                                        {history[item.index]?.verses_stats?.total_processed || '0'} ayat
                                      </span>
                                    </div>
                                    <div className="bg-white rounded-lg shadow-sm p-1.5 max-h-24 overflow-y-auto w-full">
                                      {history[item.index]?.verses_stats?.processed_verses?.length ? (
                                        <ul className="grid grid-cols-2 gap-0.5 w-full">
                                          {history[item.index]?.verses_stats?.processed_verses?.map((verse, idx) => (
                                            <li key={idx} className="text-[11px] text-gray-600 text-left">
                                              {verse.surah_name} ({verse.sura}:{verse.aya})
                                            </li>
                                          ))}
                                        </ul>
                                      ) : (
                                        <p className="text-[11px] text-gray-500 italic text-center">Tidak ada ayat diproses</p>
                                      )}
                                    </div>
                                  </div>
                                  
                                  {/* Ayat Berhasil Diprediksi */}
                                  <div className="flex flex-col items-center w-full">
                                    <div className="flex items-center justify-center gap-1 w-full mb-1">
                                      <div className="text-[11px] font-medium text-purple-800 text-center">Ayat Berhasil Diprediksi</div>
                                      <span className="text-[11px] bg-purple-100 text-purple-800 px-1.5 py-0.5 rounded">
                                        {history[item.index]?.verses_stats?.total_predicted || '0'} ayat
                                      </span>
                                    </div>
                                    <div className="bg-white rounded-lg shadow-sm p-1.5 max-h-24 overflow-y-auto w-full">
                                      {history[item.index]?.verses_stats?.predicted_verses?.length ? (
                                        <ul className="grid grid-cols-2 gap-0.5 w-full">
                                          {history[item.index]?.verses_stats?.predicted_verses?.map((verse, idx) => (
                                            <li key={idx} className="text-[11px] text-gray-600 text-left">
                                              {verse.surah_name} ({verse.sura}:{verse.aya})
                                            </li>
                                          ))}
                                        </ul>
                                      ) : (
                                        <p className="text-[11px] text-gray-500 italic text-center">Tidak ada ayat hasil prediksi</p>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GraphHistory; 