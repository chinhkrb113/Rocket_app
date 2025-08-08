const { executeQuery } = require('../config/database');

class LeadService {
  // Get all leads
  async getAllLeads(page = 1, limit = 10, status = null, source = null) {
    const offset = (page - 1) * limit;
    
    let query = `
      SELECT 
        id,
        full_name,
        email,
        phone,
        source,
        status,
        lead_score,
        interested_courses,
        notes,
        assigned_to,
        created_at,
        updated_at
      FROM leads
      WHERE 1=1
    `;
    
    const params = [];
    if (status) {
      query += ' AND status = ?';
      params.push(status);
    }
    if (source) {
      query += ' AND source = ?';
      params.push(source);
    }
    
    query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
    params.push(limit, offset);
    
    const leads = await executeQuery(query, params);
    
    // Get total count
    let countQuery = 'SELECT COUNT(*) as total FROM leads WHERE 1=1';
    const countParams = [];
    if (status) {
      countQuery += ' AND status = ?';
      countParams.push(status);
    }
    if (source) {
      countQuery += ' AND source = ?';
      countParams.push(source);
    }
    
    const countResult = await executeQuery(countQuery, countParams);
    const total = countResult[0].total;
    
    return {
      leads: leads.map(lead => ({
        id: lead.id,
        fullName: lead.full_name,
        email: lead.email,
        phone: lead.phone,
        source: lead.source,
        status: lead.status,
        leadScore: lead.lead_score,
        interestedCourses: lead.interested_courses,
        notes: lead.notes,
        assignedTo: lead.assigned_to,
        createdAt: lead.created_at,
        updatedAt: lead.updated_at
      })),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    };
  }

  // Get lead by ID
  async getLeadById(leadId) {
    const query = `
      SELECT 
        id,
        full_name,
        email,
        phone,
        source,
        status,
        lead_score,
        interested_courses,
        notes,
        assigned_to,
        created_at,
        updated_at
      FROM leads
      WHERE id = ?
    `;
    
    const leads = await executeQuery(query, [leadId]);
    if (leads.length === 0) return null;
    
    const lead = leads[0];
    
    return {
      id: lead.id,
      fullName: lead.full_name,
      email: lead.email,
      phone: lead.phone,
      source: lead.source,
      status: lead.status,
      leadScore: lead.lead_score,
      interestedCourses: lead.interested_courses,
      notes: lead.notes,
      assignedTo: lead.assigned_to,
      createdAt: lead.created_at,
      updatedAt: lead.updated_at
    };
  }

  // Create new lead
  async createLead(leadData) {
    const {
      fullName,
      email,
      phone,
      source,
      interestedCourses,
      notes,
      assignedTo
    } = leadData;
    
    const query = `
      INSERT INTO leads (
        full_name, email, phone, source, 
        interested_courses, notes, assigned_to, status
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, 'new')
    `;
    
    const result = await executeQuery(query, [
      fullName,
      email,
      phone,
      source || 'website',
      interestedCourses,
      notes,
      assignedTo
    ]);
    
    return result.insertId;
  }

  // Update lead
  async updateLead(leadId, updateData) {
    const {
      fullName,
      email,
      phone,
      source,
      status,
      leadScore,
      interestedCourses,
      notes,
      assignedTo
    } = updateData;
    
    const query = `
      UPDATE leads 
      SET 
        full_name = ?,
        email = ?,
        phone = ?,
        source = ?,
        status = ?,
        lead_score = ?,
        interested_courses = ?,
        notes = ?,
        assigned_to = ?,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `;
    
    await executeQuery(query, [
      fullName,
      email,
      phone,
      source,
      status,
      leadScore,
      interestedCourses,
      notes,
      assignedTo,
      leadId
    ]);
    
    return await this.getLeadById(leadId);
  }

  // Update lead status
  async updateLeadStatus(leadId, status, notes = null) {
    let query = `
      UPDATE leads 
      SET 
        status = ?,
        updated_at = CURRENT_TIMESTAMP
    `;
    
    const params = [status];
    
    if (notes) {
      query += ', notes = ?';
      params.push(notes);
    }
    
    query += ' WHERE id = ?';
    params.push(leadId);
    
    await executeQuery(query, params);
    
    return await this.getLeadById(leadId);
  }

  // Delete lead
  async deleteLead(leadId) {
    const query = 'DELETE FROM leads WHERE id = ?';
    await executeQuery(query, [leadId]);
    return true;
  }

  // Get lead statistics
  async getLeadStats() {
    const query = `
      SELECT 
        COUNT(*) as total_leads,
        COUNT(CASE WHEN status = 'new' THEN 1 END) as new_leads,
        COUNT(CASE WHEN status = 'contacted' THEN 1 END) as contacted_leads,
        COUNT(CASE WHEN status = 'qualified' THEN 1 END) as qualified_leads,
        COUNT(CASE WHEN status = 'converted' THEN 1 END) as converted_leads,
        COUNT(CASE WHEN status = 'lost' THEN 1 END) as lost_leads
      FROM leads
    `;
    
    const stats = await executeQuery(query);
    
    // Get source breakdown
    const sourceQuery = `
      SELECT 
        source,
        COUNT(*) as count
      FROM leads 
      WHERE source IS NOT NULL
      GROUP BY source
      ORDER BY count DESC
    `;
    
    const sourceStats = await executeQuery(sourceQuery);
    
    // Get interested courses breakdown
    const interestQuery = `
      SELECT 
        interested_courses,
        COUNT(*) as count
      FROM leads 
      WHERE interested_courses IS NOT NULL AND interested_courses != ''
      GROUP BY interested_courses
      ORDER BY count DESC
      LIMIT 10
    `;
    
    const interestStats = await executeQuery(interestQuery);
    
    // Get conversion rate by month
    const conversionQuery = `
      SELECT 
        DATE_FORMAT(created_at, '%Y-%m') as month,
        COUNT(*) as total,
        COUNT(CASE WHEN status = 'converted' THEN 1 END) as converted
      FROM leads 
      WHERE created_at >= DATE_SUB(NOW(), INTERVAL 12 MONTH)
      GROUP BY DATE_FORMAT(created_at, '%Y-%m')
      ORDER BY month DESC
    `;
    
    const conversionStats = await executeQuery(conversionQuery);
    
    return {
      total: parseInt(stats[0].total_leads) || 0,
      byStatus: {
        new: parseInt(stats[0].new_leads) || 0,
        contacted: parseInt(stats[0].contacted_leads) || 0,
        qualified: parseInt(stats[0].qualified_leads) || 0,
        converted: parseInt(stats[0].converted_leads) || 0,
        lost: parseInt(stats[0].lost_leads) || 0
      },
      bySource: sourceStats.map(item => ({
        source: item.source,
        count: parseInt(item.count)
      })),
      byInterest: interestStats.map(item => ({
        interestedCourses: item.interested_courses,
        count: parseInt(item.count)
      })),
      conversionTrend: conversionStats.map(item => ({
        month: item.month,
        total: parseInt(item.total),
        converted: parseInt(item.converted),
        conversionRate: item.total > 0 ? (parseInt(item.converted) / parseInt(item.total) * 100).toFixed(2) : '0.00'
      }))
    };
  }

  // Search leads
  async searchLeads(searchTerm, page = 1, limit = 10) {
    const offset = (page - 1) * limit;
    
    const query = `
      SELECT 
        id,
        full_name,
        email,
        phone,
        source,
        status,
        lead_score,
        interested_courses,
        notes,
        assigned_to,
        created_at,
        updated_at
      FROM leads
      WHERE 
        full_name LIKE ? OR 
        email LIKE ? OR 
        interested_courses LIKE ? OR 
        notes LIKE ?
      ORDER BY created_at DESC 
      LIMIT ? OFFSET ?
    `;
    
    const searchPattern = `%${searchTerm}%`;
    const params = [searchPattern, searchPattern, searchPattern, searchPattern, limit, offset];
    
    const leads = await executeQuery(query, params);
    
    // Get total count for search
    const countQuery = `
      SELECT COUNT(*) as total 
      FROM leads
      WHERE 
        full_name LIKE ? OR 
        email LIKE ? OR 
        interested_courses LIKE ? OR 
        notes LIKE ?
    `;
    
    const countParams = [searchPattern, searchPattern, searchPattern, searchPattern];
    const countResult = await executeQuery(countQuery, countParams);
    const total = countResult[0].total;
    
    return {
      leads: leads.map(lead => ({
        id: lead.id,
        fullName: lead.full_name,
        email: lead.email,
        phone: lead.phone,
        source: lead.source,
        status: lead.status,
        leadScore: lead.lead_score,
        interestedCourses: lead.interested_courses,
        notes: lead.notes,
        assignedTo: lead.assigned_to,
        createdAt: lead.created_at,
        updatedAt: lead.updated_at
      })),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    };
  }
}

module.exports = new LeadService();