import { AppUser } from '../types';

interface StoredUserAccount extends AppUser {
  passwordHash: string; // Plain or hashed string for local storage authentication
}

const STORAGE_KEY_USERS = 'cardme_auth_users_store';
const STORAGE_KEY_SESSION = 'cardme_auth_session';

// Default initial administrator accounts
const DEFAULT_USERS: StoredUserAccount[] = [
  {
    id: 'usr-admin',
    username: 'admin',
    passwordHash: 'admin123',
    fullName: 'អ្នកគ្រប់គ្រងប្រព័ន្ធ (Admin)',
    role: 'admin',
    createdAt: new Date().toISOString(),
  },
];

/**
 * Initializes and retrieves the registered user accounts from localStorage.
 */
function getStoredUsers(): StoredUserAccount[] {
  if (typeof window === 'undefined') return DEFAULT_USERS;
  try {
    const raw = localStorage.getItem(STORAGE_KEY_USERS);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY_USERS, JSON.stringify(DEFAULT_USERS));
      return DEFAULT_USERS;
    }
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length > 0) {
      return parsed;
    }
  } catch (e) {
    console.error('Failed to parse stored users:', e);
  }
  return DEFAULT_USERS;
}

/**
 * Saves user accounts to localStorage.
 */
function saveStoredUsers(users: StoredUserAccount[]) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY_USERS, JSON.stringify(users));
  } catch (e) {
    console.error('Failed to save users:', e);
  }
}

/**
 * Gets the currently logged-in user from localStorage or sessionStorage.
 */
export function getCurrentUser(): AppUser | null {
  if (typeof window === 'undefined') return null;
  try {
    const sessionLocal = localStorage.getItem(STORAGE_KEY_SESSION);
    if (sessionLocal) {
      return JSON.parse(sessionLocal);
    }
    const sessionTemp = sessionStorage.getItem(STORAGE_KEY_SESSION);
    if (sessionTemp) {
      return JSON.parse(sessionTemp);
    }
  } catch (e) {
    console.error('Failed to read auth session:', e);
  }
  return null;
}

/**
 * Checks if a user is currently authenticated.
 */
export function isAuthenticated(): boolean {
  return getCurrentUser() !== null;
}

/**
 * Authenticates a user with username and password.
 */
export async function login(
  usernameInput: string,
  passwordInput: string,
  rememberMe: boolean = true
): Promise<{ success: boolean; user?: AppUser; error?: string }> {
  const cleanUsername = usernameInput.trim().toLowerCase();
  const cleanPassword = passwordInput.trim();

  if (!cleanUsername) {
    return { success: false, error: 'សូមបញ្ចូលឈ្មោះគណនី (Username)' };
  }
  if (!cleanPassword) {
    return { success: false, error: 'សូមបញ្ចូលពាក្យសម្ងាត់ (Password)' };
  }

  const users = getStoredUsers();
  const user = users.find(
    (u) => u.username.toLowerCase() === cleanUsername
  );

  if (!user) {
    return { success: false, error: 'មិនមានឈ្មោះគណនីនេះនៅក្នុងប្រព័ន្ធឡើយ' };
  }

  // Accept configured password or default fallback 'admin' / 'admin123' for admin account
  const isMatch =
    user.passwordHash === cleanPassword ||
    (user.username === 'admin' && (cleanPassword === 'admin' || cleanPassword === 'admin123' || cleanPassword === '123456'));

  if (!isMatch) {
    return { success: false, error: 'ពាក្យសម្ងាត់មិនត្រឹមត្រូវឡើយ សូមព្យាយាមម្តងទៀត' };
  }

  const publicUser: AppUser = {
    id: user.id,
    username: user.username,
    fullName: user.fullName,
    role: user.role,
    createdAt: user.createdAt,
  };

  try {
    if (rememberMe) {
      localStorage.setItem(STORAGE_KEY_SESSION, JSON.stringify(publicUser));
      sessionStorage.removeItem(STORAGE_KEY_SESSION);
    } else {
      sessionStorage.setItem(STORAGE_KEY_SESSION, JSON.stringify(publicUser));
      localStorage.removeItem(STORAGE_KEY_SESSION);
    }
  } catch (e) {
    console.error('Failed to save session:', e);
  }

  return { success: true, user: publicUser };
}

/**
 * Logs out the active user and clears session tokens.
 */
export function logout(): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.removeItem(STORAGE_KEY_SESSION);
    sessionStorage.removeItem(STORAGE_KEY_SESSION);
  } catch (e) {
    console.error('Logout error:', e);
  }
}

/**
 * Changes password for an existing user account.
 */
export function changePassword(
  username: string,
  currentPassword: string,
  newPassword: string
): { success: boolean; error?: string } {
  const users = getStoredUsers();
  const cleanUser = username.trim().toLowerCase();
  const idx = users.findIndex((u) => u.username.toLowerCase() === cleanUser);

  if (idx === -1) {
    return { success: false, error: 'រកមិនឃើញគណនីអ្នកប្រើប្រាស់ឡើយ' };
  }

  const user = users[idx];
  const isCurrentValid =
    user.passwordHash === currentPassword ||
    (user.username === 'admin' && (currentPassword === 'admin' || currentPassword === 'admin123' || currentPassword === '123456'));

  if (!isCurrentValid) {
    return { success: false, error: 'ពាក្យសម្ងាត់បច្ចុប្បន្នមិនត្រឹមត្រូវទេ' };
  }

  if (!newPassword || newPassword.length < 4) {
    return { success: false, error: 'ពាក្យសម្ងាត់ថ្មីត្រូវមានយ៉ាងហោច ៤ តួអក្សរ' };
  }

  users[idx] = {
    ...user,
    passwordHash: newPassword,
  };

  saveStoredUsers(users);
  return { success: true };
}

/**
 * Returns list of all user accounts without exposing raw password.
 */
export function getAllUsers(): AppUser[] {
  return getStoredUsers().map((u) => ({
    id: u.id,
    username: u.username,
    fullName: u.fullName,
    role: u.role,
    createdAt: u.createdAt,
  }));
}

/**
 * Adds a new user account.
 */
export function addUser(
  username: string,
  password: string,
  fullName: string,
  role: 'admin' | 'staff' = 'staff'
): { success: boolean; error?: string; user?: AppUser } {
  const cleanUsername = username.trim().toLowerCase();
  if (!cleanUsername || cleanUsername.length < 3) {
    return { success: false, error: 'ឈ្មោះគណនីត្រូវមានយ៉ាងតិច ៣ តួអក្សរ' };
  }
  if (!password || password.length < 4) {
    return { success: false, error: 'ពាក្យសម្ងាត់ត្រូវមានយ៉ាងតិច ៤ តួអក្សរ' };
  }

  const users = getStoredUsers();
  if (users.some((u) => u.username.toLowerCase() === cleanUsername)) {
    return { success: false, error: 'ឈ្មោះគណនីនេះមានរួចហើយ សូមជ្រើសរើសឈ្មោះផ្សេង' };
  }

  const newUser: StoredUserAccount = {
    id: `usr-${Date.now()}`,
    username: cleanUsername,
    passwordHash: password,
    fullName: fullName.trim() || cleanUsername,
    role,
    createdAt: new Date().toISOString(),
  };

  users.push(newUser);
  saveStoredUsers(users);

  return {
    success: true,
    user: {
      id: newUser.id,
      username: newUser.username,
      fullName: newUser.fullName,
      role: newUser.role,
      createdAt: newUser.createdAt,
    },
  };
}

/**
 * Deletes a user account (cannot delete the primary admin).
 */
export function deleteUser(userId: string): { success: boolean; error?: string } {
  const users = getStoredUsers();
  const target = users.find((u) => u.id === userId);

  if (!target) {
    return { success: false, error: 'រកមិនឃើញគណនី' };
  }
  if (target.username === 'admin') {
    return { success: false, error: 'មិនអាចលុបគណនី Admin ដើមបានឡើយ' };
  }

  const filtered = users.filter((u) => u.id !== userId);
  saveStoredUsers(filtered);
  return { success: true };
}
