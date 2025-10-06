# Sub-Issue: Enhanced Input Validation for New Project Form

## Summary
This sub-issue tracks additional enhancements to the new project form validation that go beyond the basic error handling implemented in the main issue.

## Current State (Already Implemented)
- ✅ Basic project name validation (spaces, special characters, length)
- ✅ Basic topic validation and sanitization (lowercase, special characters)
- ✅ Error display in the form UI
- ✅ User confirmation dialog before proceeding with invalid inputs
- ✅ Error handling for topic setting failures
- ✅ Notification when GitHub modifies project name

## Proposed Enhancements

### 1. Real-Time Validation
**Priority: Medium**
- Add real-time validation as user types
- Show inline error messages next to each input field
- Disable submit button when critical errors exist
- Use debouncing to avoid excessive validation calls

**Benefits:**
- Immediate feedback to users
- Prevents submission attempts with invalid data
- Better user experience

### 2. Auto-Sanitization Preview
**Priority: Medium**
- Show a preview of how inputs will be sanitized
- Display "This will become: [sanitized-value]" under the input
- Allow users to see exactly what GitHub will accept

**Example:**
```
Input: "My CAD Design"
Preview: ✓ This will be saved as: "my-cad-design"
```

**Benefits:**
- Users understand transformations before submission
- Reduces surprises after project creation
- Educational for users unfamiliar with GitHub requirements

### 3. Enhanced Topic Input
**Priority: Low**
- Add auto-complete suggestions from existing popular topics
- Show topic count and character count as user types
- Highlight invalid topics in red immediately
- Add a "sanitize all" button to clean all topics at once

**Benefits:**
- Helps users discover relevant topics
- Prevents exceeding GitHub's topic limits
- More intuitive user experience

### 4. Smart Suggestions
**Priority: Low**
- Suggest valid alternatives for invalid names
  - "my project" → "my-project"
  - "My@Project" → "My-Project"
- Auto-suggest topic replacements
  - "3D Printing" → "3d-printing"
  
**Benefits:**
- Helps users fix issues quickly
- Reduces frustration
- Teaches GitHub naming conventions

### 5. Bulk Validation Endpoint
**Priority: Low**
- Check if project name already exists (if GitHub API allows)
- Validate against user's existing repositories
- Warn about similar project names

**Benefits:**
- Prevents duplicate project creation attempts
- Saves time and API calls

### 6. Improved Error Messages
**Priority: High**
- More specific error messages with examples
- Link to GitHub documentation for naming rules
- Contextual help tooltips next to each field

**Example:**
```
❌ Project name contains spaces
💡 Try using hyphens instead: "my-project"
📚 Learn more about GitHub naming rules
```

**Benefits:**
- Users understand why validation failed
- Provides actionable solutions
- Reduces support requests

### 7. Form State Persistence
**Priority: Low**
- Save form data to localStorage during validation
- Restore form if user accidentally closes popup
- Clear saved data after successful submission

**Benefits:**
- Prevents data loss
- Better user experience for complex projects

### 8. Validation Testing Infrastructure
**Priority: High**
- Add comprehensive E2E tests for validation scenarios
- Test validation with various edge cases
- Automated testing of error message display
- Visual regression testing for error UI

**Benefits:**
- Ensures validation works correctly
- Prevents regression bugs
- Documents expected behavior

## Implementation Notes

### Technical Considerations
1. All validation should be client-side first, then server-validated
2. Use consistent error message format across all fields
3. Ensure accessibility (ARIA labels, keyboard navigation)
4. Support internationalization for error messages (future)
5. Keep validation logic in sync with GitHub's actual requirements

### Testing Requirements
1. Unit tests for each validation rule
2. Integration tests for form submission flow
3. E2E tests for user interaction scenarios
4. Performance tests for real-time validation

### Documentation Needs
1. Update user guide with validation rules
2. Add tooltips/help text in the UI
3. Create developer documentation for validation logic
4. Document GitHub's official requirements

## Success Criteria
- [ ] Users understand validation errors immediately
- [ ] No valid projects are rejected due to false positives
- [ ] Invalid projects are caught before GitHub API call
- [ ] Error messages are clear and actionable
- [ ] Form validation is performant (< 100ms for any check)
- [ ] All validation rules match GitHub's actual requirements

## Related Issues
- Main issue: Unhandled error in newProject input fields
- Future: Consider extracting validation logic into reusable utility library

## Dependencies
- GitHub API documentation for latest requirements
- User feedback on current validation implementation
- Analytics on common validation errors
