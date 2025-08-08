import React from 'react';
import './MetricCard.css';

interface TrendData {
    value: number;
    isPositive: boolean;
}

interface MetricCardProps {
    title: string;
    value: number;
    icon: string;
    trend?: TrendData;
    color: 'blue' | 'green' | 'purple' | 'orange' | 'red';
    format?: 'number' | 'currency' | 'percentage';
    loading?: boolean;
}

const MetricCard: React.FC<MetricCardProps> = ({
    title,
    value,
    icon,
    trend,
    color,
    format = 'number',
    loading = false
}) => {
    const formatValue = (val: number, fmt: string): string => {
        switch (fmt) {
            case 'currency':
                return new Intl.NumberFormat('vi-VN', {
                    style: 'currency',
                    currency: 'VND',
                    minimumFractionDigits: 0,
                    maximumFractionDigits: 0
                }).format(val);
            case 'percentage':
                return `${val.toFixed(1)}%`;
            case 'number':
            default:
                return new Intl.NumberFormat('vi-VN').format(val);
        }
    };

    const formatTrendValue = (val: number): string => {
        if (format === 'percentage') {
            return `${Math.abs(val).toFixed(1)}%`;
        }
        return `${Math.abs(val)}`;
    };

    if (loading) {
        return (
            <div className={`metric-card metric-card--${color} metric-card--loading`}>
                <div className="metric-card__content">
                    <div className="metric-card__header">
                        <div className="metric-card__icon-skeleton"></div>
                        <div className="metric-card__title-skeleton"></div>
                    </div>
                    <div className="metric-card__value-skeleton"></div>
                    <div className="metric-card__trend-skeleton"></div>
                </div>
            </div>
        );
    }

    return (
        <div className={`metric-card metric-card--${color}`}>
            <div className="metric-card__content">
                <div className="metric-card__header">
                    <div className="metric-card__icon">
                        {icon}
                    </div>
                    <h3 className="metric-card__title">
                        {title}
                    </h3>
                </div>
                
                <div className="metric-card__value">
                    {formatValue(value, format)}
                </div>
                
                {trend && (
                    <div className={`metric-card__trend ${
                        trend.isPositive ? 'metric-card__trend--positive' : 'metric-card__trend--negative'
                    }`}>
                        <span className="metric-card__trend-icon">
                            {trend.isPositive ? '↗️' : '↘️'}
                        </span>
                        <span className="metric-card__trend-value">
                            {formatTrendValue(trend.value)}
                        </span>
                        <span className="metric-card__trend-label">
                            so với tháng trước
                        </span>
                    </div>
                )}
            </div>
            
            {/* Background decoration */}
            <div className="metric-card__decoration"></div>
        </div>
    );
};

export default MetricCard;