const { executeQuery } = require('../config/database');

class EnterpriseService {
  // Get all enterprises
  async getAllEnterprises(page = 1, limit = 10, industry = null) {
    const offset = (page - 1) * limit;
    
    let query = `
      SELECT 
        id,
        company_name,
        address,
        tax_code,
        industry,
        company_size,
        website,
        description,
        is_active,
        created_at
      FROM enterprises
      WHERE is_active = TRUE
    `;
    
    const params = [];
    if (industry) {
      query += ' AND industry = ?';
      params.push(industry);
    }
    
    query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
    params.push(limit, offset);
    
    const enterprises = await executeQuery(query, params);
    
    // Get total count
    let countQuery = 'SELECT COUNT(*) as total FROM enterprises WHERE is_active = TRUE';
    const countParams = [];
    if (industry) {
      countQuery += ' AND industry = ?';
      countParams.push(industry);
    }
    
    const countResult = await executeQuery(countQuery, countParams);
    const total = countResult[0].total;
    
    return {
      enterprises: enterprises.map(enterprise => ({
        id: enterprise.id,
        companyName: enterprise.company_name,
        address: enterprise.address,
        taxCode: enterprise.tax_code,
        industry: enterprise.industry,
        companySize: enterprise.company_size,
        website: enterprise.website,
        description: enterprise.description,
        isActive: enterprise.is_active,
        createdAt: enterprise.created_at
      })),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    };
  }

  // Get enterprise by ID
  async getEnterpriseById(enterpriseId) {
    const query = `
      SELECT 
        id,
        company_name,
        address,
        tax_code,
        industry,
        company_size,
        website,
        description,
        is_active,
        created_at
      FROM enterprises
      WHERE id = ? AND is_active = TRUE
    `;
    
    const enterprises = await executeQuery(query, [enterpriseId]);
    if (enterprises.length === 0) return null;
    
    const enterprise = enterprises[0];
    
    return {
      id: enterprise.id,
      companyName: enterprise.company_name,
      address: enterprise.address,
      taxCode: enterprise.tax_code,
      industry: enterprise.industry,
      companySize: enterprise.company_size,
      website: enterprise.website,
      description: enterprise.description,
      isActive: enterprise.is_active,
      createdAt: enterprise.created_at
    };
  }

  // Create new enterprise
  async createEnterprise(enterpriseData) {
    const {
      companyName,
      address,
      taxCode,
      industry,
      companySize,
      website,
      description
    } = enterpriseData;
    
    const query = `
      INSERT INTO enterprises (
        company_name, address, tax_code, industry, 
        company_size, website, description, is_active
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, TRUE)
    `;
    
    const result = await executeQuery(query, [
      companyName,
      address,
      taxCode,
      industry,
      companySize,
      website,
      description
    ]);
    
    return result.insertId;
  }

  // Update enterprise
  async updateEnterprise(enterpriseId, updateData) {
    const {
      companyName,
      address,
      taxCode,
      industry,
      companySize,
      website,
      description
    } = updateData;
    
    const query = `
      UPDATE enterprises 
      SET 
        company_name = ?,
        address = ?,
        tax_code = ?,
        industry = ?,
        company_size = ?,
        website = ?,
        description = ?,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `;
    
    await executeQuery(query, [
      companyName,
      address,
      taxCode,
      industry,
      companySize,
      website,
      description,
      enterpriseId
    ]);
    
    return await this.getEnterpriseById(enterpriseId);
  }

  // Get enterprise statistics
  async getEnterpriseStats() {
    const query = `
      SELECT 
        COUNT(*) as total_enterprises,
        COUNT(CASE WHEN company_size = 'startup' THEN 1 END) as startup_count,
        COUNT(CASE WHEN company_size = 'small' THEN 1 END) as small_count,
        COUNT(CASE WHEN company_size = 'medium' THEN 1 END) as medium_count,
        COUNT(CASE WHEN company_size = 'large' THEN 1 END) as large_count,
        COUNT(CASE WHEN company_size = 'enterprise' THEN 1 END) as enterprise_count
      FROM enterprises 
      WHERE is_active = TRUE
    `;
    
    const stats = await executeQuery(query);
    
    // Get industry breakdown
    const industryQuery = `
      SELECT 
        industry,
        COUNT(*) as count
      FROM enterprises 
      WHERE is_active = TRUE AND industry IS NOT NULL
      GROUP BY industry
      ORDER BY count DESC
    `;
    
    const industryStats = await executeQuery(industryQuery);
    
    return {
      total: parseInt(stats[0].total_enterprises) || 0,
      bySize: {
        startup: parseInt(stats[0].startup_count) || 0,
        small: parseInt(stats[0].small_count) || 0,
        medium: parseInt(stats[0].medium_count) || 0,
        large: parseInt(stats[0].large_count) || 0,
        enterprise: parseInt(stats[0].enterprise_count) || 0
      },
      byIndustry: industryStats.map(item => ({
        industry: item.industry,
        count: parseInt(item.count)
      }))
    };
  }

  // Mock projects data (since we don't have projects table yet)
  async getProjects(enterpriseId = null, page = 1, limit = 10) {
    const offset = (page - 1) * limit;
    
    let whereClause = '';
    let queryParams = [];
    
    if (enterpriseId) {
      whereClause = 'WHERE p.enterprise_id = ?';
      queryParams.push(enterpriseId);
    }
    
    const query = `
      SELECT 
        p.id,
        p.title,
        p.description,
        p.status,
        p.budget,
        p.duration,
        p.required_skills,
        p.assigned_student_ids,
        p.start_date,
        p.end_date,
        p.enterprise_id,
        p.created_by,
        p.created_at,
        p.updated_at,
        e.company_name as enterprise_name,
        u.full_name as created_by_name
      FROM projects p
      LEFT JOIN enterprises e ON p.enterprise_id = e.id
      LEFT JOIN users u ON p.created_by = u.id
      ${whereClause}
      ORDER BY p.created_at DESC
      LIMIT ? OFFSET ?
    `;
    
    queryParams.push(limit, offset);
    const projects = await executeQuery(query, queryParams);
    
    // Đếm tổng số dự án
    const countQuery = `
      SELECT COUNT(*) as total 
      FROM projects p
      ${whereClause}
    `;
    
    const countParams = enterpriseId ? [enterpriseId] : [];
    const countResult = await executeQuery(countQuery, countParams);
    const total = countResult[0].total;
    
    return {
      projects: projects.map(project => ({
        id: project.id,
        title: project.title,
        description: project.description,
        status: project.status,
        budget: project.budget,
        duration: project.duration,
        requiredSkills: project.required_skills ? JSON.parse(project.required_skills) : [],
        assignedStudentIds: project.assigned_student_ids ? JSON.parse(project.assigned_student_ids) : [],
        startDate: project.start_date,
        endDate: project.end_date,
        enterpriseId: project.enterprise_id,
        enterpriseName: project.enterprise_name,
        createdBy: project.created_by,
        createdByName: project.created_by_name,
        createdAt: project.created_at,
        updatedAt: project.updated_at
      })),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    };
  }

  // Create a new project and assign it to students
  async createProject(projectData) {
    const {
      enterpriseId,
      title,
      description,
      budget,
      duration,
      requiredSkills = [],
      assignedStudentIds = [], // Changed from assignedStaff
      startDate,
      endDate,
      createdBy
    } = projectData;

    // Save the project details
    const projectQuery = `
      INSERT INTO projects (
        enterprise_id, title, description, budget, duration, 
        required_skills, assigned_student_ids, start_date, end_date, created_by
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const projectResult = await executeQuery(projectQuery, [
      enterpriseId,
      title,
      description,
      budget,
      duration,
      JSON.stringify(requiredSkills),
      JSON.stringify(assignedStudentIds), // Storing student IDs
      startDate || null,
      endDate || null,
      createdBy || null
    ]);

    const projectId = projectResult.insertId;

    // Notify assigned students and create assignment records
    if (assignedStudentIds && assignedStudentIds.length > 0) {
      const notificationService = require('./notificationService');
      
      for (const studentId of assignedStudentIds) {
        // Get user_id from student_id for notification
        const studentUserQuery = `
          SELECT user_id FROM students WHERE id = ?
        `;
        const studentUserResult = await executeQuery(studentUserQuery, [studentId]);
        
        if (studentUserResult.length > 0) {
          const userId = studentUserResult[0].user_id;

          // Create a notification for the student
          await notificationService.createProjectAssignmentNotification(
            projectId,
            userId,
            title,
            createdBy || null
          );
          
          // Create a record in the project_student_assignments table
          const assignmentQuery = `
            INSERT INTO project_student_assignments (project_id, student_id, assigned_by)
            VALUES (?, ?, ?)
          `;
          await executeQuery(assignmentQuery, [projectId, studentId, createdBy || null]);
        }
      }
    }

    // Return the newly created project details
    const createdProject = await this.getProjectById(projectId);
    return createdProject;
  }

  // Lấy thông tin dự án theo ID
  async getProjectById(projectId) {
    const query = `
      SELECT 
        p.id,
        p.title,
        p.description,
        p.status,
        p.budget,
        p.duration,
        p.required_skills,
        p.assigned_student_ids,
        p.start_date,
        p.end_date,
        p.enterprise_id,
        p.created_by,
        p.created_at,
        p.updated_at,
        e.company_name as enterprise_name,
        u.full_name as created_by_name
      FROM projects p
      LEFT JOIN enterprises e ON p.enterprise_id = e.id
      LEFT JOIN users u ON p.created_by = u.id
      WHERE p.id = ?
    `;

    const result = await executeQuery(query, [projectId]);
    
    if (result.length === 0) {
      throw new Error('Project not found');
    }

    const project = result[0];
    return {
      id: project.id,
      title: project.title,
      description: project.description,
      status: project.status,
      budget: project.budget,
      duration: project.duration,
      requiredSkills: project.required_skills ? JSON.parse(project.required_skills) : [],
      assignedStudentIds: project.assigned_student_ids ? JSON.parse(project.assigned_student_ids) : [],
      startDate: project.start_date,
      endDate: project.end_date,
      enterpriseId: project.enterprise_id,
      enterpriseName: project.enterprise_name,
      createdBy: project.created_by,
      createdByName: project.created_by_name,
      createdAt: project.created_at,
      updatedAt: project.updated_at
    };
  }
}

module.exports = new EnterpriseService();