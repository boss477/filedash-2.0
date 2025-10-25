import React, { useState, useMemo, useEffect } from 'react';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, ScatterChart, Scatter } from 'recharts';
import { BarChart3, PieChart as PieChartIcon, TrendingUp, Activity, Download, RefreshCw, ZoomIn, ZoomOut, Database } from 'lucide-react';
import { useTheme } from '@/contexts/ThemeContext';

import { Dataset } from '@/types/dataset';

interface ChartBuilderProps {
  data: any[];
  columns: any[];
  datasets?: Dataset[];
  onConfigChange?: (config: any) => void;
  chartId?: string;
}

const COLORS = ['#3B82F6', '#8B5CF6', '#10B981', '#F59E0B', '#EF4444', '#6366F1', '#EC4899', '#14B8A6'];

export const ChartBuilder: React.FC<ChartBuilderProps> = ({ data, columns, datasets = [], onConfigChange, chartId = 'default' }) => {
  const [chartType, setChartType] = useState<'bar' | 'line' | 'pie' | 'scatter'>('bar');
  const [xAxis, setXAxis] = useState<string>('');
  const [yAxis, setYAxis] = useState<string>('');
  const [groupBy, setGroupBy] = useState<string>('none');
  const [selectedDatasetId, setSelectedDatasetId] = useState<string>('');
  const [combinedMode, setCombinedMode] = useState<boolean>(false);
  const [combinedData, setCombinedData] = useState<any[]>([]);
  const [zoomLevel, setZoomLevel] = useState<number>(1);
  const [configLoaded, setConfigLoaded] = useState(false);
  const { isDarkMode } = useTheme();

  const numericColumns = columns.filter(col => col.type === 'number');
  const categoricalColumns = columns.filter(col => col.type === 'text' || col.type === 'date');
  const allColumns = columns;

  // Load saved configuration on mount
  useEffect(() => {
    const savedConfig = localStorage.getItem(`chart-config-${chartId}`);
    if (savedConfig) {
      try {
        const config = JSON.parse(savedConfig);
        setChartType(config.chartType || 'bar');
        setXAxis(config.xAxis || '');
        setYAxis(config.yAxis || '');
        setGroupBy(config.groupBy || 'none');
        setZoomLevel(config.zoomLevel || 1);
        console.log('Loaded chart configuration for', chartId, ':', config);
      } catch (error) {
        console.error('Error loading chart configuration:', error);
      }
    }
    setConfigLoaded(true);
  }, [chartId]);

  // Save configuration whenever any setting changes (only after initial load)
  useEffect(() => {
    if (!configLoaded) return; // Don't save during initial load
    
    const config = {
      chartType,
      xAxis,
      yAxis,
      groupBy,
      zoomLevel,
      timestamp: new Date().toISOString()
    };

    // Save to localStorage
    localStorage.setItem(`chart-config-${chartId}`, JSON.stringify(config));
    console.log('Auto-saved chart configuration for', chartId, ':', config);

    // Notify parent component
    if (onConfigChange) {
      onConfigChange(config);
    }
  }, [chartType, xAxis, yAxis, groupBy, zoomLevel, onConfigChange, chartId, configLoaded]);

  // Function to combine datasets
  const combineDatasets = () => {
    if (!datasets || datasets.length === 0) return;
    
    // Combine all datasets into one
    const combined = datasets.reduce((acc, dataset) => {
      // Add a source identifier to each row
      const labeledData = dataset.data.map(row => ({
        ...row,
        _source: dataset.name
      }));
      return [...acc, ...labeledData];
    }, []);
    
    setCombinedData(combined);
    setCombinedMode(true);
  };

  // Function to reset to single dataset mode
  const resetToSingleDataset = () => {
    setCombinedMode(false);
    setCombinedData([]);
  };

  const chartData = useMemo(() => {
    if (!xAxis || (chartType !== 'pie' && !yAxis)) return [];

    // Use combined data if in combined mode, otherwise use selected dataset or current data
    const currentData = combinedMode 
      ? combinedData 
      : selectedDatasetId && selectedDatasetId !== 'current' && datasets?.length > 0 
        ? datasets.find(d => d.id === selectedDatasetId)?.data || data
        : data;

    // Safety check to prevent errors
    if (!currentData || !Array.isArray(currentData)) return [];

    let processedData = [...currentData];

    if (chartType === 'pie') {
      // For pie charts, group by xAxis and sum up occurrences or values
      const grouped = processedData.reduce((acc, row) => {
        const key = String(row[xAxis] || 'Unknown');
        if (!acc[key]) {
          acc[key] = { name: key, value: 0, count: 0 };
        }
        
        if (yAxis && !isNaN(Number(row[yAxis]))) {
          acc[key].value += Number(row[yAxis]);
        } else {
          acc[key].value += 1;
        }
        acc[key].count += 1;
        return acc;
      }, {} as Record<string, any>);

      return Object.values(grouped).slice(0, 10); // Limit to top 10 for readability
    }

    if (groupBy && groupBy !== 'none') {
      // Group data by the groupBy field
      const grouped = processedData.reduce((acc, row) => {
        const key = String(row[xAxis] || 'Unknown');
        const group = combinedMode && row._source 
          ? `${row._source} - ${String(row[groupBy] || 'Other')}`
          : String(row[groupBy] || 'Other');
        
        if (!acc[key]) {
          acc[key] = { [xAxis]: key };
        }
        
        const value = yAxis && !isNaN(Number(row[yAxis])) ? Number(row[yAxis]) : 1;
        acc[key][group] = (acc[key][group] || 0) + value;
        
        return acc;
      }, {} as Record<string, any>);

      return Object.values(grouped);
    } else {
      // Simple aggregation
      const grouped = processedData.reduce((acc, row) => {
        const key = String(row[xAxis] || 'Unknown');
        if (!acc[key]) {
          acc[key] = { [xAxis]: key, [yAxis]: 0, count: 0 };
        }
        
        const value = yAxis && !isNaN(Number(row[yAxis])) ? Number(row[yAxis]) : 1;
        acc[key][yAxis] += value;
        acc[key].count += 1;
        
        return acc;
      }, {} as Record<string, any>);

      return Object.values(grouped);
    }
  }, [data, datasets, selectedDatasetId, combinedMode, combinedData, xAxis, yAxis, groupBy, chartType]);

  const handleZoomIn = () => {
    const newZoom = Math.min(zoomLevel + 0.25, 3);
    setZoomLevel(newZoom);
    console.log('Zoom in to:', newZoom);
  };

  const handleZoomOut = () => {
    const newZoom = Math.max(zoomLevel - 0.25, 0.5);
    setZoomLevel(newZoom);
    console.log('Zoom out to:', newZoom);
  };

  const resetZoom = () => {
    setZoomLevel(1);
    console.log('Reset zoom to 1');
  };

  const exportChart = () => {
    const chartConfig = {
      type: chartType,
      xAxis,
      yAxis,
      groupBy,
      zoomLevel,
      data: chartData,
      timestamp: new Date().toISOString(),
      chartId
    };
    
    try {
      const dataStr = JSON.stringify(chartConfig, null, 2);
      const dataBlob = new Blob([dataStr], { type: 'application/json' });
      const url = URL.createObjectURL(dataBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `chart-config-${chartId}-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      console.log('Chart configuration exported successfully');
    } catch (error) {
      console.error('Error exporting chart:', error);
    }
  };

  const resetChart = () => {
    setChartType('bar');
    setXAxis('');
    setYAxis('');
    setGroupBy('none');
    setZoomLevel(1);
    // Clear saved configuration
    localStorage.removeItem(`chart-config-${chartId}`);
    console.log('Chart reset and localStorage cleared for:', chartId);
  };

  const renderChart = () => {
    // Safety check for chartData
    if (!chartData || !Array.isArray(chartData) || chartData.length === 0) {
      return (
        <div className="h-64 flex items-center justify-center">
          <div className="text-center">
            <BarChart3 className={`h-12 w-12 mx-auto mb-3 opacity-50 ${
              isDarkMode ? 'text-gray-400' : 'text-gray-500'
            }`} />
            <p className={`text-lg ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
              Select fields to generate chart
            </p>
          </div>
        </div>
      );
    }

    const chartTheme = {
      grid: { stroke: isDarkMode ? '#374151' : '#e5e7eb' },
      text: { fill: isDarkMode ? '#d1d5db' : '#374151' },
      axis: { stroke: isDarkMode ? '#6b7280' : '#9ca3af' }
    };

    // Calculate responsive dimensions with zoom
    const baseHeight = 300;
    const chartHeight = baseHeight * zoomLevel;
    const containerStyle = {
      width: '100%',
      height: `${chartHeight}px`,
      overflow: 'auto',
      transition: 'all 0.3s ease'
    };

    const commonProps = {
      data: chartData,
      margin: { top: 20, right: 30, left: 20, bottom: 5 }
    };

    switch (chartType) {
      case 'bar':
        return (
          <div style={containerStyle}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart {...commonProps}>
                <CartesianGrid strokeDasharray="3 3" stroke={chartTheme.grid.stroke} />
                <XAxis 
                  dataKey={xAxis} 
                  tick={{ fill: chartTheme.text.fill, fontSize: 12 }}
                  axisLine={{ stroke: chartTheme.axis.stroke }}
                />
                <YAxis 
                  tick={{ fill: chartTheme.text.fill, fontSize: 12 }}
                  axisLine={{ stroke: chartTheme.axis.stroke }}
                />
                <Tooltip 
                  contentStyle={{
                    backgroundColor: isDarkMode ? '#1f2937' : '#ffffff',
                    border: `1px solid ${isDarkMode ? '#374151' : '#e5e7eb'}`,
                    borderRadius: '8px',
                    color: isDarkMode ? '#f3f4f6' : '#111827',
                    fontSize: '14px'
                  }}
                />
                <Legend />
                {groupBy && groupBy !== 'none' ? (
                  // Multiple bars for grouped data
                  [...new Set(chartData.flatMap(d => Object.keys(d).filter(k => k !== xAxis && k !== 'count')))].slice(0, 8).map((group, index) => (
                    <Bar key={group} dataKey={group} fill={COLORS[index % COLORS.length]} />
                  ))
                ) : (
                  <Bar dataKey={yAxis} fill={COLORS[0]} />
                )}
              </BarChart>
            </ResponsiveContainer>
          </div>
        );

      case 'line':
        return (
          <div style={containerStyle}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart {...commonProps}>
                <CartesianGrid strokeDasharray="3 3" stroke={chartTheme.grid.stroke} />
                <XAxis 
                  dataKey={xAxis}
                  tick={{ fill: chartTheme.text.fill, fontSize: 12 }}
                  axisLine={{ stroke: chartTheme.axis.stroke }}
                />
                <YAxis 
                  tick={{ fill: chartTheme.text.fill, fontSize: 12 }}
                  axisLine={{ stroke: chartTheme.axis.stroke }}
                />
                <Tooltip 
                  contentStyle={{
                    backgroundColor: isDarkMode ? '#1f2937' : '#ffffff',
                    border: `1px solid ${isDarkMode ? '#374151' : '#e5e7eb'}`,
                    borderRadius: '8px',
                    color: isDarkMode ? '#f3f4f6' : '#111827',
                    fontSize: '14px'
                  }}
                />
                <Legend />
                <Line type="monotone" dataKey={yAxis} stroke={COLORS[0]} strokeWidth={3} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        );

      case 'pie':
        return (
          <div style={containerStyle}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={chartData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  outerRadius={Math.min(80 * zoomLevel, 150)}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{
                    backgroundColor: isDarkMode ? '#1f2937' : '#ffffff',
                    border: `1px solid ${isDarkMode ? '#374151' : '#e5e7eb'}`,
                    borderRadius: '8px',
                    color: isDarkMode ? '#f3f4f6' : '#111827',
                    fontSize: '14px'
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        );

      case 'scatter':
        return (
          <div style={containerStyle}>
            <ResponsiveContainer width="100%" height="100%">
              <ScatterChart {...commonProps}>
                <CartesianGrid stroke={chartTheme.grid.stroke} />
                <XAxis 
                  dataKey={xAxis}
                  tick={{ fill: chartTheme.text.fill, fontSize: 12 }}
                  axisLine={{ stroke: chartTheme.axis.stroke }}
                />
                <YAxis 
                  dataKey={yAxis}
                  tick={{ fill: chartTheme.text.fill, fontSize: 12 }}
                  axisLine={{ stroke: chartTheme.axis.stroke }}
                />
                <Tooltip 
                  cursor={{ strokeDasharray: '3 3' }}
                  contentStyle={{
                    backgroundColor: isDarkMode ? '#1f2937' : '#ffffff',
                    border: `1px solid ${isDarkMode ? '#374151' : '#e5e7eb'}`,
                    borderRadius: '8px',
                    color: isDarkMode ? '#f3f4f6' : '#111827',
                    fontSize: '14px'
                  }}
                />
                <Scatter fill={COLORS[0]} />
              </ScatterChart>
            </ResponsiveContainer>
          </div>
        );

      default:
        return null;
    }
  };

  const chartTypeOptions = [
    { value: 'bar', label: 'Bar Chart', icon: BarChart3 },
    { value: 'line', label: 'Line Chart', icon: TrendingUp },
    { value: 'pie', label: 'Pie Chart', icon: PieChartIcon },
    { value: 'scatter', label: 'Scatter Plot', icon: Activity }
  ];

  return (
    <ErrorBoundary>
      <div className="space-y-6">
        {/* Chart Controls */}
      <div className="flex justify-between items-center">
        <h3 className={`text-lg font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
          Chart Builder
        </h3>
        <div className="flex items-center space-x-2">
          <div className={`flex items-center space-x-1 border rounded-lg p-1 ${
            isDarkMode ? 'border-gray-600 bg-gray-800' : 'border-gray-300 bg-white'
          }`}>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={handleZoomOut} 
              disabled={zoomLevel <= 0.5}
              className={isDarkMode ? 'text-gray-300 hover:bg-gray-700' : 'text-gray-700 hover:bg-gray-100'}
            >
              <ZoomOut className="h-4 w-4" />
            </Button>
            <span className={`px-2 text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
              {Math.round(zoomLevel * 100)}%
            </span>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={handleZoomIn} 
              disabled={zoomLevel >= 3}
              className={isDarkMode ? 'text-gray-300 hover:bg-gray-700' : 'text-gray-700 hover:bg-gray-100'}
            >
              <ZoomIn className="h-4 w-4" />
            </Button>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={resetZoom}
              className={isDarkMode ? 'text-gray-300 hover:bg-gray-700' : 'text-gray-700 hover:bg-gray-100'}
            >
              Reset
            </Button>
          </div>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={resetChart}
            className={isDarkMode ? 'border-gray-600 bg-gray-800 text-gray-200 hover:bg-gray-700' : ''}
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Reset
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={exportChart}
            className={isDarkMode ? 'border-gray-600 bg-gray-800 text-gray-200 hover:bg-gray-700' : ''}
          >
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Dataset Selection */}
      {datasets && datasets.length > 1 && (
        <div>
          <div className="flex justify-between items-center mb-2">
            <label className={`text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
              Dataset
              <Badge variant="outline" className="ml-2 text-xs">Optional</Badge>
            </label>
            {combinedMode ? (
              <Button 
                variant="outline" 
                size="sm" 
                onClick={resetToSingleDataset}
                className={isDarkMode ? 'border-gray-600 bg-gray-800 text-gray-200 hover:bg-gray-700' : ''}
              >
                Reset to Single
              </Button>
            ) : (
              <Button 
                variant="outline" 
                size="sm" 
                onClick={combineDatasets}
                className={isDarkMode ? 'border-gray-600 bg-gray-800 text-gray-200 hover:bg-gray-700' : ''}
              >
                Combine All Datasets
              </Button>
            )}
          </div>
          <Select 
            value={combinedMode ? 'combined' : selectedDatasetId || 'current'} 
            onValueChange={setSelectedDatasetId}
            disabled={combinedMode}
          >
            <SelectTrigger className={isDarkMode ? 'border-gray-600 bg-gray-800 text-gray-200' : ''}>
              <SelectValue placeholder="Select dataset" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="current">
                <div className="flex items-center space-x-2">
                  <Database className="h-4 w-4" />
                  <span>Current Dataset</span>
                </div>
              </SelectItem>
              {datasets.map((dataset) => (
                <SelectItem key={dataset.id} value={dataset.id}>
                  <div className="flex items-center space-x-2">
                    <Database className="h-4 w-4" />
                    <span>{dataset.name}</span>
                    <Badge className="text-xs bg-blue-100 text-blue-800">
                      {dataset.data.length} rows
                    </Badge>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {/* Chart Type Selection */}
      <div>
        <label className={`text-sm font-medium mb-3 block ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
          Chart Type
        </label>
        <div className="grid grid-cols-2 gap-3">
          {chartTypeOptions.map((option) => {
            const Icon = option.icon;
            return (
              <Button
                key={option.value}
                variant={chartType === option.value ? "default" : "outline"}
                size="sm"
                onClick={() => setChartType(option.value as any)}
                className={`flex items-center space-x-2 h-12 ${
                  chartType !== option.value && isDarkMode 
                    ? 'border-gray-600 bg-gray-800 text-gray-200 hover:bg-gray-700' 
                    : ''
                }`}
              >
                <Icon className="h-5 w-5" />
                <span>{option.label}</span>
              </Button>
            );
          })}
        </div>
      </div>

      {/* Field Selection */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label className={`text-sm font-medium mb-2 block ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
            X-Axis {chartType === 'pie' ? '(Categories)' : ''}
            <Badge variant="secondary" className="ml-2 text-xs">Required</Badge>
          </label>
          <Select value={xAxis} onValueChange={setXAxis}>
            <SelectTrigger className={isDarkMode ? 'border-gray-600 bg-gray-800 text-gray-200' : ''}>
              <SelectValue placeholder="Select field" />
            </SelectTrigger>
            <SelectContent>
              {allColumns.map((column) => (
                <SelectItem key={column.key} value={column.key}>
                  <div className="flex items-center space-x-2">
                    <span>{column.label}</span>
                    <Badge className={`text-xs ${
                      column.type === 'number' ? 'bg-blue-100 text-blue-800' :
                      column.type === 'date' ? 'bg-green-100 text-green-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {column.type}
                    </Badge>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {chartType !== 'pie' && (
          <div>
            <label className={`text-sm font-medium mb-2 block ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
              Y-Axis (Values)
              <Badge variant="secondary" className="ml-2 text-xs">Required</Badge>
            </label>
            <Select value={yAxis} onValueChange={setYAxis}>
              <SelectTrigger className={isDarkMode ? 'border-gray-600 bg-gray-800 text-gray-200' : ''}>
                <SelectValue placeholder="Select field" />
              </SelectTrigger>
              <SelectContent>
                {numericColumns.map((column) => (
                  <SelectItem key={column.key} value={column.key}>
                    <div className="flex items-center space-x-2">
                      <span>{column.label}</span>
                      <Badge className="text-xs bg-blue-100 text-blue-800">
                        {column.type}
                      </Badge>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        <div>
          <label className={`text-sm font-medium mb-2 block ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
            Group By
            <Badge variant="outline" className="ml-2 text-xs">Optional</Badge>
          </label>
          <Select value={groupBy} onValueChange={setGroupBy}>
            <SelectTrigger className={isDarkMode ? 'border-gray-600 bg-gray-800 text-gray-200' : ''}>
              <SelectValue placeholder="Select field" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">None</SelectItem>
              {categoricalColumns.map((column) => (
                <SelectItem key={column.key} value={column.key}>
                  <div className="flex items-center space-x-2">
                    <span>{column.label}</span>
                    <Badge className={`text-xs ${
                      column.type === 'date' ? 'bg-green-100 text-green-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {column.type}
                    </Badge>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Chart Display */}
      <div className={`border-2 rounded-xl p-6 transition-colors duration-300 ${
        isDarkMode ? 'bg-gray-900/50 border-gray-600' : 'bg-white/50 border-gray-200'
      }`}>
        {renderChart()}
      </div>

      {/* Chart Info */}
      {chartData.length > 0 && (
        <div className={`flex justify-between items-center text-sm ${
          isDarkMode ? 'text-gray-400' : 'text-gray-600'
        }`}>
          <span className="font-medium">
            {chartData.length} data points {combinedMode ? '• Combined Mode' : ''} • Zoom: {Math.round(zoomLevel * 100)}%
          </span>
          <div className="flex items-center space-x-3">
            {xAxis && <Badge variant="outline">X: {columns.find(c => c.key === xAxis)?.label}</Badge>}
            {yAxis && <Badge variant="outline">Y: {columns.find(c => c.key === yAxis)?.label}</Badge>}
            {groupBy && groupBy !== 'none' && <Badge variant="outline">Group: {columns.find(c => c.key === groupBy)?.label}</Badge>}
          </div>
        </div>
      )}
    </div>
    </ErrorBoundary>
  );
};
