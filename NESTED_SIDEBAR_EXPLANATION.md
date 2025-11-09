# Nested Sidebar Implementation Guide

This document explains how the nested sidebar system works in the React + TypeScript application.

## Overview

When a user clicks on the "People" menu item:
1. The main sidebar collapses to show only icons (reduces width)
2. A second sidebar appears on the right side of the main sidebar
3. The second sidebar displays: Tenants, Owners, Vendors, Prospects
4. When "People" is not selected, the second sidebar hides
5. All transitions are smooth with animations

## Architecture

```
┌─────────────┬──────────────┬─────────────────────┐
│ Main Sidebar │ Second       │ Main Content        │
│ (Icons Only) │ Sidebar      │ Area                │
│              │              │                     │
│ • Overview   │ ← PEOPLE     │                     │
│ • People ✓   │ DIRECTORY    │                     │
│ • Accounts   │ • Tenants    │                     │
│ • ...        │ • Owners     │                     │
│              │ • Vendors    │                     │
│              │ • Prospects  │                     │
└─────────────┴──────────────┴─────────────────────┘
```

## Component Structure

### 1. AdminLayout.tsx (Main Layout Controller)

**Purpose**: Controls the overall layout and manages sidebar states.

**Key Features**:
- Detects when "People" route is active using `useLocation()`
- Automatically collapses main sidebar when People is active
- Conditionally renders the second sidebar

**Code Explanation**:

```typescript
// Step 1: Get current route location
const location = useLocation();

// Step 2: Check if People section is active
const isPeopleActive = location.pathname.startsWith(ROUTES.PEOPLE);

// Step 3: Automatically collapse main sidebar when People is active
useEffect(() => {
  if (isPeopleActive && !isSidebarCollapsed) {
    setIsSidebarCollapsed(true);
  }
}, [isPeopleActive, isSidebarCollapsed]);
```

**Why this works**:
- `useLocation()` from React Router gives us the current URL
- `startsWith()` checks if we're on any People-related route
- `useEffect` automatically collapses the sidebar when People becomes active
- The second sidebar is conditionally rendered based on `isPeopleActive`

### 2. Sidebar.tsx (Main Sidebar)

**Purpose**: Displays the main navigation with icons and labels.

**Key Features**:
- Collapses to icons-only when `isCollapsed` is true
- Uses Framer Motion for smooth width transitions
- Hides labels and text when collapsed

**Code Explanation**:

```typescript
// Step 1: Animate width based on collapsed state
<motion.aside
  animate={{
    width: isCollapsed ? 80 : 256,  // 80px for icons, 256px for full
  }}
  transition={{ duration: 0.3, ease: 'easeInOut' }}
>
```

**Why this works**:
- `motion.aside` is a Framer Motion component that can animate properties
- `animate` prop controls the width: 80px (icons only) or 256px (full width)
- `transition` defines smooth animation over 0.3 seconds

**Label Hiding**:

```typescript
<motion.span
  animate={{ 
    opacity: isCollapsed || isPeopleActive ? 0 : 1, 
    width: isCollapsed || isPeopleActive ? 0 : 'auto' 
  }}
  transition={{ duration: 0.3 }}
>
  {item.label}
</motion.span>
```

**Why this works**:
- Labels fade out (opacity: 0) and collapse (width: 0) when sidebar is collapsed
- `AnimatePresence` handles smooth exit animations for elements that disappear

### 3. SecondSidebar.tsx (Nested Sidebar)

**Purpose**: Displays the Directory navigation when People is active.

**Key Features**:
- Slides in/out smoothly using Framer Motion
- Shows search bar, back button, and directory items
- Highlights active section

**Code Explanation**:

```typescript
<AnimatePresence>
  {isVisible && (
    <motion.aside
      initial={{ width: 0, opacity: 0 }}    // Start: hidden, no width
      animate={{ width: 240, opacity: 1 }}  // End: visible, 240px wide
      exit={{ width: 0, opacity: 0 }}       // Exit: hide again
      transition={{ duration: 0.3, ease: 'easeInOut' }}
    >
```

**Why this works**:
- `AnimatePresence` allows components to animate when mounting/unmounting
- `initial` defines starting state (hidden, width 0)
- `animate` defines end state (visible, width 240px)
- `exit` defines how it disappears
- The sidebar smoothly slides in from 0 to 240px width

**Active Section Detection**:

```typescript
const getActiveSection = (): string | null => {
  if (location.pathname.includes('/tenants')) return 'Tenants';
  if (location.pathname.includes('/employees')) return 'Employees';
  if (location.pathname.includes('/vendors')) return 'Vendors';
  if (location.pathname.includes('/prospects')) return 'Prospects';
  return null;
};
```

**Why this works**:
- Checks URL pathname to determine which section is active
- Returns the section name or null
- Used to highlight the active item in the directory

## State Management Flow

```
User clicks "People"
    ↓
AdminLayout detects route change (useLocation)
    ↓
isPeopleActive becomes true
    ↓
useEffect triggers → setIsSidebarCollapsed(true)
    ↓
Main Sidebar animates to 80px width
    ↓
SecondSidebar receives isVisible={true}
    ↓
SecondSidebar slides in (0px → 240px)
    ↓
User sees: [Icons] [Directory] [Content]
```

## Animation Details

### Main Sidebar Collapse
- **Duration**: 0.3 seconds
- **Easing**: easeInOut (smooth start and end)
- **Properties**: Width (256px → 80px), Opacity (labels fade)

### Second Sidebar Slide-in
- **Duration**: 0.3 seconds
- **Easing**: easeInOut
- **Properties**: Width (0px → 240px), Opacity (0 → 1)

### Why Framer Motion?
- Smooth, performant animations
- Easy to use API
- Handles mount/unmount animations automatically
- Works well with React's rendering cycle

## Key React Hooks Used

1. **useState**: Manages sidebar collapsed state
2. **useEffect**: Automatically collapses sidebar when People is active
3. **useLocation**: Detects current route
4. **useNavigate**: Programmatic navigation

## CSS Classes Used

- `transition-all duration-300`: Smooth transitions
- `overflow-hidden`: Prevents content overflow during animation
- `flex-shrink-0`: Prevents sidebar from shrinking
- `animate`: Framer Motion animation prop

## Testing the Implementation

1. Click "People" in main sidebar
2. Observe: Main sidebar collapses to icons
3. Observe: Second sidebar slides in from left
4. Click a directory item (e.g., "Tenants")
5. Observe: Active item is highlighted
6. Navigate away from People
7. Observe: Second sidebar slides out, main sidebar expands

## Customization

### Change Animation Speed
```typescript
transition={{ duration: 0.5, ease: 'easeInOut' }}  // Slower
transition={{ duration: 0.2, ease: 'easeInOut' }}  // Faster
```

### Change Sidebar Widths
```typescript
width: isCollapsed ? 60 : 256,  // Smaller collapsed width
animate={{ width: 280, opacity: 1 }}  // Wider second sidebar
```

### Add More Directory Items
Edit `peopleSections` array in `SecondSidebar.tsx`:
```typescript
const peopleSections: PeopleSection[] = [
  { id: 'Tenants', label: 'Tenants', path: ROUTES.TENANTS },
  { id: 'Employees', label: 'Owners', path: ROUTES.EMPLOYEES },
  // Add more items here
];
```

## Troubleshooting

**Issue**: Second sidebar doesn't appear
- Check: Is `isPeopleActive` true?
- Check: Is `isVisible` prop passed correctly?

**Issue**: Animations are choppy
- Check: Is Framer Motion installed?
- Check: Are there conflicting CSS transitions?

**Issue**: Main sidebar doesn't collapse
- Check: Is `isSidebarCollapsed` state updating?
- Check: Is `useEffect` dependency array correct?

## Summary

The nested sidebar system uses:
- **React Router** for route detection
- **Framer Motion** for smooth animations
- **React Hooks** for state management
- **Conditional Rendering** for showing/hiding sidebars

The result is a smooth, intuitive navigation experience where the main sidebar collapses to make room for the nested directory sidebar when needed.


