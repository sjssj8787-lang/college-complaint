const DATA_KEY = 'college_complaint_system_v1';
const PROFILE_STORAGE_KEY = 'college_complaint_profiles_v1';
const defaultProfileData = {
  faculty: [
    { id: 'faculty-1', name: 'Faculty 1', initials: 'F1', role: 'Principal', description: 'Leadership & Strategy', photo: 'photos/faculty1.png' },
    { id: 'faculty-2', name: 'Faculty 2', initials: 'F2', role: 'Dean', description: 'Academic Affairs', photo: 'photos/faculty2.png' },
    { id: 'faculty-3', name: 'Faculty 3', initials: 'F3', role: 'HOD, Engineering', description: 'Department leadership and course strategy', photo: 'photos/faculty1.png' },
    { id: 'faculty-4', name: 'Faculty 4', initials: 'F4', role: 'Physical Education', description: 'Health, fitness and sports coordination', photo: 'photos/faculty2.png' },
    { id: 'faculty-5', name: 'Faculty 5', initials: 'F5', role: 'Librarian', description: 'Resource services and student support', photo: 'photos/faculty1.png' },
    { id: 'faculty-6', name: 'Faculty 6', initials: 'F6', role: 'Student Affairs', description: 'Campus experience and student engagement', photo: 'photos/faculty2.png' }
  ],
  teachers: [
    { id: 'teacher-1', name: 'Teacher 1', initials: 'T1', role: 'Mathematics', description: 'Curriculum planning and exam guidance', photo: 'photos/teacher1.png' },
    { id: 'teacher-2', name: 'Teacher 2', initials: 'T2', role: 'Physics', description: 'Lab mentoring and concept clarity', photo: 'photos/teacher2.png' },
    { id: 'teacher-3', name: 'Teacher 3', initials: 'T3', role: 'Chemistry', description: 'Practical chemistry support and assessment', photo: 'photos/teacher1.png' },
    { id: 'teacher-4', name: 'Teacher 4', initials: 'T4', role: 'Computer Science', description: 'Technology projects and coding practice', photo: 'photos/teacher2.png' },
    { id: 'teacher-5', name: 'Teacher 5', initials: 'T5', role: 'Electronics', description: 'Hands-on circuits and systems learning', photo: 'photos/teacher1.png' },
    { id: 'teacher-6', name: 'Teacher 6', initials: 'T6', role: 'English', description: 'Communication skills and literature support', photo: 'photos/teacher2.png' }
  ]
};

// Global database caching variable for server syncing
window.dbData = null;

async function saveDataToServer(data) {
  try {
    await fetch('/api/save', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(data)
    });
  } catch (error) {
    console.error("Failed to save data to server database:", error);
  }
}

function getStoredData() {
  if (window.dbData) {
    return window.dbData;
  }
  const raw = localStorage.getItem(DATA_KEY);
  if (!raw) {
    const initial = {
      admin: { id: 'shreyas', password: 'shreyas123' },
      students: [
        { usn: '1MS17CS001', password: 'password' },
        { usn: '1MS17CS002', password: 'password' }
      ],
      complaints: []
    };
    localStorage.setItem(DATA_KEY, JSON.stringify(initial));
    return initial;
  }
  try {
    const parsed = JSON.parse(raw);
    let changed = false;
    if (parsed.admin) {
      if (parsed.admin.id !== 'shreyas' || parsed.admin.password !== 'shreyas123') {
        parsed.admin.id = 'shreyas';
        parsed.admin.password = 'shreyas123';
        changed = true;
      }
    } else {
      parsed.admin = { id: 'shreyas', password: 'shreyas123' };
      changed = true;
    }
    if (!parsed.students) {
      parsed.students = [
        { usn: '1MS17CS001', password: 'password' },
        { usn: '1MS17CS002', password: 'password' }
      ];
      changed = true;
    }
    if (!parsed.complaints) {
      parsed.complaints = [];
      changed = true;
    }
    if (changed) {
      localStorage.setItem(DATA_KEY, JSON.stringify(parsed));
    }
    return parsed;
  } catch {
    const fallback = {
      admin: { id: 'shreyas', password: 'shreyas123' },
      students: [
        { usn: '1MS17CS001', password: 'password' },
        { usn: '1MS17CS002', password: 'password' }
      ],
      complaints: []
    };
    localStorage.setItem(DATA_KEY, JSON.stringify(fallback));
    return fallback;
  }
}

function setStoredData(data) {
  window.dbData = data;
  saveDataToServer(data);
  localStorage.setItem(DATA_KEY, JSON.stringify(data));
}

const THEME_KEY = 'college_complaint_system_theme';
let adminFilter = 'All';
let adminCategoryFilter = 'All';
let adminSubFilter = '';
let adminSearch = '';

function setTheme(theme) {
  if (theme === 'dark') {
    document.documentElement.classList.add('dark');
    localStorage.setItem(THEME_KEY, 'dark');
  } else {
    document.documentElement.classList.remove('dark');
    localStorage.setItem(THEME_KEY, 'light');
  }
  updateThemeToggleIcon();
}

function loadTheme() {
  const saved = localStorage.getItem(THEME_KEY);
  if (saved) {
    setTheme(saved);
    return;
  }
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  setTheme(prefersDark ? 'dark' : 'light');
}

function toggleTheme() {
  const nextTheme = document.documentElement.classList.contains('dark') ? 'light' : 'dark';
  setTheme(nextTheme);
}

function updateThemeToggleIcon() {
  const btn = document.getElementById('themeToggle');
  if (!btn) return;
  const isDark = document.documentElement.classList.contains('dark');
  btn.textContent = isDark ? '☀️' : '🌙';
}

function getElementValue(id) {
  const element = document.getElementById(id);
  return element ? element.value.trim() : '';
}

function handlePublicTargetChange() {
  const publicTarget = document.getElementById('publicTarget');
  const detailContainer = document.getElementById('publicTargetDetailContainer');
  const detailSelect = document.getElementById('publicTargetDetail');
  const detailLabel = document.getElementById('publicTargetDetailLabel');

  if (!publicTarget || !detailContainer || !detailSelect) return;

  const val = publicTarget.value;
  if (val === 'Subject Teacher') {
    detailContainer.style.display = 'block';
    if (detailLabel) detailLabel.textContent = 'Select Teacher';
    detailSelect.disabled = false;
    detailSelect.required = true;

    const profiles = getStoredProfiles();
    const teachers = profiles.teachers || [];
    detailSelect.innerHTML = '<option value="">Choose a Subject Teacher</option>' +
      teachers.map(t => `<option value="${t.name}">${t.name} (${t.role})</option>`).join('');
  } else if (val === 'Faculty') {
    detailContainer.style.display = 'block';
    if (detailLabel) detailLabel.textContent = 'Select Faculty Member';
    detailSelect.disabled = false;
    detailSelect.required = true;

    const profiles = getStoredProfiles();
    const faculty = profiles.faculty || [];
    detailSelect.innerHTML = '<option value="">Choose a Faculty Member</option>' +
      faculty.map(f => `<option value="${f.name}">${f.name} (${f.role})</option>`).join('');
  } else {
    detailContainer.style.display = 'none';
    detailSelect.disabled = true;
    detailSelect.required = false;
    detailSelect.innerHTML = '';
  }
}

function handleStudentTargetChange() {
  const studentTarget = document.getElementById('studentTarget');
  const detailContainer = document.getElementById('studentTargetDetailContainer');
  const detailSelect = document.getElementById('studentTargetDetail');
  const detailLabel = document.getElementById('studentTargetDetailLabel');

  if (!studentTarget || !detailContainer || !detailSelect) return;

  const val = studentTarget.value;
  if (val === 'Subject Teacher') {
    detailContainer.style.display = 'block';
    if (detailLabel) detailLabel.textContent = 'Select Subject Teacher';
    detailSelect.disabled = false;
    detailSelect.required = true;

    const profiles = getStoredProfiles();
    const teachers = profiles.teachers || [];
    detailSelect.innerHTML = '<option value="">Choose a Subject Teacher</option>' +
      teachers.map(t => `<option value="${t.name}">${t.name} (${t.role})</option>`).join('');
  } else if (val === 'Faculty') {
    detailContainer.style.display = 'block';
    if (detailLabel) detailLabel.textContent = 'Select Faculty Member';
    detailSelect.disabled = false;
    detailSelect.required = true;

    const profiles = getStoredProfiles();
    const faculty = profiles.faculty || [];
    detailSelect.innerHTML = '<option value="">Choose a Faculty Member</option>' +
      faculty.map(f => `<option value="${f.name}">${f.name} (${f.role})</option>`).join('');
  } else if (val === 'Hostel') {
    detailContainer.style.display = 'block';
    if (detailLabel) detailLabel.textContent = 'Select Hostel Issue';
    detailSelect.disabled = false;
    detailSelect.required = true;

    detailSelect.innerHTML = `
      <option value="">Choose a hostel issue</option>
      <option value="Mess">Mess</option>
      <option value="Room">Room</option>
      <option value="Security">Security</option>
      <option value="Maintenance">Maintenance</option>
    `;
  } else {
    detailContainer.style.display = 'none';
    detailSelect.disabled = true;
    detailSelect.required = false;
    detailSelect.innerHTML = '';
  }
}

function handlePublicSubmit(event) {
  event.preventDefault();
  const type = getElementValue('reportType') || getElementValue('guestType');
  const optionalUsn = getElementValue('publicUsn') || getElementValue('guestUsn');
  const platform = getElementValue('reportPlatform') || 'College';
  const subject = getElementValue('publicSubject') || getElementValue('guestSubject');
  const message = getElementValue('publicMessage') || getElementValue('guestMessage');

  let target = '';
  if (platform === 'Hostel') {
    const hostelTarget = getElementValue('publicTargetHostel');
    target = hostelTarget ? `Hostel: ${hostelTarget}` : '';
  } else {
    const collegeTarget = getElementValue('publicTarget');
    if (collegeTarget === 'Subject Teacher' || collegeTarget === 'Faculty') {
      const detail = getElementValue('publicTargetDetail');
      target = detail ? `${collegeTarget}: ${detail}` : collegeTarget;
    } else {
      target = collegeTarget;
    }
  }

  if (!target || !subject || !message) {
    alert('Please complete the category, subject, and report details.');
    return;
  }

  const data = getStoredData();
  data.complaints.unshift({
    id: `P-${Date.now()}`,
    role: 'Public',
    owner: optionalUsn || 'Anonymous',
    platform,
    type: type || 'Feedback',
    target,
    subject,
    message,
    resolved: false,
    status: 'Open',
    date: new Date().toLocaleString()
  });
  setStoredData(data);
  alert('Thanks! Your report has been submitted. Admin can review it soon.');
  event.target.reset();

  const detailContainer = document.getElementById('publicTargetDetailContainer');
  if (detailContainer) detailContainer.style.display = 'none';
}

function setHomeReportType(type) {
  const reportType = document.getElementById('reportType');
  if (reportType) {
    reportType.value = type;
  }

  const complaintTab = document.getElementById('reportTabComplaint');
  const feedbackTab = document.getElementById('reportTabFeedback');
  if (complaintTab && feedbackTab) {
    complaintTab.classList.toggle('active', type === 'Complaint');
    feedbackTab.classList.toggle('active', type === 'Feedback');
  }
}

function setComplaintPlatform(platform) {
  const platformInput = document.getElementById('reportPlatform');
  const platformButtons = document.querySelectorAll('.tab-button');
  const platformLabel = document.getElementById('platformLabel');
  if (platformInput) {
    platformInput.value = platform;
  }
  if (platformLabel) {
    platformLabel.textContent = platform;
  }
  platformButtons.forEach((button) => {
    button.classList.toggle('active', button.dataset.platform === platform);
  });
  const tabContents = document.querySelectorAll('.tab-content');
  tabContents.forEach((content) => {
    const isActive = content.dataset.platform === platform;
    content.classList.toggle('active', isActive);
    const select = content.querySelector('select');
    if (select) {
      select.disabled = !isActive;
      if (!isActive) {
        select.selectedIndex = 0;
      }
    }
  });

  const detailContainer = document.getElementById('publicTargetDetailContainer');
  const detailSelect = document.getElementById('publicTargetDetail');
  if (detailContainer && detailSelect) {
    detailContainer.style.display = 'none';
    detailSelect.disabled = true;
    detailSelect.required = false;
    detailSelect.innerHTML = '';
  }
}

function handleStudentSubmit(event) {
  event.preventDefault();
  const type = document.getElementById('studentType').value;
  const mainTarget = document.getElementById('studentTarget').value;
  const detail = document.getElementById('studentTargetDetail') ? document.getElementById('studentTargetDetail').value : '';
  const subject = document.getElementById('studentSubject').value.trim();
  const message = document.getElementById('studentMessage').value.trim();
  const currentUser = sessionStorage.getItem('loggedInUser');

  if (!currentUser || !mainTarget || !subject || !message) {
    alert('Please login and complete all fields before submitting.');
    return;
  }

  let target = mainTarget;
  if (mainTarget === 'Subject Teacher' || mainTarget === 'Faculty' || mainTarget === 'Hostel') {
    target = detail ? `${mainTarget}: ${detail}` : mainTarget;
  }

  const data = getStoredData();
  data.complaints.unshift({
    id: `S-${Date.now()}`,
    role: 'Student',
    owner: currentUser,
    type,
    target,
    subject,
    message,
    resolved: false,
    status: 'Open',
    date: new Date().toLocaleString()
  });
  setStoredData(data);
  renderStudentHistory();
  alert('Your request has been submitted successfully.');
  event.target.reset();

  const detailContainer = document.getElementById('studentTargetDetailContainer');
  if (detailContainer) detailContainer.style.display = 'none';
}

async function initApp() {
  const rawProfiles = localStorage.getItem(PROFILE_STORAGE_KEY);
  const rawData = localStorage.getItem(DATA_KEY);
  if (
    (rawProfiles && (rawProfiles.includes('Suresh') || rawProfiles.includes('Aparna') || rawProfiles.includes('Rohit') || !rawProfiles.includes('teacher1.png'))) ||
    (rawData && (rawData.includes('Suresh') || rawData.includes('Aparna') || rawData.includes('Rohit') || !rawData.includes('teacher1.png')))
  ) {
    localStorage.removeItem(PROFILE_STORAGE_KEY);
    localStorage.removeItem(DATA_KEY);
    window.location.reload();
    return;
  }

  try {
    const res = await fetch('/api/data');
    if (res.ok) {
      window.dbData = await res.json();
      if (window.dbData && window.dbData.profiles) {
        localStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify(window.dbData.profiles));
      }
    } else {
      console.warn("Server API returned error status:", res.status);
    }
  } catch (e) {
    console.warn("Database server offline, using local fallbacks.", e);
  }

  loadTheme();

  // Dynamic dropdown listeners
  const publicTarget = document.getElementById('publicTarget');
  if (publicTarget) {
    publicTarget.addEventListener('change', handlePublicTargetChange);
    // Initial trigger to ensure correct state on load
    handlePublicTargetChange();
  }

  const studentTarget = document.getElementById('studentTarget');
  if (studentTarget) {
    studentTarget.addEventListener('change', handleStudentTargetChange);
    // Initial trigger to ensure correct state on load
    handleStudentTargetChange();
  }

  // Dynamic Header Navigation based on authentication state
  const loggedInUser = sessionStorage.getItem('loggedInUser');
  const mainNav = document.querySelector('.main-nav');
  if (mainNav && loggedInUser) {
    if (loggedInUser === 'admin') {
      if (!mainNav.querySelector('a[href="admin.html"]')) {
        const link = document.createElement('a');
        link.href = 'admin.html';
        link.textContent = 'Admin Dashboard';
        mainNav.appendChild(link);
      }
    } else {
      if (!mainNav.querySelector('a[href="student.html"]')) {
        const link = document.createElement('a');
        link.href = 'student.html';
        link.textContent = 'Student Portal';
        mainNav.appendChild(link);
      }
    }
  }

  if (document.getElementById('reportTabComplaint')) {
    setHomeReportType('Complaint');
  }
  if (document.getElementById('adminStats')) {
    updateAdminStats();
  }
  if (document.querySelector('#allSubmissionsTable tbody')) {
    renderAllSubmissions();
  }
  if (document.querySelector('#reportsSummaryTable tbody')) {
    renderReportSummaryTable();
  }
  if (document.querySelector('#studentTable tbody')) {
    renderStudentList();
  }
  if (document.getElementById('studentHistory')) {
    renderStudentHistory();
  }
  if (document.querySelector('.search-bar')) {
    initAdminDashboard();
  }
  const profilesGrid = document.getElementById('profilesGrid');
  if (profilesGrid) {
    const pageKey = profilesGrid.dataset.profilePage;
    if (pageKey) {
      initProfilePage(pageKey);
    }
  }
}

window.addEventListener('DOMContentLoaded', () => {
  // Keyboard shortcut (Ctrl + Shift + Y) Easter Egg for ownership proof
  window.addEventListener('keydown', (e) => {
    if (e.ctrlKey && e.shiftKey && e.key.toLowerCase() === 'y') {
      alert("🔒 Verified System Creator:\nDeveloped by Shreyas Kulkarni\n© 2026. All rights reserved.");
    }
  });

  initApp();
});

function initAdminDashboard() {
  const searchInput = document.querySelector('.search-bar input');
  const filterButtons = document.querySelectorAll('.status-filters button');
  const catButtons = document.querySelectorAll('.category-filters button');

  if (searchInput) {
    searchInput.addEventListener('input', (event) => {
      adminSearch = event.target.value.trim().toLowerCase();
      renderAllSubmissions();
    });
  }

  filterButtons.forEach((button) => {
    button.addEventListener('click', () => {
      adminFilter = button.textContent;
      filterButtons.forEach((btn) => btn.classList.toggle('active', btn === button));
      renderAllSubmissions();
    });
  });

  catButtons.forEach((button) => {
    button.addEventListener('click', () => {
      const catText = button.textContent.trim();
      if (catText.includes('Teachers')) {
        adminCategoryFilter = 'Subject Teacher';
      } else if (catText.includes('Faculty')) {
        adminCategoryFilter = 'Faculty';
      } else if (catText.includes('Hostel')) {
        adminCategoryFilter = 'Hostel';
      } else {
        adminCategoryFilter = 'All';
      }
      adminSubFilter = ''; // Reset sub-filter when category changes
      catButtons.forEach((btn) => btn.classList.toggle('active', btn === button));
      renderAllSubmissions();
    });
  });
}

function handleStudentLogin(event) {
  event.preventDefault();
  const usn = document.getElementById('studentLoginUsn').value.trim();
  const password = document.getElementById('studentLoginPassword').value.trim();
  const data = getStoredData();

  const student = data.students.find((user) => user.usn === usn && user.password === password);
  if (student) {
    sessionStorage.setItem('loggedInUser', student.usn);
    window.location.href = 'student.html';
    return;
  }

  alert('Student login failed. Please check your USN or password.');
}

function handleAdminLogin(event) {
  event.preventDefault();
  const id = document.getElementById('adminLoginId').value.trim();
  const password = document.getElementById('adminLoginPassword').value.trim();
  const data = getStoredData();

  if (id === data.admin.id && password === data.admin.password) {
    sessionStorage.setItem('loggedInUser', 'admin');
    window.location.href = 'admin.html';
    return;
  }

  alert('Admin login failed. Please check your credentials.');
}

function handleAddStudent(event) {
  event.preventDefault();
  const usn = document.getElementById('newStudentUsn').value.trim();
  const password = document.getElementById('newStudentPassword').value.trim();
  if (!usn || !password) return;

  const data = getStoredData();
  if (data.students.find((user) => user.usn === usn)) {
    alert('Student with this USN already exists.');
    return;
  }

  data.students.push({ usn, password });
  setStoredData(data);
  renderStudentList();
  updateAdminStats();
  event.target.reset();
  alert('Student account added successfully.');
}

function cloneProfileData(data) {
  return {
    faculty: data.faculty.map((profile) => ({ ...profile })),
    teachers: data.teachers.map((profile) => ({ ...profile }))
  };
}

function getStoredProfiles() {
  if (window.dbData && window.dbData.profiles) {
    return window.dbData.profiles;
  }
  const raw = localStorage.getItem(PROFILE_STORAGE_KEY);
  if (!raw) {
    const initialProfiles = cloneProfileData(defaultProfileData);
    setStoredProfiles(initialProfiles);
    return initialProfiles;
  }
  try {
    const stored = JSON.parse(raw);
    const profiles = {
      faculty: stored.faculty?.map((profile) => ({ ...profile })) ?? cloneProfileData(defaultProfileData).faculty,
      teachers: stored.teachers?.map((profile) => ({ ...profile })) ?? cloneProfileData(defaultProfileData).teachers
    };
    if (window.dbData) {
      window.dbData.profiles = profiles;
      saveDataToServer(window.dbData);
    }
    return profiles;
  } catch {
    const fallback = cloneProfileData(defaultProfileData);
    if (window.dbData) {
      window.dbData.profiles = fallback;
      saveDataToServer(window.dbData);
    }
    return fallback;
  }
}

function setStoredProfiles(data) {
  if (window.dbData) {
    window.dbData.profiles = data;
    saveDataToServer(window.dbData);
  }
  localStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify(data));
}

function getInitials(name) {
  return String(name)
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0].toUpperCase())
    .join('');
}

function renderProfiles(profiles, container, selectedId, onSelect, onDelete) {
  if (!container) return;
  container.innerHTML = '';
  profiles.forEach((profile) => {
    const card = document.createElement('article');
    card.className = 'profile-card';
    if (selectedId === profile.id) {
      card.classList.add('active');
    }

    const visual = profile.photo ? document.createElement('img') : document.createElement('div');
    if (profile.photo) {
      visual.className = 'profile-photo';
      visual.src = profile.photo;
      visual.alt = profile.name;
    } else {
      visual.className = 'profile-avatar';
      visual.textContent = profile.initials || getInitials(profile.name);
    }

    const copy = document.createElement('div');
    copy.className = 'profile-copy';
    const title = document.createElement('h3');
    title.textContent = profile.name;
    const role = document.createElement('p');
    role.className = 'role';
    role.textContent = profile.role;
    const bio = document.createElement('p');
    bio.textContent = profile.description || 'No description provided.';
    copy.appendChild(title);
    copy.appendChild(role);
    copy.appendChild(bio);

    card.appendChild(visual);
    card.appendChild(copy);

    if (typeof onSelect === 'function') {
      card.addEventListener('click', () => {
        onSelect(profile.id);
      });
      card.style.cursor = 'pointer';
    }

    if (typeof onDelete === 'function') {
      const actionGroup = document.createElement('div');
      actionGroup.className = 'profile-actions';
      const deleteButton = document.createElement('button');
      deleteButton.type = 'button';
      deleteButton.className = 'button secondary small delete-profile-button';
      deleteButton.textContent = 'Delete';
      deleteButton.addEventListener('click', (event) => {
        event.stopPropagation();
        onDelete(profile.id);
      });
      actionGroup.appendChild(deleteButton);
      card.appendChild(actionGroup);
    }

    container.appendChild(card);
  });
}

function initProfilePage(pageKey) {
  const profilesContainer = document.getElementById('profilesGrid');
  if (!profilesContainer) return;

  let editorMode = 'edit';
  let selectedProfileId = null;

  const stored = getStoredProfiles();
  let currentPage = pageKey;
  let profiles = stored[currentPage] ?? [];
  selectedProfileId = profiles[0]?.id || null;

  const openEditor = document.getElementById('openProfileEditor');
  const editorSection = document.getElementById('profileEditorSection');
  const profileForm = document.getElementById('profileEditorForm');
  const profileIdInput = document.getElementById('profileId');
  const profileName = document.getElementById('profileName');
  const profileRole = document.getElementById('profileRole');
  const profileBio = document.getElementById('profileBio');
  const profilePhotoInput = document.getElementById('profilePhotoInput');
  const profilePhotoPreview = document.getElementById('profilePhotoPreview');
  const profilePhotoPreviewContainer = document.getElementById('profilePhotoPreviewContainer');
  const cancelButton = document.getElementById('cancelProfileEdit');
  const removePhotoButton = document.getElementById('removeProfilePhoto');
  const deleteProfileButton = document.getElementById('deleteProfileButton');
  const editTabButton = document.getElementById('editProfileTab');
  const newTabButton = document.getElementById('newProfileTab');
  const saveProfileButton = document.getElementById('saveProfileButton');
  const manageFacultyTab = document.getElementById('manageFacultyTab');
  const manageTeachersTab = document.getElementById('manageTeachersTab');
  const profileSelectDropdown = document.getElementById('profileSelectDropdown');
  const profileSelectGroup = document.getElementById('profileSelectGroup');

  renderProfiles(profiles, profilesContainer, selectedProfileId, null, null);

  const hasEditor = editorSection && profileForm && profileIdInput && profileName && profileRole && profileBio && profilePhotoInput && profilePhotoPreviewContainer && cancelButton && removePhotoButton && deleteProfileButton && editTabButton && newTabButton && saveProfileButton;

  // Search and Category filter logic
  const rosterSearch = document.getElementById('rosterSearch');
  const filterPills = document.querySelectorAll('.roster-filter-pills button');

  function filterRoster() {
    const query = rosterSearch ? rosterSearch.value.toLowerCase().trim() : '';
    const activePill = document.querySelector('.roster-filter-pills button.active');
    const filterVal = activePill ? activePill.dataset.filter.toLowerCase() : 'all';

    const filtered = profiles.filter((p) => {
      const matchesQuery = p.name.toLowerCase().includes(query) ||
        p.role.toLowerCase().includes(query) ||
        (p.description && p.description.toLowerCase().includes(query));

      let matchesFilter = false;
      if (filterVal === 'all') {
        matchesFilter = true;
      } else if (filterVal === 'leadership') {
        matchesFilter = ['principal', 'dean', 'hod'].some(term => p.role.toLowerCase().includes(term));
      } else if (filterVal === 'staff') {
        matchesFilter = !['principal', 'dean', 'hod'].some(term => p.role.toLowerCase().includes(term));
      } else if (filterVal === 'science') {
        matchesFilter = ['physics', 'chemistry', 'electronics', 'science'].some(term => p.role.toLowerCase().includes(term) || (p.description && p.description.toLowerCase().includes(term)));
      } else if (filterVal === 'math') {
        matchesFilter = p.role.toLowerCase().includes('math') || (p.description && p.description.toLowerCase().includes('math'));
      } else if (filterVal === 'english') {
        matchesFilter = p.role.toLowerCase().includes('english') || (p.description && p.description.toLowerCase().includes('english'));
      } else if (filterVal === 'cs') {
        matchesFilter = p.role.toLowerCase().includes('computer') || (p.description && p.description.toLowerCase().includes('computer'));
      } else {
        matchesFilter = p.role.toLowerCase().includes(filterVal) || (p.description && p.description.toLowerCase().includes(filterVal));
      }

      return matchesQuery && matchesFilter;
    });

    const selHandler = hasEditor ? onSelectProfile : null;
    const delHandler = hasEditor ? onDeleteProfile : null;
    renderProfiles(filtered, profilesContainer, selectedProfileId, selHandler, delHandler);
  }

  if (rosterSearch) {
    rosterSearch.addEventListener('input', filterRoster);
  }

  filterPills.forEach((button) => {
    button.addEventListener('click', () => {
      filterPills.forEach((btn) => btn.classList.remove('active'));
      button.classList.add('active');
      filterRoster();
    });
  });

  if (!hasEditor) return;

  function toggleEditor(forceState) {
    if (!editorSection) return;
    if (typeof forceState === 'boolean') {
      editorSection.hidden = !forceState;
    } else {
      editorSection.hidden = !editorSection.hidden;
    }
    if (openEditor) {
      openEditor.textContent = editorSection.hidden ? 'Open profile editor' : 'Close profile editor';
    }
  }

  function updateProfileDropdown() {
    if (!profileSelectDropdown) return;
    profileSelectDropdown.innerHTML = '';
    const current = getCurrentProfiles();
    current.forEach((p) => {
      const option = document.createElement('option');
      option.value = p.id;
      option.textContent = `${p.name} (${p.role})`;
      profileSelectDropdown.appendChild(option);
    });
    if (selectedProfileId) {
      profileSelectDropdown.value = selectedProfileId;
    } else {
      profileSelectDropdown.value = '';
    }
  }

  if (profileSelectDropdown) {
    profileSelectDropdown.addEventListener('change', (e) => {
      const val = e.target.value;
      if (val) {
        onSelectProfile(val);
      }
    });
  }

  function setPreviewImage(src) {
    if (src) {
      profilePhotoPreview.src = src;
      profilePhotoPreviewContainer.classList.add('has-image');
    } else {
      profilePhotoPreview.src = '';
      profilePhotoPreviewContainer.classList.remove('has-image');
    }
  }

  function getCurrentProfiles() {
    return getStoredProfiles()[currentPage] ?? [];
  }

  function switchPage(newPage) {
    currentPage = newPage;
    profiles = getCurrentProfiles();
    selectedProfileId = profiles[0]?.id || null;
    if (manageFacultyTab) {
      manageFacultyTab.classList.toggle('active', newPage === 'faculty');
    }
    if (manageTeachersTab) {
      manageTeachersTab.classList.toggle('active', newPage === 'teachers');
    }
    if (editorMode === 'edit' && selectedProfileId) {
      const profile = getCurrentProfiles().find((item) => item.id === selectedProfileId);
      if (profile) fillEditor(profile);
    } else if (editorMode === 'new') {
      resetEditor();
    }
    updateProfileDropdown();
    renderProfiles(profiles, profilesContainer, selectedProfileId, onSelectProfile, onDeleteProfile);
  }

  function saveProfileData(profilesToSave) {
    const saved = getStoredProfiles();
    saved[currentPage] = profilesToSave;
    setStoredProfiles(saved);
    profiles = saved[currentPage];
    updateProfileDropdown();
    renderProfiles(profiles, profilesContainer, selectedProfileId, onSelectProfile, onDeleteProfile);
    if (typeof window.renderReportSummaryTable === 'function') {
      window.renderReportSummaryTable();
    }
  }

  function onSelectProfile(profileId) {
    selectedProfileId = profileId;
    if (editorMode !== 'edit') {
      setEditorMode('edit');
    }
    const profile = getCurrentProfiles().find((item) => item.id === profileId);
    if (profile) {
      fillEditor(profile);
    }
    if (profileSelectDropdown) {
      profileSelectDropdown.value = profileId;
    }
    renderProfiles(profiles, profilesContainer, selectedProfileId, onSelectProfile, onDeleteProfile);
  }

  function onDeleteProfile(profileId) {
    if (!confirm('Delete this profile? This action cannot be undone.')) return;
    const currentProfiles = getCurrentProfiles().filter((item) => item.id !== profileId);
    saveProfileData(currentProfiles);
    if (selectedProfileId === profileId) {
      selectedProfileId = currentProfiles[0]?.id || null;
      if (selectedProfileId) {
        const selected = currentProfiles.find((item) => item.id === selectedProfileId);
        if (selected) fillEditor(selected);
      } else {
        setEditorMode('new');
      }
    }
  }

  function fillEditor(profile) {
    profileIdInput.value = profile.id;
    profileName.value = profile.name;
    profileRole.value = profile.role;
    profileBio.value = profile.description || '';
    setPreviewImage(profile.photo || '');
    profilePhotoInput.value = '';
  }

  function resetEditor() {
    profileIdInput.value = '';
    profileName.value = '';
    profileRole.value = '';
    profileBio.value = '';
    setPreviewImage('');
    profilePhotoInput.value = '';
  }

  function setEditorMode(mode) {
    editorMode = mode;
    editTabButton.classList.toggle('active', mode === 'edit');
    newTabButton.classList.toggle('active', mode === 'new');
    deleteProfileButton.hidden = mode !== 'edit';
    saveProfileButton.textContent = mode === 'new' ? 'Add profile' : 'Save changes';
    if (profileSelectGroup) {
      profileSelectGroup.style.display = mode === 'new' ? 'none' : 'grid';
    }
    if (mode === 'edit') {
      const profile = getCurrentProfiles().find((item) => item.id === selectedProfileId) ?? getCurrentProfiles()[0];
      if (profile) {
        selectedProfileId = profile.id;
        fillEditor(profile);
      } else {
        setEditorMode('new');
      }
    } else {
      resetEditor();
    }
    if (profileSelectDropdown && selectedProfileId) {
      profileSelectDropdown.value = selectedProfileId;
    }
    renderProfiles(profiles, profilesContainer, selectedProfileId, onSelectProfile, onDeleteProfile);
  }

  if (openEditor) {
    openEditor.addEventListener('click', () => {
      toggleEditor();
      if (!editorSection.hidden && editorMode === 'edit' && selectedProfileId) {
        const profile = getCurrentProfiles().find((item) => item.id === selectedProfileId);
        if (profile) fillEditor(profile);
      }
    });
  }

  if (manageFacultyTab) {
    manageFacultyTab.addEventListener('click', () => switchPage('faculty'));
  }
  if (manageTeachersTab) {
    manageTeachersTab.addEventListener('click', () => switchPage('teachers'));
  }

  cancelButton.addEventListener('click', () => {
    if (editorMode === 'edit') {
      const profile = getCurrentProfiles().find((item) => item.id === selectedProfileId);
      if (profile) fillEditor(profile);
    } else {
      resetEditor();
    }
    toggleEditor(false);
  });

  removePhotoButton.addEventListener('click', () => {
    if (editorMode === 'edit') {
      const currentProfiles = getCurrentProfiles();
      const profile = currentProfiles.find((item) => item.id === selectedProfileId);
      if (!profile) return;
      profile.photo = '';
      saveProfileData(currentProfiles);
      fillEditor(profile);
    } else {
      setPreviewImage('');
    }
  });

  deleteProfileButton.addEventListener('click', () => {
    if (editorMode !== 'edit') return;
    if (!selectedProfileId) return;
    onDeleteProfile(selectedProfileId);
  });

  editTabButton.addEventListener('click', () => setEditorMode('edit'));
  newTabButton.addEventListener('click', () => setEditorMode('new'));

  profilePhotoInput.addEventListener('change', () => {
    const file = profilePhotoInput.files[0];
    if (!file) {
      setPreviewImage('');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => setPreviewImage(reader.result);
    reader.readAsDataURL(file);
  });

  profileForm.addEventListener('submit', (event) => {
    event.preventDefault();
    const currentProfiles = getCurrentProfiles();
    const name = profileName.value.trim();
    const role = profileRole.value.trim();
    const description = profileBio.value.trim();
    if (!name || !role) {
      alert('Please enter both name and role.');
      return;
    }

    if (editorMode === 'new') {
      let id = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') || `profile-${Date.now()}`;
      if (currentProfiles.some((item) => item.id === id)) {
        id = `${id}-${Date.now()}`;
      }
      const newProfile = {
        id,
        name,
        initials: getInitials(name),
        role,
        description,
        photo: ''
      };
      const file = profilePhotoInput.files[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = () => {
          newProfile.photo = reader.result;
          currentProfiles.push(newProfile);
          selectedProfileId = newProfile.id;
          saveProfileData(currentProfiles);
          setEditorMode('edit');
        };
        reader.readAsDataURL(file);
        return;
      }
      currentProfiles.push(newProfile);
      selectedProfileId = newProfile.id;
      saveProfileData(currentProfiles);
      setEditorMode('edit');
      return;
    }

    const profile = currentProfiles.find((item) => item.id === selectedProfileId);
    if (!profile) return;
    profile.name = name;
    profile.role = role;
    profile.description = description;
    const file = profilePhotoInput.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        profile.photo = reader.result;
        saveProfileData(currentProfiles);
      };
      reader.readAsDataURL(file);
      return;
    }
    saveProfileData(currentProfiles);
  });

  setEditorMode('edit');
  switchPage(currentPage);
}

function logout() {
  sessionStorage.removeItem('loggedInUser');
  window.location.href = 'index.html';
}

function updateAdminStats() {
  const stats = document.getElementById('adminStats');
  if (!stats) return;
  const data = getStoredData();
  const total = data.complaints.length;
  const solved = data.complaints.filter((item) => item.resolved).length;
  const openCases = total - solved;
  const studentCount = data.students.length;

  const facultyCount = data.complaints.filter(c => ['faculty', 'subject teacher', 'subject_teacher', 'subject teachers'].includes((c.target || '').toLowerCase())).length;
  const hostelCount = data.complaints.filter(c => (c.platform || '').toLowerCase() === 'hostel' || ['mess', 'room', 'security', 'maintenance'].includes((c.target || '').toLowerCase())).length;
  const campusCount = Math.max(0, total - facultyCount - hostelCount);

  const facPercent = total ? Math.round((facultyCount / total) * 100) : 0;
  const hosPercent = total ? Math.round((hostelCount / total) * 100) : 0;
  const camPercent = total ? Math.round((campusCount / total) * 100) : 0;

  stats.innerHTML = `
    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 2rem; align-items: start;">
      <div>
        <h2 style="margin: 0 0 1.25rem 0;">System Statistics</h2>
        <div class="admin-summary" style="margin-top: 0;">
          <div><strong>${total}</strong><span>Total submissions</span></div>
          <div><strong>${openCases}</strong><span>Open cases</span></div>
          <div><strong>${solved}</strong><span>Resolved cases</span></div>
          <div><strong>${studentCount}</strong><span>Students registered</span></div>
        </div>
      </div>
      <div>
        <h2 style="margin: 0 0 1.25rem 0;">Complaint Distribution</h2>
        <div style="display: flex; flex-direction: column; gap: 1.2rem;">
          <div>
            <div style="display: flex; justify-content: space-between; font-size: 0.9rem; margin-bottom: 0.35rem;">
              <span>Faculty & Academics</span>
              <strong>${facultyCount} (${facPercent}%)</strong>
            </div>
            <div style="width: 100%; height: 8px; background: var(--border); border-radius: 999px; overflow: hidden;">
              <div style="width: ${facPercent}%; height: 100%; background: var(--primary); border-radius: 999px; transition: width 0.4s ease;"></div>
            </div>
          </div>
          <div>
            <div style="display: flex; justify-content: space-between; font-size: 0.9rem; margin-bottom: 0.35rem;">
              <span>Hostel & Mess</span>
              <strong>${hostelCount} (${hosPercent}%)</strong>
            </div>
            <div style="width: 100%; height: 8px; background: var(--border); border-radius: 999px; overflow: hidden;">
              <div style="width: ${hosPercent}%; height: 100%; background: var(--accent); border-radius: 999px; transition: width 0.4s ease;"></div>
            </div>
          </div>
          <div>
            <div style="display: flex; justify-content: space-between; font-size: 0.9rem; margin-bottom: 0.35rem;">
              <span>Campus & Surroundings</span>
              <strong>${campusCount} (${camPercent}%)</strong>
            </div>
            <div style="width: 100%; height: 8px; background: var(--border); border-radius: 999px; overflow: hidden;">
              <div style="width: ${camPercent}%; height: 100%; background: #f59e0b; border-radius: 999px; transition: width 0.4s ease;"></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `;
}

function deleteStudent(usn) {
  const data = getStoredData();
  const remaining = data.students.filter((student) => student.usn !== usn);
  if (remaining.length === data.students.length) return;
  data.students = remaining;
  setStoredData(data);
  renderStudentList();
  updateAdminStats();
}

function deleteComplaint(id) {
  const data = getStoredData();
  data.complaints = data.complaints.filter((item) => item.id !== id);
  setStoredData(data);
  renderAllSubmissions();
  updateAdminStats();
  if (typeof window.renderReportSummaryTable === 'function') {
    window.renderReportSummaryTable();
  }
}

function toggleComplaintStatus(id) {
  const data = getStoredData();
  const complaint = data.complaints.find((item) => item.id === id);
  if (!complaint) return;
  complaint.resolved = !complaint.resolved;
  complaint.status = complaint.resolved ? 'Solved' : 'Open';
  setStoredData(data);
  renderAllSubmissions();
  updateAdminStats();
  if (typeof window.renderReportSummaryTable === 'function') {
    window.renderReportSummaryTable();
  }
}

function updateComplaintStatus(id, newStatus) {
  const data = getStoredData();
  const complaint = data.complaints.find((item) => item.id === id);
  if (!complaint) return;

  if (newStatus === 'Solved') {
    complaint.resolved = true;
    complaint.status = 'Solved';
  } else if (newStatus === 'Investigating') {
    complaint.resolved = false;
    complaint.status = 'Investigating';
  } else {
    complaint.resolved = false;
    complaint.status = 'Open';
  }

  setStoredData(data);
  renderAllSubmissions();
  updateAdminStats();
  if (typeof window.renderReportSummaryTable === 'function') {
    window.renderReportSummaryTable();
  }
}
window.updateComplaintStatus = updateComplaintStatus;

function renderStudentHistory() {
  const historyContainer = document.getElementById('studentHistory');
  if (!historyContainer) return;
  const currentUser = sessionStorage.getItem('loggedInUser');
  const data = getStoredData();
  const entries = data.complaints.filter((item) => item.role === 'Student' && item.owner === currentUser);

  if (!entries.length) {
    historyContainer.innerHTML = '<p class="muted-text">No submissions yet. Submit your first feedback or complaint above.</p>';
    return;
  }

  historyContainer.innerHTML = entries
    .map(
      (item) => {
        const isOpen = !item.resolved && item.status !== 'Investigating';
        const isInvestigating = item.status === 'Investigating';
        const isResolved = item.resolved;

        return `
          <div class="history-item ${isResolved ? 'solved' : ''}" style="margin-bottom: 1.5rem;">
            <div style="display: flex; justify-content: space-between; align-items: flex-start; flex-wrap: wrap; gap: 0.5rem;">
              <div>
                <strong style="font-size: 1.1rem; color: var(--text);">${item.type}: ${item.subject}</strong>
                <span class="muted-text" style="font-size: 0.85rem; display: block; margin-top: 0.15rem;">Target: ${item.target || 'General'}</span>
              </div>
              <small class="muted-text">${item.date}</small>
            </div>
            <p style="margin: 0.75rem 0 1.25rem; line-height: 1.6; color: var(--text); opacity: 0.9;">${item.message}</p>
            
            <div class="timeline-pipeline">
              <div class="timeline-step active">
                <div class="step-icon">✓</div>
                <span>Submitted</span>
              </div>
              <div class="timeline-step ${isInvestigating || isResolved ? 'active' : ''}">
                <div class="step-icon">${isInvestigating || isResolved ? '✓' : '2'}</div>
                <span>Under Review</span>
              </div>
              <div class="timeline-step ${isResolved ? 'active' : ''}">
                <div class="step-icon">${isResolved ? '✓' : '3'}</div>
                <span>Resolved</span>
              </div>
            </div>
          </div>
        `;
      }
    )
    .join('');
}

function formatTargetDisplay(target) {
  if (!target) return '<span class="muted-text">General</span>';

  if (target.startsWith('Subject Teacher:')) {
    const name = target.replace('Subject Teacher:', '').trim();
    const profiles = getStoredProfiles();
    const match = (profiles.teachers || []).find(t => t.name.toLowerCase() === name.toLowerCase());

    const photoHtml = match && match.photo
      ? `<img src="${match.photo}" style="width: 32px; height: 32px; border-radius: 50%; object-fit: cover; border: 1px solid var(--border);" alt="${name}" />`
      : `<div style="width: 32px; height: 32px; border-radius: 50%; display: grid; place-items: center; background: linear-gradient(135deg, var(--primary), var(--accent)); color: white; font-size: 0.8rem; font-weight: 700;">T</div>`;

    return `
      <span style="display: inline-flex; align-items: center; gap: 0.6rem;">
        ${photoHtml}
        <div>
          <strong style="font-size: 0.95rem; display: block; line-height: 1.2;">${name}</strong>
          <span class="muted-text" style="font-size: 0.75rem; display: block; opacity: 0.8; margin-top: 0.1rem;">Subject Teacher</span>
        </div>
      </span>
    `;
  }

  if (target.startsWith('Faculty:')) {
    const name = target.replace('Faculty:', '').trim();
    const profiles = getStoredProfiles();
    const match = (profiles.faculty || []).find(f => f.name.toLowerCase() === name.toLowerCase());

    const photoHtml = match && match.photo
      ? `<img src="${match.photo}" style="width: 32px; height: 32px; border-radius: 50%; object-fit: cover; border: 1px solid var(--border);" alt="${name}" />`
      : `<div style="width: 32px; height: 32px; border-radius: 50%; display: grid; place-items: center; background: linear-gradient(135deg, var(--primary), var(--accent)); color: white; font-size: 0.8rem; font-weight: 700;">F</div>`;

    return `
      <span style="display: inline-flex; align-items: center; gap: 0.6rem;">
        ${photoHtml}
        <div>
          <strong style="font-size: 0.95rem; display: block; line-height: 1.2;">${name}</strong>
          <span class="muted-text" style="font-size: 0.75rem; display: block; opacity: 0.8; margin-top: 0.1rem;">Faculty Member</span>
        </div>
      </span>
    `;
  }

  if (target.startsWith('Hostel:')) {
    const issue = target.replace('Hostel:', '').trim();
    return `
      <span style="display: inline-flex; align-items: center; gap: 0.6rem;">
        <div style="width: 32px; height: 32px; border-radius: 50%; display: grid; place-items: center; background: rgba(16, 185, 129, 0.1); color: var(--accent); font-size: 0.9rem;">🏢</div>
        <div>
          <strong style="font-size: 0.95rem; display: block; line-height: 1.2;">${issue}</strong>
          <span class="muted-text" style="font-size: 0.75rem; display: block; opacity: 0.8; margin-top: 0.1rem;">Hostel & Mess</span>
        </div>
      </span>
    `;
  }

  if (target === 'Faculty') {
    return `<span style="display: inline-flex; align-items: center; gap: 0.35rem;"><span style="font-size: 1.1rem;">🏛️</span> <strong>Faculty</strong></span>`;
  }
  if (target === 'Hostel') {
    return `<span style="display: inline-flex; align-items: center; gap: 0.35rem;"><span style="font-size: 1.1rem;">🏢</span> <strong>Hostel</strong></span>`;
  }
  if (target === 'Campus') {
    return `<span style="display: inline-flex; align-items: center; gap: 0.35rem;"><span style="font-size: 1.1rem;">🌳</span> <strong>Campus</strong></span>`;
  }
  return target;
}

function renderCategorySummary() {
  const container = document.getElementById('categorySummaryContainer');
  if (!container) return;

  if (adminCategoryFilter === 'All' || adminCategoryFilter === 'Hostel') {
    container.style.display = 'none';
    container.innerHTML = '';
    return;
  }

  container.style.display = 'block';
  const data = getStoredData();
  const profiles = getStoredProfiles();

  let list = [];
  let categoryLabel = '';

  if (adminCategoryFilter === 'Subject Teacher') {
    list = profiles.teachers || [];
    categoryLabel = 'Subject Teachers';
  } else if (adminCategoryFilter === 'Faculty') {
    list = profiles.faculty || [];
    categoryLabel = 'Faculty Members';
  }

  // Count complaints for each profile
  const summaryData = list.map(item => {
    const count = data.complaints.filter(c => {
      const targetStr = (c.target || '').toLowerCase();
      return targetStr.includes(item.name.toLowerCase());
    }).length;
    return { ...item, count };
  });

  // Render cards
  const activeClass = (name) => adminSubFilter === name ? 'style="border: 2px solid var(--primary); box-shadow: 0 8px 20px rgba(37,99,235,0.15); font-weight: 600;"' : '';

  const headerHtml = `
    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem;">
      <h3 style="margin: 0; font-size: 1.15rem; font-weight: 700;">${categoryLabel} Complaint Counts</h3>
      ${adminSubFilter ? `<button class="button secondary small" style="padding: 0.4rem 0.85rem;" onclick="clearAdminSubFilter()">Show All ${categoryLabel}</button>` : ''}
    </div>
  `;

  const cardsHtml = summaryData.map(item => {
    const badgeColor = item.count === 0 ? 'var(--accent)' : (item.count < 3 ? '#f59e0b' : '#dc2626');
    const badgeBg = item.count === 0 ? 'rgba(16, 185, 129, 0.1)' : (item.count < 3 ? 'rgba(245, 158, 11, 0.1)' : 'rgba(239, 68, 68, 0.1)');

    return `
      <div class="card-glass" ${activeClass(item.name)} style="padding: 1.1rem; border-radius: 1.25rem; display: flex; flex-direction: column; justify-content: space-between; gap: 0.75rem; cursor: pointer; transition: transform 0.2s ease, box-shadow 0.2s ease; background: var(--surface-strong);" onclick="setAdminSubFilter('${item.name}')">
        <div style="display: flex; gap: 0.85rem; align-items: center; overflow: hidden;">
          ${item.photo
        ? `<img src="${item.photo}" style="width: 44px; height: 44px; min-width: 44px; border-radius: 1rem; object-fit: cover; border: 1px solid var(--border);" alt="${item.name}" />`
        : `<div style="width: 44px; height: 44px; min-width: 44px; border-radius: 1rem; display: grid; place-items: center; background: linear-gradient(135deg, var(--primary), var(--accent)); color: white; font-weight: 700; font-size: 1rem;">${item.initials || getInitials(item.name)}</div>`
      }
          <div style="overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">
            <strong style="font-size: 1rem; display: block; overflow: hidden; text-overflow: ellipsis; margin-bottom: 0.15rem;">${item.name}</strong>
            <span class="muted-text" style="font-size: 0.8rem; overflow: hidden; text-overflow: ellipsis; display: block;">${item.role}</span>
          </div>
        </div>
        <div style="display: flex; justify-content: space-between; align-items: center; border-top: 1px solid var(--border); padding-top: 0.75rem;">
          <span style="font-size: 0.85rem; color: var(--muted);">Complaints</span>
          <span style="padding: 0.25rem 0.65rem; border-radius: 999px; font-weight: 700; font-size: 0.85rem; color: ${badgeColor}; background: ${badgeBg};">
            ${item.count}
          </span>
        </div>
      </div>
    `;
  }).join('');

  container.innerHTML = `
    ${headerHtml}
    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 1.25rem;">
      ${cardsHtml}
    </div>
  `;
}

function setAdminSubFilter(name) {
  adminSubFilter = name;
  renderCategorySummary();
  renderAllSubmissions();
}
window.setAdminSubFilter = setAdminSubFilter;

function clearAdminSubFilter() {
  adminSubFilter = '';
  renderCategorySummary();
  renderAllSubmissions();
}
window.clearAdminSubFilter = clearAdminSubFilter;

function renderAllSubmissions() {
  const tableBody = document.querySelector('#allSubmissionsTable tbody');
  const data = getStoredData();
  const filterText = adminSearch.trim().toLowerCase();

  // Populate category summary dashboard
  renderCategorySummary();

  let items = data.complaints;
  if (adminFilter === 'Open') {
    items = items.filter((item) => !item.resolved);
  } else if (adminFilter === 'Solved') {
    items = items.filter((item) => item.resolved);
  }

  // Apply Category Filter
  if (adminCategoryFilter !== 'All') {
    items = items.filter((item) => {
      const targetStr = (item.target || '').toLowerCase();
      const platformStr = (item.platform || '').toLowerCase();
      const categoryFilterLower = adminCategoryFilter.toLowerCase();

      if (adminCategoryFilter === 'Subject Teacher') {
        if (targetStr.includes('subject teacher')) return true;
        const profiles = getStoredProfiles();
        const teachers = profiles.teachers || [];
        return teachers.some(t => targetStr.includes(t.name.toLowerCase()));
      }

      if (adminCategoryFilter === 'Faculty') {
        if (targetStr.includes('faculty')) return true;
        const profiles = getStoredProfiles();
        const faculty = profiles.faculty || [];
        return faculty.some(f => targetStr.includes(f.name.toLowerCase()));
      }

      if (adminCategoryFilter === 'Hostel') {
        return targetStr.includes('hostel') || platformStr.includes('hostel');
      }

      return targetStr.includes(categoryFilterLower) || platformStr.includes(categoryFilterLower);
    });
  }

  // Apply Sub-Filter (specific teacher/faculty)
  if (adminSubFilter) {
    items = items.filter((item) => {
      const targetStr = (item.target || '').toLowerCase();
      return targetStr.includes(adminSubFilter.toLowerCase());
    });
  }

  if (filterText) {
    items = items.filter((item) => {
      const value = `${item.id} ${item.role} ${item.type} ${item.target || ''} ${item.subject} ${item.owner} ${item.date}`.toLowerCase();
      return value.includes(filterText);
    });
  }

  if (!items.length) {
    if (tableBody) {
      tableBody.innerHTML = '<tr><td colspan="9">No matches found for this search or filter.</td></tr>';
    }
    return;
  }

  if (tableBody) {
    tableBody.innerHTML = items
      .map(
        (item) => `
          <tr class="${item.resolved ? 'solved' : ''}">
            <td>${item.id}</td>
            <td>${item.role}</td>
            <td>${item.type}</td>
            <td>${formatTargetDisplay(item.target)}</td>
            <td>${item.subject}</td>
            <td>${item.owner}</td>
            <td>${item.date}</td>
            <td>
              <span class="status-badge ${item.resolved ? 'solved' : (item.status === 'Investigating' ? 'investigating' : 'open')}">
                ${item.resolved ? 'Solved' : (item.status === 'Investigating' ? 'Investigating' : 'Open')}
              </span>
            </td>
            <td>
              <select class="button secondary small" style="padding: 0.45rem 0.8rem; height: auto; border: 1px solid var(--border); background: var(--surface-strong); color: var(--text); cursor: pointer;" onchange="updateComplaintStatus('${item.id}', this.value)">
                <option value="Open" ${(!item.resolved && item.status !== 'Investigating') ? 'selected' : ''}>Open</option>
                <option value="Investigating" ${(item.status === 'Investigating') ? 'selected' : ''}>Investigating</option>
                <option value="Solved" ${item.resolved ? 'selected' : ''}>Solved</option>
              </select>
              <button class="button secondary small delete-profile-button" onclick="deleteComplaint('${item.id}')">Delete</button>
            </td>
          </tr>
        `
      )
      .join('');
  }
}

function resetStudentPassword(usn) {
  const newPassword = prompt('Enter a new password for ' + usn + ':');
  if (!newPassword) return;

  const data = getStoredData();
  const student = data.students.find((item) => item.usn === usn);
  if (!student) return;

  student.password = newPassword;
  setStoredData(data);
  renderStudentList();
  alert('Password updated successfully.');
}

function renderStudentList() {
  const tbody = document.querySelector('#studentTable tbody');
  if (!tbody) return;
  const data = getStoredData();

  if (!data.students.length) {
    tbody.innerHTML = '<tr><td colspan="3">No student accounts added yet.</td></tr>';
    return;
  }

  tbody.innerHTML = data.students
    .map(
      (student) => `
          <tr>
            <td>${student.usn}</td>
            <td>${student.password}</td>
            <td>
              <button class="button secondary small" onclick="resetStudentPassword('${student.usn}')">Reset</button>
              <button class="button secondary small" onclick="deleteStudent('${student.usn}')">Delete</button>
            </td>
          </tr>
        `
    )
    .join('');
}

function arrayToCSV(rows, headers) {
  const esc = (v) => '"' + String(v ?? '').replace(/"/g, '""') + '"';
  const headerLine = headers.map(esc).join(',') + '\n';
  const lines = rows.map((r) => headers.map((h) => esc(r[h])).join(',')).join('\n');
  return headerLine + lines;
}

function downloadCSV(filename, csv) {
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

function exportStudentsCSV() {
  const data = getStoredData();
  const rows = data.students.map((s) => ({ usn: s.usn, password: s.password }));
  const csv = arrayToCSV(rows, ['usn', 'password']);
  downloadCSV('students.csv', csv);
}

function exportAllCSV() {
  const data = getStoredData();
  const rows = data.complaints.map((c) => ({ id: c.id, role: c.role, type: c.type, target: c.target, subject: c.subject, owner: c.owner, date: c.date, solved: c.resolved ? 'Solved' : 'Open', message: c.message }));
  const csv = arrayToCSV(rows, ['id', 'role', 'type', 'target', 'subject', 'owner', 'date', 'solved', 'message']);
  downloadCSV('all_feedback.csv', csv);
}

function renderReportSummaryTable() {
  const tbody = document.querySelector('#reportsSummaryTable tbody');
  if (!tbody) return;

  const data = getStoredData();
  const profiles = getStoredProfiles();
  const searchInput = document.getElementById('reportSummarySearch');
  const query = searchInput ? searchInput.value.toLowerCase().trim() : '';

  const teachers = (profiles.teachers || []).map(t => ({ ...t, category: 'Subject Teacher' }));
  const faculty = (profiles.faculty || []).map(f => ({ ...f, category: 'Faculty' }));
  const allProfiles = [...teachers, ...faculty];

  const complaints = data.complaints || [];

  const processed = allProfiles.map(profile => {
    const matchedComplaints = complaints.filter(c => {
      const targetStr = (c.target || '').toLowerCase();
      return targetStr.includes(profile.name.toLowerCase());
    });

    const openCount = matchedComplaints.filter(c => !c.resolved && c.status !== 'Investigating').length;
    const investigatingCount = matchedComplaints.filter(c => c.status === 'Investigating').length;
    const solvedCount = matchedComplaints.filter(c => c.resolved).length;
    const totalCount = matchedComplaints.length;

    return {
      ...profile,
      openCount,
      investigatingCount,
      solvedCount,
      totalCount
    };
  });

  // Filter based on search query
  const filtered = processed.filter(p => {
    return p.name.toLowerCase().includes(query) ||
      p.role.toLowerCase().includes(query) ||
      p.category.toLowerCase().includes(query);
  });

  if (!filtered.length) {
    tbody.innerHTML = '<tr><td colspan="8" style="text-align: center; color: var(--muted); padding: 2rem;">No teacher or faculty profiles found matching your search.</td></tr>';
    return;
  }

  tbody.innerHTML = filtered.map(p => {
    const initials = p.initials || getInitials(p.name);
    const avatarHtml = p.photo
      ? `<img src="${p.photo}" style="width: 40px; height: 40px; border-radius: 50%; object-fit: cover; border: 1px solid var(--border);" alt="${p.name}" />`
      : `<div style="width: 40px; height: 40px; border-radius: 50%; display: grid; place-items: center; background: linear-gradient(135deg, var(--primary), var(--accent)); color: white; font-size: 0.85rem; font-weight: 700;">${initials}</div>`;

    const openBadge = p.openCount > 0
      ? `<span class="status-badge open">${p.openCount}</span>`
      : `<span class="status-badge solved" style="opacity: 0.4;">0</span>`;

    const investigatingBadge = p.investigatingCount > 0
      ? `<span class="status-badge investigating">${p.investigatingCount}</span>`
      : `<span class="status-badge solved" style="opacity: 0.4;">0</span>`;

    const solvedBadge = p.solvedCount > 0
      ? `<span class="status-badge solved">${p.solvedCount}</span>`
      : `<span class="status-badge solved" style="opacity: 0.4;">0</span>`;

    return `
      <tr>
        <td>${avatarHtml}</td>
        <td><strong>${p.name}</strong></td>
        <td><span class="platform-tag" style="margin-bottom: 0; font-size: 0.8rem; padding: 0.25rem 0.65rem;">${p.category}</span></td>
        <td>${p.role}</td>
        <td>${openBadge}</td>
        <td>${investigatingBadge}</td>
        <td>${solvedBadge}</td>
        <td><strong>${p.totalCount}</strong></td>
      </tr>
    `;
  }).join('');
}
window.renderReportSummaryTable = renderReportSummaryTable;
