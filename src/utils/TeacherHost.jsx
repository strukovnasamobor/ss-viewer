// localStorage key holding the teacher key, saved after a correct PIN (see TeacherAccess.jsx)
export const TEACHER_KEY_STORAGE = "teacherKey";

// The teachers' site always shows teacher view
export const isRasHost = window.location.hostname === 'ras.strukovnasamobor.hr';

export function getTeacherKey() {
  try {
    return localStorage.getItem(TEACHER_KEY_STORAGE);
  } catch {
    return null;
  }
}

// Fixed at page load: switching views reloads the app
//const isTeacherHost = true;
const isTeacherHost = isRasHost || !!getTeacherKey();
export default isTeacherHost;
