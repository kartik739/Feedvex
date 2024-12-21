# Feedvex User Guide

## Getting Started

### Creating an Account

1. Click **Sign Up** in the header
2. Enter your email, username, and password
3. Click **Create Account**
4. You'll be automatically logged in

### Logging In

1. Click **Login** in the header
2. Enter your email and password
3. Click **Sign In**

---

## Searching Reddit Content

### Basic Search

1. Enter your search query in the search bar
2. Press **Enter** or click the search icon
3. Results will appear below with:
   - Post title (highlighted search terms)
   - Snippet of content
   - Metadata (subreddit, score, comments, date)

### Autocomplete

As you type, suggestions will appear:
- **Recent searches**: Your previous queries
- **Popular terms**: Frequently searched terms

Use **arrow keys** to navigate suggestions and **Enter** to select.

### Advanced Search

Use the filter panel to refine results:
- **Date Range**: Filter by post date
- **Subreddit**: Limit to specific subreddits
- **Sort By**: 
  - Relevance (default)
  - Date (newest first)
  - Score (highest first)

### Pagination

- Use **Previous** and **Next** buttons to navigate pages
- Click page numbers to jump to specific pages
- Results show 10 items per page

---

## Features

### Dark Mode

Toggle between light and dark themes:
1. Click the **theme icon** in the header (sun/moon)
2. Your preference is saved automatically
3. The app respects your system preference on first visit

### Profile Management

Access your profile:
1. Click your **avatar** in the header
2. Select **Profile**
3. Update your information:
   - Username
   - Email
   - Password
   - Avatar

### Search History

View your recent searches:
1. Go to **Profile** page
2. Scroll to **Search History** section
3. Click any search to re-run it
4. Click **X** to remove individual items
5. Click **Clear All** to remove all history

### Statistics Dashboard

View system statistics:
1. Click **Stats** in the navigation
2. See metrics like:
   - Total documents indexed
   - Total queries processed
   - Cache hit rate
   - Average query time
3. View charts:
   - Query volume over time
   - Popular queries
   - Response time distribution

---

## Keyboard Shortcuts

### Global
- **/** - Focus search bar
- **Esc** - Close modals/dropdowns
- **Ctrl/Cmd + K** - Quick search

### Search Results
- **Arrow Up/Down** - Navigate results
- **Enter** - Open selected result
- **Home** - Jump to first result
- **End** - Jump to last result

### Autocomplete
- **Arrow Up/Down** - Navigate suggestions
- **Enter** - Select suggestion
- **Esc** - Close dropdown

---

## Tips & Tricks

### Better Search Results

1. **Use specific terms**: "react hooks tutorial" vs "react"
2. **Try different keywords**: If no results, rephrase your query
3. **Use filters**: Narrow down by subreddit or date
4. **Check spelling**: Typos may reduce results

### Performance

- **Autocomplete**: Suggestions appear after 2 characters
- **Caching**: Repeated searches load instantly
- **Lazy loading**: Images load as you scroll

### Accessibility

- **Keyboard navigation**: Full keyboard support
- **Screen readers**: ARIA labels on all interactive elements
- **High contrast**: Supports high contrast mode
- **Reduced motion**: Respects motion preferences

---

## Mobile Usage

### Navigation

- Tap **hamburger menu** (☰) for navigation
- Swipe to close menu
- Bottom navigation bar for quick access

### Search

- Tap search bar to focus
- Autocomplete appears below input
- Tap suggestion to select
- Swipe results to scroll

### Gestures

- **Tap**: Select/activate
- **Long press**: Show context menu (where available)
- **Swipe**: Navigate/dismiss

---

## Troubleshooting

### No Search Results

**Possible causes:**
- Query too specific
- No matching content indexed
- Spelling errors

**Solutions:**
- Try broader terms
- Check spelling
- Use different keywords
- Remove filters

### Slow Performance

**Possible causes:**
- Slow internet connection
- Large result set
- Server load

**Solutions:**
- Check internet connection
- Use filters to narrow results
- Try again later

### Login Issues

**Possible causes:**
- Incorrect credentials
- Account doesn't exist
- Network error

**Solutions:**
- Verify email and password
- Try password reset
- Check internet connection
- Clear browser cache

### Page Not Loading

**Possible causes:**
- Network error
- Server down
- Browser cache

**Solutions:**
- Refresh the page
- Check internet connection
- Clear browser cache
- Try different browser

---

## Privacy & Security

### Data Collection

We collect:
- Search queries (for analytics)
- Click events (for ranking improvement)
- Account information (email, username)

We **do not** collect:
- Personal browsing history
- Reddit account credentials
- Location data

### Security

- Passwords are hashed with bcrypt
- JWT tokens for authentication
- HTTPS encryption (in production)
- Rate limiting to prevent abuse

### Data Retention

- Search history: 90 days
- Account data: Until account deletion
- Analytics: Aggregated, no personal data

---

## Accessibility Features

### Screen Reader Support

- Semantic HTML structure
- ARIA labels on all interactive elements
- Live regions for dynamic content
- Skip to content link

### Keyboard Navigation

- Full keyboard support
- Visible focus indicators
- Logical tab order
- Keyboard shortcuts

### Visual Accessibility

- High contrast mode support
- Adjustable font sizes
- Color-blind friendly palette
- Reduced motion option

---

## Browser Support

### Recommended Browsers

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

### Mobile Browsers

- iOS Safari 14+
- Chrome Mobile 90+
- Firefox Mobile 88+

### Features Requiring Modern Browsers

- Lazy loading (IntersectionObserver)
- Smooth animations (CSS transitions)
- Dark mode (CSS variables)
- Service worker (PWA features)

---

## FAQ

**Q: Is Feedvex free to use?**
A: Yes, Feedvex is completely free.

**Q: Do I need a Reddit account?**
A: No, you only need a Feedvex account to use the search.

**Q: How often is content updated?**
A: Content is collected hourly from configured subreddits.

**Q: Can I search all of Reddit?**
A: Currently limited to configured subreddits. More coming soon.

**Q: How do I report a bug?**
A: Contact support or open an issue on GitHub.

**Q: Can I suggest features?**
A: Yes! We welcome feature requests.

**Q: Is my search history private?**
A: Yes, only you can see your search history.

**Q: Can I export my data?**
A: Data export feature coming soon.

---

## Support

### Getting Help

- **Documentation**: Check this guide first
- **FAQ**: Common questions answered above
- **GitHub Issues**: Report bugs or request features
- **Email**: support@feedvex.com (if available)

### Reporting Bugs

When reporting bugs, include:
1. Browser and version
2. Steps to reproduce
3. Expected vs actual behavior
4. Screenshots (if applicable)
5. Console errors (if any)

---

## Updates & Changelog

Check the main README for version history and updates.

### Recent Features

- Dark mode support
- Responsive design
- Accessibility improvements
- Performance optimizations
- Error handling enhancements

### Coming Soon

- Social login (Google, GitHub)
- Advanced filters
- Saved searches
- Email notifications
- Mobile app
