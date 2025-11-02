import React from 'react';
import { TrendingUp, TrendingDown, BarChart3 } from 'lucide-react';

interface ChartData {
  labels: string[];
  datasets: Array<{
    label: string;
    data: number[];
    color: string;
  }>;
}

interface GrowthChartProps {
  title: string;
  data: ChartData;
  type?: 'line' | 'bar';
}

const GrowthChart: React.FC<GrowthChartProps> = ({ title, data, type = 'line' }) => {
  const maxValue = Math.max(...data.datasets.flatMap(dataset => dataset.data));
  const minValue = Math.min(...data.datasets.flatMap(dataset => dataset.data));
  
  const normalizeValue = (value: number) => {
    if (maxValue === minValue) return 50; // Default height if all values are same
    return ((value - minValue) / (maxValue - minValue)) * 100;
  };

  const getOverallTrend = () => {
    const firstDataset = data.datasets[0];
    if (!firstDataset || firstDataset.data.length < 2) return null;
    
    const firstValue = firstDataset.data[0];
    const lastValue = firstDataset.data[firstDataset.data.length - 1];
    const change = ((lastValue - firstValue) / firstValue) * 100;
    
    return {
      percentage: Math.abs(change).toFixed(1),
      isPositive: change >= 0
    };
  };

  const trend = getOverallTrend();

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <BarChart3 className="h-5 w-5 text-gray-600" />
          <h3 className="text-lg font-medium text-gray-900">{title}</h3>
        </div>
        {trend && (
          <div className={`flex items-center gap-1 text-sm font-medium ${
            trend.isPositive ? 'text-green-600' : 'text-red-600'
          }`}>
            {trend.isPositive ? <TrendingUp size={16} /> : <TrendingDown size={16} />}
            {trend.isPositive ? '+' : '-'}{trend.percentage}%
          </div>
        )}
      </div>

      <div className="relative h-64">
        {type === 'line' ? (
          <svg className="w-full h-full" viewBox="0 0 400 200">
            {data.datasets.map((dataset, datasetIndex) => {
              const points = dataset.data.map((value, index) => {
                const x = (index / (dataset.data.length - 1)) * 380 + 10;
                const y = 190 - (normalizeValue(value) / 100) * 180;
                return `${x},${y}`;
              }).join(' ');

              return (
                <g key={datasetIndex}>
                  <polyline
                    fill="none"
                    stroke={dataset.color}
                    strokeWidth="2"
                    points={points}
                    className="drop-shadow-sm"
                  />
                  {dataset.data.map((value, index) => {
                    const x = (index / (dataset.data.length - 1)) * 380 + 10;
                    const y = 190 - (normalizeValue(value) / 100) * 180;
                    return (
                      <circle
                        key={index}
                        cx={x}
                        cy={y}
                        r="4"
                        fill={dataset.color}
                        className="drop-shadow-sm"
                      />
                    );
                  })}
                </g>
              );
            })}
          </svg>
        ) : (
          <div className="flex items-end justify-between h-full gap-2">
            {data.labels.map((label, index) => (
              <div key={index} className="flex-1 flex flex-col items-center">
                <div className="w-full flex justify-between items-end gap-1 h-48">
                  {data.datasets.map((dataset, datasetIndex) => (
                    <div
                      key={datasetIndex}
                      className="flex-1 rounded-t transition-all duration-500"
                      style={{
                        backgroundColor: dataset.color,
                        height: `${normalizeValue(dataset.data[index])}%`,
                        minHeight: '4px'
                      }}
                      title={`${dataset.label}: ${dataset.data[index]}`}
                    />
                  ))}
                </div>
                <span className="text-xs text-gray-600 mt-2 text-center">{label}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-4 mt-4 pt-4 border-t">
        {data.datasets.map((dataset, index) => (
          <div key={index} className="flex items-center gap-2">
            <div 
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: dataset.color }}
            />
            <span className="text-sm text-gray-700">{dataset.label}</span>
          </div>
        ))}
      </div>

      {/* Data Labels */}
      <div className="grid grid-cols-3 gap-4 mt-4 pt-4 border-t text-center">
        <div>
          <p className="text-sm text-gray-600">Peak</p>
          <p className="font-semibold text-gray-900">{maxValue}</p>
        </div>
        <div>
          <p className="text-sm text-gray-600">Average</p>
          <p className="font-semibold text-gray-900">
            {Math.round(data.datasets[0]?.data.reduce((a, b) => a + b, 0) / data.datasets[0]?.data.length || 0)}
          </p>
        </div>
        <div>
          <p className="text-sm text-gray-600">Low</p>
          <p className="font-semibold text-gray-900">{minValue}</p>
        </div>
      </div>
    </div>
  );
};

export default GrowthChart;