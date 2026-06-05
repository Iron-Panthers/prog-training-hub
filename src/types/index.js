// Profile Type (from Supabase)
/**
 * @typedef {Object} Profile
 * @property {string} id
 * @property {string|null} name
 * @property {"student"|"teacher"|"admin"} role
 * @property {string|null} avatar_url
 * @property {string} created_at
 * @property {string} updated_at
 */

/**
 * @typedef {Object} Announcement
 * @property {string} id
 * @property {string} title
 * @property {string} content
 * @property {"reminder"|"update"|"important"} type
 * @property {string} image_url
 * @property {string} author_id
 * @property {boolean} is_pinned
 * @property {boolean} is_published
 * @property {string} created_at
 */

/**
 * @typedef {Object} ProjectAdminComments
 * @property {string} id
 * @property {number} line_number
 * @property {string} comment
 * @property {string} author_id
 * @property {string} created_at
 */

/**
 * @typedef {Object} ProjectSubmission
 * @property {string} id
 * @property {string} student_id
 * @property {string} unit_id
 * @property {string} code
 * @property {string} notes
 * @property {"submitted"|"reviewed"|"approved"|"needs_revision"} status
 * @property {ProjectAdminComments[]} admin_comments
 * @property {number} grade
 * @property {string} created_at
 */

/**
 * @typedef {Object} QuizSubmission
 * @property {string} id
 * @property {string} unit_id
 * @property {string[]} answers
 * @property {number} score
 * @property {number} total_questions
 */

/**
 * @typedef {Object} StudentProgress
 * @property {string} student_id
 * @property {string} unit_id
 * @property {boolean} slideshow_completed
 * @property {string[]} exercises_completed
 * @property {number} quiz_attempts
 * @property {number} quiz_completed
 * @property {boolean} project_submitted
 * @property {number} overall_progress
 */

/**
 * @typedef {Object} Exercise
 * @property {string} id
 * @property {string} title
 * @property {string} description
 * @property {string} starter_code
 * @property {string} solution_code
 * @property {string} instructions
 */

/**
 * @typedef {Object} QuizQuestion
 * @property {string} id
 * @property {string} question
 * @property {string[]} options
 * @property {number} correct_index
 * @property {string} explanation
 */

/**
 * @typedef {Object} ProjectStarter
 * @property {string} title
 * @property {string} description
 * @property {string[]} requirements
 * @property {string} starter_code
 */

/**
 * @typedef {Object} Unit
 * @property {string} title
 * @property {string} description
 * @property {"java"|"robo"|"frc"} topic
 * @property {number} order
 * @property {boolean} is_published
 * @property {string} slideshow_url
 * @property {string} slideshow_embed
 * @property {Exercise[]} exercises
 * @property {QuizQuestion[]} quiz_questions
 * @property {ProjectStarter} project
 */
