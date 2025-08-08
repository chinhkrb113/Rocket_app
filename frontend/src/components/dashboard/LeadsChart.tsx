import React from 'react';
import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    Area,
    AreaChart
} from 'recharts';
import './LeadsChart.css';

interface ChartDataPoint {
    date: string;
    leads: number;
    day: string;
}

interface TrendDataPoint {
    date: string;
    count: number;
}

interface LeadsChartProps {
    data: ChartDataPoint[] | TrendDataPoint[];
    loading?: boolean;
    chartType?: 'line' | 'area';
    height?: number;
}

const LeadsChart: React.FC<LeadsChartProps> = ({
    data,
    loading = false,
    chartType = 'area',
    height = 300
}) => {
    // Transform data to consistent format
    const transformedData: ChartDataPoint[] = data.map(item => {
        if ('count' in item) {
            // TrendDataPoint format
            const date = new Date(item.date);
            const dayNames = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];
            return {
                date: item.date,
                leads: item.count,
                day: dayNames[date.getDay()]
            };
        } else {
            // Already ChartDataPoint format
            return item as ChartDataPoint;
        }
    });
    const formatDate = (dateString: string): string => {
        const date = new Date(dateString);
        return new Intl.DateTimeFormat('vi-VN', {
            day: '2-digit',
            month: '2-digit'
        }).format(date);
    };

    const formatTooltipDate = (dateString: string): string => {
        const date = new Date(dateString);
        return new Intl.DateTimeFormat('vi-VN', {
            weekday: 'long',
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
        }).format(date);
    };

    const CustomTooltip = ({ active, payload, label }: any) => {
        if (active && payload && payload.length) {
            return (
                <div className="chart-tooltip">
                    <div className="tooltip-header">
                        {formatTooltipDate(label)}
                    </div>
                    <div className="tooltip-content">
                        <div className="tooltip-item">
                            <span className="tooltip-indicator"></span>
                            <span className="tooltip-label">Leads mới:</span>
                            <span className="tooltip-value">{payload[0].value}</span>
                        </div>
                    </div>
                </div>
            );
        }
        return null;
    };

    const CustomDot = (props: any) => {
        const { cx, cy } = props;
        return (
            <circle
                cx={cx}
                cy={cy}
                r={4}
                fill="#3182ce"
                stroke="#ffffff"
                strokeWidth={2}
                className="chart-dot"
            />
        );
    };

    if (loading) {
        return (
            <div className="leads-chart-container">
                <div className="chart-header">
                    <div className="chart-title-skeleton"></div>
                    <div className="chart-subtitle-skeleton"></div>
                </div>
                <div className="chart-loading">
                    <div className="chart-skeleton">
                        <div className="skeleton-bars">
                            {[...Array(7)].map((_, index) => (
                                <div 
                                    key={index} 
                                    className="skeleton-bar"
                                    style={{ 
                                        height: `${Math.random() * 60 + 20}%`,
                                        animationDelay: `${index * 0.1}s`
                                    }}
                                ></div>
                            ))}
                        </div>
                        <div className="skeleton-axis"></div>
                    </div>
                </div>
            </div>
        );
    }

    if (!data || data.length === 0) {
        return (
            <div className="leads-chart-container">
                <div className="chart-header">
                    <h3 className="chart-title">Leads mới theo ngày</h3>
                    <p className="chart-subtitle">7 ngày qua</p>
                </div>
                <div className="chart-empty">
                    <div className="empty-chart-content">
                        <span className="empty-chart-icon">📈</span>
                        <p>Không có dữ liệu để hiển thị</p>
                    </div>
                </div>
            </div>
        );
    }

    const totalLeads = transformedData.reduce((sum, item) => sum + item.leads, 0);
    const averageLeads = Math.round(totalLeads / transformedData.length);
    const maxLeads = Math.max(...transformedData.map(item => item.leads));

    return (
        <div className="leads-chart-container">
            <div className="chart-header">
                <div className="chart-info">
                    <h3 className="chart-title">Leads mới theo ngày</h3>
                    <p className="chart-subtitle">7 ngày qua</p>
                </div>
                <div className="chart-stats">
                    <div className="stat-item">
                        <span className="stat-label">Tổng:</span>
                        <span className="stat-value">{totalLeads}</span>
                    </div>
                    <div className="stat-item">
                        <span className="stat-label">TB/ngày:</span>
                        <span className="stat-value">{averageLeads}</span>
                    </div>
                    <div className="stat-item">
                        <span className="stat-label">Cao nhất:</span>
                        <span className="stat-value">{maxLeads}</span>
                    </div>
                </div>
            </div>

            <div className="chart-wrapper">
                <ResponsiveContainer width="100%" height={height}>
                    {chartType === 'area' ? (
                        <AreaChart
                            data={transformedData}
                            margin={{
                                top: 20,
                                right: 30,
                                left: 20,
                                bottom: 20,
                            }}
                        >
                            <defs>
                                <linearGradient id="colorLeads" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#3182ce" stopOpacity={0.3}/>
                                    <stop offset="95%" stopColor="#3182ce" stopOpacity={0.05}/>
                                </linearGradient>
                            </defs>
                            <CartesianGrid 
                                strokeDasharray="3 3" 
                                stroke="#e2e8f0"
                                vertical={false}
                            />
                            <XAxis 
                                dataKey="date"
                                tickFormatter={formatDate}
                                axisLine={false}
                                tickLine={false}
                                tick={{ fontSize: 12, fill: '#718096' }}
                                dy={10}
                            />
                            <YAxis 
                                axisLine={false}
                                tickLine={false}
                                tick={{ fontSize: 12, fill: '#718096' }}
                                dx={-10}
                                domain={[0, 'dataMax + 2']}
                            />
                            <Tooltip content={<CustomTooltip />} />
                            <Area
                                type="monotone"
                                dataKey="leads"
                                stroke="#3182ce"
                                strokeWidth={3}
                                fill="url(#colorLeads)"
                                dot={<CustomDot />}
                                activeDot={{ 
                                    r: 6, 
                                    fill: '#3182ce',
                                    stroke: '#ffffff',
                                    strokeWidth: 3
                                }}
                            />
                        </AreaChart>
                    ) : (
                        <LineChart
                            data={transformedData}
                            margin={{
                                top: 20,
                                right: 30,
                                left: 20,
                                bottom: 20,
                            }}
                        >
                            <CartesianGrid 
                                strokeDasharray="3 3" 
                                stroke="#e2e8f0"
                                vertical={false}
                            />
                            <XAxis 
                                dataKey="date"
                                tickFormatter={formatDate}
                                axisLine={false}
                                tickLine={false}
                                tick={{ fontSize: 12, fill: '#718096' }}
                                dy={10}
                            />
                            <YAxis 
                                axisLine={false}
                                tickLine={false}
                                tick={{ fontSize: 12, fill: '#718096' }}
                                dx={-10}
                                domain={[0, 'dataMax + 2']}
                            />
                            <Tooltip content={<CustomTooltip />} />
                            <Line
                                type="monotone"
                                dataKey="leads"
                                stroke="#3182ce"
                                strokeWidth={3}
                                dot={<CustomDot />}
                                activeDot={{ 
                                    r: 6, 
                                    fill: '#3182ce',
                                    stroke: '#ffffff',
                                    strokeWidth: 3
                                }}
                            />
                        </LineChart>
                    )}
                </ResponsiveContainer>
            </div>

            <div className="chart-legend">
                <div className="legend-item">
                    <div className="legend-color"></div>
                    <span className="legend-text">Số lượng leads mới</span>
                </div>
            </div>
        </div>
    );
};

export default LeadsChart;