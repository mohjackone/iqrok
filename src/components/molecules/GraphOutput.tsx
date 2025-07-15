'use client';

import React from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ChartOptions,
} from 'chart.js';
import { Bar } from 'react-chartjs-2';

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

interface VerseRelevancy {
  verse_ref: string;
  relevance: number;
  skor_final?: number;
  'map@10'?: number;
  mrr?: number;
  surah_name?: string;
}

interface GraphOutputProps {
  queryVerses: VerseRelevancy[];
  relatedVerses: VerseRelevancy[];
}

const GraphOutput: React.FC<GraphOutputProps> = ({ queryVerses, relatedVerses }) => {
  // Process data for the chart
  const processVerseData = (verses: VerseRelevancy[]) => {
    // Sort verses by combined MAP@10 and MRR score
    const sortedVerses = [...verses].sort((a, b) => {
      const scoreA = (a['map@10'] || 0) + (a.mrr || 0);
      const scoreB = (b['map@10'] || 0) + (b.mrr || 0);
      return scoreB - scoreA; // Sort in descending order
    });

    return sortedVerses.slice(0, 5).map(verse => ({  // Limit to first 5 verses
      ref: verse.verse_ref,
      relevance: Number(verse.relevance) || 0,
      map: verse['map@10'] || 0,
      mrr: verse.mrr || 0,
      final: verse.skor_final || 0,
      surah_name: verse.surah_name || ''
    }));
  };

  const queryData = processVerseData(queryVerses);
  const relatedData = processVerseData(relatedVerses);

  // For debugging
  console.log('Related Verses Data:', relatedVerses);
  console.log('Processed Related Data:', relatedData);

  // Common chart options
  const commonOptions: Partial<ChartOptions<'bar'>> = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      y: {
        beginAtZero: true,
        max: 1,
        ticks: {
          callback: function(value) {
            return Number(value).toFixed(2);
          },
          font: {
            family: "'Saira', sans-serif"
          }
        }
      },
      x: {
        ticks: {
          maxRotation: 45,
          minRotation: 45,
          callback: function(value, index) {
            const label = this.getLabelForValue(value as number);
            // Truncate long labels
            return label.length > 30 ? label.substring(0, 27) + '...' : label;
          },
          font: {
            family: "'Saira', sans-serif"
          }
        }
      }
    }
  };

  // Relevancy chart options
  const relevancyOptions: ChartOptions<'bar'> = {
    ...commonOptions,
    plugins: {
      legend: {
        display: false
      },
      title: {
        display: true,
        text: 'Skor Relevansi',
        color: '#374151',
        font: {
          size: 16,
          weight: 'bold',
          family: "'Saira', sans-serif"
        }
      },
      tooltip: {
        callbacks: {
          label: (context: any) => {
            const label = context.dataset.label || '';
            const value = context.parsed.y;
            return `${label}: ${(value * 100).toFixed(1)}%`;
          }
        }
      }
    }
  };

  // Metrics chart options
  const metricsOptions: ChartOptions<'bar'> = {
    ...commonOptions,
    plugins: {
      legend: {
        display: false
      },
      title: {
        display: true,
        text: 'Metrik Evaluasi',
        color: '#374151',
        font: {
          size: 16,
          weight: 'bold',
          family: "'Saira', sans-serif"
        }
      },
      tooltip: {
        callbacks: {
          label: (context: any) => {
            const label = context.dataset.label || '';
            const value = context.parsed.y;
            return `${label}: ${value.toFixed(3)}`;
          }
        }
      }
    }
  };

  const labels = Array.from(new Set([...queryData, ...relatedData].map(v => v.ref))).slice(0, 5);

  // Prepare data for relevancy chart
  const relevancyData = {
    labels,
    datasets: [
      {
        label: 'Relevansi Pertanyaan Pengguna',
        data: queryData.map(v => v.final),
        backgroundColor: 'rgba(47, 181, 168, 0.6)',
        borderColor: 'rgba(47, 181, 168, 1)',
        borderWidth: 1,
      },
      {
        label: 'Relevansi Pertanyaan Terkait',
        data: relatedData.map(v => v.relevance),
        backgroundColor: 'rgba(63, 134, 199, 0.6)',
        borderColor: 'rgba(63, 134, 199, 1)',
        borderWidth: 1,
      }
    ]
  };

  // Prepare data for metrics chart
  const metricsData = {
    labels,
    datasets: [
      {
        label: 'MAP@10',
        data: queryData.map(v => v.map),
        backgroundColor: 'rgba(253, 196, 66, 0.6)',
        borderColor: 'rgba(253, 196, 66, 1)',
        borderWidth: 1,
      },
      {
        label: 'MRR',
        data: queryData.map(v => v.mrr),
        backgroundColor: 'rgba(241, 117, 117, 0.6)',
        borderColor: 'rgba(241, 117, 117, 1)',
        borderWidth: 1,
      }
    ]
  };

  return (
    <div className="flex mb-0">
      <div className="w-2 bg-gradient-to-b from-[#2FB5A8] to-[#3F86C7]" />
      <div className="flex-1 bg-gradient-to-r from-[#2FB5A8]/10 to-[#eafaf7] shadow-md mb-0 p-3">
        <h3 className="text-xl font-semibold mb-4">Evaluasi Hasil</h3>
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div className="h-[400px] bg-white rounded-lg p-4 shadow-sm">
            <Bar options={relevancyOptions} data={relevancyData} />
          </div>
          <div className="h-[400px] bg-white rounded-lg p-4 shadow-sm">
            <Bar options={metricsOptions} data={metricsData} />
          </div>
        </div>
        <div className="mt-4 text-sm flex gap-4">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-sm bg-[#2FB5A8]" />
            <span>Relevansi Pertanyaan Pengguna</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-sm bg-[#3F86C7]" />
            <span>Relevansi Pertanyaan Terkait</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-sm bg-[#FDC442]" />
            <span>MAP@10</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-sm bg-[#F17575]" />
            <span>MRR</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GraphOutput;
