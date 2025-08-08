const { executeQuery } = require('../config/database');

class CourseService {
  // Get all courses with enrollment stats
  async getAllCourses(page = 1, limit = 10, level = null) {
    const offset = (page - 1) * limit;
    
    let query = `
      SELECT 
        c.id,
        c.title,
        c.description,
        c.price,
        c.duration_weeks,
        c.level,
        c.content_detail,
        c.max_students,
        c.is_active,
        c.created_at,
        u.full_name as instructor_name,
        COUNT(DISTINCT e.id) as total_enrollments,
        COUNT(DISTINCT CASE WHEN e.status = 'completed' THEN e.id END) as completed_enrollments,
        AVG(e.progress_percentage) as avg_progress
      FROM courses c
      LEFT JOIN users u ON c.created_by = u.id
      LEFT JOIN enrollments e ON c.id = e.course_id
      WHERE c.is_active = TRUE
    `;
    
    const params = [];
    if (level) {
      query += ' AND c.level = ?';
      params.push(level);
    }
    
    query += `
      GROUP BY c.id
      ORDER BY c.created_at DESC
      LIMIT ? OFFSET ?
    `;
    params.push(limit, offset);
    
    const courses = await executeQuery(query, params);
    
    // Get total count
    let countQuery = 'SELECT COUNT(*) as total FROM courses WHERE is_active = TRUE';
    const countParams = [];
    if (level) {
      countQuery += ' AND level = ?';
      countParams.push(level);
    }
    
    const countResult = await executeQuery(countQuery, countParams);
    const total = countResult[0].total;
    
    return {
      courses: courses.map(course => ({
        id: course.id,
        title: course.title,
        description: course.description,
        price: parseFloat(course.price),
        durationWeeks: course.duration_weeks,
        level: course.level,
        contentDetail: course.content_detail ? JSON.parse(course.content_detail) : null,
        maxStudents: course.max_students,
        instructorName: course.instructor_name,
        isActive: course.is_active,
        createdAt: course.created_at,
        stats: {
          totalEnrollments: parseInt(course.total_enrollments) || 0,
          completedEnrollments: parseInt(course.completed_enrollments) || 0,
          averageProgress: parseFloat(course.avg_progress) || 0,
          availableSlots: course.max_students - (parseInt(course.total_enrollments) || 0)
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

  // Get course by ID with detailed info
  async getCourseById(courseId) {
    const query = `
      SELECT 
        c.id,
        c.title,
        c.description,
        c.price,
        c.duration_weeks,
        c.level,
        c.content_detail,
        c.max_students,
        c.is_active,
        c.created_at,
        u.full_name as instructor_name,
        u.email as instructor_email
      FROM courses c
      LEFT JOIN users u ON c.created_by = u.id
      WHERE c.id = ? AND c.is_active = TRUE
    `;
    
    const courses = await executeQuery(query, [courseId]);
    if (courses.length === 0) return null;
    
    const course = courses[0];
    
    // Get enrollments for this course
    const enrollmentsQuery = `
      SELECT 
        e.id,
        e.status,
        e.progress_percentage,
        e.final_score,
        e.enrolled_at,
        e.completed_at,
        u.full_name as student_name,
        u.email as student_email
      FROM enrollments e
      JOIN students s ON e.student_id = s.id
      JOIN users u ON s.user_id = u.id
      WHERE e.course_id = ?
      ORDER BY e.enrolled_at DESC
    `;
    
    const enrollments = await executeQuery(enrollmentsQuery, [courseId]);
    
    // Get tasks for this course
    const tasksQuery = `
      SELECT 
        id,
        title,
        description,
        task_type,
        max_score,
        due_date,
        order_index,
        is_required,
        created_at
      FROM tasks
      WHERE course_id = ?
      ORDER BY order_index ASC
    `;
    
    const tasks = await executeQuery(tasksQuery, [courseId]);
    
    return {
      id: course.id,
      title: course.title,
      description: course.description,
      price: parseFloat(course.price),
      durationWeeks: course.duration_weeks,
      level: course.level,
      contentDetail: course.content_detail ? JSON.parse(course.content_detail) : null,
      maxStudents: course.max_students,
      isActive: course.is_active,
      createdAt: course.created_at,
      instructor: {
        name: course.instructor_name,
        email: course.instructor_email
      },
      enrollments: enrollments.map(e => ({
        id: e.id,
        status: e.status,
        progress: parseFloat(e.progress_percentage) || 0,
        finalScore: parseFloat(e.final_score) || null,
        enrolledAt: e.enrolled_at,
        completedAt: e.completed_at,
        student: {
          name: e.student_name,
          email: e.student_email
        }
      })),
      tasks: tasks.map(task => ({
        id: task.id,
        title: task.title,
        description: task.description,
        type: task.task_type,
        maxScore: parseFloat(task.max_score),
        dueDate: task.due_date,
        orderIndex: task.order_index,
        isRequired: task.is_required,
        createdAt: task.created_at
      })),
      stats: {
        totalEnrollments: enrollments.length,
        completedEnrollments: enrollments.filter(e => e.status === 'completed').length,
        inProgressEnrollments: enrollments.filter(e => e.status === 'in_progress').length,
        averageProgress: enrollments.length > 0 ? 
          enrollments.reduce((sum, e) => sum + (parseFloat(e.progress_percentage) || 0), 0) / enrollments.length : 0,
        availableSlots: course.max_students - enrollments.length
      }
    };
  }

  // Create new course
  async createCourse(courseData, createdBy) {
    const { 
      title, 
      description, 
      price, 
      durationWeeks, 
      level, 
      contentDetail, 
      maxStudents 
    } = courseData;
    
    const query = `
      INSERT INTO courses (
        title, description, price, duration_weeks, level, 
        content_detail, max_students, created_by, is_active
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, TRUE)
    `;
    
    const result = await executeQuery(query, [
      title,
      description,
      price,
      durationWeeks,
      level,
      JSON.stringify(contentDetail),
      maxStudents,
      createdBy
    ]);
    
    return result.insertId;
  }

  // Update course
  async updateCourse(courseId, updateData) {
    const { 
      title, 
      description, 
      price, 
      durationWeeks, 
      level, 
      contentDetail, 
      maxStudents 
    } = updateData;
    
    const query = `
      UPDATE courses 
      SET 
        title = ?, 
        description = ?, 
        price = ?, 
        duration_weeks = ?, 
        level = ?, 
        content_detail = ?, 
        max_students = ?, 
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `;
    
    await executeQuery(query, [
      title,
      description,
      price,
      durationWeeks,
      level,
      JSON.stringify(contentDetail),
      maxStudents,
      courseId
    ]);
    
    return await this.getCourseById(courseId);
  }

  // Get course statistics
  async getCourseStats() {
    const query = `
      SELECT 
        COUNT(*) as total_courses,
        COUNT(CASE WHEN level = 'beginner' THEN 1 END) as beginner_courses,
        COUNT(CASE WHEN level = 'intermediate' THEN 1 END) as intermediate_courses,
        COUNT(CASE WHEN level = 'advanced' THEN 1 END) as advanced_courses,
        AVG(price) as avg_price,
        AVG(duration_weeks) as avg_duration
      FROM courses 
      WHERE is_active = TRUE
    `;
    
    const stats = await executeQuery(query);
    
    // Get enrollment stats
    const enrollmentQuery = `
      SELECT 
        COUNT(*) as total_enrollments,
        COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed_enrollments,
        COUNT(CASE WHEN status = 'in_progress' THEN 1 END) as in_progress_enrollments,
        AVG(progress_percentage) as avg_progress
      FROM enrollments
    `;
    
    const enrollmentStats = await executeQuery(enrollmentQuery);
    
    return {
      courses: {
        total: parseInt(stats[0].total_courses) || 0,
        byLevel: {
          beginner: parseInt(stats[0].beginner_courses) || 0,
          intermediate: parseInt(stats[0].intermediate_courses) || 0,
          advanced: parseInt(stats[0].advanced_courses) || 0
        },
        averagePrice: parseFloat(stats[0].avg_price) || 0,
        averageDuration: parseFloat(stats[0].avg_duration) || 0
      },
      enrollments: {
        total: parseInt(enrollmentStats[0].total_enrollments) || 0,
        completed: parseInt(enrollmentStats[0].completed_enrollments) || 0,
        inProgress: parseInt(enrollmentStats[0].in_progress_enrollments) || 0,
        averageProgress: parseFloat(enrollmentStats[0].avg_progress) || 0
      }
    };
  }

  // Enroll student in course
  async enrollStudent(studentId, courseId) {
    // Check if already enrolled
    const existingQuery = `
      SELECT id FROM enrollments 
      WHERE student_id = ? AND course_id = ?
    `;
    
    const existing = await executeQuery(existingQuery, [studentId, courseId]);
    if (existing.length > 0) {
      throw new Error('Student is already enrolled in this course');
    }
    
    // Check course capacity
    const capacityQuery = `
      SELECT 
        c.max_students,
        COUNT(e.id) as current_enrollments
      FROM courses c
      LEFT JOIN enrollments e ON c.id = e.course_id
      WHERE c.id = ?
      GROUP BY c.id
    `;
    
    const capacity = await executeQuery(capacityQuery, [courseId]);
    if (capacity.length === 0) {
      throw new Error('Course not found');
    }
    
    if (capacity[0].current_enrollments >= capacity[0].max_students) {
      throw new Error('Course is full');
    }
    
    // Create enrollment
    const enrollQuery = `
      INSERT INTO enrollments (student_id, course_id, status, progress_percentage)
      VALUES (?, ?, 'enrolled', 0.00)
    `;
    
    const result = await executeQuery(enrollQuery, [studentId, courseId]);
    return result.insertId;
  }
}

module.exports = new CourseService();