const { executeQuery } = require('../config/database');

class StudentService {
  // Get all students with their user info and enrollments
  async getAllStudents(page = 1, limit = 10) {
    const offset = (page - 1) * limit;
    
    const query = `
      SELECT 
        s.id as student_id,
        u.id as user_id,
        u.full_name,
        u.email,
        u.phone,
        s.address,
        s.date_of_birth,
        s.background,
        s.education_level,
        s.goals,
        u.created_at,
        COUNT(DISTINCT e.id) as total_enrollments,
        COUNT(DISTINCT CASE WHEN e.status = 'completed' THEN e.id END) as completed_courses,
        AVG(e.progress_percentage) as avg_progress
      FROM students s
      JOIN users u ON s.user_id = u.id
      LEFT JOIN enrollments e ON s.id = e.student_id
      WHERE u.is_active = TRUE
      GROUP BY s.id, u.id
      ORDER BY u.created_at DESC
      LIMIT ? OFFSET ?
    `;
    
    const students = await executeQuery(query, [limit, offset]);
    
    // Get total count
    const countQuery = `
      SELECT COUNT(DISTINCT s.id) as total 
      FROM students s 
      JOIN users u ON s.user_id = u.id 
      WHERE u.is_active = TRUE
    `;
    const countResult = await executeQuery(countQuery);
    const total = countResult[0].total;
    
    return {
      students: students.map(student => ({
        id: student.student_id,
        user_id: student.user_id,
        name: student.full_name,
        email: student.email,
        phone: student.phone,
        address: student.address,
        dateOfBirth: student.date_of_birth,
        background: student.background,
        educationLevel: student.education_level,
        goals: student.goals,
        joinedAt: student.created_at,
        stats: {
          totalEnrollments: parseInt(student.total_enrollments) || 0,
          completedCourses: parseInt(student.completed_courses) || 0,
          averageProgress: parseFloat(student.avg_progress) || 0
        }
      })),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    };
  }

  // Get student by ID with detailed info
  async getStudentById(studentId) {
    const query = `
      SELECT 
        s.id as student_id,
        u.id as user_id,
        u.full_name,
        u.email,
        u.phone,
        s.address,
        s.date_of_birth,
        s.background,
        s.education_level,
        s.goals,
        u.created_at
      FROM students s
      JOIN users u ON s.user_id = u.id
      WHERE s.id = ? AND u.is_active = TRUE
    `;
    
    const students = await executeQuery(query, [studentId]);
    if (students.length === 0) return null;
    
    const student = students[0];
    
    // Get enrollments
    const enrollmentsQuery = `
      SELECT 
        e.id,
        e.status,
        e.progress_percentage,
        e.final_score,
        e.enrolled_at,
        e.completed_at,
        c.id as course_id,
        c.title as course_title,
        c.description as course_description,
        c.level,
        c.duration_weeks
      FROM enrollments e
      JOIN courses c ON e.course_id = c.id
      WHERE e.student_id = ?
      ORDER BY e.enrolled_at DESC
    `;
    
    const enrollments = await executeQuery(enrollmentsQuery, [studentId]);
    
    // Get competencies
    const competenciesQuery = `
      SELECT 
        sc.score,
        sc.assessment_method,
        sc.assessed_at,
        c.name,
        c.category,
        c.description
      FROM student_competencies sc
      JOIN competencies c ON sc.competency_id = c.id
      WHERE sc.student_id = ?
      ORDER BY sc.score DESC
    `;
    
    const competencies = await executeQuery(competenciesQuery, [studentId]);
    
    return {
      id: student.student_id,
      user_id: student.user_id,
      name: student.full_name,
      email: student.email,
      phone: student.phone,
      address: student.address,
      dateOfBirth: student.date_of_birth,
      background: student.background,
      educationLevel: student.education_level,
      goals: student.goals,
      joinedAt: student.created_at,
      enrollments: enrollments.map(e => ({
        id: e.id,
        status: e.status,
        progress: parseFloat(e.progress_percentage) || 0,
        finalScore: parseFloat(e.final_score) || null,
        enrolledAt: e.enrolled_at,
        completedAt: e.completed_at,
        course: {
          id: e.course_id,
          title: e.course_title,
          description: e.course_description,
          level: e.level,
          durationWeeks: e.duration_weeks
        }
      })),
      competencies: competencies.map(comp => ({
        name: comp.name,
        category: comp.category,
        description: comp.description,
        score: parseFloat(comp.score),
        assessmentMethod: comp.assessment_method,
        assessedAt: comp.assessed_at
      }))
    };
  }

  // Get student performance analytics
  async getStudentAnalytics(studentId) {
    // Get overall stats
    const statsQuery = `
      SELECT 
        COUNT(DISTINCT e.id) as total_enrollments,
        COUNT(DISTINCT CASE WHEN e.status = 'completed' THEN e.id END) as completed_courses,
        COUNT(DISTINCT CASE WHEN e.status = 'in_progress' THEN e.id END) as in_progress_courses,
        AVG(e.progress_percentage) as avg_progress,
        AVG(CASE WHEN e.final_score IS NOT NULL THEN e.final_score END) as avg_score
      FROM enrollments e
      WHERE e.student_id = ?
    `;
    
    const stats = await executeQuery(statsQuery, [studentId]);
    
    // Get competency breakdown
    const competencyQuery = `
      SELECT 
        c.category,
        AVG(sc.score) as avg_score,
        COUNT(*) as competency_count
      FROM student_competencies sc
      JOIN competencies c ON sc.competency_id = c.id
      WHERE sc.student_id = ?
      GROUP BY c.category
      ORDER BY avg_score DESC
    `;
    
    const competencyBreakdown = await executeQuery(competencyQuery, [studentId]);
    
    // Get recent activity
    const activityQuery = `
      SELECT 
        'enrollment' as activity_type,
        c.title as description,
        e.enrolled_at as activity_date
      FROM enrollments e
      JOIN courses c ON e.course_id = c.id
      WHERE e.student_id = ?
      
      UNION ALL
      
      SELECT 
        'competency_assessment' as activity_type,
        CONCAT('Assessed: ', comp.name) as description,
        sc.assessed_at as activity_date
      FROM student_competencies sc
      JOIN competencies comp ON sc.competency_id = comp.id
      WHERE sc.student_id = ?
      
      ORDER BY activity_date DESC
      LIMIT 10
    `;
    
    const recentActivity = await executeQuery(activityQuery, [studentId, studentId]);
    
    return {
      overview: {
        totalEnrollments: parseInt(stats[0].total_enrollments) || 0,
        completedCourses: parseInt(stats[0].completed_courses) || 0,
        inProgressCourses: parseInt(stats[0].in_progress_courses) || 0,
        averageProgress: parseFloat(stats[0].avg_progress) || 0,
        averageScore: parseFloat(stats[0].avg_score) || 0
      },
      competencyBreakdown: competencyBreakdown.map(comp => ({
        category: comp.category,
        averageScore: parseFloat(comp.avg_score),
        competencyCount: parseInt(comp.competency_count)
      })),
      recentActivity: recentActivity.map(activity => ({
        type: activity.activity_type,
        description: activity.description,
        date: activity.activity_date
      }))
    };
  }

  // Create new student profile
  async createStudent(userId, studentData) {
    const { address, dateOfBirth, background, educationLevel, goals } = studentData;
    
    const query = `
      INSERT INTO students (user_id, address, date_of_birth, background, education_level, goals)
      VALUES (?, ?, ?, ?, ?, ?)
    `;
    
    const result = await executeQuery(query, [
      userId, address, dateOfBirth, background, educationLevel, goals
    ]);
    
    return result.insertId;
  }

  // Update student profile
  async updateStudent(studentId, updateData) {
    const { address, dateOfBirth, background, educationLevel, goals } = updateData;
    
    const query = `
      UPDATE students 
      SET address = ?, date_of_birth = ?, background = ?, education_level = ?, goals = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `;
    
    await executeQuery(query, [
      address, dateOfBirth, background, educationLevel, goals, studentId
    ]);
    
    return await this.getStudentById(studentId);
  }
}

module.exports = new StudentService();