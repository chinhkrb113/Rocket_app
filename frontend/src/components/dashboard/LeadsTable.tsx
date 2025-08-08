import React, { useState } from 'react';
import './LeadsTable.css';

interface Lead {
    id: number;
    fullName: string;
    email: string;
    phone?: string;
    score: number;
    source: string;
    status: 'new' | 'qualified' | 'contacted' | 'converted' | 'lost';
    createdAt: string;
    lastInteraction?: string;
}

interface LeadsTableProps {
    leads: Lead[];
    loading?: boolean;
    onLeadClick?: (lead: Lead) => void;
    onStatusChange?: (leadId: number, newStatus: string) => void;
}

const LeadsTable: React.FC<LeadsTableProps> = ({
    leads,
    loading = false,
    onLeadClick,
    onStatusChange
}) => {
    const [sortField, setSortField] = useState<keyof Lead>('score');
    const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
    const [filterStatus, setFilterStatus] = useState<string>('all');

    const getStatusColor = (status: string): string => {
        switch (status) {
            case 'new': return 'blue';
            case 'qualified': return 'green';
            case 'contacted': return 'orange';
            case 'converted': return 'purple';
            case 'lost': return 'red';
            default: return 'gray';
        }
    };

    const getSourceIcon = (source: string): string => {
        switch (source.toLowerCase()) {
            case 'website': return '🌐';
            case 'facebook': return '📘';
            case 'google': return '🔍';
            case 'referral': return '👥';
            case 'email': return '📧';
            case 'phone': return '📞';
            case 'chatbot': return '🤖';
            default: return '📝';
        }
    };

    const formatDate = (dateString: string): string => {
        const date = new Date(dateString);
        return new Intl.DateTimeFormat('vi-VN', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        }).format(date);
    };

    const handleSort = (field: keyof Lead) => {
        if (sortField === field) {
            setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
        } else {
            setSortField(field);
            setSortDirection('desc');
        }
    };

    const filteredAndSortedLeads = React.useMemo(() => {
        let filtered = leads;
        
        if (filterStatus !== 'all') {
            filtered = leads.filter(lead => lead.status === filterStatus);
        }
        
        return [...filtered].sort((a, b) => {
            const aValue = a[sortField];
            const bValue = b[sortField];
            
            if (typeof aValue === 'string' && typeof bValue === 'string') {
                return sortDirection === 'asc' 
                    ? aValue.localeCompare(bValue)
                    : bValue.localeCompare(aValue);
            }
            
            if (typeof aValue === 'number' && typeof bValue === 'number') {
                return sortDirection === 'asc' ? aValue - bValue : bValue - aValue;
            }
            
            return 0;
        });
    }, [leads, sortField, sortDirection, filterStatus]);

    if (loading) {
        return (
            <div className="leads-table-container">
                <div className="leads-table-header">
                    <div className="leads-table-title-skeleton"></div>
                    <div className="leads-table-filter-skeleton"></div>
                </div>
                <div className="leads-table-loading">
                    {[...Array(5)].map((_, index) => (
                        <div key={index} className="leads-table-row-skeleton">
                            <div className="skeleton-cell"></div>
                            <div className="skeleton-cell"></div>
                            <div className="skeleton-cell"></div>
                            <div className="skeleton-cell"></div>
                            <div className="skeleton-cell"></div>
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    return (
        <div className="leads-table-container">
            <div className="leads-table-header">
                <div className="leads-table-info">
                    <h3 className="leads-table-title">
                        Khách hàng tiềm năng chất lượng cao
                    </h3>
                    <p className="leads-table-subtitle">
                        {filteredAndSortedLeads.length} leads với điểm số &gt; 50
                    </p>
                </div>
                
                <div className="leads-table-controls">
                    <select 
                        className="status-filter"
                        value={filterStatus}
                        onChange={(e) => setFilterStatus(e.target.value)}
                    >
                        <option value="all">Tất cả trạng thái</option>
                        <option value="new">Mới</option>
                        <option value="qualified">Đủ điều kiện</option>
                        <option value="contacted">Đã liên hệ</option>
                        <option value="converted">Chuyển đổi</option>
                        <option value="lost">Mất</option>
                    </select>
                </div>
            </div>

            <div className="leads-table-wrapper">
                <table className="leads-table">
                    <thead>
                        <tr>
                            <th 
                                className={`sortable ${sortField === 'fullName' ? `sorted-${sortDirection}` : ''}`}
                                onClick={() => handleSort('fullName')}
                            >
                                Họ tên
                                <span className="sort-icon">
                                    {sortField === 'fullName' ? (sortDirection === 'asc' ? '↑' : '↓') : '↕️'}
                                </span>
                            </th>
                            <th 
                                className={`sortable ${sortField === 'email' ? `sorted-${sortDirection}` : ''}`}
                                onClick={() => handleSort('email')}
                            >
                                Email
                                <span className="sort-icon">
                                    {sortField === 'email' ? (sortDirection === 'asc' ? '↑' : '↓') : '↕️'}
                                </span>
                            </th>
                            <th 
                                className={`sortable ${sortField === 'score' ? `sorted-${sortDirection}` : ''}`}
                                onClick={() => handleSort('score')}
                            >
                                Điểm số
                                <span className="sort-icon">
                                    {sortField === 'score' ? (sortDirection === 'asc' ? '↑' : '↓') : '↕️'}
                                </span>
                            </th>
                            <th 
                                className={`sortable ${sortField === 'source' ? `sorted-${sortDirection}` : ''}`}
                                onClick={() => handleSort('source')}
                            >
                                Nguồn
                                <span className="sort-icon">
                                    {sortField === 'source' ? (sortDirection === 'asc' ? '↑' : '↓') : '↕️'}
                                </span>
                            </th>
                            <th 
                                className={`sortable ${sortField === 'status' ? `sorted-${sortDirection}` : ''}`}
                                onClick={() => handleSort('status')}
                            >
                                Trạng thái
                                <span className="sort-icon">
                                    {sortField === 'status' ? (sortDirection === 'asc' ? '↑' : '↓') : '↕️'}
                                </span>
                            </th>
                            <th 
                                className={`sortable ${sortField === 'createdAt' ? `sorted-${sortDirection}` : ''}`}
                                onClick={() => handleSort('createdAt')}
                            >
                                Ngày tạo
                                <span className="sort-icon">
                                    {sortField === 'createdAt' ? (sortDirection === 'asc' ? '↑' : '↓') : '↕️'}
                                </span>
                            </th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredAndSortedLeads.length === 0 ? (
                            <tr>
                                <td colSpan={6} className="empty-state">
                                    <div className="empty-content">
                                        <span className="empty-icon">📊</span>
                                        <p>Không có leads nào phù hợp với bộ lọc</p>
                                    </div>
                                </td>
                            </tr>
                        ) : (
                            filteredAndSortedLeads.map((lead) => (
                                <tr 
                                    key={lead.id} 
                                    className="leads-table-row"
                                    onClick={() => onLeadClick?.(lead)}
                                >
                                    <td className="name-cell">
                                        <div className="name-content">
                                            <span className="name">{lead.fullName}</span>
                                            {lead.phone && (
                                                <span className="phone">{lead.phone}</span>
                                            )}
                                        </div>
                                    </td>
                                    <td className="email-cell">
                                        <a href={`mailto:${lead.email}`} className="email-link">
                                            {lead.email}
                                        </a>
                                    </td>
                                    <td className="score-cell">
                                        <div className="score-badge">
                                            <span className="score-value">{lead.score}</span>
                                            <div className="score-bar">
                                                <div 
                                                    className="score-fill"
                                                    style={{ width: `${Math.min(lead.score, 100)}%` }}
                                                ></div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="source-cell">
                                        <div className="source-badge">
                                            <span className="source-icon">
                                                {getSourceIcon(lead.source)}
                                            </span>
                                            <span className="source-text">{lead.source}</span>
                                        </div>
                                    </td>
                                    <td className="status-cell">
                                        <select
                                            className={`status-badge status-badge--${getStatusColor(lead.status)}`}
                                            value={lead.status}
                                            onChange={(e) => {
                                                e.stopPropagation();
                                                onStatusChange?.(lead.id, e.target.value);
                                            }}
                                        >
                                            <option value="new">Mới</option>
                                            <option value="qualified">Đủ điều kiện</option>
                                            <option value="contacted">Đã liên hệ</option>
                                            <option value="converted">Chuyển đổi</option>
                                            <option value="lost">Mất</option>
                                        </select>
                                    </td>
                                    <td className="date-cell">
                                        <div className="date-content">
                                            <span className="date">{formatDate(lead.createdAt)}</span>
                                            {lead.lastInteraction && (
                                                <span className="last-interaction">
                                                    Tương tác: {formatDate(lead.lastInteraction)}
                                                </span>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default LeadsTable;