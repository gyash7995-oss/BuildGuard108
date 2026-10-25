import re, json

def get_extracted_body(filename):
    with open(f'stitch_source/{filename}.html') as f:
        html = f.read()

    # Image replacements
    img_replacements = [
        ('https://lh3.googleusercontent.com/aida-public/AB6AXuCVoZWAnQCV-jV32FD-vo0TpnS-c6iOA-RFGjarP_8HO_W7smitc5ajrrdMKaYD8UIBqa2Izx5GZOaupkBtSVT-hu627KPhb7qsc72efZBwaynf_f8W_B4p54xwJzMIIEKM7yc-dUDPKhmZTbPI5TZzW55FLmIjujk_oi-FQkuPWwCOh_-RtnSZY6hG4pWYJ2-lovDMbrmBG9d9MhYTHE1Cpzmk800QQkr26WLUhs1l_TloVYjfVMB-', 'assets/img/login_hero.jpg'),
        ('https://lh3.googleusercontent.com/aida-public/AB6AXuBxoahNotBJ4y0YJiCO_E_B-51xZ17trVBzKXfFSCNRIjZfHXUJlQVC4ggYzvf-1T8asHYjSayPR9WVP6_5_rO-ZJOfB_MxqyOeW8xxcjHvq6K__H7faBfkAkX9x8XUambM3ZDQxU_kvA8GTuUvteM4iMNdNC2Q5wQI8PT8xPHyRVEQ4_RklUKDtDCGqgTFmXrVs1WPx0zxOGyeN86R06qLCBzADBeXlUCe3uIZl9Q6eOs6-UVs8KIU', 'assets/img/live_monitoring_0.jpg'),
        ('https://lh3.googleusercontent.com/aida-public/AB6AXuCBlN5vu8xuY6PBr8XRHxJWiqNQIaDI4uaHALXZRn_WPgSuItm-EiEMOJRYGdBRcUktvtVyMPzUTjNlu36NyIgRpbEM109Hxf5jc8mFfN-PR3hNcD4SJaYhSrz6ml3YBvVmCOxNbCdcWxbLfbvJQ-7vwIhfQKk0wyqW7scfAJkR1NjM1IbNfClanTx78H7XdrhKRjvEcbn_jdk8UBFQ4q_2ygRIEAD2LEr-aLaOS3zFvtAyckvKBGV1', 'assets/img/movement_0.jpg'),
        ('https://lh3.googleusercontent.com/aida-public/AB6AXuDWreOIBiMw1u_g4qdBSZEcQoyuTNaOmgfwERCSL-O4tJTAxxlDN93FYgKSHGxlqMO1yTgoyhdcaVr7_JhE_7LL-FQ-TpVNvlIKdX5KY1mprKOZ6_01P8V5fAtLENDVsyA1Yb4N06Pu8O1t4ZP2UGzcwOnNJPpVkkxCJbejK17Zyq-9FFKi6nYXUlMh3oZMjKsaTvNiNsv3RYuet6pHlHxEdOb0TZvpZ5Z1V01eyYKchModOhfkwb7e', 'assets/img/wastage_0.jpg'),
        ('https://lh3.googleusercontent.com/aida-public/AB6AXuDUc8KjivdeNDA1IKwP6kg5BGqqNtIaX0bDuOxY65VrVGXjYwwgnEM4Bhj9s6Kg76DdLmXdDbDfOnEMaYUqp1BExxR3GkdCFDx0HC9US2YyHRdSqeBPqiR9Ux6g00GZkdaTdoECK8nUjQ3NV6W9ENL27AvX47_Qke70KJBn08XuRj1yFpVrpxFybaF8e6H4o-ss_6AA3zOo6fRgj1nX1afNc8sSt_7YNU_1FcbDP863-zkiYh7Cb84w', 'assets/img/wastage_1.jpg'),
        ('https://lh3.googleusercontent.com/aida-public/AB6AXuAZeUIa7K4hmfa4lFjyPz6YS7OSrDLvvgzzEqc1zxvDR2PZM-iq_ZO6NhOi78Puy0gHFsU7UW4IMI9PLMdyH0pTyvjta7Sj3Q9VAuHg3ZBXYgxwtRwyeWBmGR-mdoSG9PfMqRUfCr9oB7q-YtyFwFa1RQ3-LxEtbZd14ILiUMXUBxcOFZcMNCRqpRll1kQhmItzXMIN3NVsbuAV8MA0hqJ6qYKAIFdgKs5yX15215ObdgX8clYqwtXh', 'assets/img/sitemap_0.jpg')
    ]
    for orig, rep in img_replacements:
        html = html.replace(orig, rep)

    body_match = re.search(r'<body[^>]*>([\s\S]*?)</body>', html)
    if not body_match:
        return ''
    
    body = body_match.group(1)
    
    # Remove header if present
    body = re.sub(r'<header[\s\S]*?</header>', '', body)
    
    # Remove inline scripts
    body = re.sub(r'<script[\s\S]*?</script>', '', body)
    
    # In alerts, inject the Forensic Inspection Modal / Drawer and Tab switcher buttons if helpful
    return body.strip()

print("Generating index.html...")

pages = {
    'login': get_extracted_body('login'),
    'dashboard': get_extracted_body('dashboard'),
    'live-monitoring': get_extracted_body('live_monitoring'),
    'alerts': get_extracted_body('alerts'),
    'sitemap': get_extracted_body('sitemap'),
    'movement': get_extracted_body('movement'),
    'wastage': get_extracted_body('wastage'),
}

# In movement, make sure exportCsvBtn is present in the Header Context Strip
pages['movement'] = pages['movement'].replace(
    'class="flex items-center gap-space-sm">\n\n\n</div>',
    'class="flex items-center gap-space-sm">\n  <button class="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-surface-container hover:bg-surface-container-high text-on-surface font-label-md text-label-md transition-all shadow-sm" id="exportCsvBtn" type="button"><span class="material-symbols-outlined text-[18px] text-tertiary">download</span><span>Export Manifest</span></button>\n</div>'
)

# Enhance Login page with Supabase Auth: dynamic login/signup switch, clean generic error banner, and seamless design preservation
login_enhancement = """
<div class="mb-5">
  <div class="flex items-center p-1 bg-surface-container-low rounded-xl border border-outline-variant/30 mb-4">
    <button type="button" id="auth-tab-signin" onclick="switchAuthMode('signin')" class="flex-1 py-2 rounded-lg text-xs font-bold transition-all text-center bg-surface-container-lowest text-primary shadow-xs">
      Site Sign In
    </button>
    <button type="button" id="auth-tab-signup" onclick="switchAuthMode('signup')" class="flex-1 py-2 rounded-lg text-xs font-semibold transition-all text-center text-on-surface-variant hover:text-on-surface">
      Create Account
    </button>
  </div>
  <h1 id="auth-title" class="font-headline-xl text-2xl sm:text-3xl font-bold tracking-tight text-on-surface">Sign In to Site Portal</h1>
  <p id="auth-subtitle" class="text-xs text-on-surface-variant mt-1">Access verified live telemetry and CCTV streams</p>
</div>
<div id="auth-error-box" class="hidden mb-4 p-3 rounded-xl bg-error-container/30 border border-error/30 text-error flex items-start gap-2.5 text-xs font-medium">
  <span class="material-symbols-outlined text-base mt-0.5 flex-shrink-0">error</span>
  <span id="auth-error-text">Login ID ya password galat hai.</span>
</div>
"""

pages['login'] = pages['login'].replace(
    '<div class="mb-7">\n<h1 class="font-headline-xl text-2xl sm:text-3xl font-bold tracking-tight text-on-surface">Sign In to Site Portal</h1>\n\n</div>',
    login_enhancement
)

# Replace the login form with clean email & password inputs and dynamic submit handling
login_form_replacement = """<form class="space-y-4" id="signin-form" onsubmit="event.preventDefault(); handleSignInSubmit();">
<div class="space-y-1.5" id="fullname-field-container" style="display: none;">
  <label class="block font-label-md text-xs sm:text-sm text-on-surface font-semibold" for="work-name">Full Name</label>
  <div class="relative flex items-center">
    <span class="material-symbols-outlined absolute left-3.5 text-primary text-lg pointer-events-none">badge</span>
    <input class="w-full h-11 pl-10 pr-4 bg-surface-container-low text-on-surface placeholder:text-tertiary/60 rounded-lg font-body-md text-sm focus:bg-surface-container-lowest focus:outline-none focus:ring-2 focus:ring-primary/25 focus:border-primary transition-all border border-surface-container hover:border-outline-variant" id="work-name" name="name" placeholder="Rajesh Mehta" type="text" autocomplete="name">
  </div>
</div>
<div class="space-y-1.5">
  <label class="block font-label-md text-xs sm:text-sm text-on-surface font-semibold" for="work-email" id="email-label">Site Email Address</label>
  <div class="relative flex items-center">
    <span class="material-symbols-outlined absolute left-3.5 text-primary text-lg pointer-events-none">mail</span>
    <input class="w-full h-11 pl-10 pr-4 bg-surface-container-low text-on-surface placeholder:text-tertiary/60 rounded-lg font-body-md text-sm focus:bg-surface-container-lowest focus:outline-none focus:ring-2 focus:ring-primary/25 focus:border-primary transition-all border border-surface-container hover:border-outline-variant" id="work-email" name="email" placeholder="name@company.com" required="" type="email" autocomplete="username">
  </div>
</div>
<div class="space-y-1.5">
  <div class="flex items-center justify-between">
    <label class="block font-label-md text-xs sm:text-sm text-on-surface font-semibold" for="password-input">Password</label>
  </div>
  <div class="relative flex items-center">
    <span class="material-symbols-outlined absolute left-3.5 text-primary text-lg pointer-events-none">lock</span>
    <input class="w-full h-11 pl-10 pr-11 bg-surface-container-low text-on-surface placeholder:text-tertiary/60 rounded-lg font-body-md text-sm focus:bg-surface-container-lowest focus:outline-none focus:ring-2 focus:ring-primary/25 focus:border-primary transition-all border border-surface-container hover:border-outline-variant tracking-wider" id="password-input" name="password" placeholder="••••••••••••" required="" type="password" autocomplete="current-password">
    <button aria-label="Show or hide password" class="absolute right-2.5 text-tertiary hover:text-on-surface flex items-center justify-center p-1.5 rounded-md hover:bg-surface-container focus:outline-none transition-colors" id="toggle-password-btn" onclick="togglePasswordVisibility()" type="button">
      <span class="material-symbols-outlined text-lg" id="eye-icon">visibility</span>
    </button>
  </div>
</div>
<div class="flex items-center justify-between pt-1" id="remember-forgot-row">
  <label class="flex items-center space-x-2 cursor-pointer select-none">
    <input checked="" class="w-4 h-4 rounded text-primary focus:ring-primary bg-surface-container-low cursor-pointer accent-primary" id="remember-device" type="checkbox">
    <span class="font-body-sm text-xs text-tertiary font-medium">Remember device</span>
  </label>
  <a class="font-label-md text-xs text-primary hover:text-primary-container hover:underline font-semibold transition-colors focus:outline-none" href="#" onclick="event.preventDefault(); showGlobalToast('Password reset instructions will be sent to registered email.', 'mail');">Forgot password?</a>
</div>
<!-- Submit Button -->
<button class="w-full h-11 bg-primary hover:bg-primary-container text-on-primary font-headline-sm text-sm rounded-lg flex items-center justify-center space-x-2 shadow-md hover:shadow-lg active:scale-[0.99] transition-all font-semibold mt-3 focus:outline-none focus:ring-2 focus:ring-primary/30" id="submit-btn" type="submit">
  <span id="submit-btn-text">Sign In to Dashboard</span>
  <span class="material-symbols-outlined text-base" id="submit-btn-icon">arrow_forward</span>
</button>
</form>"""

pages['login'] = re.sub(
    r'<form class="space-y-4" id="signin-form"[\s\S]*?</form>',
    login_form_replacement,
    pages['login']
)

# In alerts, add Tab Buttons in the operational table header so user can easily toggle Realtime vs Periodic
pages['alerts'] = pages['alerts'].replace(
    '<h2 class="font-headline-sm text-headline-sm font-bold text-on-surface tracking-tight">Live Verification</h2>',
    '<div class="flex items-center gap-3"><h2 class="font-headline-sm text-headline-sm font-bold text-on-surface tracking-tight">Live Verification</h2><div class="flex items-center bg-surface-container-low p-1 rounded-xl border border-outline-variant/30 gap-1"><button type="button" id="tab-btn-realtime" onclick="switchAlertView(\'realtime\')" class="px-3 py-1 rounded-lg font-label-md text-label-md font-bold transition-all flex items-center gap-1.5 shadow-sm bg-surface-container-lowest text-primary border border-outline-variant/30"><span class="w-2 h-2 rounded-full bg-error animate-pulse"></span>Live Realtime Queue</button><button type="button" id="tab-btn-periodic" onclick="switchAlertView(\'periodic\')" class="px-3 py-1 rounded-lg font-label-md text-label-md font-semibold transition-all flex items-center gap-1.5 text-on-surface-variant hover:text-on-surface hover:bg-surface-container-lowest/70"><span class="material-symbols-outlined text-[15px] text-secondary">schedule</span>Periodic AI Sweeps</button></div></div>'
)

# Also in periodic view header, add a back button to return to realtime queue
pages['alerts'] = pages['alerts'].replace(
    '<h2 class="font-headline-sm text-headline-sm font-bold text-on-surface">Periodic AI Optical Sweeps &amp; Automated Verification</h2>',
    '<div class="flex items-center gap-3"><button type="button" onclick="switchAlertView(\'realtime\')" class="px-2.5 py-1.5 rounded-lg bg-surface-container-low hover:bg-surface-container text-on-surface flex items-center gap-1 text-xs font-semibold border border-outline-variant/30"><span class="material-symbols-outlined text-[16px]">arrow_back</span> Return to Live Queue</button><h2 class="font-headline-sm text-headline-sm font-bold text-on-surface">Periodic AI Optical Sweeps &amp; Automated Verification</h2></div>'
)

# In sitemap, add global SVG defs if missing
sitemap_defs = """
<svg aria-hidden="true" style="position: absolute; width: 0; height: 0; overflow: hidden;" version="1.1" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <pattern height="40" id="cadGrid" patternUnits="userSpaceOnUse" width="40">
      <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#172b44" stroke-width="0.75"></path>
      <path d="M 200 0 L 0 0 0 200" fill="none" opacity="0.6" stroke="#223e63" stroke-width="1.25"></path>
    </pattern>
    <pattern height="8" id="diagonalHatch" patternTransform="rotate(45 0 0)" patternUnits="userSpaceOnUse" width="8">
      <line opacity="0.3" stroke="#1d4ed8" stroke-width="1" x1="0" x2="0" y1="0" y2="8"></line>
    </pattern>
    <pattern height="10" id="dangerHatch" patternTransform="rotate(45 0 0)" patternUnits="userSpaceOnUse" width="10">
      <line opacity="0.4" stroke="#ba1a1a" stroke-width="1.5" x1="0" x2="0" y1="0" y2="10"></line>
    </pattern>
  </defs>
</svg>
"""

# Let's write the complete unified index.html
index_html = f"""<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>BuildGuard AI - Intelligent Construction Site Surveillance & Loss Prevention</title>
  
  <!-- Google Fonts: Inter & Plus Jakarta Sans & Material Symbols -->
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Plus+Jakarta+Sans:wght@600;700;800&family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200&display=swap" rel="stylesheet">
  
  <!-- Supabase JS Client for Secure Auth -->
  <script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>
  
  <!-- Tailwind Play CDN for Exact Design System Mapping -->
  <script src="https://cdn.tailwindcss.com?plugins=forms,container-queries"></script>
  <script>
    tailwind.config = {{
      darkMode: "class",
      theme: {{
        extend: {{
          colors: {{
            "on-secondary-fixed": "#001d31",
            "surface-container-lowest": "#ffffff",
            "on-error-container": "#93000a",
            "primary-container": "#15803d",
            "tertiary": "#4f576d",
            "on-error": "#ffffff",
            "tertiary-fixed-dim": "#bec6e0",
            "error": "#ba1a1a",
            "surface-bright": "#f8f9ff",
            "on-primary-fixed": "#00210a",
            "on-primary-container": "#d3ffd5",
            "on-primary": "#ffffff",
            "outline": "#6f7a6e",
            "primary": "#00652c",
            "surface-container-highest": "#d3e4fe",
            "on-background": "#0b1c30",
            "outline-variant": "#becabc",
            "on-tertiary-fixed-variant": "#3f465c",
            "on-surface-variant": "#3f493f",
            "tertiary-fixed": "#dae2fd",
            "on-surface": "#0b1c30",
            "secondary-fixed": "#cce5ff",
            "inverse-surface": "#213145",
            "primary-fixed-dim": "#79db8d",
            "error-container": "#ffdad6",
            "on-secondary-container": "#00476e",
            "inverse-primary": "#79db8d",
            "on-tertiary-container": "#f2f3ff",
            "secondary": "#006398",
            "on-tertiary": "#ffffff",
            "tertiary-container": "#676f86",
            "on-secondary-fixed-variant": "#004b73",
            "surface-variant": "#d3e4fe",
            "surface-dim": "#cbdbf5",
            "secondary-fixed-dim": "#93ccff",
            "surface-tint": "#006d30",
            "surface-container-low": "#eff4ff",
            "secondary-container": "#5bb8fe",
            "inverse-on-surface": "#eaf1ff",
            "on-primary-fixed-variant": "#005323",
            "primary-fixed": "#95f8a7",
            "background": "#f8f9ff",
            "surface": "#f8f9ff",
            "surface-container": "#e5eeff",
            "on-tertiary-fixed": "#131b2e",
            "on-secondary": "#ffffff",
            "surface-container-high": "#dce9ff"
          }},
          borderRadius: {{
            DEFAULT: "0.25rem",
            lg: "0.5rem",
            xl: "0.75rem",
            full: "9999px"
          }},
          spacing: {{
            "space-md": "1rem",
            "margin-tablet": "1.5rem",
            "space-xs": "0.25rem",
            margin: "1rem",
            "space-xl": "2.25rem",
            "space-lg": "1.5rem",
            "gutter-desktop": "1.5rem",
            "margin-desktop": "2rem",
            "space-sm": "0.5rem",
            gutter: "1rem",
            "gutter-tablet": "1.25rem"
          }},
          fontFamily: {{
            "data-tabular": ["Inter", "sans-serif"],
            "headline-lg-mobile": ["Plus Jakarta Sans", "sans-serif"],
            "body-md": ["Inter", "sans-serif"],
            "headline-sm": ["Plus Jakarta Sans", "sans-serif"],
            "label-md": ["Inter", "sans-serif"],
            "body-lg": ["Inter", "sans-serif"],
            "label-sm": ["Inter", "sans-serif"],
            "headline-lg": ["Plus Jakarta Sans", "sans-serif"],
            "headline-xl": ["Plus Jakarta Sans", "sans-serif"],
            "body-sm": ["Inter", "sans-serif"],
            "headline-md": ["Plus Jakarta Sans", "sans-serif"],
            "label-lg": ["Inter", "sans-serif"],
            "headline-xl-mobile": ["Plus Jakarta Sans", "sans-serif"]
          }},
          fontSize: {{
            "data-tabular": ["0.875rem", {{ lineHeight: "1.25rem", letterSpacing: "0.02em", fontWeight: "500" }}],
            "headline-lg-mobile": ["1.375rem", {{ lineHeight: "1.75rem", letterSpacing: "-0.01em", fontWeight: "600" }}],
            "body-md": ["0.875rem", {{ lineHeight: "1.25rem", letterSpacing: "0", fontWeight: "400" }}],
            "headline-sm": ["1rem", {{ lineHeight: "1.375rem", letterSpacing: "0", fontWeight: "600" }}],
            "label-md": ["0.75rem", {{ lineHeight: "1rem", letterSpacing: "0.02em", fontWeight: "500" }}],
            "body-lg": ["1rem", {{ lineHeight: "1.5rem", letterSpacing: "-0.005em", fontWeight: "400" }}],
            "label-sm": ["0.6875rem", {{ lineHeight: "0.875rem", letterSpacing: "0.04em", fontWeight: "600" }}],
            "headline-lg": ["1.75rem", {{ lineHeight: "2.25rem", letterSpacing: "-0.015em", fontWeight: "600" }}],
            "headline-xl": ["2.25rem", {{ lineHeight: "2.75rem", letterSpacing: "-0.02em", fontWeight: "700" }}],
            "body-sm": ["0.75rem", {{ lineHeight: "1rem", letterSpacing: "0", fontWeight: "400" }}],
            "headline-md": ["1.25rem", {{ lineHeight: "1.625rem", letterSpacing: "-0.01em", fontWeight: "600" }}],
            "label-lg": ["0.875rem", {{ lineHeight: "1.25rem", letterSpacing: "0.01em", fontWeight: "600" }}],
            "headline-xl-mobile": ["1.75rem", {{ lineHeight: "2.25rem", letterSpacing: "-0.015em", fontWeight: "700" }}]
          }}
        }}
      }}
    }};
  </script>
  
  <link rel="stylesheet" href="style.css">
</head>
<body class="bg-background text-on-surface font-body-md text-body-md antialiased min-h-screen flex flex-col">

  {sitemap_defs}

  <!-- GLOBAL APPLICATION HEADER (Shown for all authenticated screens) -->
  <header id="global-app-header" class="fixed top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-md shadow-[0_1px_8px_rgba(0,0,0,0.04)] border-b border-outline-variant/30 hidden">
    <div class="h-16 w-full px-space-md lg:px-margin-desktop flex items-center justify-between gap-space-md">
      <!-- Brand Logo -->
      <div class="flex items-center gap-space-sm flex-shrink-0">
        <a class="flex items-center gap-1.5 cursor-pointer focus:outline-none" href="#" data-path="dashboard">
          <span class="font-headline-sm text-headline-sm text-[#0b1c30] tracking-tight font-bold">BuildGuard</span>
          <span class="text-[#006398] font-bold text-headline-sm">AI</span>
          <span class="inline-block w-2.5 h-2.5 rounded-full bg-[#15803d]"></span>
        </a>
      </div>

      <!-- Navigation Pill Bar -->
      <nav class="hidden lg:flex items-center gap-1.5 bg-[#eff4ff] px-2.5 py-1.5 rounded-full shadow-sm border border-outline-variant/30" id="global-nav">
        <a href="#" data-path="dashboard" class="nav-item px-3.5 py-1.5 rounded-full text-on-surface-variant hover:text-on-surface hover:bg-surface-container transition-all text-sm font-medium">Dashboard</a>
        <a href="#" data-path="live-monitoring" class="nav-item px-3.5 py-1.5 rounded-full text-on-surface-variant hover:text-on-surface hover:bg-surface-container transition-all text-sm font-medium">Live Monitoring</a>
        <a href="#" data-path="alerts" class="nav-item px-3.5 py-1.5 rounded-full text-on-surface-variant hover:text-on-surface hover:bg-surface-container transition-all flex items-center gap-1.5 text-sm font-medium">
          <span>Alerts</span>
          <span class="w-5 h-5 rounded-full bg-[#ba1a1a] text-white text-xs flex items-center justify-center font-bold leading-none" id="global-alert-badge">3</span>
        </a>
        <a href="#" data-path="sitemap" class="nav-item px-3.5 py-1.5 rounded-full text-on-surface-variant hover:text-on-surface hover:bg-surface-container transition-all text-sm font-medium">Sitemap</a>
        <a href="#" data-path="movement" class="nav-item px-3.5 py-1.5 rounded-full text-on-surface-variant hover:text-on-surface hover:bg-surface-container transition-all text-sm font-medium">Movement</a>
        <a href="#" data-path="wastage" class="nav-item px-3.5 py-1.5 rounded-full text-on-surface-variant hover:text-on-surface hover:bg-surface-container transition-all text-sm font-medium">Wastage</a>
      </nav>

      <!-- Right Utility Actions -->
      <div class="flex items-center gap-3 flex-shrink-0">
        <!-- Site Selector -->
        <div class="relative group">
          <button class="flex items-center gap-2 bg-[#eff4ff] hover:bg-surface-container text-on-surface px-3 py-1.5 rounded-full transition-colors border border-outline-variant/30" type="button" id="site-selector-btn">
            <span class="material-symbols-outlined text-[18px] text-[#006398]">apartment</span>
            <span class="text-xs sm:text-sm font-semibold text-[#0b1c30]">Residential Tower A</span>
            <span class="inline-block w-2 h-2 rounded-full bg-[#15803d]"></span>
            <span class="material-symbols-outlined text-[18px] text-on-surface-variant">expand_more</span>
          </button>
        </div>

        <!-- Notification Bell -->
        <div class="relative group">
          <button aria-label="Notifications" class="relative p-2 rounded-full hover:bg-surface-container-low text-on-surface-variant transition-colors flex items-center justify-center" type="button" onclick="navigateTo('alerts')">
            <span class="material-symbols-outlined text-[22px] text-[#0b1c30]">notifications</span>
            <span class="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full bg-[#ba1a1a] text-white text-[10px] font-bold flex items-center justify-center leading-none ring-2 ring-white">3</span>
          </button>
        </div>

        <!-- User Profile Avatar & Logout Dropdown -->
        <div class="relative group pl-1">
          <button class="flex items-center gap-2 p-1 rounded-full hover:bg-surface-container-low transition-colors" type="button" id="user-profile-btn" onclick="toggleUserMenu()">
            <div id="header-user-avatar" class="w-8 h-8 rounded-full bg-[#00652c] text-white font-bold text-xs flex items-center justify-center tracking-wider shadow-xs">BG</div>
            <div class="hidden md:flex flex-col text-left">
              <span id="header-user-name" class="text-xs text-[#0b1c30] font-bold leading-tight">Site Operator</span>
              <span id="header-user-role" class="text-[11px] text-on-surface-variant leading-tight">Project Director</span>
            </div>
            <span class="material-symbols-outlined text-[16px] text-on-surface-variant hidden md:block">expand_more</span>
          </button>

          <!-- Dropdown menu -->
          <div id="user-profile-menu" class="hidden absolute right-0 mt-2 w-52 bg-surface-container-lowest rounded-xl shadow-xl border border-outline-variant/30 py-1.5 z-50">
            <div class="px-4 py-2 border-b border-outline-variant/20">
              <p id="dropdown-user-name" class="text-xs font-bold text-on-surface">Site Operator</p>
              <p id="dropdown-user-email" class="text-[11px] text-on-surface-variant truncate">operator@buildguard.ai</p>
            </div>
            <a href="#" onclick="event.preventDefault(); showGlobalToast('Role: Verified Site Clearance', 'verified_user');" class="flex items-center gap-2 px-4 py-2 text-xs text-on-surface hover:bg-surface-container transition-colors">
              <span class="material-symbols-outlined text-[16px] text-primary">security</span> Security Credentials
            </a>
            <a href="#" onclick="event.preventDefault(); logoutUser();" class="flex items-center gap-2 px-4 py-2 text-xs text-error hover:bg-error-container/20 transition-colors">
              <span class="material-symbols-outlined text-[16px]">logout</span> Sign Out
            </a>
          </div>
        </div>
      </div>
    </div>
  </header>

  <!-- 1. LOGIN PAGE VIEW -->
  <div id="page-login" class="page-view">
    {pages['login']}
  </div>

  <!-- 2. DASHBOARD PAGE VIEW -->
  <div id="page-dashboard" class="page-view hidden">
    {pages['dashboard']}
  </div>

  <!-- 3. LIVE MONITORING PAGE VIEW -->
  <div id="page-live-monitoring" class="page-view hidden">
    {pages['live-monitoring']}
  </div>

  <!-- 4. ALERTS PAGE VIEW -->
  <div id="page-alerts" class="page-view hidden">
    {pages['alerts']}
  </div>

  <!-- 5. SITEMAP PAGE VIEW -->
  <div id="page-sitemap" class="page-view hidden">
    {pages['sitemap']}
  </div>

  <!-- 6. MOVEMENT PAGE VIEW -->
  <div id="page-movement" class="page-view hidden">
    {pages['movement']}
  </div>

  <!-- 7. WASTAGE PAGE VIEW -->
  <div id="page-wastage" class="page-view hidden">
    {pages['wastage']}
  </div>

  <!-- Global Toast Notification Banner -->
  <div id="global-toast" class="fixed bottom-6 right-6 z-50 transform transition-all duration-300 pointer-events-none flex items-center gap-3 bg-surface-container-lowest text-on-surface px-4 py-3 rounded-xl shadow-2xl border-l-4 border-primary translate-y-16 opacity-0">
    <div class="w-7 h-7 rounded-full bg-on-primary-container text-primary flex items-center justify-center flex-shrink-0">
      <span class="material-symbols-outlined text-[18px]" id="global-toast-icon">check</span>
    </div>
    <div>
      <h4 class="font-label-lg text-label-lg font-semibold text-on-surface" id="global-toast-title">Notification</h4>
      <p class="font-body-sm text-body-sm text-on-surface-variant" id="global-toast-msg">Details</p>
    </div>
  </div>

  <script src="script.js"></script>
</body>
</html>
"""

with open('index.html', 'w') as f:
    f.write(index_html)

print("index.html successfully written! Size:", len(index_html), "bytes")
