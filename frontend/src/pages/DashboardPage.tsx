import React, { useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '../hooks/redux';
import { fetchDashboardSummary } from '../store/slices/dashboardSlice';
import MetricCard from '../components/dashboard/MetricCard';
import LeadsTable from '../components/dashboard/LeadsTable';
import LeadsChart from '../components/dashboard/LeadsChart';
import './DashboardPage.css';

const DashboardPage: React.FC = () => {
    const dispatch = useAppDispatch();
    const { data, loading, error } = useAppSelector(state => state.dashboard);

    useEffect(() => {
        dispatch(fetchDashboardSummary());
    }, [dispatch]);

    const handleLeadClick = (lead: any) => {
        console.log('Lead clicked:', lead);
        // TODO: Navigate to lead detail page or open modal
    };

    const handleStatusChange = (leadId: number, newStatus: string) => {
        console.log('Status change:', leadId, newStatus);
        // TODO: Implement status update API call
    };

    if (loading) {
        return (
            <div className="dashboard-page">
                <div className="dashboard-header">
                    <h1>Dashboard Quản trị</h1>
                    <p className="dashboard-subtitle">
                        Tổng quan hệ thống đào tạo và tuyển dụng
                    </p>
                </div>

                <div className="metrics-row">
                    <MetricCard
                        title="Số Leads Mới"
                        value={0}
                        icon="👥"
                        color="blue"
                        loading={true}
                    />
                    <MetricCard
                        title="Tổng Doanh thu Tháng"
                        value={0}
                        icon="💰"
                        color="green"
                        format="currency"
                        loading={true}
                    />
                    <MetricCard
                        title="Học viên đang học"
                        value={0}
                        icon="🎓"
                        color="purple"
                        loading={true}
                    />
                    <MetricCard
                        title="Doanh nghiệp đối tác"
                        value={0}
                        icon="🏢"
                        color="orange"
                        loading={true}
                    />
                </div>

                <div className="dashboard-content">
                    <LeadsTable leads={[]} loading={true} />
                    <LeadsChart data={[]} loading={true} />
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="dashboard-page">
                <div className="dashboard-error">
                    <h2>Lỗi tải dữ liệu</h2>
                    <p>{error}</p>
                    <button 
                        className="retry-button"
                        onClick={() => dispatch(fetchDashboardSummary())}
                    >
                        Thử lại
                    </button>
                </div>
            </div>
        );
    }



    return (
        <div className="dashboard-page">
            <div className="dashboard-header">
                <h1>Dashboard Quản trị</h1>
                <p className="dashboard-subtitle">
                    Tổng quan hệ thống đào tạo và tuyển dụng
                </p>
            </div>

            {/* Metrics Cards */}
            <div className="metrics-row">
                <MetricCard
                    title="Số Leads Mới"
                    value={data?.newLeads || 45}
                    icon="👥"
                    color="blue"
                    trend={{ value: 12, isPositive: true }}
                />
                <MetricCard
                    title="Tổng Doanh thu Tháng"
                    value={2850000000}
                    icon="💰"
                    color="green"
                    format="currency"
                    trend={{ value: 12.5, isPositive: true }}
                />

                <MetricCard
                    title="Học viên đang học"
                    value={1247}
                    icon="🎓"
                    color="purple"
                    trend={{ value: 156, isPositive: true }}
                />
                <MetricCard
                    title="Doanh nghiệp đối tác"
                    value={89}
                    icon="🏢"
                    color="orange"
                    trend={{ value: 3, isPositive: true }}
                />
            </div>

            {/* Dashboard Content */}
            <div className="dashboard-content">
                <LeadsTable
                    leads={data?.recentHighQualityLeads || []}
                    onLeadClick={handleLeadClick}
                    onStatusChange={handleStatusChange}
                />

                <LeadsChart
                    data={data?.newLeadsTrend || []}
                    chartType="area"
                    height={320}
                />
            </div>

            {/* Quick Actions */}
            <div className="quick-actions">
                <h3>Thao tác nhanh</h3>
                <div className="actions-grid">
                    <button className="action-button primary">
                        <span className="action-icon">➕</span>
                        Thêm Lead mới
                    </button>
                    <button className="action-button secondary">
                        <span className="action-icon">📊</span>
                        Xem báo cáo chi tiết
                    </button>
                    <button className="action-button secondary">
                        <span className="action-icon">📧</span>
                        Gửi email marketing
                    </button>
                    <button className="action-button secondary">
                        <span className="action-icon">⚙️</span>
                        Cài đặt hệ thống
                    </button>
                </div>
            </div>
        </div>
    );
};

export default DashboardPage;