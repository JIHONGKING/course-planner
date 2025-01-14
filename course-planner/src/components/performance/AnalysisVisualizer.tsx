import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { AlertTriangle, TrendingUp, TrendingDown, Minus, Brain } from 'lucide-react';

interface AnalysisVisualizerProps {
  analysisResult: {
    trend: 'improving' | 'declining' | 'stable';
    anomalies: Array<{
      timestamp: number;
      metric: string;
      value: number;
      expectedValue: number;
      deviation: number;
    }>;
    predictions: Array<{
      timestamp: number;
      metric: string;
      predictedValue: number;
      confidence: number;
    }>;
    recommendations: Array<{
      type: 'optimization' | 'warning' | 'critical';
      message: string;
      impact: 'high' | 'medium' | 'low';
      suggestion: string;
    }>;
  };
}

export default function AnalysisVisualizer({ analysisResult }: AnalysisVisualizerProps) {
  const getTrendIcon = () => {
    switch (analysisResult.trend) {
      case 'improving':
        return <TrendingUp className="h-5 w-5 text-green-500" />;
      case 'declining':
        return <TrendingDown className="h-5 w-5 text-red-500" />;
      default:
        return <Minus className="h-5 w-5 text-gray-500" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Trend Analysis */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5 text-blue-500" />
            Performance Analysis
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Current Trend */}
            <div className="p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Current Trend</span>
                {getTrendIcon()}
              </div>
              <p className="mt-2 text-2xl font-bold capitalize">
                {analysisResult.trend}
              </p>
            </div>
            
            {/* Anomaly Count */}
            <div className="p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Detected Anomalies</span>
                <AlertTriangle className="h-5 w-5 text-yellow-500" />
              </div>
              <p className="mt-2 text-2xl font-bold">
                {analysisResult.anomalies.length}
              </p>
            </div>
          </div>

          {/* Predictions Chart */}
          <div className="mt-6">
            <h3 className="text-sm font-medium mb-4">Performance Predictions</h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={analysisResult.predictions}
                  margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis
                    dataKey="timestamp"
                    tickFormatter={(ts) => new Date(ts).toLocaleTimeString()}
                  />
                  <YAxis />
                  <Tooltip
                    labelFormatter={(ts) => new Date(Number(ts)).toLocaleString()}
                    formatter={(value: any) => [`${value.toFixed(2)}ms`, 'Predicted']}
                  />
                  <Line
                    type="monotone"
                    dataKey="predictedValue"
                    stroke="#3B82F6"
                    strokeWidth={2}
                    dot={{ r: 5 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Recommendations */}
          <div className="mt-6">
            <h3 className="text-sm font-medium mb-4">Recommendations</h3>
            <div className="space-y-3">
              {analysisResult.recommendations.map((recommendation, index) => (
                <div
                  key={index}
                  className={`p-4 rounded-lg ${
                    recommendation.type === 'critical'
                      ? 'bg-red-50 border border-red-200'
                      : recommendation.type === 'warning'
                      ? 'bg-yellow-50 border border-yellow-200'
                      : 'bg-blue-50 border border-blue-200'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <AlertTriangle className={`h-5 w-5 mt-0.5 ${
                      recommendation.type === 'critical'
                        ? 'text-red-500'
                        : recommendation.type === 'warning'
                        ? 'text-yellow-500'
                        : 'text-blue-500'
                    }`} />
                    <div>
                      <p className="font-medium">{recommendation.message}</p>
                      <p className="mt-1 text-sm">{recommendation.suggestion}</p>
                      <div className="mt-2">
                        <span className={`text-xs px-2 py-1 rounded-full ${
                          recommendation.impact === 'high'
                            ? 'bg-red-100 text-red-700'
                            : recommendation.impact === 'medium'
                            ? 'bg-yellow-100 text-yellow-700'
                            : 'bg-blue-100 text-blue-700'
                        }`}>
                          {recommendation.impact.toUpperCase()} IMPACT
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}