/**
 * BuildGuard AI - Platform Client Script
 * Complete Navigation Router & Interactive Capabilities for 7 screens
 */

// 1. PAGE ROUTING & NAVIGATION SYSTEM
const PAGES = ['login', 'dashboard', 'live-monitoring', 'alerts', 'sitemap', 'movement', 'wastage'];
let currentPage = 'login';
let isAuthenticated = false;
let currentAuthMode = 'signin'; // 'signin' | 'signup'

// Supabase Configuration
const SUPABASE_URL = 'https://nxrowkbzcsvfdsybkmyr.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im54cm93a2J6Y3N2ZmRzeWJrbXlyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODgxOTM1MDIsImV4cCI6MjEwMzc2OTUwMn0.sKuGQrYTeHWS6kOKqKORKohfOLLrpw7iHw5rXa4ZXTI';

let supabaseClient = null;
if (window.supabase && typeof window.supabase.createClient === 'function') {
  supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true
    }
  });
}

function updateUIForSession(session) {
  if (session && session.user) {
    isAuthenticated = true;
    const user = session.user;
    const fullName = user.user_metadata?.full_name || user.email?.split('@')[0] || 'Site Operator';
    const email = user.email || 'operator@buildguard.ai';
    const role = user.user_metadata?.role || 'Project Director';

    const headerName = document.getElementById('header-user-name');
    const headerRole = document.getElementById('header-user-role');
    const headerAvatar = document.getElementById('header-user-avatar');
    const dropName = document.getElementById('dropdown-user-name');
    const dropEmail = document.getElementById('dropdown-user-email');

    if (headerName) headerName.textContent = fullName;
    if (headerRole) headerRole.textContent = role;
    if (dropName) dropName.textContent = fullName;
    if (dropEmail) dropEmail.textContent = email;
    if (headerAvatar) {
      const initials = fullName.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() || 'BG';
      headerAvatar.textContent = initials;
    }
  } else {
    isAuthenticated = false;
  }
}

// Check session on load and register listener
async function initAuth() {
  if (!supabaseClient) return;
  try {
    const { data: { session } } = await supabaseClient.auth.getSession();
    if (session) {
      updateUIForSession(session);
      // Navigate to current hash or dashboard
      const hash = window.location.hash.replace('#', '');
      if (hash && PAGES.includes(hash) && hash !== 'login') {
        navigateTo(hash);
      } else {
        navigateTo('dashboard');
      }
    } else {
      navigateTo('login');
    }

    supabaseClient.auth.onAuthStateChange((_event, session) => {
      updateUIForSession(session);
      if (!session && currentPage !== 'login') {
        navigateTo('login');
      }
    });
  } catch (err) {
    navigateTo('login');
  }
}

function navigateTo(pageId) {
  if (!PAGES.includes(pageId)) return;

  // Protected Pages Guard: non-authenticated users cannot access dashboard or monitoring pages
  if (!isAuthenticated && pageId !== 'login') {
    pageId = 'login';
  }

  currentPage = pageId;

  // Toggle page visibility
  PAGES.forEach(p => {
    const el = document.getElementById(`page-${p}`);
    if (el) {
      if (p === pageId) {
        el.classList.remove('hidden');
      } else {
        el.classList.add('hidden');
      }
    }
  });

  // Toggle Global App Header (visible for all authenticated screens except login)
  const appHeader = document.getElementById('global-app-header');
  if (appHeader) {
    if (pageId === 'login') {
      appHeader.classList.add('hidden');
    } else {
      appHeader.classList.remove('hidden');
    }
  }

  // Update Global Header Active Pill Styles
  const navItems = document.querySelectorAll('#global-nav .nav-item');
  navItems.forEach(item => {
    const path = item.getAttribute('data-path');
    if (path === pageId) {
      item.className = 'nav-item px-4 py-1.5 rounded-full text-white bg-[#15803d] shadow-sm transition-all text-sm font-semibold flex items-center gap-1.5';
    } else {
      item.className = 'nav-item px-3.5 py-1.5 rounded-full text-on-surface-variant hover:text-on-surface hover:bg-surface-container transition-all text-sm font-medium flex items-center gap-1.5';
    }
  });

  // Scroll to top
  window.scrollTo({ top: 0, behavior: 'smooth' });

  // Page specific re-initializations
  if (pageId === 'sitemap') {
    setTimeout(fitBlueprint, 50);
  } else if (pageId === 'live-monitoring') {
    updateSurveillanceClocks();
  }

  // Update URL hash without reload
  try {
    history.replaceState(null, '', `#${pageId}`);
  } catch (e) {}
}

// Global Toast Banner Helper
function showGlobalToast(message, icon = 'info', title = 'BuildGuard AI System') {
  const toast = document.getElementById('global-toast');
  const titleEl = document.getElementById('global-toast-title');
  const msgEl = document.getElementById('global-toast-msg');
  const iconEl = document.getElementById('global-toast-icon');

  if (!toast || !msgEl || !iconEl) return;

  if (titleEl) titleEl.textContent = title;
  msgEl.textContent = message;
  iconEl.textContent = icon;

  toast.classList.remove('translate-y-16', 'opacity-0');
  toast.classList.add('translate-y-0', 'opacity-100');

  setTimeout(() => {
    toast.classList.remove('translate-y-0', 'opacity-100');
    toast.classList.add('translate-y-16', 'opacity-0');
  }, 3200);
}

// User Menu Dropdown Toggle
function toggleUserMenu() {
  const menu = document.getElementById('user-profile-menu');
  if (menu) menu.classList.toggle('hidden');
}

async function logoutUser() {
  const menu = document.getElementById('user-profile-menu');
  if (menu) menu.classList.add('hidden');

  if (supabaseClient) {
    try {
      await supabaseClient.auth.signOut();
    } catch (e) {}
  }
  isAuthenticated = false;
  showGlobalToast('Signed out successfully. Session closed.', 'lock');
  navigateTo('login');
}

// -------------------------------------------------------------
// 2. LOGIN / SIGNUP SCREEN INTERACTIVITY & SUPABASE AUTH
// -------------------------------------------------------------
function switchAuthMode(mode) {
  currentAuthMode = mode;
  const tabSignIn = document.getElementById('auth-tab-signin');
  const tabSignUp = document.getElementById('auth-tab-signup');
  const authTitle = document.getElementById('auth-title');
  const authSubtitle = document.getElementById('auth-subtitle');
  const nameContainer = document.getElementById('fullname-field-container');
  const nameInput = document.getElementById('work-name');
  const btnText = document.getElementById('submit-btn-text');
  const rememberRow = document.getElementById('remember-forgot-row');
  const errorBox = document.getElementById('auth-error-box');

  if (errorBox) errorBox.classList.add('hidden');

  if (mode === 'signup') {
    if (tabSignUp) {
      tabSignUp.className = 'flex-1 py-2 rounded-lg text-xs font-bold transition-all text-center bg-surface-container-lowest text-primary shadow-xs';
    }
    if (tabSignIn) {
      tabSignIn.className = 'flex-1 py-2 rounded-lg text-xs font-semibold transition-all text-center text-on-surface-variant hover:text-on-surface';
    }
    if (authTitle) authTitle.textContent = 'Create Site Account';
    if (authSubtitle) authSubtitle.textContent = 'Register authorized personnel for surveillance portal';
    if (nameContainer) nameContainer.style.display = 'block';
    if (nameInput) nameInput.required = true;
    if (btnText) btnText.textContent = 'Register Site Account';
    if (rememberRow) rememberRow.classList.add('hidden');
  } else {
    if (tabSignIn) {
      tabSignIn.className = 'flex-1 py-2 rounded-lg text-xs font-bold transition-all text-center bg-surface-container-lowest text-primary shadow-xs';
    }
    if (tabSignUp) {
      tabSignUp.className = 'flex-1 py-2 rounded-lg text-xs font-semibold transition-all text-center text-on-surface-variant hover:text-on-surface';
    }
    if (authTitle) authTitle.textContent = 'Sign In to Site Portal';
    if (authSubtitle) authSubtitle.textContent = 'Access verified live telemetry and CCTV streams';
    if (nameContainer) nameContainer.style.display = 'none';
    if (nameInput) nameInput.required = false;
    if (btnText) btnText.textContent = 'Sign In to Dashboard';
    if (rememberRow) rememberRow.classList.remove('hidden');
  }
}

function togglePasswordVisibility() { 
  const pwdInput = document.getElementById('password-input'); 
  const eyeIcon = document.getElementById('eye-icon'); 
  if (!pwdInput || !eyeIcon) return; 
  if (pwdInput.type === 'password') { 
    pwdInput.type = 'text'; 
    eyeIcon.textContent = 'visibility_off'; 
  } else { 
    pwdInput.type = 'password'; 
    eyeIcon.textContent = 'visibility'; 
  } 
} 

function showAuthError(message = 'Login ID ya password galat hai.') {
  const errorBox = document.getElementById('auth-error-box');
  const errorText = document.getElementById('auth-error-text');
  if (errorBox && errorText) {
    errorText.textContent = message;
    errorBox.classList.remove('hidden');
  }
}

function hideAuthError() {
  const errorBox = document.getElementById('auth-error-box');
  if (errorBox) errorBox.classList.add('hidden');
}

async function handleSignInSubmit() { 
  const emailInput = document.getElementById('work-email');
  const pwdInput = document.getElementById('password-input');
  const nameInput = document.getElementById('work-name');
  const btn = document.getElementById('submit-btn'); 
  const btnText = document.getElementById('submit-btn-text'); 
  const btnIcon = document.getElementById('submit-btn-icon'); 

  if (!btn || !emailInput || !pwdInput) return; 

  const email = emailInput.value.trim();
  const password = pwdInput.value;
  const fullName = nameInput ? nameInput.value.trim() : '';

  hideAuthError();

  if (!email || !password) {
    showAuthError('Login ID aur password enter karein.');
    return;
  }

  btn.disabled = true; 
  if (btnText) btnText.textContent = currentAuthMode === 'signup' ? 'Creating account...' : 'Authenticating site link...'; 
  if (btnIcon) {
    btnIcon.textContent = 'progress_activity'; 
    btnIcon.classList.add('animate-spin'); 
  }

  try {
    if (!supabaseClient) {
      throw new Error('Supabase client not initialized');
    }

    if (currentAuthMode === 'signup') {
      // Secure signup with salted hash handled directly by Supabase Auth (bcrypt)
      const { data, error } = await supabaseClient.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName || email.split('@')[0],
            role: 'Site Supervisor'
          }
        }
      });

      if (error) {
        showAuthError(error.message || 'Signup failed. Please try again.');
        resetSubmitBtn();
        return;
      }

      if (data?.session) {
        // Immediate login if email confirmation is disabled
        updateUIForSession(data.session);
        onAuthSuccess('Account created and authorized successfully!');
      } else {
        // Confirmation required
        showGlobalToast('Account created! Check email if verification is required.', 'mark_email_read');
        switchAuthMode('signin');
        resetSubmitBtn();
      }
    } else {
      // Sign In with Supabase Auth
      const { data, error } = await supabaseClient.auth.signInWithPassword({
        email,
        password
      });

      if (error || !data?.session) {
        // Mandatory requirement: generic security error message
        showAuthError('Login ID ya password galat hai.');
        resetSubmitBtn();
        return;
      }

      updateUIForSession(data.session);
      onAuthSuccess('Authorized • Entering Site');
    }
  } catch (err) {
    showAuthError('Login ID ya password galat hai.');
    resetSubmitBtn();
  }

  function resetSubmitBtn() {
    btn.disabled = false;
    if (btnText) btnText.textContent = currentAuthMode === 'signup' ? 'Register Site Account' : 'Sign In to Dashboard';
    if (btnIcon) {
      btnIcon.classList.remove('animate-spin');
      btnIcon.textContent = 'arrow_forward';
    }
    btn.classList.remove('bg-primary-container');
    btn.classList.add('bg-primary');
  }

  function onAuthSuccess(successMsg) {
    if (btnText) btnText.textContent = successMsg; 
    if (btnIcon) { 
      btnIcon.classList.remove('animate-spin'); 
      btnIcon.textContent = 'check_circle'; 
    } 
    btn.classList.remove('bg-primary'); 
    btn.classList.add('bg-primary-container'); 

    setTimeout(() => {
      resetSubmitBtn();
      navigateTo('dashboard');
      showGlobalToast('Authentication successful. Welcome to BuildGuard AI.', 'verified_user');
    }, 600);
  }
}

function handleGoogleSignIn() {
  if (supabaseClient) {
    supabaseClient.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: window.location.origin + window.location.pathname
      }
    }).catch(() => {
      showAuthError('Google sign in is currently unavailable.');
    });
  }
}

// -------------------------------------------------------------
// 3. LIVE MONITORING CAMERA SYSTEM
// -------------------------------------------------------------
const cameraFeeds = {
  "cam-01": {
    code: "CAM-01",
    title: "Main Entrance & Inbound Gate",
    location: "North Gate Perimeter",
    nodeLabel: "Gateway Node • Residential Tower A",
    resolution: "1080p 30fps",
    bandwidth: "4.2 Mbps",
    aiStatus: "AI Edge Inspection Online",
    syncStatus: "Stream Sync OK (30 FPS)",
    ptzStatus: "PTZ Pan: 42° Tilt: -12°",
    bgUrl: "assets/img/live_monitoring_0.jpg",
    overlaysHtml: `
      <div class="absolute top-1/4 left-1/3 w-72 h-44 border-2 border-secondary-container/90 rounded bg-secondary/10 pointer-events-none z-10 flex flex-col justify-between p-1.5 shadow-lg">
        <div class="flex items-center justify-between bg-on-secondary-fixed/90 px-1.5 py-0.5 rounded text-white font-data-tabular text-label-sm">
          <span class="font-bold flex items-center gap-1">
            <span class="w-1.5 h-1.5 rounded-full bg-secondary-container"></span>
            [Truck MH-12-BQ]
          </span>
          <span class="text-secondary-fixed font-semibold">Inbound Verified</span>
        </div>
        <div class="self-end bg-inverse-surface/90 text-on-primary-container px-2 py-0.5 rounded font-label-sm text-label-sm flex items-center gap-1">
          <span class="material-symbols-outlined text-[12px] text-primary-fixed">verified</span>
          RFID #8849-OK
        </div>
      </div>
      <div class="absolute bottom-1/4 right-1/4 w-48 h-32 border-2 border-primary-fixed/80 rounded bg-primary/10 pointer-events-none z-10 flex flex-col justify-between p-1.5">
        <div class="bg-on-primary-fixed/90 px-1.5 py-0.5 rounded text-white font-data-tabular text-label-sm flex items-center justify-between">
          <span class="font-semibold">[Cement Pallet: 100 bags]</span>
          <span class="text-primary-fixed">98% match</span>
        </div>
        <div class="bg-inverse-surface/85 text-surface-container-highest px-1.5 py-0.5 rounded font-label-sm text-label-sm">
          Weight: 5.0 MT Normal
        </div>
      </div>
    `
  },
  "cam-02": {
    code: "CAM-02",
    title: "Material Storage Yard (Cement & Chemicals)",
    location: "Covered Shed Zone C",
    nodeLabel: "Node MUM-02 • Central Logistics",
    resolution: "1080p 30fps",
    bandwidth: "3.8 Mbps",
    aiStatus: "AI Stockpile & PPE Scan Active",
    syncStatus: "Stream Sync OK (30 FPS)",
    ptzStatus: "PTZ Pan: 118° Tilt: -28°",
    bgUrl: "https://images.unsplash.com/photo-1541888946425-d0fbb18615f3?auto=format&fit=crop&w=1600&q=80",
    overlaysHtml: `
      <div class="absolute top-1/4 left-1/4 w-64 h-40 border-2 border-primary-fixed/90 rounded bg-primary/10 pointer-events-none z-10 flex flex-col justify-between p-2 shadow-lg">
        <div class="flex items-center justify-between bg-inverse-surface/90 px-2 py-0.5 rounded text-white font-data-tabular text-label-sm">
          <span class="font-bold flex items-center gap-1">
            <span class="w-1.5 h-1.5 rounded-full bg-primary-fixed"></span>
            [Cement Stack: 420 Bags]
          </span>
          <span class="text-primary-fixed font-semibold">Tarp Protected</span>
        </div>
        <div class="bg-inverse-surface/85 text-surface-container-highest px-1.5 py-0.5 rounded font-label-sm text-label-sm self-start">
          Grade 53 OPC • In Stock
        </div>
      </div>
      <div class="absolute bottom-1/3 right-1/3 w-56 h-36 border-2 border-secondary-container/90 rounded bg-secondary/15 pointer-events-none z-10 flex flex-col justify-between p-2">
        <div class="flex items-center justify-between bg-inverse-surface/90 px-2 py-0.5 rounded text-white font-data-tabular text-label-sm">
          <span class="font-semibold flex items-center gap-1">
            <span class="material-symbols-outlined text-[13px] text-secondary-container">shield</span>
            [PPE Detection: OK]
          </span>
        </div>
        <div class="bg-inverse-surface/85 text-surface-container-highest px-1.5 py-0.5 rounded font-label-sm text-label-sm">
          2 Handlers • Helmets & Gloves Verified
        </div>
      </div>
    `
  },
  "cam-03": {
    code: "CAM-03",
    title: "Work Zone Deck & Crane Loading",
    location: "Tower A Core - Floor 4",
    nodeLabel: "Node MUM-03 • Core Structure Mast",
    resolution: "1080p 25fps",
    bandwidth: "4.0 Mbps",
    aiStatus: "AI Crane Hoist & Fall Hazard Active",
    syncStatus: "Stream Sync OK (25 FPS)",
    ptzStatus: "PTZ Pan: 240° Tilt: +15°",
    bgUrl: "https://images.unsplash.com/photo-1504307651254-35680f356dfd?auto=format&fit=crop&w=1600&q=80",
    overlaysHtml: `
      <div class="absolute top-1/5 right-1/4 w-72 h-48 border-2 border-primary-container rounded bg-primary-container/15 pointer-events-none z-10 flex flex-col justify-between p-2 shadow-lg">
        <div class="flex items-center justify-between bg-inverse-surface/90 px-2 py-0.5 rounded text-white font-data-tabular text-label-sm">
          <span class="font-bold flex items-center gap-1">
            <span class="w-1.5 h-1.5 rounded-full bg-primary-container"></span>
            [Tower Crane #1 Hoist]
          </span>
          <span class="text-primary-fixed font-semibold">Load: 3.2 MT</span>
        </div>
        <div class="bg-inverse-surface/85 text-surface-container-highest px-2 py-0.5 rounded font-label-sm text-label-sm self-end">
          Slew Speed: 0.6 RPM • Wind: 8 kn
        </div>
      </div>
      <div class="absolute bottom-1/4 left-1/3 w-64 h-32 border-2 border-secondary-container/90 rounded bg-secondary/15 pointer-events-none z-10 flex flex-col justify-between p-1.5">
        <div class="bg-inverse-surface/90 px-2 py-0.5 rounded text-white font-data-tabular text-label-sm flex items-center justify-between">
          <span class="font-semibold">[Rebar Mesh Perimeter]</span>
          <span class="text-secondary-fixed">Floor 4 Deck</span>
        </div>
        <div class="bg-inverse-surface/85 text-surface-container-highest px-1.5 py-0.5 rounded font-label-sm text-label-sm">
          Safety Netting Verified Active
        </div>
      </div>
    `
  },
  "cam-04": {
    code: "CAM-04",
    title: "Rear Exit & Waste Gate",
    location: "South Perimeter Exit",
    nodeLabel: "Node MUM-04 • South Egress Checkpoint",
    resolution: "1080p 30fps",
    bandwidth: "4.5 Mbps",
    aiStatus: "AI Perimeter Intrusion & ANPR Ready",
    syncStatus: "Stream Sync OK (30 FPS)",
    ptzStatus: "PTZ Pan: 180° Tilt: -05°",
    bgUrl: "https://images.unsplash.com/photo-1590486803833-1c5dc8ddd4c8?auto=format&fit=crop&w=1600&q=80",
    overlaysHtml: `
      <div class="absolute top-1/3 left-1/4 w-80 h-44 border-2 border-error/90 rounded bg-error/15 pointer-events-none z-10 flex flex-col justify-between p-2 shadow-lg">
        <div class="flex items-center justify-between bg-inverse-surface/90 px-2 py-0.5 rounded text-white font-data-tabular text-label-sm">
          <span class="font-bold flex items-center gap-1">
            <span class="w-1.5 h-1.5 rounded-full bg-error animate-ping"></span>
            [Unauthorized Movement Alert]
          </span>
          <span class="text-error font-semibold">Flagged</span>
        </div>
        <div class="bg-inverse-surface/85 text-surface-container-highest px-2 py-1 rounded font-label-sm text-label-sm flex items-center justify-between">
          <span>Dumper Truck [MH-14-AX]</span>
          <span class="text-primary-fixed">Undercarriage Clear</span>
        </div>
      </div>
      <div class="absolute bottom-1/4 right-1/4 w-52 h-28 border-2 border-secondary-container/90 rounded bg-secondary/10 pointer-events-none z-10 flex flex-col justify-between p-1.5">
        <div class="bg-inverse-surface/90 px-1.5 py-0.5 rounded text-white font-data-tabular text-label-sm flex items-center justify-between">
          <span class="font-semibold">[Waste Debris Bin #3]</span>
          <span class="text-secondary-fixed">80% Cap</span>
        </div>
        <div class="bg-inverse-surface/85 text-surface-container-highest px-1.5 py-0.5 rounded font-label-sm text-label-sm">
          Scheduled pickup: 17:30
        </div>
      </div>
    `
  }
};

let primaryZoom = 1.0;
let activeCameraKey = "cam-01";

function switchCameraFeed(camKey) {
  const data = cameraFeeds[camKey];
  if (!data) return;

  activeCameraKey = camKey;

  const codeEl = document.getElementById("main-cam-code");
  const titleEl = document.getElementById("main-cam-title");
  const locEl = document.getElementById("main-cam-location");
  const resEl = document.getElementById("main-cam-res");
  const bwEl = document.getElementById("main-cam-bandwidth");

  if (codeEl) codeEl.textContent = data.code;
  if (titleEl) titleEl.textContent = data.title;
  if (locEl) locEl.textContent = data.location;
  if (resEl) resEl.textContent = data.resolution;
  if (bwEl) bwEl.textContent = data.bandwidth;

  const bgEl = document.getElementById("main-feed-bg");
  if (bgEl) {
    bgEl.style.backgroundImage = `url('${data.bgUrl}')`;
  }

  const nodeLabelEl = document.getElementById("main-feed-node-label");
  const aiFlagEl = document.getElementById("main-ai-flag");
  const syncEl = document.getElementById("main-sync-status");
  const ptzEl = document.getElementById("main-ptz-status");

  if (nodeLabelEl) nodeLabelEl.textContent = data.nodeLabel;
  if (aiFlagEl) aiFlagEl.textContent = data.aiStatus;
  if (syncEl) syncEl.textContent = data.syncStatus;
  if (ptzEl) ptzEl.textContent = data.ptzStatus;

  const boxesContainer = document.getElementById("main-bounding-boxes");
  if (boxesContainer) {
    boxesContainer.innerHTML = data.overlaysHtml;
  }

  primaryZoom = 1.0;
  const zoomLabel = document.getElementById("primary-zoom-label");
  if (zoomLabel) zoomLabel.textContent = "1.0x";
  if (bgEl) bgEl.style.transform = "scale(1)";

  ["cam-01", "cam-02", "cam-03", "cam-04"].forEach(key => {
    const card = document.getElementById(`health-node-${key}`);
    const badge = document.getElementById(`badge-node-${key}`);
    const dot = card ? card.querySelector(".node-indicator-dot") : null;

    if (!card || !badge) return;

    if (key === camKey) {
      card.className = "camera-selector-card text-left p-space-md rounded-xl border-2 border-primary bg-primary-fixed/20 shadow-sm transition-all duration-200 cursor-pointer hover:shadow-md flex flex-col justify-between gap-space-sm";
      badge.className = "node-badge px-2 py-0.5 rounded font-label-sm text-label-sm font-semibold bg-primary-fixed text-primary";
      badge.textContent = "Active";
      if (dot) dot.className = "node-indicator-dot w-2.5 h-2.5 rounded-full bg-primary-container";
    } else {
      card.className = "camera-selector-card text-left p-space-md rounded-xl border-2 border-transparent bg-surface-container-low/70 hover:bg-surface-container-low transition-all duration-200 cursor-pointer hover:shadow-md flex flex-col justify-between gap-space-sm";
      badge.className = "node-badge px-2 py-0.5 rounded font-label-sm text-label-sm font-medium bg-surface-container-high text-on-surface-variant";
      badge.textContent = "Standby";
      if (dot) dot.className = "node-indicator-dot w-2.5 h-2.5 rounded-full bg-tertiary";
    }
  });

  showGlobalToast(`Switched active feed to ${data.code} • ${data.title}`, "videocam");
}

function adjustPrimaryZoom(dir) {
  primaryZoom = Math.min(3.0, Math.max(1.0, primaryZoom + dir * 0.5));
  const label = document.getElementById("primary-zoom-label");
  if (label) label.textContent = `${primaryZoom.toFixed(1)}x`;
  const bg = document.getElementById("main-feed-bg");
  if (bg) bg.style.transform = `scale(${primaryZoom})`;
  showGlobalToast(`PTZ Zoom adjusted to ${primaryZoom.toFixed(1)}x`, "zoom_in");
}

function selectGridLayout(cols, label) {
  const labelEl = document.getElementById('current-grid-layout-label');
  if (labelEl) labelEl.textContent = label;

  const menu = document.getElementById('grid-layout-menu');
  if (menu) menu.classList.add('hidden');

  document.querySelectorAll('.grid-opt-check').forEach(chk => {
    if (chk.getAttribute('data-grid') === String(cols)) {
      chk.classList.remove('hidden');
    } else {
      chk.classList.add('hidden');
    }
  });

  const grid = document.getElementById('cctv-grid');
  if (grid) {
    grid.classList.remove('grid-cols-1', 'lg:grid-cols-2', 'xl:grid-cols-3', 'lg:grid-cols-4');
    if (cols === 1) {
      grid.classList.add('grid-cols-1');
    } else if (cols === 2) {
      grid.classList.add('grid-cols-1', 'lg:grid-cols-2');
    } else if (cols === 3) {
      grid.classList.add('grid-cols-1', 'lg:grid-cols-2', 'xl:grid-cols-3');
    } else if (cols >= 4) {
      grid.classList.add('grid-cols-2', 'lg:grid-cols-4');
    }
  }

  showGlobalToast(`Grid layout switched to ${label}`, 'grid_view');
}

function updateSurveillanceClocks() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  const seconds = String(now.getSeconds()).padStart(2, '0');
  const timeStr = `${year}-${month}-${day} ${hours}:${minutes}:${seconds} IST`;

  document.querySelectorAll('.live-clock').forEach(clock => {
    clock.textContent = timeStr;
  });
}

function toggleAudio(btn) {
  const icon = btn.querySelector('.material-symbols-outlined');
  if (icon && icon.textContent === 'volume_off') {
    icon.textContent = 'volume_up';
    btn.classList.add('bg-primary-container', 'text-on-primary');
    showGlobalToast("Audio stream unmuted for active feed", "volume_up");
  } else if (icon) {
    icon.textContent = 'volume_off';
    btn.classList.remove('bg-primary-container', 'text-on-primary');
    showGlobalToast("Audio feed muted", "volume_off");
  }
}

function captureSnapshot(camName) {
  showGlobalToast(`Snapshot saved: ${camName} [Frame Capture Authenticated]`, "photo_camera");
}

function takeAllSnapshots() {
  showGlobalToast("Simultaneous snapshot captured across all 4 optical nodes", "photo_library");
}

function addCameraStream() {
  triggerRegisterModal(true);
}

function toggleFullscreen(elementId) {
  const el = document.getElementById(elementId);
  if (!el) return;
  if (!document.fullscreenElement) {
    el.requestFullscreen?.().catch(() => {
      showGlobalToast("Fullscreen mode engaged", "fullscreen");
    });
  } else {
    document.exitFullscreen?.();
  }
}

function triggerRegisterModal(open = true) {
  const modal = document.getElementById("register-modal");
  if (!modal) return;
  if (open) {
    modal.classList.remove("hidden");
    modal.classList.add("flex");
  } else {
    modal.classList.add("hidden");
    modal.classList.remove("flex");
  }
}

function saveNewStream() {
  triggerRegisterModal(false);
  showGlobalToast("RTSP Channel handshake verified. Added to surveillance queue.", "cloud_done");
}

// -------------------------------------------------------------
// 4. ALERTS SCREEN INTERACTION
// -------------------------------------------------------------
function switchAlertView(view) {
  const realtimeView = document.getElementById('view-realtime-alerts');
  const periodicView = document.getElementById('view-periodic-alerts');
  const realtimeBtn = document.getElementById('tab-btn-realtime');
  const periodicBtn = document.getElementById('tab-btn-periodic');
  const realtimeChips = document.getElementById('filter-chips-realtime');
  const periodicChips = document.getElementById('filter-chips-periodic');

  if (view === 'periodic') {
    if (realtimeView) realtimeView.classList.add('hidden');
    if (periodicView) {
      periodicView.classList.remove('hidden');
      periodicView.classList.add('flex');
    }
    if (realtimeChips) realtimeChips.classList.add('hidden');
    if (periodicChips) periodicChips.classList.remove('hidden');

    if (periodicBtn) {
      periodicBtn.className = 'px-3 py-1 rounded-lg font-label-md text-label-md font-bold transition-all flex items-center gap-1.5 shadow-sm bg-surface-container-lowest text-secondary border border-outline-variant/30';
    }
    if (realtimeBtn) {
      realtimeBtn.className = 'px-3 py-1 rounded-lg font-label-md text-label-md font-semibold transition-all flex items-center gap-1.5 text-on-surface-variant hover:text-on-surface hover:bg-surface-container-lowest/70';
    }
    showGlobalToast('Switched to Periodic AI Optical Sweeps', 'schedule');
  } else {
    if (periodicView) {
      periodicView.classList.add('hidden');
      periodicView.classList.remove('flex');
    }
    if (realtimeView) realtimeView.classList.remove('hidden');
    if (periodicChips) periodicChips.classList.add('hidden');
    if (realtimeChips) realtimeChips.classList.remove('hidden');

    if (realtimeBtn) {
      realtimeBtn.className = 'px-3 py-1 rounded-lg font-label-md text-label-md font-bold transition-all flex items-center gap-1.5 shadow-sm bg-surface-container-lowest text-primary border border-outline-variant/30';
    }
    if (periodicBtn) {
      periodicBtn.className = 'px-3 py-1 rounded-lg font-label-md text-label-md font-semibold transition-all flex items-center gap-1.5 text-on-surface-variant hover:text-on-surface hover:bg-surface-container-lowest/70';
    }
    showGlobalToast('Switched to Real-Time Alert Verification Queue', 'emergency');
  }
}

// -------------------------------------------------------------
// 5. SITEMAP SCHEMATIC CANVAS & MARKERS
// -------------------------------------------------------------
let currentZoom = 100;
let isPanning = false;
let panStartX = 0;
let panStartY = 0;
let translateX = 0;
let translateY = 0;

function updateTransform() {
  const canvasEl = document.getElementById('schematicCanvas');
  const zoomText = document.getElementById('zoomLevelText');
  if (canvasEl) {
    canvasEl.style.transform = `translate(${translateX}px, ${translateY}px) scale(${currentZoom / 100})`;
  }
  if (zoomText) {
    zoomText.textContent = `${currentZoom}%`;
  }
}

function adjustZoom(delta) {
  currentZoom = Math.min(220, Math.max(50, currentZoom + delta));
  updateTransform();
}

function resetBlueprint() {
  currentZoom = 100;
  translateX = 0;
  translateY = 0;
  updateTransform();
  showGlobalToast('Blueprint zoom reset to 100%', 'center_focus_strong');
}

function fitBlueprint() {
  const container = document.getElementById('blueprintContainer');
  const canvas = document.getElementById('schematicCanvas');
  if (!container || !canvas) return;

  const cw = container.clientWidth;
  const ch = container.clientHeight;
  const nw = 1140;
  const nh = 700;

  if (cw > 0 && ch > 0) {
    const scale = Math.min((cw - 40) / nw, (ch - 40) / nh, 1.0);
    currentZoom = Math.round(scale * 100);
    translateX = Math.max(0, (cw - nw * scale) / 2);
    translateY = Math.max(0, (ch - nh * scale) / 2);
    updateTransform();
  }
}

function toggleSitemapLayer(layerType, btn) {
  const dot = btn.querySelector('span.rounded-full');
  const isVisible = dot && dot.classList.contains('bg-primary');

  if (isVisible) {
    dot.classList.remove('bg-primary');
    dot.classList.add('bg-surface-container-highest');
    btn.classList.remove('bg-surface-container-low', 'border-primary/40');
    btn.classList.add('opacity-60');
  } else {
    dot.classList.remove('bg-surface-container-highest');
    dot.classList.add('bg-primary');
    btn.classList.add('bg-surface-container-low', 'border-primary/40');
    btn.classList.remove('opacity-60');
  }

  const layerMap = {
    cctv: ['pin-cam-01', 'pin-cam-02', 'pin-cam-03', 'pin-cam-04'],
    hazards: ['pin-hazard-01', 'pin-hazard-02'],
    materials: ['pin-mat-01', 'pin-mat-02', 'pin-mat-03']
  };

  const pins = layerMap[layerType];
  if (pins) {
    pins.forEach(id => {
      const el = document.getElementById(id);
      if (el) el.style.display = isVisible ? 'none' : 'block';
    });
  }
}

const sitemapDrawerData = {
  cam01: {
    title: 'CAM-01: Main Gate',
    subtitle: 'Inbound Perimeter Access Point • Optical Lens',
    status: 'Live • Monitoring Active',
    statusColor: 'text-primary',
    dotColor: 'bg-primary',
    icon: 'videocam',
    iconWrap: 'bg-primary-container text-on-primary',
    tag: 'CAM-01 [NORTH GATE]',
    fps: '29.97 FPS',
    movements: '38 Vehicles',
    movementsTrend: '+12% vs yesterday',
    anomalies: '0 Clean',
    anomalySub: 'No perimeter breaches',
    logs: [
      { title: 'RMC Batch #4928 Inbound', desc: 'UltraTech Transit Mixer (MH-12-EQ-9011)', time: '11:42 AM', status: 'VERIFIED', type: 'local_shipping' },
      { title: 'TMT Rebar 16mm Delivery', desc: 'Tata Tiscon • 14.2 Metric Tons', time: '10:15 AM', status: 'VERIFIED', type: 'inventory' },
      { title: 'Subcontractor Crew In', desc: 'Shiv Shakti Formworks (42 crew)', time: '08:00 AM', status: 'VERIFIED', type: 'person_check' }
    ]
  },
  cam02: {
    title: 'CAM-02: Cement Shed',
    subtitle: 'Covered Enclosure 103 • Moisture & Pile Tracker',
    status: 'Stock Normal • Safe Humidity 54%',
    statusColor: 'text-secondary',
    dotColor: 'bg-secondary',
    icon: 'inventory_2',
    iconWrap: 'bg-secondary text-on-secondary',
    tag: 'CAM-02 [CEMENT DEPOT]',
    fps: '30.00 FPS',
    movements: '240 Bags Moved',
    movementsTrend: 'On schedule for Tower A Slab',
    anomalies: '0 Spoilage',
    anomalySub: 'Zero moisture risk alerts',
    logs: [
      { title: 'Transfer to Batching Silo', desc: '120 Bags OPC-53 Dispatched by Forklift #2', time: '11:10 AM', status: 'VERIFIED', type: 'forklift' },
      { title: 'Intake Delivery Staged', desc: 'Ambuja Cement Trailer (400 Bags)', time: '09:20 AM', status: 'STOCKED', type: 'inventory_2' },
      { title: 'Daily Inventory Count', desc: '1,420 Bags Total Active Inventory', time: '07:30 AM', status: 'AUDITED', type: 'checklist' }
    ]
  },
  cam03: {
    title: 'CAM-03: Crane Work Deck',
    subtitle: 'Tower Crane Jib Pad • Slab Level 14',
    status: 'Active Rigging Operations',
    statusColor: 'text-amber-600',
    dotColor: 'bg-amber-500',
    icon: 'precision_manufacturing',
    iconWrap: 'bg-amber-500 text-on-primary',
    tag: 'CAM-03 [CRANE CABIN]',
    fps: '30.00 FPS',
    movements: '18 Heavy Lifts',
    movementsTrend: 'Wind speed 12 km/h (Safe)',
    anomalies: '0 Hazards',
    anomalySub: 'Rigging permits fully verified',
    logs: [
      { title: 'Rebar Bundle Lift #18', desc: '2.8 Tons lifted to Core Shear Wall', time: '11:35 AM', status: 'VERIFIED', type: 'hardware' },
      { title: 'Concrete Bucket Lift #17', desc: '3.0 Cubic Meters to Pour Bay 3', time: '11:02 AM', status: 'VERIFIED', type: 'architecture' },
      { title: 'Jib Inspection Log', desc: 'Cable tension check cleared by Operator', time: '07:45 AM', status: 'VERIFIED', type: 'assignment_turned_in' }
    ]
  },
  cam04: {
    title: 'CAM-04: Rear Exit Gate',
    subtitle: 'Secondary Perimeter Haul Road • Alert Zone',
    status: 'CRITICAL ALERT: ANOMALY FLAGGED',
    statusColor: 'text-error',
    dotColor: 'bg-error',
    icon: 'warning',
    iconWrap: 'bg-error text-on-error',
    tag: 'CAM-04 [REAR ACCESS]',
    fps: '30.00 FPS',
    movements: '4 Movements (1 Unscheduled)',
    movementsTrend: 'Excess cement displacement',
    anomalies: '1 Active Alert',
    anomalySub: 'Supervisor review requested',
    logs: [
      { title: 'Suspicious Vehicle Outbound', desc: 'Pickup Truck carrying 45 Bags cement without manifest', time: '11:28 AM', status: 'FLAGGED', type: 'gpp_bad' },
      { title: 'Gate Breach Sensor #04', desc: 'Sensor triggered outside designated dispatch window', time: '11:26 AM', status: 'ALERT', type: 'sensors' },
      { title: 'Dump Truck Cleared', desc: 'Earth removal empty departure', time: '09:50 AM', status: 'VERIFIED', type: 'check_circle' }
    ]
  },
  steel: {
    title: 'Rebar Staging Yard B',
    subtitle: 'Fabrication & Cut-Bend Work Area',
    status: 'Operational Normal',
    statusColor: 'text-secondary',
    dotColor: 'bg-secondary',
    icon: 'grid_view',
    iconWrap: 'bg-secondary text-on-secondary',
    tag: 'ZONE-ST-02 [FAB YARD]',
    fps: 'SENSOR ARRAY',
    movements: '12 TMT Bundles Cut',
    movementsTrend: 'Efficiency at 98.4%',
    anomalies: '0 Deviations',
    anomalySub: 'Wastage rate 0.9% (Below 2% threshold)',
    logs: [
      { title: 'Beam Rebar Cage Complete', desc: 'Grid C-4 to C-8 Shear Reinforcement', time: '10:55 AM', status: 'VERIFIED', type: 'construction' },
      { title: 'Off-cut Scrap Logged', desc: '42 kg scrap routed to bin #3', time: '09:40 AM', status: 'VERIFIED', type: 'recycling' }
    ]
  }
};

function openMarkerDrawer(key) {
  const data = sitemapDrawerData[key];
  if (!data) return;

  const tEl = document.getElementById('drawerTitle');
  const sEl = document.getElementById('drawerSubtitle');
  const stText = document.getElementById('drawerStatusText');
  const stDot = document.getElementById('drawerStatusDot');
  const hIcon = document.getElementById('drawerHeaderIcon');
  const iWrap = document.getElementById('drawerIconWrap');
  const cTag = document.getElementById('drawerCameraTag');
  const fpsEl = document.getElementById('drawerFps');
  const dMove = document.getElementById('drawerDailyMovements');
  const anomCount = document.getElementById('drawerAnomaliesCount');
  const anomSub = document.getElementById('drawerAnomalySubtext');

  if (tEl) tEl.textContent = data.title;
  if (sEl) sEl.textContent = data.subtitle;
  if (stText) {
    stText.textContent = data.status;
    stText.className = `font-label-sm text-label-sm font-semibold ${data.statusColor}`;
  }
  if (stDot) stDot.className = `w-2 h-2 rounded-full ${data.dotColor} animate-pulse`;
  
  if (hIcon) hIcon.textContent = data.icon;
  if (iWrap) iWrap.className = `w-8 h-8 rounded-lg flex items-center justify-center ${data.iconWrap}`;
  
  if (cTag) cTag.textContent = data.tag;
  if (fpsEl) fpsEl.textContent = data.fps;
  if (dMove) dMove.textContent = data.movements;
  if (anomCount) anomCount.textContent = data.anomalies;
  if (anomSub) anomSub.textContent = data.anomalySub;

  const listContainer = document.getElementById('drawerLogsList');
  if (listContainer) {
    listContainer.innerHTML = '';
    data.logs.forEach(log => {
      const isFlagged = log.status === 'FLAGGED' || log.status === 'ALERT';
      const badgeClass = isFlagged ? 'bg-error text-on-error' : 'bg-primary-fixed text-on-primary-fixed';
      
      const itemEl = document.createElement('div');
      itemEl.className = 'p-2 rounded-lg bg-surface-container-low flex items-center justify-between text-body-sm';
      itemEl.innerHTML = `
        <div class="flex items-center gap-2">
          <div class="w-6 h-6 rounded ${isFlagged ? 'bg-error-container text-error' : 'bg-surface-container-highest text-secondary'} flex items-center justify-center">
            <span class="material-symbols-outlined text-[14px]">${log.type}</span>
          </div>
          <div>
            <div class="font-semibold text-on-surface text-[12px]">${log.title}</div>
            <div class="text-[10px] text-tertiary">${log.desc}</div>
          </div>
        </div>
        <div class="text-right">
          <div class="font-data-tabular font-medium text-[11px] text-on-surface">${log.time}</div>
          <span class="px-1.5 py-0.2 rounded ${badgeClass} font-label-sm text-[9px] font-bold">${log.status}</span>
        </div>
      `;
      listContainer.appendChild(itemEl);
    });
  }

  const drawer = document.getElementById('inspectorDrawer');
  if (drawer) {
    drawer.classList.remove('hidden');
    drawer.classList.add('flex');
  }
}

function closeMarkerDrawer() {
  const drawer = document.getElementById('inspectorDrawer');
  if (drawer) {
    drawer.classList.add('hidden');
    drawer.classList.remove('flex');
  }
}

// -------------------------------------------------------------
// 6. MOVEMENT LEDGER INTERACTIVITY
// -------------------------------------------------------------
let pendingCount = 3;
let activeDrawerRowId = null;

const movementDetailsData = {
  'mv-1049': {
    challan: '#UT-8921',
    material: 'Ultratech Cement - 100 bags (50kg each)',
    direction: 'IN (Inbound Delivery)',
    plate: 'MH-12-QE-4091 (Tata Prima 2825.K)',
    driver: 'Rajesh G. (ID: DRV-4421 - Cleared)',
    weight: '11,200 kg Gross / 5,000 kg Net Cement',
    scale: 'Weighbridge Gate 1 (Calibration: Pass)',
    routing: 'Supplier Gate 1 → Central Yard Staging',
    cam: 'CAM-01 (Gate ANPR West)',
    status: 'Pending',
    isPending: true
  },
  'mv-1048': {
    challan: '#JSW-5502',
    material: 'TMT Steel 16mm - 120 rods (Fe 550D)',
    direction: 'IN (Inbound Delivery)',
    plate: 'MH-14-BT-8902 (Ashok Leyland)',
    driver: 'Mohan Verma (ID: DRV-8820 - Cleared)',
    weight: '14,800 kg Gross / 8,240 kg Net Rebar',
    scale: 'Weighbridge Gate 2 (Calibration: Pass)',
    routing: 'Supplier Gate 2 → Rebar Fabrication Bay',
    cam: 'CAM-02 (Rebar Yard Crane)',
    status: 'Pending',
    isPending: true
  },
  'mv-1047': {
    challan: '#FLAG-7711 (Unscheduled)',
    material: 'Red Clay Bricks - 2,500 pcs',
    direction: 'OUT (Outbound Transfer)',
    plate: 'KA-04-MB-7711 (Tipper)',
    driver: 'Sunil Kumar (Contractor B Sub)',
    weight: '6,200 kg Net (Exceeds permit by 380 kg)',
    scale: 'Weighbridge South CAM-04',
    routing: 'Central Storage → Offsite Disposal',
    cam: 'CAM-04 (South Exit Weighbridge)',
    status: 'Flagged',
    isPending: false
  },
  'mv-1046': {
    challan: '#KJ-9011',
    material: 'Kajaria Vitrified Tiles - 450 boxes',
    direction: 'IN (Inbound Delivery)',
    plate: 'HR-55-AN-1218 (Container Carrier)',
    driver: 'Devendra Pal (ID: DRV-1209)',
    weight: '9,450 kg Net Ceramic Tile Stock',
    scale: 'Gate 1 Automatic Platform',
    routing: 'Logistics Gate 1 → Tower A L2 Floor Staging',
    cam: 'CAM-01 (Gate ANPR West)',
    status: 'Pending',
    isPending: true
  },
  'mv-1045': {
    challan: '#UT-8910',
    material: 'Ultratech Cement - 300 bags',
    direction: 'IN (Inbound Delivery)',
    plate: 'MH-14-GH-2210',
    driver: 'Anil Shinde',
    weight: '15,000 kg Net',
    scale: 'Gate 1 Weighbridge',
    routing: 'Supplier Gate 1 → Silo Prep Silo B',
    cam: 'CAM-01',
    status: 'Verified',
    isPending: false
  },
  'mv-1044': {
    challan: '#SCR-119',
    material: 'TMT Scrap Offcuts - 1.8 Tons',
    direction: 'OUT (Outbound)',
    plate: 'DL-1L-AA-9900',
    driver: 'Harish Babu',
    weight: '1,800 kg Net Scrap',
    scale: 'Rear Scrap Exit Platform',
    routing: 'Rebar Yard → Recycler Yard Gate 3',
    cam: 'CAM-03',
    status: 'Verified',
    isPending: false
  },
  'mv-1043': {
    challan: '#BRK-4008',
    material: 'Red Clay Bricks - 5,000 pcs',
    direction: 'IN (Inbound Delivery)',
    plate: 'RJ-14-GB-3341',
    driver: 'Mukesh Sharma',
    weight: '14,000 kg Net',
    scale: 'Gate 1 Scale',
    routing: 'Gate 1 → Masonry Staging Ground',
    cam: 'CAM-01',
    status: 'Verified',
    isPending: false
  },
  'mv-1042': {
    challan: '#UT-8899',
    material: 'Ultratech Cement - 200 bags',
    direction: 'IN (Inbound Delivery)',
    plate: 'MH-04-KF-1010',
    driver: 'Auto-dispenser pipeline',
    weight: '10,000 kg Net',
    scale: 'Basement Scale sensor',
    routing: 'Night Delivery Gate → Tower A Basement',
    cam: 'CAM-01',
    status: 'Verified',
    isPending: false
  }
};

function executeVerification(rowId) {
  const row = document.getElementById('row-' + rowId);
  if (!row) return;

  const currentStatus = row.getAttribute('data-status');
  if (currentStatus === 'Verified') {
    showGlobalToast('This entry was already authenticated.', 'check_circle', 'Already Verified');
    return;
  }

  row.setAttribute('data-status', 'Verified');
  if (movementDetailsData[rowId]) {
    movementDetailsData[rowId].status = 'Verified';
    movementDetailsData[rowId].isPending = false;
  }

  if (pendingCount > 0) {
    pendingCount--;
    const kpiCounter = document.getElementById('kpi-pending-count');
    if (kpiCounter) {
      kpiCounter.textContent = pendingCount;
      kpiCounter.classList.add('text-primary');
      setTimeout(() => kpiCounter.classList.remove('text-primary'), 1000);
    }
  }

  const statusCell = row.querySelector('.status-cell');
  if (statusCell) {
    statusCell.innerHTML = `
      <span class="status-badge inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-on-primary-container text-primary font-label-sm text-label-sm font-semibold">
        <span class="material-symbols-outlined text-[14px]">check_circle</span> Verified
      </span>
    `;
  }

  const actionCell = row.querySelector('.action-cell');
  if (actionCell) {
    actionCell.innerHTML = `
      <div class="inline-flex items-center gap-2 justify-end" onclick="event.stopPropagation()">
        <span class="font-body-sm text-body-sm text-primary font-medium">Verified just now</span>
        <button type="button" class="drawer-btn p-1.5 rounded-full hover:bg-surface-container text-on-surface-variant" data-id="${rowId}" title="Details" onclick="openDetailsModal('${rowId}')">
          <span class="material-symbols-outlined text-[20px]">chevron_right</span>
        </button>
      </div>
    `;
  }

  closeDetailsModal();
  showGlobalToast(`Gate Pass & Manifest ${rowId.toUpperCase()} verified and reconciled into site ledger`, 'verified');
}

function renderDrawerDetails(rowId) {
  activeDrawerRowId = rowId;
  const data = movementDetailsData[rowId];
  if (!data) return;

  const mChallan = document.getElementById('modalChallan');
  const mMaterial = document.getElementById('modalMaterial');
  const mDirection = document.getElementById('modalDirection');
  const mPlate = document.getElementById('modalPlate');
  const mDriver = document.getElementById('modalDriver');
  const mWeight = document.getElementById('modalWeight');
  const mScale = document.getElementById('modalScale');
  const mRouting = document.getElementById('modalRouting');
  const mCamTag = document.getElementById('modalCamTag');

  if (mChallan) mChallan.textContent = 'Challan ' + data.challan;
  if (mMaterial) mMaterial.textContent = data.material;
  if (mDirection) mDirection.textContent = data.direction;
  if (mPlate) mPlate.textContent = data.plate;
  if (mDriver) mDriver.textContent = data.driver;
  if (mWeight) mWeight.textContent = data.weight;
  if (mScale) mScale.textContent = data.scale;
  if (mRouting) mRouting.textContent = data.routing;
  if (mCamTag) mCamTag.textContent = data.cam;

  const badge = document.getElementById('modalStatusBadge');
  const actionVerifyBtn = document.getElementById('modalActionVerifyBtn');
  const auditIcon = document.getElementById('modalAuditIcon');
  const auditTitle = document.getElementById('modalAuditTitle');
  const auditTime = document.getElementById('modalAuditTime');
  const auditDesc = document.getElementById('modalAuditDesc');

  if (!badge) return;

  if (data.status === 'Verified') {
    badge.className = 'px-2.5 py-0.5 rounded-full bg-on-primary-container text-primary font-label-sm text-label-sm font-semibold';
    badge.textContent = 'Verified';
    if (actionVerifyBtn) actionVerifyBtn.classList.add('hidden');

    if (auditIcon) {
      auditIcon.textContent = 'check_circle';
      auditIcon.className = 'material-symbols-outlined text-primary text-[18px] mt-0.5';
    }
    if (auditTitle) auditTitle.textContent = 'Verified by Rajesh M. (Project Director)';
    if (auditTime) auditTime.textContent = 'Certified';
    if (auditDesc) auditDesc.textContent = 'Identity, RFID tag, and tare weighbridge ticket matched autonomous tolerances.';
  } else if (data.status === 'Flagged') {
    badge.className = 'px-2.5 py-0.5 rounded-full bg-error text-on-error font-label-sm text-label-sm font-semibold';
    badge.textContent = 'Flagged Discrepancy';
    if (actionVerifyBtn) {
      actionVerifyBtn.classList.remove('hidden');
      actionVerifyBtn.textContent = 'Override & Clear Flag';
    }
    if (auditIcon) {
      auditIcon.textContent = 'error';
      auditIcon.className = 'material-symbols-outlined text-error text-[18px] mt-0.5';
    }
    if (auditTitle) auditTitle.textContent = 'Gate Discrepancy Hold';
    if (auditTime) auditTime.textContent = 'Active Investigation';
    if (auditDesc) auditDesc.textContent = 'Gross scale readout diverged by +380 kg above manifest. Secondary weighing required.';
  } else {
    badge.className = 'px-2.5 py-0.5 rounded-full bg-error-container text-on-error-container font-label-sm text-label-sm font-semibold';
    badge.textContent = 'Pending Sign-off';
    if (actionVerifyBtn) {
      actionVerifyBtn.classList.remove('hidden');
      actionVerifyBtn.innerHTML = '<span class="material-symbols-outlined text-[18px]">verified</span> One-Click Verify Record';
    }
    if (auditIcon) {
      auditIcon.textContent = 'pending';
      auditIcon.className = 'material-symbols-outlined text-tertiary text-[18px] mt-0.5';
    }
    if (auditTitle) auditTitle.textContent = 'Site Director Manual Sign-off Required';
    if (auditTime) auditTime.textContent = 'Awaiting Action';
    if (auditDesc) auditDesc.textContent = 'Pending physical receipt confirmation from field inspector Rajesh M.';
  }
}

function openDetailsModal(rowId) {
  renderDrawerDetails(rowId);
  const overlay = document.getElementById('drawerOverlay');
  const drawer = document.getElementById('drawerContent');

  if (overlay && drawer) {
    overlay.classList.remove('hidden');
    setTimeout(() => {
      overlay.classList.remove('opacity-0');
      drawer.classList.remove('translate-x-full');
    }, 10);
  }
}

function closeDetailsModal() {
  const overlay = document.getElementById('drawerOverlay');
  const drawer = document.getElementById('drawerContent');

  if (overlay && drawer) {
    drawer.classList.add('translate-x-full');
    overlay.classList.add('opacity-0');
    setTimeout(() => {
      overlay.classList.add('hidden');
      activeDrawerRowId = null;
    }, 300);
  }
}

// -------------------------------------------------------------
// 7. WASTAGE TRACKING INTERACTIVITY
// -------------------------------------------------------------
let currentTotalLoss = 34600;
let openCasesCount = 2;
let totalUnitsAffected = 48;
let activeCaseRowId = null;

function toggleWastageModal(show) {
  const addModal = document.getElementById('addWastageModal');
  if (!addModal) return;
  if (show) {
    addModal.classList.remove('hidden');
  } else {
    addModal.classList.add('hidden');
  }
}

function openInvestigationModal(id) {
  activeCaseRowId = id;
  const drawerIncidentId = document.getElementById('drawerIncidentId');
  const drawer = document.getElementById('investigationDrawer');
  if (drawerIncidentId) drawerIncidentId.textContent = 'Case #INC-' + (id.toString().padStart(4, '0'));
  if (drawer) drawer.classList.remove('hidden');
}

function closeInvestigationDrawer() {
  const drawer = document.getElementById('investigationDrawer');
  if (drawer) drawer.classList.add('hidden');
}

function resolveRecordRow(id) {
  const row = document.querySelector(`tr[data-row-id="${id}"]`);
  if (!row) return;

  const previousStatus = row.getAttribute('data-status');
  const metricOpenCasesEl = document.getElementById('metricOpenCases');
  if (previousStatus === 'Under Review' && openCasesCount > 0) {
    openCasesCount -= 1;
    if (metricOpenCasesEl) metricOpenCasesEl.textContent = openCasesCount;
  }

  row.setAttribute('data-status', 'Approved & Reconciled');
  const statusCell = row.children[7];
  if (statusCell) {
    statusCell.innerHTML = `
      <span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-on-primary-container/70 text-primary font-label-sm text-label-sm font-semibold">
        <span class="w-1.5 h-1.5 rounded-full bg-primary"></span>
        Approved &amp; Reconciled
      </span>
    `;
  }
  const actionCell = row.children[8];
  if (actionCell) {
    actionCell.innerHTML = `
      <div class="flex items-center justify-end gap-1.5">
        <button type="button" onclick="openInvestigationModal(${id})" class="px-2.5 py-1.5 rounded-lg bg-surface-container-low hover:bg-secondary hover:text-on-secondary text-secondary font-label-md text-label-md font-semibold transition-all">
          Investigate
        </button>
        <span class="text-on-surface-variant/40 material-symbols-outlined text-[18px]">verified</span>
      </div>
    `;
  }
  closeInvestigationDrawer();
  showGlobalToast(`Case #INC-${id.toString().padStart(4, '0')} approved & reconciled into site balance.`, 'check_circle');
}

function setVendorClaimStatus(id) {
  const row = document.querySelector(`tr[data-row-id="${id}"]`);
  if (!row) return;

  const previousStatus = row.getAttribute('data-status');
  const metricOpenCasesEl = document.getElementById('metricOpenCases');
  if (previousStatus === 'Under Review' && openCasesCount > 0) {
    openCasesCount -= 1;
    if (metricOpenCasesEl) metricOpenCasesEl.textContent = openCasesCount;
  }

  row.setAttribute('data-status', 'Vendor Claim Filed');
  const statusCell = row.children[7];
  if (statusCell) {
    statusCell.innerHTML = `
      <span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-secondary-fixed text-on-secondary-fixed font-label-sm text-label-sm font-semibold">
        <span class="w-1.5 h-1.5 rounded-full bg-secondary"></span>
        Vendor Claim Filed
      </span>
    `;
  }
  closeInvestigationDrawer();
  showGlobalToast(`Vendor indemnity claim filed for Case #INC-${id.toString().padStart(4, '0')}`, 'receipt_long');
}

function openPhotoViewerModal(title, caption) {
  const photoModal = document.getElementById('photoViewerModal');
  const photoModalTitle = document.getElementById('photoModalTitle');
  const photoModalCaption = document.getElementById('photoModalCaption');
  if (photoModalTitle) photoModalTitle.textContent = title;
  if (photoModalCaption) photoModalCaption.textContent = caption;
  if (photoModal) photoModal.classList.remove('hidden');
}

function closePhotoViewerModal() {
  const photoModal = document.getElementById('photoViewerModal');
  if (photoModal) photoModal.classList.add('hidden');
}

// -------------------------------------------------------------
// 8. GLOBAL DOM INITIALIZATION & EVENT DELEGATION
// -------------------------------------------------------------
document.addEventListener('DOMContentLoaded', () => {

  // A. Hash Routing on load or change
  const initialHash = window.location.hash.replace('#', '') || 'login';
  if (initialHash && PAGES.includes(initialHash)) {
    // If user starts on a subpage directly, allow demo view
    if (initialHash !== 'login') {
      isAuthenticated = true;
    }
    navigateTo(initialHash);
  } else {
    navigateTo('login');
  }

  window.addEventListener('hashchange', () => {
    const hash = window.location.hash.replace('#', '');
    if (hash && PAGES.includes(hash)) {
      navigateTo(hash);
    }
  });

  // B. Click Delegation for all data-path anchors and buttons
  document.addEventListener('click', (e) => {
    const targetLink = e.target.closest('[data-path]');
    if (targetLink) {
      e.preventDefault();
      const path = targetLink.getAttribute('data-path');
      navigateTo(path);
      return;
    }

    // Close user dropdown if click outside
    const userBtn = document.getElementById('user-profile-btn');
    const userMenu = document.getElementById('user-profile-menu');
    if (userMenu && !userMenu.classList.contains('hidden')) {
      if (!userMenu.contains(e.target) && !userBtn?.contains(e.target)) {
        userMenu.classList.add('hidden');
      }
    }
  });

  // C. Sitemap Canvas Pan & Zoom listeners
  const canvasEl = document.getElementById('schematicCanvas');
  const container = document.getElementById('blueprintContainer');

  if (container && canvasEl) {
    container.addEventListener('mousedown', (e) => {
      // Don't pan if clicking an interactive marker
      if (e.target.closest('.group') || e.target.closest('button')) return;
      isPanning = true;
      panStartX = e.clientX - translateX;
      panStartY = e.clientY - translateY;
    });

    window.addEventListener('mousemove', (e) => {
      if (!isPanning) return;
      translateX = e.clientX - panStartX;
      translateY = e.clientY - panStartY;
      updateTransform();
    });

    window.addEventListener('mouseup', () => {
      isPanning = false;
    });

    container.addEventListener('wheel', (e) => {
      e.preventDefault();
      const delta = e.deltaY < 0 ? 10 : -10;
      adjustZoom(delta);
    }, { passive: false });
  }

  // D. Movement Ledger Filter Listeners
  const mSearch = document.getElementById('searchInput');
  const mFilterMat = document.getElementById('materialFilter');
  const mFilterDir = document.getElementById('directionFilter');
  const mFilterSt = document.getElementById('statusFilter');
  const mResetBtn = document.getElementById('resetFiltersBtn');
  const mRows = document.querySelectorAll('.ledger-row');
  const mRecordCount = document.getElementById('record-count');

  function filterMovementLedger() {
    const q = (mSearch?.value || '').toLowerCase().trim();
    const mat = mFilterMat?.value || 'all';
    const dir = mFilterDir?.value || 'all';
    const st = mFilterSt?.value || 'all';

    let count = 0;
    mRows.forEach(row => {
      const txt = row.innerText.toLowerCase();
      const rowMat = row.getAttribute('data-material');
      const rowDir = row.getAttribute('data-direction');
      const rowSt = row.getAttribute('data-status');

      const matchQ = !q || txt.includes(q);
      const matchMat = (mat === 'all') || (rowMat === mat);
      const matchDir = (dir === 'all') || (rowDir === dir);
      const matchSt = (st === 'all') || (rowSt === st);

      if (matchQ && matchMat && matchDir && matchSt) {
        row.classList.remove('hidden');
        count++;
      } else {
        row.classList.add('hidden');
      }
    });

    if (mRecordCount) mRecordCount.textContent = count + ' displayed';
  }

  mSearch?.addEventListener('input', filterMovementLedger);
  mFilterMat?.addEventListener('change', filterMovementLedger);
  mFilterDir?.addEventListener('change', filterMovementLedger);
  mFilterSt?.addEventListener('change', filterMovementLedger);
  mResetBtn?.addEventListener('click', () => {
    if (mSearch) mSearch.value = '';
    if (mFilterMat) mFilterMat.value = 'all';
    if (mFilterDir) mFilterDir.value = 'all';
    if (mFilterSt) mFilterSt.value = 'all';
    filterMovementLedger();
  });

  // Export CSV button in movement
  document.getElementById('exportCsvBtn')?.addEventListener('click', () => {
    showGlobalToast('BuildGuard_Movements_2026-10-22.csv downloaded', 'download', 'Export Manifest');
  });

  // Movement Row & Drawer triggers
  mRows.forEach(row => {
    row.addEventListener('click', () => {
      const id = row.getAttribute('data-id');
      if (id) openDetailsModal(id);
    });
  });

  document.querySelectorAll('.verify-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const id = btn.getAttribute('data-id');
      if (id) executeVerification(id);
    });
  });

  document.querySelectorAll('.drawer-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const id = btn.getAttribute('data-id');
      if (id) openDetailsModal(id);
    });
  });

  document.getElementById('modalActionVerifyBtn')?.addEventListener('click', () => {
    if (activeDrawerRowId) executeVerification(activeDrawerRowId);
  });

  document.getElementById('closeDrawerBtn')?.addEventListener('click', closeDetailsModal);
  document.getElementById('drawerOverlay')?.addEventListener('click', (e) => {
    if (e.target.id === 'drawerOverlay') closeDetailsModal();
  });

  // E. Wastage Modal & Filter Listeners
  const wOpenBtn = document.getElementById('openAddWastageModal');
  const wCloseBtn = document.getElementById('closeAddWastageModal');
  const wCancelBtn = document.getElementById('cancelModalBtn');
  const wForm = document.getElementById('addWastageForm');
  const wTableBody = document.getElementById('wastageTableBody');
  const wSearch = document.getElementById('tableSearchInput');
  const wMat = document.getElementById('filterMaterialSelect');
  const wSt = document.getElementById('filterStatusSelect');
  const wReset = document.getElementById('resetFiltersBtn');
  const wExportBtn = document.getElementById('openExportBtn');

  wOpenBtn?.addEventListener('click', () => toggleWastageModal(true));
  wCloseBtn?.addEventListener('click', () => toggleWastageModal(false));
  wCancelBtn?.addEventListener('click', () => toggleWastageModal(false));
  wExportBtn?.addEventListener('click', () => {
    showGlobalToast('Audit Log CSV exported for Residential Tower A', 'download', 'Export Audit');
  });

  // Investigation drawer actions
  document.getElementById('closeDrawerBtn')?.addEventListener('click', closeInvestigationDrawer);
  document.getElementById('approveReconcileBtn')?.addEventListener('click', () => {
    if (activeCaseRowId) resolveRecordRow(activeCaseRowId);
  });
  document.getElementById('fileVendorClaimBtn')?.addEventListener('click', () => {
    if (activeCaseRowId) setVendorClaimStatus(activeCaseRowId);
  });
  document.getElementById('closePhotoViewerModal')?.addEventListener('click', closePhotoViewerModal);

  // Wastage Form Submit
  if (wForm && wTableBody) {
    wForm.addEventListener('submit', (e) => {
      e.preventDefault();

      const material = document.getElementById('modalMaterial')?.value || 'Ultratech Cement (53 Grade)';
      const quantityStr = document.getElementById('modalQuantity')?.value || '10 Bags';
      const cause = document.getElementById('modalCause')?.value || 'Rain / Inadequate Tarping';
      const location = document.getElementById('modalLocation')?.value || 'Storage Shed Zone C';
      const lossValue = parseInt(document.getElementById('modalLoss')?.value || '4500', 10);
      const parsedUnits = parseInt(quantityStr, 10) || 10;

      const newIdNum = Math.floor(Math.random() * 8000) + 1000;
      const caseCode = '#INC-' + newIdNum;

      const tr = document.createElement('tr');
      tr.className = 'border-b border-outline-variant/15 hover:bg-surface-container-low/40 transition-colors';
      tr.setAttribute('data-material', material.toUpperCase().includes('CEMENT') ? 'CEMENT' : (material.toUpperCase().includes('STEEL') ? 'STEEL' : 'BRICKS'));
      tr.setAttribute('data-status', 'Under Review');
      tr.setAttribute('data-row-id', newIdNum);

      let materialPillClass = 'bg-primary-fixed text-on-primary-fixed-variant';
      let materialIcon = 'inventory_2';
      if (material.toUpperCase().includes('STEEL')) {
        materialPillClass = 'bg-secondary-fixed text-on-secondary-fixed-variant';
        materialIcon = 'reorder';
      } else if (material.toUpperCase().includes('BRICK')) {
        materialPillClass = 'bg-amber-100 text-amber-900';
        materialIcon = 'grid_view';
      }

      tr.innerHTML = `
        <td class="py-3.5 px-space-lg font-data-tabular text-secondary font-semibold">${caseCode}</td>
        <td class="py-3.5 px-space-md font-data-tabular text-on-surface-variant text-body-sm">Today, Just now</td>
        <td class="py-3.5 px-space-md">
          <span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full ${materialPillClass} font-label-md text-label-md font-semibold">
            <span class="material-symbols-outlined text-[15px]">${materialIcon}</span> ${material}
          </span>
        </td>
        <td class="py-3.5 px-space-md font-data-tabular font-semibold text-on-surface">${quantityStr}</td>
        <td class="py-3.5 px-space-md">
          <div class="flex items-center gap-1.5 text-on-surface">
            <span class="material-symbols-outlined text-[16px] text-tertiary">warning</span>
            <span>${cause}</span>
          </div>
        </td>
        <td class="py-3.5 px-space-md">
          <span class="px-2 py-0.5 rounded bg-surface-container-low text-on-surface-variant font-label-md text-label-md">${location}</span>
        </td>
        <td class="py-3.5 px-space-md font-data-tabular font-bold text-on-surface">₹${lossValue.toLocaleString('en-IN')}</td>
        <td class="py-3.5 px-space-md text-center">
          <button type="button" onclick="openPhotoViewerModal('${material} Damage Evidence', 'Field photo attached to logged incident report')" class="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-surface-container-low hover:bg-surface-container text-secondary font-label-sm text-label-sm font-semibold transition-all">
            <span class="material-symbols-outlined text-[15px]">photo_camera</span> Photo (1)
          </button>
        </td>
        <td class="py-3.5 px-space-md">
          <span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-100 text-amber-900 font-label-sm text-label-sm font-semibold">
            <span class="w-1.5 h-1.5 rounded-full bg-amber-600 animate-pulse"></span>
            Under Review
          </span>
        </td>
        <td class="py-3.5 px-space-lg text-right">
          <div class="flex items-center justify-end gap-1.5">
            <button type="button" onclick="openInvestigationModal(${newIdNum})" class="px-2.5 py-1.5 rounded-lg bg-surface-container-low hover:bg-secondary hover:text-on-secondary text-secondary font-label-md text-label-md font-semibold transition-all">
              Investigate
            </button>
            <button type="button" onclick="resolveRecordRow(${newIdNum})" class="p-1.5 rounded-lg hover:bg-primary-container hover:text-on-primary text-primary transition-all" title="Mark Resolved">
              <span class="material-symbols-outlined text-[18px]">done</span>
            </button>
          </div>
        </td>
      `;

      wTableBody.insertBefore(tr, wTableBody.firstChild);

      currentTotalLoss += lossValue;
      totalUnitsAffected += parsedUnits;
      openCasesCount += 1;

      const mLoss = document.getElementById('metricTotalLoss');
      const mUnits = document.getElementById('metricAffectedUnits');
      const mCases = document.getElementById('metricOpenCases');

      if (mLoss) mLoss.textContent = '₹' + currentTotalLoss.toLocaleString('en-IN');
      if (mUnits) mUnits.textContent = totalUnitsAffected;
      if (mCases) mCases.textContent = openCasesCount;

      toggleWastageModal(false);
      showGlobalToast(`New damage record ${caseCode} logged and staged for review`, 'report_problem');
    });
  }

  // Wastage Search & Filter
  function filterWastage() {
    const q = (wSearch?.value || '').toLowerCase().trim();
    const selMat = wMat?.value || 'ALL';
    const selSt = wSt?.value || 'ALL';
    const rows = wTableBody?.querySelectorAll('tr') || [];

    let count = 0;
    rows.forEach(r => {
      const txt = r.textContent.toLowerCase();
      const rMat = r.getAttribute('data-material') || '';
      const rSt = r.getAttribute('data-status') || '';

      const matchQ = !q || txt.includes(q);
      const matchMat = (selMat === 'ALL') || (rMat === selMat);
      const matchSt = (selSt === 'ALL') || (rSt === selSt);

      if (matchQ && matchMat && matchSt) {
        r.style.display = '';
        count++;
      } else {
        r.style.display = 'none';
      }
    });

    const showing = document.getElementById('showingCountText');
    if (showing) showing.textContent = `Showing ${count} of ${rows.length} logged incidents`;
  }

  wSearch?.addEventListener('input', filterWastage);
  wMat?.addEventListener('change', filterWastage);
  wSt?.addEventListener('change', filterWastage);
  wReset?.addEventListener('click', () => {
    if (wSearch) wSearch.value = '';
    if (wMat) wMat.value = 'ALL';
    if (wSt) wSt.value = 'ALL';
    filterWastage();
  });

  // Initialize Supabase Auth & persistent session verification
  initAuth();

  // Start continuous surveillance clock
  updateSurveillanceClocks();
  setInterval(updateSurveillanceClocks, 1000);
});

// Expose globals for inline event handlers in templates
window.navigateTo = navigateTo;
window.toggleUserMenu = toggleUserMenu;
window.logoutUser = logoutUser;
window.showGlobalToast = showGlobalToast;

window.switchAuthMode = switchAuthMode;
window.showAuthError = showAuthError;
window.hideAuthError = hideAuthError;
window.togglePasswordVisibility = togglePasswordVisibility;
window.handleGoogleSignIn = handleGoogleSignIn;
window.handleSignInSubmit = handleSignInSubmit;

window.switchCameraFeed = switchCameraFeed;
window.adjustPrimaryZoom = adjustPrimaryZoom;
window.selectGridLayout = selectGridLayout;
window.toggleAudio = toggleAudio;
window.captureSnapshot = captureSnapshot;
window.takeAllSnapshots = takeAllSnapshots;
window.addCameraStream = addCameraStream;
window.toggleFullscreen = toggleFullscreen;
window.triggerRegisterModal = triggerRegisterModal;
window.saveNewStream = saveNewStream;

window.switchAlertView = switchAlertView;

window.adjustZoom = adjustZoom;
window.resetBlueprint = resetBlueprint;
window.fitBlueprint = fitBlueprint;
window.toggleSitemapLayer = toggleSitemapLayer;
window.openMarkerDrawer = openMarkerDrawer;
window.closeMarkerDrawer = closeMarkerDrawer;

window.openDetailsModal = openDetailsModal;
window.closeDetailsModal = closeDetailsModal;
window.executeVerification = executeVerification;

window.toggleWastageModal = toggleWastageModal;
window.openInvestigationModal = openInvestigationModal;
window.closeInvestigationDrawer = closeInvestigationDrawer;
window.resolveRecordRow = resolveRecordRow;
window.setVendorClaimStatus = setVendorClaimStatus;
window.openPhotoViewerModal = openPhotoViewerModal;
window.closePhotoViewerModal = closePhotoViewerModal;
