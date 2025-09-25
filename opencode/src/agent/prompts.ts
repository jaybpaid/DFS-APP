/**
 * Prompts for the OpenCode build agent
 */

export const PLAN_PROMPT = `You are an expert software engineer tasked with planning the implementation of a feature.

Given the user's goal and the current repository structure, provide a concise implementation plan.

**Requirements:**
- List the specific files that need to be created or modified
- Provide a step-by-step implementation plan
- Focus on the essential changes needed
- Keep the plan actionable and specific

**Output Format:**
- First, list the files that will be affected
- Then, provide a numbered step-by-step plan
- Keep it concise but complete

**Current repository files (top-level only):**
{{FILE_LIST}}

**User Goal:** {{GOAL}}

**Plan:**`;

export const DIFF_PROMPT = `You are an expert software engineer tasked with implementing a specific change.

Given the current file content and the requested change, provide a unified diff that implements the change.

**Requirements:**
- Provide ONLY a valid unified diff
- Include proper context lines (at least 3 lines before and after changes)
- Use standard diff format with +++ and --- headers
- Make minimal, focused changes
- Ensure the diff is syntactically correct

**Current file:** {{FILE_PATH}}
**Change request:** {{CHANGE_REQUEST}}

**Instructions:**
- Read the current file content carefully
- Implement the requested change
- Return only the unified diff, no explanations`;

export const VALIDATION_PROMPT = `You are an expert software engineer reviewing code changes.

Review the following implementation and provide feedback on:
1. Code quality and best practices
2. Potential bugs or issues
3. Performance considerations
4. Security concerns
5. Missing error handling

**Implementation to review:**
{{IMPLEMENTATION}}

**Feedback (be specific and actionable):**`;

export const REPAIR_PROMPT = `You are an expert software engineer tasked with fixing issues in code.

Given the error messages and the current implementation, provide a corrected version.

**Error messages:**
{{ERRORS}}

**Current implementation:**
{{IMPLEMENTATION}}

**Instructions:**
- Fix the identified errors
- Maintain the original functionality
- Follow best practices
- Provide only the corrected code, no explanations`;

export function buildPlanPrompt(fileList: string[], goal: string): string {
  return PLAN_PROMPT.replace('{{FILE_LIST}}', fileList.join('\n')).replace(
    '{{GOAL}}',
    goal
  );
}

export function buildDiffPrompt(filePath: string, changeRequest: string): string {
  return DIFF_PROMPT.replace('{{FILE_PATH}}', filePath).replace(
    '{{CHANGE_REQUEST}}',
    changeRequest
  );
}

export function buildValidationPrompt(implementation: string): string {
  return VALIDATION_PROMPT.replace('{{IMPLEMENTATION}}', implementation);
}

export function buildRepairPrompt(errors: string[], implementation: string): string {
  return REPAIR_PROMPT.replace('{{ERRORS}}', errors.join('\n')).replace(
    '{{IMPLEMENTATION}}',
    implementation
  );
}
